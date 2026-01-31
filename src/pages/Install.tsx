import { useState, useEffect } from 'react';
import { Download, Share, Plus, Smartphone, CheckCircle, Monitor, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Check if mobile
    const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobile(mobile);

    // Listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
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
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8 text-center">
        {/* App Icon */}
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-accent to-primary flex items-center justify-center shadow-xl">
            {isMobile ? (
              <Smartphone className="w-12 h-12 text-accent-foreground" />
            ) : (
              <Monitor className="w-12 h-12 text-accent-foreground" />
            )}
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Daily Habits</h1>
          <p className="text-muted-foreground">Install the app for the best experience</p>
        </div>

        {isInstalled ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-accent">
              <CheckCircle className="w-6 h-6" />
              <span className="font-medium">App is installed!</span>
            </div>
            <Button onClick={() => navigate('/')} className="w-full">
              Open App
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* PWA Install Button */}
            {deferredPrompt && (
              <Button onClick={handleInstall} className="w-full" size="lg">
                <Download className="w-5 h-5 mr-2" />
                Install App
              </Button>
            )}
            {isIOS && (
              <div className="space-y-6 bg-popover rounded-2xl border border-border/50 p-6">
                <p className="text-sm text-foreground font-medium">To install on iOS:</p>
                <div className="space-y-4 text-left">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-accent">1</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-foreground">Tap the</span>
                      <Share className="w-5 h-5 text-accent" />
                      <span className="text-sm text-foreground">Share button</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-accent">2</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-foreground">Scroll and tap</span>
                      <Plus className="w-5 h-5 text-accent" />
                      <span className="text-sm text-foreground">"Add to Home Screen"</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-accent">3</span>
                    </div>
                    <span className="text-sm text-foreground">Tap "Add" to confirm</span>
                  </div>
                </div>
              </div>
            )}

            {!isMobile && !deferredPrompt && (
              <div className="space-y-6 bg-popover rounded-2xl border border-border/50 p-6">
                <p className="text-sm text-foreground font-medium">To install on Windows/macOS:</p>
                <div className="space-y-4 text-left">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-accent">1</span>
                    </div>
                    <span className="text-sm text-foreground">Open in Chrome or Edge browser</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-accent">2</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-foreground">Click the</span>
                      <Menu className="w-5 h-5 text-accent" />
                      <span className="text-sm text-foreground">menu (⋮) or install icon in address bar</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-accent">3</span>
                    </div>
                    <span className="text-sm text-foreground">Select "Install Daily Habits" or "Install app"</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Features */}
        <div className="pt-6 space-y-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Benefits of installing</p>
          <div className="grid grid-cols-2 gap-3 text-left">
            <div className="bg-popover rounded-xl p-3 border border-border/30">
              <p className="text-xs font-medium text-foreground">Works Offline</p>
              <p className="text-xs text-muted-foreground">Track habits anytime</p>
            </div>
            <div className="bg-popover rounded-xl p-3 border border-border/30">
              <p className="text-xs font-medium text-foreground">Push Notifications</p>
              <p className="text-xs text-muted-foreground">Stay on track</p>
            </div>
            <div className="bg-popover rounded-xl p-3 border border-border/30">
              <p className="text-xs font-medium text-foreground">Quick Access</p>
              <p className="text-xs text-muted-foreground">{isMobile ? 'One tap from home' : 'Launch from desktop'}</p>
            </div>
            <div className="bg-popover rounded-xl p-3 border border-border/30">
              <p className="text-xs font-medium text-foreground">Full Screen</p>
              <p className="text-xs text-muted-foreground">No browser bars</p>
            </div>
          </div>
        </div>

        {/* Skip link */}
        <button
          onClick={() => navigate('/')}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Continue in browser →
        </button>
      </div>
    </div>
  );
};

export default Install;