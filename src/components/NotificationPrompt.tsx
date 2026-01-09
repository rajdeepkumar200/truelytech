import { useState, useEffect } from 'react';
import { Bell, X, Smartphone, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { checkNotificationPermission, requestNotificationPermission, type AppNotificationPermission } from '@/lib/notifications';

const NotificationPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [permission, setPermission] = useState<AppNotificationPermission>('prompt');
  const [platform, setPlatform] = useState<'windows' | 'macos' | 'android' | 'ios' | 'other'>('other');

  useEffect(() => {
    let cancelled = false;

    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('windows')) {
      setPlatform('windows');
    } else if (userAgent.includes('mac')) {
      setPlatform('macos');
    } else if (userAgent.includes('android')) {
      setPlatform('android');
    } else if (/iphone|ipad|ipod/.test(userAgent)) {
      setPlatform('ios');
    }

    (async () => {
      const current = await checkNotificationPermission();
      if (cancelled) return;
      setPermission(current);

      // Show prompt if permission hasn't been asked yet
      const hasAsked = localStorage.getItem('notification-prompted');
      if (current === 'prompt' && !hasAsked) {
        const timer = setTimeout(() => {
          if (!cancelled) setShowPrompt(true);
        }, 1500);
        return () => clearTimeout(timer);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const requestPermission = async () => {
    try {
      const result = await requestNotificationPermission();
      setPermission(result);
      localStorage.setItem('notification-prompted', 'true');
      setShowPrompt(false);

      if (result === 'granted') {
        toast.success('Notifications enabled! We\'ll remind you about your habits.');
        // Send a test notification
        try {
          if (typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'granted') {
            new window.Notification('Daily Habits', {
              body: 'Notifications are now enabled! Stay consistent with your habits. 🎯',
              icon: '/pwa-192x192.png',
              badge: '/pwa-192x192.png',
            });
          }
        } catch {
          // Ignore notification construction failures on some platforms.
        }
        
        // Haptic feedback on mobile
        if (navigator.vibrate) {
          navigator.vibrate(200);
        }
      } else if (result === 'denied') {
        toast.error('Notifications blocked. You can enable them in your browser/system settings.');
      } else if (result === 'unsupported') {
        toast.error('Notifications are not supported on this device.');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error('Could not request notification permission.');
    }
  };

  const dismissPrompt = () => {
    localStorage.setItem('notification-prompted', 'true');
    setShowPrompt(false);
  };

  const getPlatformText = () => {
    switch (platform) {
      case 'windows':
        return 'Get desktop notifications on Windows';
      case 'macos':
        return 'Get notifications in your Mac menu bar';
      case 'android':
        return 'Get push notifications on your Android device';
      case 'ios':
        return 'Get notifications on your iPhone/iPad';
      default:
        return 'Get notified to complete your daily habits';
    }
  };

  if (!showPrompt || permission !== 'prompt') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-popover rounded-2xl p-6 shadow-xl border border-border max-w-sm mx-4 animate-scale-in">
        <button
          onClick={dismissPrompt}
          className="absolute top-3 right-3 p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center space-y-4">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center">
              <Bell className="w-8 h-8 text-accent" />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground text-lg">
              Enable Notifications
            </h3>
            <p className="text-sm text-muted-foreground">
              {getPlatformText()}
            </p>
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-2 gap-2 py-2">
            <div className="bg-muted/50 rounded-lg p-2 text-left">
              <p className="text-xs font-medium text-foreground">⏰ Reminders</p>
              <p className="text-xs text-muted-foreground">Before tasks</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-2 text-left">
              <p className="text-xs font-medium text-foreground">🎯 Daily Goals</p>
              <p className="text-xs text-muted-foreground">Morning alerts</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-2 text-left">
              <p className="text-xs font-medium text-foreground">🔥 Streaks</p>
              <p className="text-xs text-muted-foreground">Completion alerts</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-2 text-left">
              <p className="text-xs font-medium text-foreground">📌 Schedule</p>
              <p className="text-xs text-muted-foreground">Task reminders</p>
            </div>
          </div>

          {/* Platform indicator */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            {platform === 'windows' || platform === 'macos' ? (
              <Monitor className="w-3.5 h-3.5" />
            ) : (
              <Smartphone className="w-3.5 h-3.5" />
            )}
            <span className="capitalize">{platform === 'other' ? 'Your device' : platform}</span>
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-2 pt-2">
            <Button onClick={requestPermission} className="w-full gap-2">
              <Bell className="w-4 h-4" />
              Enable Notifications
            </Button>
            <button
              onClick={dismissPrompt}
              className="py-2 text-muted-foreground text-sm hover:text-foreground transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationPrompt;
