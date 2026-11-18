# Architecture

> Deep-dive technical documentation for Professor AI. For a quick overview, see [README.md](../README.md).

## Technology Stack

| Layer          | Technology                                    |
| -------------- | --------------------------------------------- |
| Build tool     | Vite 5.x                                      |
| UI framework   | React 18 + TypeScript 5                       |
| Styling        | Tailwind CSS 3 + PostCSS                      |
| Routing        | React Router 6 (lazy-loaded routes)           |
| Data fetching  | TanStack Query 5                              |
| Backend        | Firebase Web SDK 10 (Auth + Firestore only)   |
| Icons          | Lucide React                                  |
| Markdown       | react-markdown + remark-gfm                   |
| Notifications  | react-hot-toast                               |
| PWA            | vite-plugin-pwa                               |

## Project Structure

```
src/
├── lib/                    # Core libraries
│   ├── types.ts            # Domain models (LessonPlan, Category, UserProfile)
│   ├── config.ts           # Centralized Vite env vars
│   ├── firebase.ts         # Firebase init + App Check (opt-in)
│   ├── store.ts            # Firestore data layer (pagination, batches, quotas)
│   ├── auth.ts             # Auth helpers (dedupe, disposable domains)
│   ├── utils.ts            # Utility functions (cn() tailwind-merge wrapper)
│   └── ai/
│       ├── provider.ts     # AiProvider interface, factories, JSON extractor
│       ├── docs.ts         # Doc grounding (LANGUAGE_DOCS, fetchExcerpt)
│       ├── generator.ts    # Feasibility + lesson plan generation
│       └── chat.ts         # Adaptive chat (hints only, never direct answers)
├── context/                # React context (AppContext, settings persistence)
├── components/
│   ├── layout/             # Header, MainLayout
│   ├── chat/               # AdaptiveChatBar (rainbow outline, retract logic)
│   └── ui/                 # Button, Input, Card, EmptyState, Loader, Skeleton
├── pages/                  # Route components (lazy-loaded)
│   ├── Dashboard.tsx
│   ├── Settings.tsx
│   ├── SignIn.tsx
│   ├── Onboarding.tsx
│   ├── create/CreateFlow.tsx
│   ├── Discover.tsx
│   └── lesson/LessonPlayer.tsx
└── App.tsx                 # Root orchestrator with routing
```

## Data Model

### Firestore Collections

```
/users/{uid}                  # User profile (cooldownUntil, verifiedEmail)
  /usage/{date}               # Daily quota counters (generations, publishes)
  /lessons/{lessonId}         # Private user lessons
  /categories/{catId}         # User-created categories
  /progress/{progressId}      # Section completion tracking

/publicLessons/{lessonId}     # Publicly browsable lessons
```

### Key Types (from src/lib/types.ts)

```typescript
interface LessonPlan {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  language: string;
  sections: Section[];
  metadata: {
    estimatedDuration: number; // minutes
    prerequisites: string[];
    finalProject: string;
  };
}

interface Section {
  id: string;
  title: string;
  type: 'read' | 'quiz' | 'exercise' | 'challenge';
  content: string;
  // Quiz/exercise fields...
}

interface UsageRecord {
  uid: string;
  date: string; // YYYY-MM-DD
  generations: number;
  publishes: number;
}
```

## AI Generation Flow

### Lesson Creation Pipeline

1. **User describes goal** → e.g., "I want to make a Minecraft plugin"
2. **AI suggests languages** → reads documentation to assess feasibility
3. **Feasibility check** → if mismatched (e.g., Scratch + Minecraft plugin), explains why
4. **Documentation grounding** → fetches relevant docs via `fetchExcerpt()` from `LANGUAGE_DOCS`
5. **Prompt construction** → combines user goal + docs + difficulty into structured prompt
6. **JSON extraction** → validates AI response against section schema
7. **Lesson assembly** → creates Firestore document with full plan

### Chat System Constraints

The adaptive chat bar enforces:
- No direct answers to coding questions
- Hints only
- Socratic questioning
- Concept explanation without solutions

This is enforced via prompt engineering in `chatWithLesson()` — the AI is instructed to never output the solution directly.

## Quota Enforcement

### Client-Side Pre-flight Checks (src/lib/store.ts)

