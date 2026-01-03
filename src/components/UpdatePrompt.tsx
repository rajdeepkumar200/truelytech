import { useEffect, useMemo, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
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

function normalizeBaseUrl(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

export default function UpdatePrompt() {
  const [open, setOpen] = useState(false);
  const [apkUrl, setApkUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const updateBaseUrl = useMemo(() => {
    const raw = (import.meta.env.VITE_UPDATE_BASE_URL as string | undefined) ?? '';
    return raw ? normalizeBaseUrl(raw) : '';
  }, []);

  useEffect(() => {
    const run = async () => {
      // Only show in the native Android app.
      if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') return;
      if (!updateBaseUrl) return;

      try {
        const appInfo = await App.getInfo();
        const currentVersion = appInfo.version;

        const res = await fetch(`${updateBaseUrl}/app-update.json?ts=${Date.now()}`, {
          cache: 'no-store',
        });
        if (!res.ok) return;
        const info = (await res.json()) as UpdateInfo;

        if (!info?.versionName || !info?.apkUrl) return;
        if (info.versionName === currentVersion) return;

        const rawApkUrl = String(info.apkUrl);
        const resolvedApkUrl = /^https?:\/\//i.test(rawApkUrl)
          ? rawApkUrl
          : `${updateBaseUrl}/${rawApkUrl.replace(/^\/+/, '')}`;

        setApkUrl(resolvedApkUrl);
        setMessage(info.message ?? 'More amazing features and a more stable version are available.');
        setOpen(true);
      } catch {
        // Ignore update check failures.
      }
    };

    run();
  }, [updateBaseUrl]);

  const onUpdate = async () => {
    if (!apkUrl) return;
    try {
      await UpdateInstaller.downloadAndInstall({ url: apkUrl });
    } catch {
      // If install fails, just keep the dialog closed.
    } finally {
      setOpen(false);
    }
  };

  if (!open) return null;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Update available</AlertDialogTitle>
          <AlertDialogDescription>
            {message ?? 'More amazing features and a more stable version are available.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Later</AlertDialogCancel>
          <AlertDialogAction onClick={onUpdate}>Update</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
