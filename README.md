# Professor AI

An AI-powered coding learning platform focused on **goal-driven, project-based learning**.
Generates interactive lessons that build toward a learner's stated end goal — by the
end of a course, you have actually built what you asked for.

![License: GPLv3](https://img.shields.io/badge/license-GPLv3-blue.svg)
![Vite](https://img.shields.io/badge/Vite-5.4-blue)
![React](https://img.shields.io/badge/React-18-purple)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

---

## Features

- **Goal-driven curriculum**: Lessons are structured as a progression from fundamentals
  to a working final project with visible milestones and checkpoints.
- **AI-guided chat**: Adaptive chat bar with a thin rainbow outline — gives hints, asks
  guiding questions, never direct answers.
- **Progress tracking**: Saved to Firestore, resumed across sessions.
- **Public lesson discovery**: Browse and copy lessons created by others.
- **Multi-provider support**: Default endpoint, Pollinations AI (free), or any OpenAI-compatible custom API.
- **Free-tier safe**: Quota enforcement in Firestore rules; no Cloud Functions needed.
- **Accessibility first**: WCAG 2.2 AA, keyboard navigation, `prefers-reduced-motion`.
- **Mobile responsive**: Works on all screen sizes.

---

## Architecture

```
public/              Static assets (manifest, favicon, robots.txt)
src/
  components/
    chat/            AdaptiveChatBar — rainbow outline, hint system
    layout/          Header, MainLayout
    lesson/          Roadmap — milestone progress visualization
    ui/              Reusable primitives (Button, Input, Card, EmptyState, Loader, Skeleton)
  context/           AppContext — React context wrapping QueryClient + settings
  lib/
    ai/              Provider factories, lesson generator, chat logic, doc grounding
    store.ts         Firestore data layer (queries, batch writes, quota helpers)
    firebase.ts      One-time Firebase init + App Check reCAPTCHA v3
    auth.ts          Email dedupe + disposable domain blocklist
    config.ts        Centralized env vars
    types.ts         Shared TypeScript interfaces
    utils.ts         cn() utility (clsx + tailwind-merge)
  pages/
    SignIn.tsx
    Onboarding.tsx
    Dashboard.tsx
    Discover.tsx
    Settings.tsx
    create/CreateFlow.tsx
    lesson/LessonPlayer.tsx
  App.tsx            Router setup, lazy-loaded routes, auth gates
  main.tsx           Root entry
firestore/
  firestore.rules    Security rules with per-account quotas
private-setup.example/
  README.md          Template for Firebase setup instructions (no secrets)
.github/workflows/
  deploy.yml         GitHub Pages deployment pipeline
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Firebase](https://console.firebase.google.com/) project (Spark / free plan)
- A GitHub account (for Pages deployment)

### Step 1 — Set Up Firebase

Follow the step-by-step instructions in [private-setup.example/README.md](private-setup.example/README.md).

At minimum you need to:

1. Create a Firebase project.
2. Enable **Email/Password**, **Google**, and **GitHub** sign-in providers.
3. Create a Firestore database (start in test mode — rules will lock it down).
4. Copy the web app config values.
5. (Optional but recommended) Register an App Check reCAPTCHA v3 token.
6. Add your domain(s) to the authorised domains list.

### Step 2 — Configure Environment Variables

```bash
cp .env.example .env.local
```

Fill in the values from your Firebase project:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
VITE_APPCHECK_KEY=your_recaptcha_site_key   # optional but recommended
```

These keys are **client-side only** and are not secret — they are embedded in the
deployed bundle. Do **not** commit `.env.local`.

### Step 3 — Deploy Firestore Rules

Open the Firebase Console → **Firestore Database** → **Rules**, then paste the
contents of [firestore/firestore.rules](firestore/firestore.rules) and publish.

The rules enforce:
- Per-account daily generation limits (5 for established, 2 for new accounts).
- 30-day public publish cap (10).
- New-account cool-down (7 days before generation allowed).
- Email verification required for generation and publishing.

### Step 4 — Install & Run Locally

```bash
npm install
npm run dev
```

The app starts at `http://localhost:5173`.

---

## GitHub Pages Deployment

A GitHub Actions workflow is provided at [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

### Configure Your Repository

1. Push this repository to GitHub (it must be **public** for GitHub Pages free tier).
2. Go to **Settings → Pages**.
3. Set **Source** to **GitHub Actions**.
4. Push any commit to `main` to trigger the workflow.

### Base Path Configuration

If your repository name differs from the username (e.g. `username.github.io/myapp`),
the workflow automatically uses the correct base path via `VITE_BASE_PATH`. If you host
on `username.github.io`, leave it empty. The value is read at build time — no runtime
config needed.

---

## Free-Tier Quotas & Limits

Professor AI is designed to operate safely within the **Firebase Spark (free) plan**.

### Firestore Read/Write Budget (per active user)

| Operation                    | Frequency per session | Est. reads/day |
|------------------------------|-----------------------|----------------|
| Load own lessons (paginated) | Once per dashboard     | 1–5            |
| Load a single lesson         | Once per view          | 1              |
| Save progress                | After each section     | 1 write        |
| Chat prompt                  | ~5 per session         | 0 (external)   |
| List public lessons          | Paginated load         | 1              |

Assuming a typical learner does 10–20 page loads and 5–10 chat prompts per day, total
Firestore reads stay well under the **50 000 reads/day** free allowance.

### App Engine (none used)

No Cloud Functions, no scheduled tasks, no real-time listeners — everything is
single-shot reads via TanStack Query with stale-time caching.

### Quota Enforcements

| Limit                                    | Value                              |
|------------------------------------------|------------------------------------|
| Daily lesson generations (established)   | 5                                |
| Daily lesson generations (new account)   | 2 (first 7 days)                   |
| 30-day public publishes                  | 10                               |
| Minimum gap between generations          | 30 seconds                         |

See [DECISIONS.md](DECISIONS.md) for rationale and notes on what a stricter version would require.

---

## Accessibility

- Keyboard navigable throughout (Tab / Shift+Tab, Enter, Escape).
- Visible focus rings on all interactive elements (`outline-offset`, `focus-visible`).
- ARIA labels on icon-only buttons.
- Semantic landmarks (`<header>`, `<nav>`, `<main>`, `<section>`).
- Sufficient color contrast (WCAG 2.2 AA verified).
- `prefers-reduced-motion` respected — animations and the rainbow bar collapse to static.
- Scalable text using relative units (`rem`).

---

## Project Tracking

- **[PROGRESS.md](PROGRESS.md)** — current status of features and known issues.
- **[DECISIONS.md](DECISIONS.md)** — key architectural and product choices with rationale.
- **[AGENTS.md](AGENTS.md)** — conventions and rules for AI agents working in this repo.

New items added during development should go into the **BACKLOG** section of
[PROGRESS.md](PROGRESS.md) so future sessions can pick them up.

---

## License

GNU General Public License v3.0 — see [LICENSE](LICENSE).
