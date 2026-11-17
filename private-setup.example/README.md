# Professor AI — Private Setup Instructions

> **This folder is NOT committed to git.** It contains secrets and credentials.
> See `.gitignore` for the exclusion rules.

## Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project**.
3. Name it `Professor AI`.
4. Skip Google Analytics for now (optional later).
5. Click **Create project**.
6. Wait for Firebase to finish provisioning.

## Step 2: Copy the Web Config

1. In your Firebase project, go to **Project Settings** (gear icon).
2. Scroll to **Your apps** → **Web app** → **Register app**.
3. Copy the `firebaseConfig` object values.

## Step 3: Place the Config in `.env.local`

Copy `.env.example` to `.env.local` and fill in the values from Step 2:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

## Step 4: Enable Authentication Providers

1. In Firebase Console, go to **Authentication** → **Sign-in method**.
2. Enable the following providers:
   - **Email/Password**
   - **Google**
   - **GitHub** (requires OAuth app setup)
   - **Apple** (optional)
3. For GitHub, create an OAuth app on GitHub and paste the Client ID/Secret.

## Step 5: Create and Deploy Firestore Rules

1. In Firebase Console, go to **Firestore Database** → **Create database**.
2. Choose **Start in test mode** (we'll lock it down).
3. Once created, go to the **Rules** tab.
4. Copy the contents of `firestore/firestore.rules` and paste it here.
5. Click **Publish**.

## Step 6: Authorise Domains

1. In Firebase Console, go to **Authentication** → **Sign-in method** → **Authorised domains**.
2. Add:
   - `localhost` (for development)
   - `127.0.0.1`
   - Your GitHub Pages URL: `professor-ai.github.io` (or `matth.github.io` depending on your username)
   - `*.firebaseapp.com` (for preview deployments)

## Step 7: Set Up App Check (reCAPTCHA)

1. In Firebase Console, go to **App Check**.
2. Under **reCAPTCHA**, click **Register app**.
3. Choose **Web**.
4. Copy the **Site key**.
5. Paste it into `.env.local` as `VITE_APPCHECK_KEY`.
6. Enable **Debug mode** for localhost (optional, useful during development).

## Step 8: Run Locally

```bash
npm install
npm run dev
```

## Step 9: Deploy to GitHub Pages

1. Ensure `.github/workflows/deploy.yml` exists (it does).
2. Make sure the repository is public.
3. In GitHub, go to **Settings** → **Pages** → **Source** → **GitHub Actions**.
4. Push to `main` to trigger the workflow.

## Where Each Config Value Goes

| Value | Where It Goes |
|-------|---------------|
| `VITE_FIREBASE_API_KEY` | `.env.local` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `.env.local` |
| `VITE_FIREBASE_PROJECT_ID` | `.env.local` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `.env.local` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `.env.local` |
| `VITE_FIREBASE_APP_ID` | `.env.local` |
| `VITE_FIREBASE_MEASUREMENT_ID` | `.env.local` (optional — Google Analytics) |
| `VITE_APPCHECK_KEY` | `.env.local` (optional but recommended) |
| `VITE_PROFESSOR_API_URL` | `.env.local` (optional) |
| `VITE_PROFESSOR_API_KEY` | `.env.local` (optional) |
| `VITE_PROFESSOR_MODEL` | `.env.local` (optional) |
| `firestore.rules` | Firebase Console → Firestore → Rules |
| `manifest.json` | `public/manifest.json` |

## Security Notes

- Never commit `.env.local` or any file containing secrets.
- App Check (reCAPTCHA v3) is best-effort deterrence — it reduces bots but does not guarantee security.
- Per-account quotas are enforced in Firestore rules, not client-side code.
- Disposable email domains are blocked at sign-up via a client-side check.
- Email verification is required before generating lessons or publishing publicly.