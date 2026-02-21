import { useState, useEffect } from 'react';
import { Download, Share, Plus, CheckCircle, Menu } from 'lucide-react';
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
  const [showInstructions, setShowInstructions] = useState(false);
  const [promptReady, setPromptReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Check if mobile
    const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobile(mobile);

    // If prompt was already captured globally, store it
    const storedPrompt = (window as any).deferredInstallPrompt as BeforeInstallPromptEvent | undefined;
    if (storedPrompt) {
      setDeferredPrompt(storedPrompt);
      setPromptReady(true);
    }

    // Listen for new install prompts (covers Brave, Samsung, etc.)
    const handler = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      (window as any).deferredInstallPrompt = promptEvent;
      setPromptReady(true);
      // Hide instructions if they were shown as fallback
      setShowInstructions(false);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // For browsers that don't fire beforeinstallprompt, show instructions after a delay
    const fallbackTimer = setTimeout(() => {
      if (!(window as any).deferredInstallPrompt && !iOS) {
        setShowInstructions(true);
      }
    }, 3000);

    // For iOS, show instructions immediately
    if (iOS) {
      setShowInstructions(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(fallbackTimer);
    };
  }, []);

  const handleInstallClick = async () => {
    const prompt = deferredPrompt || (window as any).deferredInstallPrompt as BeforeInstallPromptEvent | null;
    if (prompt) {
      try {
        await prompt.prompt();
        const { outcome } = await prompt.userChoice;
        if (outcome === 'accepted') {
          setIsInstalled(true);
        }
        setDeferredPrompt(null);
        setPromptReady(false);
        delete (window as any).deferredInstallPrompt;
      } catch (err) {
        console.warn('Install prompt failed:', err);
        // prompt() already called once or not allowed — clear stale prompt and show instructions
        setDeferredPrompt(null);
        setPromptReady(false);
        delete (window as any).deferredInstallPrompt;
        setShowInstructions(true);
      }
    } else {
      // No native prompt available — show manual instructions
      setShowInstructions(true);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8 text-center">
        {/* App Icon */}
        <div className="flex justify-center">
          <img
            src="/pwa-512x512.png"
            alt="Habitency Logo"
            className="w-24 h-24 rounded-3xl shadow-xl"
          />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Habitency | Daily Habits</h1>
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
            {/* Install Now Button - Always visible */}
            <Button onClick={handleInstallClick} className="w-full" size="lg">
              <Download className="w-5 h-5 mr-2" />
              Install Now
            </Button>

            {/* Instructions - Show when button is clicked and no native prompt */}
            {showInstructions && (
              <>
                {isIOS && (
                  <div className="space-y-6 bg-popover rounded-2xl border border-border/50 p-6 animate-in fade-in slide-in-from-top-4 duration-300">
                    <p className="text-sm text-foreground font-medium">To install on iOS Safari:</p>
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

                {!isIOS && isMobile && (
                  <div className="space-y-6 bg-popover rounded-2xl border border-border/50 p-6 animate-in fade-in slide-in-from-top-4 duration-300">
                    <p className="text-sm text-foreground font-medium">To install on Android:</p>
                    <div className="space-y-4 text-left">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-accent">1</span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm text-foreground">Tap the</span>
                          <Menu className="w-5 h-5 text-accent" />
                          <span className="text-sm text-foreground">three dots menu (⋮)</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-accent">2</span>
                        </div>
                        <span className="text-sm text-foreground">Select "Add to Home screen"</span>
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

                {!isMobile && (
                  <div className="space-y-6 bg-popover rounded-2xl border border-border/50 p-6 animate-in fade-in slide-in-from-top-4 duration-300">
                    <p className="text-sm text-foreground font-medium">To install on Desktop:</p>
                    <div className="space-y-4 text-left">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-accent">1</span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm text-foreground">Click the</span>
                          <Menu className="w-5 h-5 text-accent" />
                          <span className="text-sm text-foreground">three dots menu (⋮)</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-accent">2</span>
                        </div>
                        <span className="text-sm text-foreground">Look for "Install Habitency" or "Add to Home screen"</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-accent">3</span>
                        </div>
                        <span className="text-sm text-foreground">Click "Install" to confirm</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
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
          Go to App →
        </button>
      </div>
    </div>
  );
};

export default Install;