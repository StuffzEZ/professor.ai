/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
  readonly VITE_FIREBASE_MEASUREMENT_ID?: string;
  readonly VITE_APPCHECK_KEY?: string;
  // Note: there are NO VITE_PROFESSOR_* env vars. The "Professor AI" provider
  // uses Pollinations AI (free, keyless) at build time. Custom endpoints are
  // configured at runtime via Settings → stored in localStorage, never in the bundle.
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}