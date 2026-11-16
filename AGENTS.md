# Professor AI — Agent Conventions

> This document is for AI agents working in this repository. Follow these rules strictly.

## Core Rules

1. **Never deliver scaffold-only work.** Every feature in the spec must be fully implemented. If a feature is incomplete, mark it in `PROGRESS.md` and explain what remains.
2. **Don't fix unrelated pre-existing issues.** Only fix bugs caused by or tightly coupled to your changes.
3. **Update `PROGRESS.md`, `AGENTS.md`, and `DECISIONS.md` after every meaningful change.**
4. **Production-quality code.** Include error handling, loading states, and empty states.
5. **Keep it light and optimized.** Small bundle, lazy-loaded routes, paginated queries, batched writes, caching, no unnecessary realtime listeners.

## Architecture

```
src/
├── lib/              # Core libraries
│   ├── types.ts      # TypeScript domain models
│   ├── config.ts     # Vite env var centralization
│   ├── firebase.ts   # Firebase init (one-time, with App Check)
│   ├── store.ts      # Firestore data layer (pagination, batches, quotas)
│   ├── auth.ts       # Auth helpers (dedupe, disposable domains)
│   ├── utils.ts      # Utility functions
│   └── ai/           # AI stack
│       ├── provider.ts    # AiProvider interface, factories, JSON extractor
│       ├── docs.ts        # Doc grounding (LANGUAGE_DOCS, fetchExcerpt)
│       ├── generator.ts   # Feasibility + lesson plan generation
│       └── chat.ts        # Adaptive chat (hints only, never direct answers)
├── context/          # React context (AppContext, settings persistence)
├── components/       # Reusable components
│   ├── layout/       # Header, MainLayout
│   ├── chat/         # AdaptiveChatBar
│   └── ui/           # Button, Input, Card, EmptyState, Loader, Skeleton
├── pages/            # Route components
│   ├── Dashboard.tsx
│   ├── Settings.tsx
│   ├── SignIn.tsx
│   ├── Onboarding.tsx
│   ├── create/CreateFlow.tsx
│   ├── Discover.tsx
│   └── lesson/LessonPlayer.tsx
└── App.tsx           # Root orchestrator with routing
```

## Stack

- **Vite** + **React 18** + **TypeScript 5** + **Tailwind 3**
- **React Router 6** for routing (lazy-loaded)
- **Firebase Web SDK 10** (Auth + Firestore only, Spark plan)
- **TanStack Query 5** for data fetching with caching
- **Lucide React** for icons
- **React Markdown** + **Remark GFM** for markdown rendering
- **React Hot Toast** for notifications
- **Vite Plugin PWA** for service worker

## Conventions

- **Components**: Functional, with TypeScript props interfaces
- **Styling**: Tailwind utility classes, not styled-components or CSS modules
- **Icons**: Lucide React only
- **State**: React context for global settings, TanStack Query for server state, local `useState` for component state
- **Error handling**: Try/catch with toast notifications, never silently swallow errors
- **Quotas**: Enforced in Firestore rules (server-side), with client-side pre-flight checks
- **AI safety**: Chat bar never gives direct answers — hints and Socratic questions only
- **Accessibility**: WCAG 2.2 AA — keyboard navigation, focus states, ARIA landmarks, screen-reader-friendly

## Git Conventions

- Commit messages: conventional commits (`feat:`, `fix:`, `docs:`, `chore:`)
- Version bump per commit (semantic versioning)
- Include `Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>` trailer

## Forbidden Actions

- Do not commit API keys, tokens, or service accounts
- Do not commit `.env.local` or any file containing secrets
- Do not modify `private-setup/` folder (it's gitignored)
- Do not use Cloud Functions, phone/SMS auth, or anything requiring the Blaze plan
- Do not add realtime listeners unnecessarily (use polling for lists)
- Do not use heavy gradients, glassmorphism, or glowing effects (except the thin rainbow outline on the chat bar)

## Mid-Build Changes (BACKLOG Process)

When the user pastes new ideas, changes, or fixes while work is in progress:

1. **Do NOT drop what you're doing** — continue the current task.
2. Add the item to the **📝 BACKLOG** section of `PROGRESS.md` with:
   - Short description
   - User's exact wording
   - Where it fits in the build
3. Acknowledge briefly in one line (e.g., "Noted in the backlog").
4. Come back to backlog items at a sensible point — when building the relevant part, finishing a milestone, or when it naturally fits with related work.
5. If an item conflicts with something already built, flag the conflict in the backlog entry and ask before changing anything.
6. Mark items as done in `PROGRESS.md` once completed, and mention them in your summary.
7. Never use the backlog as an excuse to cut scope — every item added is still a requirement.