import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Rocket, BatteryCharging, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const PROMPTED_KEY = 'habitency_startup_prompted';

/**
 * One-time prompt asking users to:
 * - Windows/Desktop PWA: Pin to taskbar & enable auto-start
 * - Android: Disable battery optimization for background running
 */
export function StartupPermissionPrompt() {
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<'windows' | 'android' | 'other'>('other');

  useEffect(() => {
    // Only show once
    if (localStorage.getItem(PROMPTED_KEY)) return;

    const timer = setTimeout(() => {
      if (Capacitor.isNativePlatform()) {
        setPlatform('android');
        setOpen(true);
      } else {
        // Detect Windows
        const ua = navigator.userAgent.toLowerCase();
        if (ua.includes('windows')) {
          // Only show for installed PWA
          if (window.matchMedia('(display-mode: standalone)').matches) {
            setPlatform('windows');
            setOpen(true);
          }
        }
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(PROMPTED_KEY, 'true');
    setOpen(false);
  };

  const handleAndroidBatteryOptimization = async () => {
    try {
      const packageName = await getPackageName();
      // Open Android battery optimization settings for this app
      window.location.href = `intent://settings/apps/details?package=${packageName}#Intent;scheme=android-app;end`;
    } catch {
      // Fallback: just mark as prompted
    }
    localStorage.setItem(PROMPTED_KEY, 'true');
    setOpen(false);
  };

  const handleWindowsAutoStart = () => {
    // Can't programmatically add to startup, but guide the user
    localStorage.setItem(PROMPTED_KEY, 'true');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleDismiss(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {platform === 'android' ? (
              <>
                <BatteryCharging className="w-5 h-5 text-green-500" />
                Keep Habitency Running
              </>
            ) : (
              <>
                <Rocket className="w-5 h-5 text-purple-500" />
                Launch at Startup
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {platform === 'android'
              ? 'Allow Habitency to run in the background so you never miss a reminder.'
              : 'Start Habitency automatically when you turn on your computer.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {platform === 'android' ? (
            <>
              <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                <p className="text-sm font-medium text-foreground">Why is this needed?</p>
                <ul className="text-sm text-muted-foreground space-y-1.5">
                  <li>✅ Receive habit reminders on time</li>
                  <li>✅ Keep notifications working after phone restart</li>
                  <li>✅ Track habits even when the app is closed</li>
                </ul>
              </div>

              <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
                <p className="text-sm text-foreground font-medium mb-2">📋 Steps to enable:</p>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal pl-4">
                  <li>Tap <strong>"Enable Now"</strong> below</li>
                  <li>Find <strong>Habitency</strong> in the list</li>
                  <li>Select <strong>"Don't optimize"</strong> or <strong>"Unrestricted"</strong></li>
                </ol>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={handleDismiss}>
                  Maybe Later
                </Button>
                <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={handleAndroidBatteryOptimization}>
                  Enable Now
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                <p className="text-sm font-medium text-foreground">Benefits:</p>
                <ul className="text-sm text-muted-foreground space-y-1.5">
                  <li>✅ Habitency opens automatically on startup</li>
                  <li>✅ Never forget to track your habits</li>
                  <li>✅ Get morning reminders right away</li>
                </ul>
              </div>

              <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
                <p className="text-sm text-foreground font-medium mb-2">📋 How to enable (Windows):</p>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal pl-4">
                  <li>Open <strong>Habitency</strong> in Chrome/Edge/Brave</li>
                  <li>Click the <strong>⋮ menu</strong> → <strong>"Install Habitency"</strong></li>
                  <li>After installing, right-click the app in the taskbar</li>
                  <li>Check <strong>"Start on login"</strong> or <strong>"Open at startup"</strong></li>
                </ol>
                <p className="text-xs text-muted-foreground mt-2">
                  💡 In Chrome: chrome://apps → right-click Habitency → "Start app when you sign in"
                </p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={handleDismiss}>
                  Got it
                </Button>
                <Button className="flex-1" onClick={handleWindowsAutoStart}>
                  <Monitor className="w-4 h-4 mr-2" />
                  I'll set it up
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

async function getPackageName(): Promise<string> {
  try {
    const { App } = await import('@capacitor/app');
    const info = await App.getInfo();
    return info.id;
  } catch {
    return 'com.truelytech.habitency';
  }
}

export default StartupPermissionPrompt;
