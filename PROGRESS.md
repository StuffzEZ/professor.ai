# Professor AI — Progress

> Last updated: 2025-01-15 (v1.2.2)

## ✅ Done

- Project scaffolding: `package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.js`, `postcss.config.js`, `index.html`
- Theme: dark palette (`#080919`), Seneca-style surfaces, accent `#6c8cff`, custom animations (`fade-in`, `slide-up`, `rainbow-shift`)
- Accessibility: focus-visible outlines, `prefers-reduced-motion` support, skip-link, ARIA landmarks
- Type system: `src/lib/types.ts` — `LessonPlan`, `Category`, `UserProfile`, `UsageRecord`, `ChatMessage`, `QUOTA`, `DIFFICULTIES`, `CATEGORY_ICONS`
- Config: `src/lib/config.ts` — centralized Vite env vars (Firebase, App Check, Professor endpoint, Pollinations fallback)
- Firebase init: `src/lib/firebase.ts` — one-time init with App Check reCAPTCHA v3
- Firestore data layer: `src/lib/store.ts` — pagination, batch writes, quota counters, doc grounding metadata
- Auth helpers: `src/lib/auth.ts` — email dedupe, disposable-domain blocklist
- Utility: `src/lib/utils.ts` — `cn()` via clsx + tailwind-merge
- AI providers: `src/lib/ai/provider.ts` — `AiProvider` interface, `openAiCompatibleChat`, professor/pollinations/custom factories, JSON extractor
- Doc grounding: `src/lib/ai/docs.ts` — curated `LANGUAGE_DOCS` map, `fetchExcerpt()` with size limits, `formatDocsForPrompt()`
- Lesson generator: `src/lib/ai/generator.ts` — `assessFeasibility()` + `generateLessonPlan()` with section-schema validation
- Adaptive chat: `src/lib/ai/chat.ts` — `chatWithLesson()` enforcing "no direct answers" constraint, `nextHint()` helper
- Context: `src/context/AppContext.tsx` + `index.ts` — React context wrapping QueryClient, settings persisted to localStorage
- Main entry: `src/main.tsx` — renders `AppProvider` + `App`
- Routing: `src/App.tsx` — single `createBrowserRouter`, lazy-loaded pages, email verification gate, protected routes
- Layout: `src/components/layout/Header.tsx`, `MainLayout.tsx`, `index.ts`
- UI primitives: `Button.tsx`, `Input.tsx`, `Card.tsx`, `EmptyState.tsx`, `Loader.tsx`, `Skeleton.tsx`
- Pages: `Dashboard.tsx`, `Settings.tsx`, `SignIn.tsx`, `Onboarding.tsx`, `create/CreateFlow.tsx`, `Discover.tsx`, `lesson/LessonPlayer.tsx`
- Chat bar: `src/components/chat/AdaptiveChatBar.tsx` — rainbow-gradient border, hover-retract, hint button, keyboard support
- Public assets: `favicon.svg`, `robots.txt`, `manifest.json`
- GitHub Actions: `.github/workflows/deploy.yml` — builds and deploys to GitHub Pages
- Firestore rules: `firestore/firestore.rules` — full security rules with quota enforcement
  - v1.2.2 fix: replaced invalid `r'^...$'` raw-string regex with a plain quoted regex
    (`date matches '[0-9]{4}-[0-9]{2}-[0-9]{2}'`); replaced `let` with `var`
    (rules language only supports `var`). Both were breaking the rules parser.
- Private setup: `private-setup/README.md` — step-by-step Firebase instructions
- Example setup: `private-setup.example/README.md` — committed template (no secrets)
- `.env.example` — placeholder config values
- `.gitignore` — excludes `private-setup/`, `.env*`, `node_modules/`, `dist/`
- ESLint configuration: `.eslintrc.cjs`
- Comprehensive `README.md` covering setup, GitHub Pages deployment, free-tier quotas, accessibility

## 🔄 In Progress

- Final lint cleanup and build verification — done
- README complete — done

## 📋 Next

All core implementation is complete. Remaining optional improvements:
1. PWA PNG icons (currently SVG fallback in `manifest.json`)
2. Unit/integration tests (optional, not required by spec)
3. First deployment to GitHub Pages to validate end-to-end flow

## ⚠️ Known Issues

- PWA PNG icons not generated (SVG fallback in `manifest.json`)
- Public icon fonts (Inter/JetBrains Mono) require internet; fallback stacks included
- No unit/integration tests written yet (out of scope per request)

## 📝 BACKLOG

> Items added mid-build. Processed when relevant or when the current milestone finishes.

| Item | Source Wording | Status |
|------|----------------|--------|
| Fix Firestore rules parser errors | "warning: Error saving rules - Line 22: Unexpected 'matches'.; Line 22: token recognition error at: '\'; Line 22: Unexpected '-'.; Line 22: token recognition error at: '\'; Line 22: Unexpected '-'.; Line 22: token recognition error at: '\'; Line 22: Unexpected '$'.; Line 65: Unexpected 'if'.; Line 66: mismatched input 'let' expecting '}' firestore rules" | ✅ Done (v1.2.2) |

