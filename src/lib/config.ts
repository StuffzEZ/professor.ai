/**
 * Centralised environment configuration.
 *
 * All values come from Vite env vars (see .env.example / private-setup/README.md).
 * Nothing here is a secret that must stay private: the Firebase web config and
 * the App Check key are public by design. The Professor AI endpoint key is
 * intended for a low-trust, rate-limited public endpoint — see DECISIONS.md.
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

export const professorEndpoint = {
  url: import.meta.env.VITE_PROFESSOR_API_URL ?? '',
  key: import.meta.env.VITE_PROFESSOR_API_KEY ?? '',
  model: import.meta.env.VITE_PROFESSOR_MODEL ?? 'gpt-4o-mini',
};

/**
 * Whether the Professor AI endpoint key is actually present at build time.
 * When false, the app falls back to Pollinations AI (free, keyless).
 */
export const hasProfessorKey = Boolean(professorEndpoint.key);

/** True when the Firebase web config has been filled in. */
export const isFirebaseConfigured =
  Boolean(firebaseConfig.apiKey) && Boolean(firebaseConfig.projectId);

/** True when a dedicated Professor AI endpoint is configured. */
export const isProfessorEndpointConfigured = Boolean(professorEndpoint.url);

/**
 * Pollinations AI — free, keyless, OpenAI-compatible.
 * Used as the community backend for the default "Professor AI" provider when
 * no dedicated endpoint is configured, and as a standalone provider.
 */
export const POLLINATIONS_URL = 'https://text.pollinations.ai/openai';
export const POLLINATIONS_MODEL = 'openai';
