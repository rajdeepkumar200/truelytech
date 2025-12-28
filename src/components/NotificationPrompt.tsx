import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const NotificationPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');

  useEffect(() => {
    if (!('Notification' in window)) {
      setPermission('unsupported');
      return;
    }

    setPermission(Notification.permission);

    // Show prompt if permission hasn't been asked yet
    const hasAsked = localStorage.getItem('notification-prompted');
    if (Notification.permission === 'default' && !hasAsked) {
      // Delay showing prompt
      const timer = setTimeout(() => setShowPrompt(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const requestPermission = async () => {
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      localStorage.setItem('notification-prompted', 'true');
      setShowPrompt(false);

      if (result === 'granted') {
        toast.success('Notifications enabled! We\'ll remind you about your habits.');
        // Send a test notification
        new Notification('Daily Habits', {
          body: 'Notifications are now enabled! Stay consistent with your habits.',
          icon: '/pwa-192x192.png',
        });
      } else if (result === 'denied') {
        toast.error('Notifications blocked. You can enable them in your browser settings.');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  const dismissPrompt = () => {
    localStorage.setItem('notification-prompted', 'true');
    setShowPrompt(false);
  };

  if (!showPrompt || permission !== 'default') return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:max-w-sm z-40 animate-slide-up">
      <div className="bg-popover rounded-xl p-4 shadow-lg border border-border">
        <button
          onClick={dismissPrompt}
          className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-card flex items-center justify-center">
            <Bell className="w-5 h-5 text-card-foreground" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground text-sm mb-1">
              Enable Reminders?
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              Get notified to complete your daily habits and stay on track.
            </p>

            <div className="flex gap-2">
              <button
                onClick={requestPermission}
                className="px-3 py-1.5 bg-card text-card-foreground text-xs font-medium rounded-lg hover:opacity-90 transition-opacity"
              >
                Enable
              </button>
              <button
                onClick={dismissPrompt}
                className="px-3 py-1.5 text-muted-foreground text-xs hover:text-foreground transition-colors"
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationPrompt;
