import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  sendSignInLinkToEmail,
  sendPasswordResetEmail,
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

      // If we initiated Google sign-in via redirect (Capacitor/Android), resolve it.
      // This also surfaces any redirect errors into console for debugging.
      getRedirectResult(auth).catch((e) => {
        // It's ok if there is no redirect result.
        console.warn('Firebase redirect result error:', e);
      });

      const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
        setFirebaseUser(nextUser);
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

      // On Android/Capacitor, popup commonly opens the system browser.
      // The browser can't reach the app's internal http://localhost origin, causing
      // "localhost refused to connect". Use redirect so auth happens within WebView.
      if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
        await signInWithRedirect(auth, provider);
      } else {
        await signInWithPopup(auth, provider);
      }
      return { error: null };
    } catch (error) {
      console.error('Google Sign-In error:', error);
      return { error: error as Error };
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const auth = getFirebaseAuth();
      await signInWithEmailAndPassword(auth, email, password);
      return { error: null };
    } catch (error) {
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