```typescript
// Daily limit: 5 generations for established, 2 for new accounts
async function reserveGeneration(uid: string): Promise<boolean> {
  const usageRef = doc(db, 'users', uid, 'usage', today());
  const usage = await getDoc(usageRef);
  
  // Cooldown check (new accounts)
  const user = await getUserProfile(uid);
  if (user.cooldownUntil > Date.now()) return false;
  
  // Count check
  if ((usage?.data()?.generations ?? 0) >= QUOTA.dailyGenerations) return false;
  
  // 30-second gap check
  if ((usage?.data()?.lastGenerated ?? 0) > Date.now() - 30_000) return false;
  
  return true;
}
```

### Server-Side Firestore Rules (firestore/firestore.rules)

```javascript
match /publicLessons/{lessonId} {
  allow create: if isAuthenticated()
                  && request.resource.data.ownerId == request.auth.uid
                  && !isCooldown(request.resource.data.ownerId);
}
```

### Quota Limits

| Limit                             | Value                  |
| --------------------------------- | ---------------------- |
| Daily lesson generations (est.)   | 5                      |
| Daily lesson generations (new)    | 2 (first 7 days)       |
| Minimum gap between generations   | 30 seconds             |
| Monthly public publishes          | 10                     |

## Free-Tier Quota Estimates

| Operation                          | Frequency/session | Est. daily reads |
| ---------------------------------- | ----------------- | ---------------- |
| Load own lessons (paginated)       | Once per dashboard| 1–5              |
| Load single lesson                 | Once per view     | 1                |
| Save progress                      | After each section| 1 write          |
| List public lessons                | Paginated load    | 1                |
| **Total (typical user)**           | **~10–20 views**  | **< 50 reads**   |

Firebase Spark free tier: 50,000 reads/day, 20,000 writes/day. This app operates well within those limits.

## Security Measures

### Firebase App Check (reCAPTCHA Enterprise) — OPT-IN

Prevents automated abuse by attaching verification tokens to every Auth/Firestore request. Configured in `src/lib/firebase.ts`. **App Check is OFF by default** — a misconfigured site key returns HTTP 400 and blocks ALL auth, so it must never be enabled by accident.

```typescript
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { appCheckEnabled, appCheckKey } from './config';

// Only initialise when explicitly enabled AND a key is present.
if (appCheckEnabled && appCheckKey) {
  initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(appCheckKey),
    isTokenAutoRefreshEnabled: true,
  });
}
```

Set `VITE_APPCHECK_ENABLED=true` in `.env.local` (and as a GitHub Actions secret) only after the deployment domain is registered in the reCAPTCHA Enterprise console.

### Email Verification Gate

Reads-only routes accessible without verified email. Generation and publishing require `auth.token.email_verified === true`.

### Disposable Domain Blocklist

Blocked domains (partial list from `src/lib/auth.ts`):
- mailinator.com, tempmail.com, guerrillamail.com, 10minutemail.com
- yopmail.com, fakeinbox.com, throwaway.email

### Ownership Enforcement

Every writable document requires `request.auth.uid == resource.data.ownerId` (or `request.resource.data.ownerId` on create).

## Deployment Architecture

```
GitHub Pages (static hosting)
├── index.html
├── assets/ (bundled JS/CSS)
└── manifest.json

Firebase (backend services)
├── Auth (provider-agnostic)
├── Firestore (NoSQL database)
└── App Check (bot protection)

External AI Providers
├── Professor AI endpoint (default)
├── Pollinations AI (free tier)
└── Custom OpenAI-compatible endpoints
```

## Known Technical Debt

1. **Transitive vulnerabilities** in Firebase SDK dependencies (@grpc/grpc-js, esbuild) — inherent to current Firebase version, requires major bump to resolve
2. **No centralized AI proxy** — Professor AI calls come directly from browser; global rate limiting not possible without paid backend
3. **localStorage API key storage** — custom endpoint keys stored client-side; acceptable risk but not ideal for production hardening

## Related Documentation

- [README.md](../README.md) — Quick start and feature overview
- [PROGRESS.md](../PROGRESS.md) — Build status and backlog
- [DECISIONS.md](../DECISIONS.md) — Architectural choices with rationale
- [AGENTS.md](../AGENTS.md) — Conventions for AI agents working in this repo
- [SECURITY.md](../SECURITY.md) — Security policy and reporting
