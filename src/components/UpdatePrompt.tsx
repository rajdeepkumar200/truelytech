import { useEffect, useMemo, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { UpdateInstaller } from '@/plugins/updateInstaller';

type UpdateInfo = {
  versionName: string;
  apkUrl: string;
  message?: string;
};

const PROMPT_COOLDOWN_MS = 6 * 60 * 60 * 1000; // 6 hours

function normalizeBaseUrl(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

function normalizeVersion(input: string): string {
  return String(input ?? '').trim().replace(/^v\s*/i, '');
}

function parseSemver(input: string): number[] | null {
  const v = normalizeVersion(input);
  // Accept common formats like:
  // - 2.0.1
  // - v2.0-1 (treated like 2.0.1)
  // - 2.0.1.4
  const groups = v.match(/\d+/g);
  if (!groups || groups.length === 0) return null;
  const parts = groups.map((x) => Number(x)).filter((n) => Number.isFinite(n));
  if (parts.length === 0) return null;
  // Normalize to at least 3 parts for stable comparisons.
  while (parts.length < 3) parts.push(0);
  // Keep at most 4 numeric components.
  return parts.slice(0, 4);
}

function compareVersions(aRaw: string, bRaw: string): number | null {
  const a = parseSemver(aRaw);
  const b = parseSemver(bRaw);
  if (!a || !b) return null;
  const max = Math.max(a.length, b.length);
  for (let i = 0; i < max; i += 1) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    if (av > bv) return 1;
    if (av < bv) return -1;
  }
  return 0;
}

export default function UpdatePrompt() {
  const [open, setOpen] = useState(false);
  const [apkUrl, setApkUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showRestartPrompt, setShowRestartPrompt] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const updateBaseUrl = useMemo(() => {
    const raw = (import.meta.env.VITE_UPDATE_BASE_URL as string | undefined) ?? '';
    return raw ? normalizeBaseUrl(raw) : '';
  }, []);

  useEffect(() => {
    const run = async () => {
      // Only show in the native Android app.
      if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') return;

      // Avoid showing update prompts during Android Studio dev/live-reload runs.
      // In that mode the app is pointing at a dev server and updates via APK are irrelevant.
      if (import.meta.env.DEV) return;

      if (!updateBaseUrl) return;

      try {
        const appInfo = await App.getInfo();
        const currentVersion = normalizeVersion(appInfo.version ?? '');
        if (!currentVersion) return;

        const res = await fetch(`${updateBaseUrl}/app-update.json?ts=${Date.now()}`, {
          cache: 'no-store',
        });
        if (!res.ok) return;
        const info = (await res.json()) as UpdateInfo;

        if (!info?.versionName || !info?.apkUrl) return;

        const remoteVersion = normalizeVersion(info.versionName);
        const cmp = compareVersions(remoteVersion, currentVersion);
        // Only prompt when we can confidently tell the remote version is newer.
        if (cmp === null || cmp <= 0) return;

        // Avoid spamming the same prompt every time the app starts.
        // Still allows re-prompting later if user dismissed or install failed.
        const lastPromptedVersion = normalizeVersion(localStorage.getItem('habitex_lastPromptedVersion') ?? '');
        const lastPromptedAt = Number(localStorage.getItem('habitex_lastPromptedAt') ?? '0');
        if (lastPromptedVersion === remoteVersion && Number.isFinite(lastPromptedAt)) {
          if (Date.now() - lastPromptedAt < PROMPT_COOLDOWN_MS) return;
        }
        localStorage.setItem('habitex_lastPromptedVersion', remoteVersion);
        localStorage.setItem('habitex_lastPromptedAt', String(Date.now()));

        const rawApkUrl = String(info.apkUrl);
        const resolvedApkUrl = /^https?:\/\//i.test(rawApkUrl)
          ? rawApkUrl
          : `${updateBaseUrl}/${rawApkUrl.replace(/^\/+/, '')}`;

        // Cache-bust the APK URL to avoid stale/cached downloads.
        const cacheBustedApkUrl = (() => {
          try {
            const u = new URL(resolvedApkUrl, window.location.origin);
            u.searchParams.set('ts', String(Date.now()));
            return u.toString();
          } catch {
            const joiner = resolvedApkUrl.includes('?') ? '&' : '?';
            return `${resolvedApkUrl}${joiner}ts=${Date.now()}`;
          }
        })();

        setApkUrl(cacheBustedApkUrl);
        setMessage(info.message ?? 'More amazing features and a more stable version are available.');
        
        // Delay showing the update prompt by 5 seconds after app launch
        setTimeout(() => {
          setOpen(true);
        }, 5000);
      } catch {
        // Ignore update check failures.
      }
    };

    run();
  }, [updateBaseUrl]);

  const onUpdate = () => {
    // Redirect to /install page to trigger the new APK download/install flow
    window.location.href = '/install';
  };

  const onRestart = () => {
    // Restart the app using Capacitor App plugin
    App.exitApp();
  };

  if (!open && !showRestartPrompt) return null;

  // Show restart prompt after successful installation
  if (showRestartPrompt) {
    return (
      <AlertDialog open={true}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update installed successfully!</AlertDialogTitle>
            <AlertDialogDescription>
              The app has been updated. Please restart to apply the changes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={onRestart}>
              Restart Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        // Freeze the app during update.
        if (isUpdating) return;
        setOpen(next);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Update available</AlertDialogTitle>
          <AlertDialogDescription>
            {isUpdating ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Downloading & installing update…
              </span>
            ) : errorMessage ? (
              errorMessage
            ) : (
              message ?? 'More amazing features and a more stable version are available.'
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {!isUpdating && <AlertDialogCancel>Later</AlertDialogCancel>}
          <AlertDialogAction onClick={onUpdate} disabled={isUpdating}>
            {isUpdating ? 'Updating…' : 'Update'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
