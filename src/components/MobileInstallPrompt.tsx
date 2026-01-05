import { useState, useEffect } from 'react';
import { Download, Share, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const MobileInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Don't show if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    // Check if dismissed recently
    const dismissed = localStorage.getItem('install-prompt-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      // Show again after 24 hours
      if (Date.now() - dismissedTime < 24 * 60 * 60 * 1000) {
        return;
      }
    }

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Check if Android
    const android = /Android/i.test(navigator.userAgent);
    setIsAndroid(android);

    // Check if mobile
    const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (mobile) {
      // Show prompt after a short delay
      setTimeout(() => setShowPrompt(true), 2000);
    }

    // Listen for install prompt (Android/Chrome)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowIOSInstructions(false);
    localStorage.setItem('install-prompt-dismissed', Date.now().toString());
  };

  if (!showPrompt) return null;

  // iOS instructions modal
  if (showIOSInstructions) {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
        <div className="w-full max-w-md bg-popover rounded-2xl border border-border/50 p-5 shadow-xl animate-slide-up">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-semibold text-foreground">Add to Home Screen</h3>
            <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-accent">1</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-foreground">Tap the</span>
                <Share className="w-5 h-5 text-accent" />
                <span className="text-sm text-foreground">Share button</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-accent">2</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-foreground">Tap</span>
                <Plus className="w-5 h-5 text-accent" />
                <span className="text-sm text-foreground">"Add to Home Screen"</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-accent">3</span>
              </div>
              <span className="text-sm text-foreground">Tap "Add" to confirm</span>
            </div>
          </div>
          <Button onClick={handleDismiss} variant="outline" className="w-full mt-4">
            Got it
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 sm:hidden animate-slide-up">
      <div className="bg-popover rounded-2xl border border-border/50 p-4 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center">
              <Download className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Install Daily Habits</p>
              <p className="text-xs text-muted-foreground">Quick access from home screen</p>
            </div>
          </div>
          <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex gap-2 mt-3">
          {isIOS ? (
            <Button onClick={() => setShowIOSInstructions(true)} size="sm" className="flex-1 gap-2">
              <Share className="w-4 h-4" />
              How to Install
            </Button>
          ) : deferredPrompt ? (
            <Button onClick={handleInstall} size="sm" className="flex-1 gap-2">
              <Download className="w-4 h-4" />
              Install Now
            </Button>
          ) : (
            <Button onClick={() => setShowIOSInstructions(true)} size="sm" className="flex-1 gap-2">
              <Download className="w-4 h-4" />
              How to Install
            </Button>
          )}
          {isAndroid && (
            <Button asChild variant="outline" size="sm" className="gap-2">
              <a href="/habitency.apk" download>
                <Download className="w-4 h-4" />
                APK
              </a>
            </Button>
          )}
          <Button onClick={handleDismiss} variant="outline" size="sm">
            Later
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MobileInstallPrompt;
