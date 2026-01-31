import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signInWithCredential,
  getRedirectResult,
  sendSignInLinkToEmail,
  sendPasswordResetEmail,
  fetchSignInMethodsForEmail,
  signOut as firebaseSignOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { getFirebaseAuth } from '@/integrations/firebase/client';
import { Capacitor } from '@capacitor/core';

export interface AuthUser {
  id: string;
  email?: string | null;
}

export interface AuthSession {
  access_token: string;
}

interface AuthContextType {
  user: AuthUser | null;
  session: AuthSession | null;
  loading: boolean;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithOtp: (email: string) => Promise<{ error: Error | null }>;
  verifyOtp: (email: string, token: string) => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  const user = useMemo<AuthUser | null>(() => {
    if (!firebaseUser) return null;
    return {
      id: firebaseUser.uid,
      email: firebaseUser.email,
    };
  }, [firebaseUser]);

  // Kept for compatibility with existing code; Firebase access tokens are fetched on-demand.
  const session = null;

  useEffect(() => {
    try {
      const auth = getFirebaseAuth();

      // Handle redirect result from Google Sign-In (Android)
      getRedirectResult(auth)
        .then((result) => {
          if (result) {
            console.log('Redirect sign-in successful:', result.user);
          }
        })
        .catch((error) => {
          console.error('Redirect sign-in error:', error);
        });

      // Listener for auth state changes
      const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
        setFirebaseUser(nextUser);

        // Sync trial date immediately when user logs in
        if (nextUser) {
          try {
            const { getFirebaseDb } = await import('@/integrations/firebase/client');
            const { doc, getDoc } = await import('firebase/firestore');
            const db = getFirebaseDb();
            const settingsRef = doc(db, 'users', nextUser.uid, 'settings', 'trialStart');
            const snap = await getDoc(settingsRef);

            if (snap.exists()) {
              const cloudTrialStart = snap.data().firstRunAt;
              const localStart = Number(localStorage.getItem('habitex_firstRunAt'));

              if (localStart !== cloudTrialStart) {
                localStorage.setItem('habitex_firstRunAt', String(cloudTrialStart));
                window.dispatchEvent(new Event('entitlement-updated'));
                console.log('🔄 Synced trial date on login:', new Date(cloudTrialStart).toISOString());
              }
            }
          } catch (syncError) {
            console.error('Failed to sync trial date:', syncError);
          }
        }

        setLoading(false);
      });
      return () => unsubscribe();
    } catch {
      // Firebase not configured yet (common on first Vercel deploy before env vars).
      setLoading(false);
      return;
    }
  }, []);

  const signInWithGoogle = async () => {
    try {
      const auth = getFirebaseAuth();
      const provider = new GoogleAuthProvider();

      // Force account selection prompt
      provider.setCustomParameters({
        prompt: 'select_account'
      });

      // Use native plugin for Android (initialized in App.tsx)
      if (Capacitor.isNativePlatform()) {
        const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
        const googleUser = await GoogleAuth.signIn();
        const credential = GoogleAuthProvider.credential(googleUser.authentication.idToken);
        await signInWithCredential(auth, credential);
      } else {
        // Use browser popup for web
        await signInWithPopup(auth, provider);
      }
      return { error: null };
    } catch (error: any) {
      console.error('Google Sign-In error:', error);
      if (Capacitor.isNativePlatform()) {
        alert('Google Sign-In Error: ' + (error?.message || JSON.stringify(error)));
      }
      if (error.code === 'auth/unauthorized-domain') {
        console.error('DOMAIN ERROR: You must add this domain to Firebase Console > Authentication > Settings > Authorized Domains:', window.location.origin);
        alert(`Calculated Origin: ${window.location.origin}\n\nPlease add this domain to Firebase Console Authorized Domains.`);
      }
      return { error: error as Error };
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const auth = getFirebaseAuth();
      await signInWithEmailAndPassword(auth, email, password);
      return { error: null };
    } catch (error: any) {
      if (Capacitor.isNativePlatform()) {
        alert('Email Sign-In Error: ' + JSON.stringify(error?.message || error));
      }
      return { error: error as Error };
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      const auth = getFirebaseAuth();
      await createUserWithEmailAndPassword(auth, email, password);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signInWithOtp = async (email: string) => {
    try {
      const auth = getFirebaseAuth();
      // Use a real path (not hash) so Firebase can append its query params.
      // Our /public/auth/index.html redirects it back into HashRouter.
      const url = `${window.location.origin}/auth?mode=emailLink`;

      await sendSignInLinkToEmail(auth, email, {
        url,
        handleCodeInApp: true,
      });
      window.localStorage.setItem('habitex_emailLinkSignInEmail', email);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const verifyOtp = async (email: string, token: string) => {
    // Firebase email-link sign-in doesn't use an in-app token.
    // Keep method for API compatibility.
    void email;
    void token;
    return { error: null };
  };

  const resetPassword = async (email: string) => {
    try {
      const auth = getFirebaseAuth();
      const url = `${window.location.origin}/auth?mode=reset`;
      await sendPasswordResetEmail(auth, email, { url });
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    const auth = getFirebaseAuth();
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      signInWithOtp,
      verifyOtp,
      resetPassword,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
