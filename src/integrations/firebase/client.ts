import { FirebaseApp, getApps, initializeApp } from 'firebase/app';
import {
  Auth,
  browserLocalPersistence,
  getAuth,
  indexedDBLocalPersistence,
  setPersistence,
} from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';

type FirebaseConfig = {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
};

export function getFirebaseConfig(): FirebaseConfig {
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };
}

let cachedApp: FirebaseApp | null = null;
let cachedAuth: Auth | null = null;
let cachedDb: Firestore | null = null;
let persistenceConfigured = false;

export function isFirebaseConfigured(): boolean {
  const cfg = getFirebaseConfig();
  return !!(cfg.apiKey && cfg.authDomain && cfg.projectId && cfg.appId);
}

export function getFirebaseApp(): FirebaseApp {
  if (cachedApp) return cachedApp;

  const apps = getApps();
  if (apps.length) {
    cachedApp = apps[0];
    return cachedApp;
  }

  const cfg = getFirebaseConfig();
  if (!isFirebaseConfigured()) {
    throw new Error(
      'Firebase is not configured. Set VITE_FIREBASE_* environment variables (see .env.example) and redeploy.'
    );
  }

  cachedApp = initializeApp(cfg as Required<FirebaseConfig>);
  return cachedApp;
}

export function getFirebaseAuth(): Auth {
  if (cachedAuth) return cachedAuth;
  cachedAuth = getAuth(getFirebaseApp());

  if (!persistenceConfigured) {
    persistenceConfigured = true;
    // Best-effort persistence configuration; falls back if unavailable.
    setPersistence(cachedAuth, indexedDBLocalPersistence).catch(() => {
      setPersistence(cachedAuth!, browserLocalPersistence).catch(() => undefined);
    });
  }

  return cachedAuth;
}

export function getFirebaseDb(): Firestore {
  if (cachedDb) return cachedDb;
  cachedDb = getFirestore(getFirebaseApp());
  return cachedDb;
}
