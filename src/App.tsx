import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Journal from "./pages/Journal";
import Install from "./pages/Install";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

import BrandFooter from "./components/BrandFooter";
import { RequirePremium } from "./components/RequirePremium";
import { PaywallPage } from "./components/PaywallPage";
import { DevTrialReset } from "./components/DevTrialReset";
import { TrialBanner } from "./components/TrialBanner";

import { WelcomeDialog, TrialEndedDialog } from "./components/WelcomeDialog";
import { getFirebaseConfig, isFirebaseConfigured } from "@/integrations/firebase/client";
import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";

const queryClient = new QueryClient();

const FirebaseConfigError = () => {
  const cfg = getFirebaseConfig();
  const missing = [
    ['VITE_FIREBASE_API_KEY', cfg.apiKey],
    ['VITE_FIREBASE_AUTH_DOMAIN', cfg.authDomain],
    ['VITE_FIREBASE_PROJECT_ID', cfg.projectId],
    ['VITE_FIREBASE_APP_ID', cfg.appId],
  ].filter(([, v]) => !v).map(([k]) => k);

  return (
    <div style={{ padding: 20, fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif' }}>
      <h2 style={{ marginBottom: 8 }}>Firebase is not configured</h2>
      <p style={{ marginTop: 0 }}>
        This deploy is missing required Vercel environment variables.
      </p>
      <p style={{ marginTop: 0 }}>
        Domain: <b>{window.location.host}</b>
      </p>
      {missing.length > 0 && (
        <>
          <p style={{ marginBottom: 6 }}>Missing:</p>
          <ul>
            {missing.map((k) => (
              <li key={k}><code>{k}</code></li>
            ))}
          </ul>
        </>
      )}
      <p style={{ marginTop: 12, marginBottom: 6 }}>Fix:</p>
      <ol>
        <li>Vercel → Project → Settings → Environment Variables</li>
        <li>Add all <code>VITE_FIREBASE_*</code> values (see <code>.env.example</code>)</li>
        <li>Redeploy the latest deployment</li>
      </ol>
    </div>
  );
};

const App = () => {
  // Initialize Google Auth plugin on app startup (Android only)
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      import('@codetrix-studio/capacitor-google-auth')
        .then(({ GoogleAuth }) => {
          GoogleAuth.initialize({
            clientId: '536614179434-rnpenriej85hsq22inquikr3ekgubnh6.apps.googleusercontent.com',
            scopes: ['profile', 'email'],
            grantOfflineAccess: true,
          });
          console.log('GoogleAuth initialized successfully');
        })
        .catch((error) => {
          console.error('Failed to initialize GoogleAuth:', error);
        });
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <DevTrialReset />
          {!isFirebaseConfigured() ? (
            <div className="min-h-screen flex flex-col pt-safe pb-safe pl-safe pr-safe">
              <div className="flex-1">
                <FirebaseConfigError />
              </div>
              <BrandFooter />
            </div>
          ) : (
            <HashRouter>
              <WelcomeDialog />
              <TrialEndedDialog />
              <div className="min-h-screen flex flex-col pt-safe pb-safe pl-safe pr-safe">
                <TrialBanner />
                <div className="flex-1">
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/paywall" element={<PaywallPage />} />
                    <Route
                      path="/journal"
                      element={
                        <RequirePremium>
                          <Journal />
                        </RequirePremium>
                      }
                    />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/install" element={<Install />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </div>
                <BrandFooter />
              </div>
            </HashRouter>
          )}
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
