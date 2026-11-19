/**
 * Centralised environment configuration.
 *
 * All values come from Vite env vars (see .env.example / private-setup/README.md).
 * Nothing here is a secret that must stay private: the Firebase web config and
  * the App Check key are public by design.
  *
  * The Professor AI endpoint is NOT configured at build time. It is set at
  * runtime in Settings (stored in localStorage). Vite bakes VITE_* env vars
  * into the JS bundle, and on a static GitHub Pages site anyone can read the
  * bundle. Putting a secret API key there would expose it.
  */

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? '',
};

export const appCheckKey = import.meta.env.VITE_APPCHECK_KEY ?? '';

/**
 * App Check must be explicitly enabled via VITE_APPCHECK_ENABLED=true.
 * It is OFF by default because a misconfigured reCAPTCHA Enterprise site key
 * (wrong domain, expired key, etc.) returns HTTP 400 and blocks ALL auth.
 * Enable only after the deployment domain is registered in the
 * reCAPTCHA Enterprise console.
 */
export const appCheckEnabled = import.meta.env.VITE_APPCHECK_ENABLED === 'true';

/**
 * The Professor AI endpoint is configured at runtime (in Settings), NOT at
 * build time. This is intentional: Vite bakes VITE_* env vars into the JS
 * bundle, and on a static GitHub Pages site anyone can read the bundle.
 * Putting a secret API key there would expose it.
 *
 * The "Professor AI" provider uses Pollinations AI (free, keyless) by default.
 * Users who want a custom endpoint configure it in Settings — the value is
 * stored in localStorage, never in the bundle.
 */
export const professorEndpoint = {
  url: '',
  key: '',
  model: 'gpt-4o-mini',
};

/** True when the Firebase web config has been filled in. */
export const isFirebaseConfigured =
  Boolean(firebaseConfig.apiKey) && Boolean(firebaseConfig.projectId);

/**
 * Pollinations AI — free, keyless, OpenAI-compatible.
 * Used as the community backend for the default "Professor AI" provider when
 * no dedicated endpoint is configured, and as a standalone provider.
 */
export const POLLINATIONS_URL = 'https://text.pollinations.ai/openai';
export const POLLINATIONS_MODEL = 'openai';
