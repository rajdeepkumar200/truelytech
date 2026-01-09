import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

export type AppNotificationPermission = 'granted' | 'denied' | 'prompt' | 'unsupported';

export function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

function normalizeWebPermission(p: NotificationPermission): AppNotificationPermission {
  if (p === 'granted') return 'granted';
  if (p === 'denied') return 'denied';
  return 'prompt';
}

export async function checkNotificationPermission(): Promise<AppNotificationPermission> {
  if (isNative()) {
    try {
      const res = await LocalNotifications.checkPermissions();
      const status = (res as unknown as { display?: string }).display;
      if (status === 'granted') return 'granted';
      if (status === 'denied') return 'denied';
      return 'prompt';
    } catch {
      return 'unsupported';
    }
  }

  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return normalizeWebPermission(window.Notification.permission);
}

export async function requestNotificationPermission(): Promise<AppNotificationPermission> {
  if (isNative()) {
    try {
      const res = await LocalNotifications.requestPermissions();
      const status = (res as unknown as { display?: string }).display;
      if (status === 'granted') return 'granted';
      if (status === 'denied') return 'denied';
      return 'prompt';
    } catch {
      return 'unsupported';
    }
  }

  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  try {
    const result = await window.Notification.requestPermission();
    return normalizeWebPermission(result);
  } catch {
    return 'unsupported';
  }
}

function stableId(input: string): number {
  // Simple 32-bit hash, forced into a positive safe int for Capacitor IDs.
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) || 1;
}

export type ScheduleNotificationArgs = {
  key: string;
  title: string;
  body: string;
  at: Date;
};

export async function sendNotificationNow(title: string, body: string): Promise<void> {
  if (isNative()) {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: stableId(`now:${title}:${body}:${Date.now()}`),
            title,
            body,
            schedule: { at: new Date(Date.now() + 1000) },
          },
        ],
      });
    } catch {
      // ignore
    }
    return;
  }

  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (window.Notification.permission !== 'granted') return;

  try {
    new window.Notification(title, {
      body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
    });
  } catch {
    // ignore
  }
}

const NATIVE_IDS_KEY = 'habitency_nativeScheduledNotificationIds';

export async function rescheduleNativeNotifications(notifications: ScheduleNotificationArgs[]): Promise<void> {
  if (!isNative()) return;

  try {
    const previous = JSON.parse(localStorage.getItem(NATIVE_IDS_KEY) ?? '[]') as number[];
    if (Array.isArray(previous) && previous.length) {
      await LocalNotifications.cancel({ notifications: previous.map((id) => ({ id })) });
    }
  } catch {
    // ignore
  }

  const now = Date.now();
  const upcoming = notifications
    .filter((n) => n.at.getTime() > now + 500)
    .sort((a, b) => a.at.getTime() - b.at.getTime());

  const ids: number[] = [];
  const payload = upcoming.map((n) => {
    const id = stableId(n.key);
    ids.push(id);
    return {
      id,
      title: n.title,
      body: n.body,
      schedule: { at: n.at },
    };
  });

  try {
    if (payload.length) {
      await LocalNotifications.schedule({ notifications: payload });
    }
    localStorage.setItem(NATIVE_IDS_KEY, JSON.stringify(ids));
  } catch {
    // ignore
  }
}
