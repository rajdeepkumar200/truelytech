import { useState, useEffect } from 'react';
import { Download, Share, Plus, CheckCircle, Menu, Globe, MonitorSmartphone, ArrowUpFromLine, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type BrowserType = 'chrome' | 'edge' | 'brave' | 'firefox' | 'samsung' | 'opera' | 'safari' | 'other';

function detectBrowser(): BrowserType {
  const ua = navigator.userAgent.toLowerCase();
  // Order matters — more specific checks first
  if ((navigator as any).brave) return 'brave';
  if (ua.includes('samsungbrowser')) return 'samsung';
  if (ua.includes('opr') || ua.includes('opera')) return 'opera';
  if (ua.includes('edg/') || ua.includes('edga/') || ua.includes('edgios/')) return 'edge';
  if (ua.includes('firefox') || ua.includes('fxios')) return 'firefox';
  if (ua.includes('safari') && !ua.includes('chrome')) return 'safari';
  if (ua.includes('chrome') || ua.includes('crios')) return 'chrome';
  return 'other';
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isIPad, setIsIPad] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [promptReady, setPromptReady] = useState(false);
  const [browser, setBrowser] = useState<BrowserType>('other');
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Detect platform & browser
    const iPad = /iPad/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const iOS = /iPhone|iPod/.test(navigator.userAgent) || iPad;
    setIsIOS(iOS);
    setIsIPad(iPad);
    const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobile(mobile);
    setBrowser(detectBrowser());

    // If prompt was already captured globally, store it
    const storedPrompt = (window as any).deferredInstallPrompt as BeforeInstallPromptEvent | undefined;
    if (storedPrompt) {
      setDeferredPrompt(storedPrompt);
      setPromptReady(true);
    }

    // Listen for new install prompts
    const handler = (e: Event) => {
      // Don't prevent default — let Chrome show its install UI too
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      (window as any).deferredInstallPrompt = promptEvent;
      setPromptReady(true);
      setShowInstructions(false);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Fallback: show instructions if no prompt arrives
    const fallbackTimer = setTimeout(() => {
      if (!(window as any).deferredInstallPrompt && !iOS) {
        setShowInstructions(true);
      }
    }, 3000);

    // iOS never fires beforeinstallprompt
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
        setDeferredPrompt(null);
        setPromptReady(false);
        delete (window as any).deferredInstallPrompt;
        setShowInstructions(true);
      }
    } else {
      setShowInstructions(true);
    }
  };

  // Browser-specific display name
  const browserName = {
    chrome: 'Google Chrome',
    edge: 'Microsoft Edge',
    brave: 'Brave',
    firefox: 'Firefox',
    samsung: 'Samsung Internet',
    opera: 'Opera',
    safari: 'Safari',
    other: 'your browser',
  }[browser];

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
            {/* Install Now Button */}
            <Button onClick={isIOS ? () => setShowInstructions(true) : handleInstallClick} className="w-full" size="lg">
              {isIOS ? (
                <><ArrowUpFromLine className="w-5 h-5 mr-2" />Add to Home Screen</>
              ) : (
                <><Download className="w-5 h-5 mr-2" />Install Now</>
              )}
            </Button>

            {/* Status indicator */}
            {promptReady && !showInstructions && (
              <p className="text-xs text-green-500 flex items-center justify-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Ready to install — click the button above
              </p>
            )}

            {/* Instructions */}
            {showInstructions && (
              <>
                {/* iOS */}
                {isIOS && (
                  <div className="space-y-6 bg-popover rounded-2xl border border-border/50 p-6 animate-in fade-in slide-in-from-top-4 duration-300">
                    {browser !== 'safari' ? (
                      /* Non-Safari on iOS — cannot install PWA */
                      <>
                        <div className="flex items-center gap-2 justify-center">
                          <Smartphone className="w-4 h-4 text-yellow-500" />
                          <p className="text-sm text-foreground font-medium">Open in Safari to install</p>
                        </div>
                        <div className="space-y-4 text-left">
                          <StepItem step={1}>
                            <span>Copy this page URL from the address bar</span>
                          </StepItem>
                          <StepItem step={2}>
                            <span>Open <strong>Safari</strong> and paste the URL</span>
                          </StepItem>
                          <StepItem step={3}>
                            <span>Follow the install steps in Safari</span>
                          </StepItem>
                        </div>
                        <p className="text-xs text-muted-foreground text-center">
                          ⚠️ {browserName} on iOS cannot install web apps — only <strong>Safari</strong> supports this
                        </p>
                      </>
                    ) : (
                      /* Safari on iOS — show Add to Home Screen steps */
                      <>
                        <div className="flex items-center gap-2 justify-center">
                          <MonitorSmartphone className="w-4 h-4 text-accent" />
                          <p className="text-sm text-foreground font-medium">Install via Safari:</p>
                        </div>
                        <div className="space-y-4 text-left">
                          <StepItem step={1}>
                            <span>Tap the</span>
                            <ArrowUpFromLine className="w-5 h-5 text-accent inline mx-1" />
                            <span><strong>Share</strong> button {isIPad ? 'at the top-right' : 'at the bottom of the screen'}</span>
                          </StepItem>
                          <StepItem step={2}>
                            <span>Scroll down and tap</span>
                            <Plus className="w-5 h-5 text-accent inline mx-1" />
                            <span><strong>"Add to Home Screen"</strong></span>
                          </StepItem>
                          <StepItem step={3}>
                            <span>Tap <strong>"Add"</strong> in the top-right corner</span>
                          </StepItem>
                        </div>
                        <p className="text-xs text-muted-foreground text-center">
                          The app will appear on your home screen like a native app
                        </p>
                      </>
                    )}
                  </div>
                )}

                {/* Android browsers */}
                {!isIOS && isMobile && (
                  <div className="space-y-6 bg-popover rounded-2xl border border-border/50 p-6 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center gap-2 justify-center">
                      <MonitorSmartphone className="w-4 h-4 text-accent" />
                      <p className="text-sm text-foreground font-medium">Install on {browserName}:</p>
                    </div>
                    <div className="space-y-4 text-left">
                      {browser === 'samsung' ? (
                        <>
                          <StepItem step={1}>
                            <span>Tap the <strong>menu icon</strong> (☰) at the bottom</span>
                          </StepItem>
                          <StepItem step={2}>
                            <span>Tap <strong>"Add page to"</strong></span>
                          </StepItem>
                          <StepItem step={3}>
                            <span>Select <strong>"Home screen"</strong></span>
                          </StepItem>
                        </>
                      ) : browser === 'firefox' ? (
                        <>
                          <StepItem step={1}>
                            <span>Tap the <strong>⋮ three dots</strong> menu</span>
                          </StepItem>
                          <StepItem step={2}>
                            <span>Tap <strong>"Install"</strong></span>
                          </StepItem>
                          <StepItem step={3}>
                            <span>Tap <strong>"Add"</strong> to confirm</span>
                          </StepItem>
                        </>
                      ) : (
                        /* Chrome, Brave, Edge, Opera on Android */
                        <>
                          <StepItem step={1}>
                            <span>Tap the <strong>⋮ three dots</strong> menu at the top-right</span>
                          </StepItem>
                          <StepItem step={2}>
                            <span>Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong></span>
                          </StepItem>
                          <StepItem step={3}>
                            <span>Tap <strong>"Install"</strong> to confirm</span>
                          </StepItem>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Desktop / Windows browsers */}
                {!isMobile && !isIOS && (
                  <div className="space-y-6 bg-popover rounded-2xl border border-border/50 p-6 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center gap-2 justify-center">
                      <Globe className="w-4 h-4 text-accent" />
                      <p className="text-sm text-foreground font-medium">Install on {browserName}:</p>
                    </div>
                    <div className="space-y-4 text-left">
                      {browser === 'chrome' ? (
                        <>
                          <StepItem step={1}>
                            <span>Click the <strong>⋮ three dots</strong> menu at the top-right</span>
                          </StepItem>
                          <StepItem step={2}>
                            <span>Click <strong>"Cast, save, and share"</strong></span>
                          </StepItem>
                          <StepItem step={3}>
                            <span>Click <strong>"Install page as app..."</strong></span>
                          </StepItem>
                          <StepItem step={4}>
                            <span>Click <strong>"Install"</strong> in the popup to confirm</span>
                          </StepItem>
                        </>
                      ) : browser === 'edge' ? (
                        <>
                          <StepItem step={1}>
                            <span>Click the <strong>⋯ three dots</strong> menu at the top-right</span>
                          </StepItem>
                          <StepItem step={2}>
                            <span>Click <strong>"Apps"</strong></span>
                          </StepItem>
                          <StepItem step={3}>
                            <span>Click <strong>"Install this site as an app"</strong></span>
                          </StepItem>
                          <StepItem step={4}>
                            <span>Click <strong>"Install"</strong> to confirm</span>
                          </StepItem>
                        </>
                      ) : browser === 'brave' ? (
                        <>
                          <StepItem step={1}>
                            <span>Click the <strong>⋮ three dots</strong> menu at the top-right</span>
                          </StepItem>
                          <StepItem step={2}>
                            <span>Hover over <strong>"More tools"</strong></span>
                          </StepItem>
                          <StepItem step={3}>
                            <span>Click <strong>"Create shortcut..."</strong></span>
                          </StepItem>
                          <StepItem step={4}>
                            <span>Check <strong>"Open as window"</strong> and click <strong>"Create"</strong></span>
                          </StepItem>
                          <p className="text-xs text-muted-foreground mt-1 pl-11">
                            💡 Or look for an install icon (⊕) in the address bar — if visible, click it directly
                          </p>
                        </>
                      ) : browser === 'firefox' ? (
                        <>
                          <StepItem step={1}>
                            <span>Firefox desktop doesn't fully support PWA install</span>
                          </StepItem>
                          <StepItem step={2}>
                            <span>Try opening this page in <strong>Chrome</strong> or <strong>Edge</strong> instead</span>
                          </StepItem>
                        </>
                      ) : (
                        <>
                          <StepItem step={1}>
                            <span>Click the browser <strong>menu</strong> (⋮ or ⋯) at the top-right</span>
                          </StepItem>
                          <StepItem step={2}>
                            <span>Look for <strong>"Install"</strong>, <strong>"Install app"</strong>, or <strong>"Add to Home screen"</strong></span>
                          </StepItem>
                          <StepItem step={3}>
                            <span>Click <strong>"Install"</strong> to confirm</span>
                          </StepItem>
                        </>
                      )}
                    </div>
                    {browser !== 'firefox' && (
                      <p className="text-xs text-muted-foreground text-center">
                        💡 You may also see an install icon (⊕) in the address bar
                      </p>
                    )}
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

/** Reusable step indicator */
function StepItem({ step, children }: { step: number; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-bold text-accent">{step}</span>
      </div>
      <div className="flex items-center gap-1 flex-wrap text-sm text-foreground pt-1">
        {children}
      </div>
    </div>
  );
}

export default Install;