import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { isFirebaseConfigured, appCheckKey, appCheckEnabled } from './config';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

/**
 * Initialise Firebase exactly once. App Check (reCAPTCHA Enterprise) is attached
 * when a site key is configured — it is the main bot-deterrence layer on the
 * free tier and is required before any Firestore read/write.
 */
export function initFirebase(): { app: FirebaseApp; auth: Auth; db: Firestore } {
  if (app) {
    if (!auth || !db) throw new Error('Firebase initialisation incomplete');
    return { app, auth, db };
  }

  if (!isFirebaseConfigured) {
    throw new Error(
      'Firebase is not configured. Copy .env.example to .env.local and fill in your Firebase web config (see private-setup/README.md).'
    );
  }

  app = initializeApp({
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  });

  // App Check (reCAPTCHA Enterprise) is opt-in only — see config.ts.
    // A misconfigured key returns HTTP 400 and blocks ALL auth, so it must
    // never be enabled by accident. Set VITE_APPCHECK_ENABLED=true after the
    // deployment domain is registered in the reCAPTCHA Enterprise console.
    if (appCheckEnabled && appCheckKey) {
      try {
        initializeAppCheck(app, { provider: new ReCaptchaEnterpriseProvider(appCheckKey) });
      } catch (err) {
        console.warn('App Check initialisation failed:', err);
      }
    }

  auth = getAuth(app);
  db = getFirestore(app);
  return { app, auth, db };
}

export function getFirebaseAuth(): Auth {
  if (!auth) initFirebase();
  if (!auth) throw new Error('Auth not initialised');
  return auth;
}

export function getFirebaseDb(): Firestore {
  if (!db) initFirebase();
  if (!db) throw new Error('Firestore not initialised');
  return db;
}
