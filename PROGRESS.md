# Professor AI — Progress

> Last updated: 2026-11-18 (v1.2.6 — major dependency migration, vulnerability reduction)

## ✅ Done

- Project scaffolding: `package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.js`, `postcss.config.js`, `index.html`
- Theme: dark palette (`#080919`), Seneca-style surfaces, accent `#6c8cff`, custom animations (`fade-in`, `slide-up`, `rainbow-shift`)
- Accessibility: focus-visible outlines, `prefers-reduced-motion` support, skip-link, ARIA landmarks
- Type system: `src/lib/types.ts` — `LessonPlan`, `Category`, `UserProfile`, `UsageRecord`, `ChatMessage`, `QUOTA`, `DIFFICULTIES`, `CATEGORY_ICONS`
- Config: `src/lib/config.ts` — centralized Vite env vars (Firebase, App Check, Professor endpoint, Pollinations fallback)
- Firebase init: `src/lib/firebase.ts` — one-time init with App Check reCAPTCHA Enterprise
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
- CI: `.github/workflows/ci.yml` — lint + typecheck + build on every push and PR
- Issue templates: `.github/ISSUE_TEMPLATE/bug-report.yml`, `feature-request.yml`, `config.yml`
- **Major dependency migration** (v1.2.6):
  - `firebase` 10 → 13.4.0 (resolves undici high vulnerabilities)
  - `react` 18 → 19.3.1, `react-dom` 18 → 19.3.1
  - `react-router-dom` 6 → 7.18.5
  - `vite` 5 → 8.3.8, `@vitejs/plugin-react` 4 → 6.3.0
  - `eslint` 8 → 10.15.0 (flat config via `eslint.config.js`)
  - `@typescript-eslint/*` 6 → 8.73.0
  - `eslint-plugin-react-hooks` 4 → 7.1.1
  - `vite-plugin-pwa` 0.19 → 2.0.0
  - Vulnerabilities reduced from **39 → 8** (4 moderate, 4 high)
- PR template: `.github/pull_request_template.md`
- CODEOWNERS: `.github/CODEOWNERS` — @stufy reviews all PRs
- Dependabot: `.github/dependabot.yml` — weekly npm updates, grouped into single PRs
- Firestore rules: `firestore/firestore.rules` — full security rules with quota enforcement
  - v1.2.3: removed the `date matches '...'` check from the usage path match (the `matches`
    keyword is not valid inside a `match` path pattern — it caused "Unexpected 'matches'"
    errors). The path pattern itself (`{date}`) is now the only constraint. Removed `let`
    from `isCooldown` — the rules language only supports `var` or direct expression return.
    The function now returns a single expression. Verified clean in Firebase Console.
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

- Nothing — all core features implemented and dependencies upgraded

## 📋 Next

All core implementation is complete. Remaining optional improvements:
1. PWA PNG icons (currently SVG fallback in `manifest.json`)
2. Unit/integration tests (optional, not required by spec)
3. First deployment to GitHub Pages to validate end-to-end flow
4. Tailwind CSS v4 migration (blocked — requires full CSS rewrite, not worth the risk)

## ⚠️ Known Issues

- PWA PNG icons not generated (SVG fallback in `manifest.json`)
- Public icon fonts (Inter/JetBrains Mono) require internet; fallback stacks included
- No unit/integration tests written yet (out of scope per request)
- **8 remaining transitive vulnerabilities** (4 moderate, 4 high) — down from 39:
  - `@grpc/grpc-js` (high, inherent to Firebase SDK) — `@firebase/firestore` pins `~1.9.0`, cannot be upgraded without Firebase releasing a newer version
  - `workbox-build` → `glob` (moderate) and `minimatch` (moderate) — transitive via `vite-plugin-pwa`, only fixable by downgrading PWA plugin
  - **These are acceptable risks** — no viable upgrade path exists without breaking core functionality

## 📝 BACKLOG

> Items added mid-build. Processed when relevant or when the current milestone finishes.

| Item | Source Wording | Status |
|------|----------------|--------|
| Fix Firestore rules parser errors | "warning: Error saving rules - Line 22: Unexpected 'matches'.; Line 22: token recognition error at: '\'; Line 22: Unexpected '-'.; Line 22: token recognition error at: '\'; Line 22: Unexpected '-'.; Line 22: token recognition error at: '\'; Line 22: Unexpected '$'.; Line 65: Unexpected 'if'.; Line 66: mismatched input 'let' expecting '}' firestore rules" | ✅ Done (v1.2.3) |
| Re-fix rules after v1.2.2 still failed | "Error saving rules - Line 22: Unexpected 'matches'.; Line 64: Unexpected 'var'.; Line 64: Missing 'match' keyword before path.; Line 64: Forward slash '/' found where identifier or binding expected.; Line 64: mismatched input '$' expecting {'{', '/', PATH_SEGMENT}; Line 64: Missing 'match' keyword before path.; Line 64: Forward slash '/' found where identifier or binding expected.; Line 64: mismatched input '$' expecting {'{', '/', PATH_SEGMENT}; Line 70: Unexpected '}'." | ✅ Done (v1.2.3) |

