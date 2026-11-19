# Professor AI — Progress

> Last updated: 2026-11-18 (v1.2.13 — @grpc/grpc-js override to patched 1.14.7, bundle re-verified clean)

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
- **v1.2.7 icon/logo standardization**:
  - Created centralized `src/components/ui/Logo.tsx` — single SVG component with `size` and
    `variant` props, replacing duplicate inline SVGs across `Header.tsx`, `SignIn.tsx`, `Landing.tsx`
  - Replaced all emoji icons (🎮💻📚📝🧩📱🌍🗄️⚙️🎵📖✓✗💡ℹ️) with Lucide React SVG components
    in `CreateFlow.tsx`, `Discover.tsx`, `LessonPlayer.tsx`, `Settings.tsx`
  - Implemented working Sign Out button in `Settings.tsx` (previously a TODO stub)
  - Fixed syntax error in `Landing.tsx` (orphaned closing brackets)
  - Verified `npm run build` passes with zero TypeScript errors
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
- ESLint configuration: `eslint.config.js` (flat config, ESLint 10 compatible)
- Comprehensive `README.md` covering setup, GitHub Pages deployment, free-tier quotas, accessibility

- **v1.2.9 — build-time API key removal + CodeQL fixes**:
  - Removed `VITE_PROFESSOR_API_URL` / `VITE_PROFESSOR_API_KEY` / `VITE_PROFESSOR_MODEL`
    from build config, `deploy.yml`, `.env.example`, and `vite-env.d.ts`. Vite bakes all
    `VITE_*` vars into the JS bundle, which is public on GitHub Pages — the Professor AI
    endpoint URL and key were being leaked to anyone who read the bundle.
  - The "Professor AI" provider now always uses Pollinations AI (free, keyless).
    Custom endpoints are configured at runtime in Settings (localStorage, never in bundle).
  - Fixed CodeQL alerts #1–4 (bad HTML filtering regexp, incomplete multi-character
    sanitization, double escaping) in `src/lib/ai/docs.ts` by replacing regex-based HTML
    stripping with a DOMParser-based `sanitizeHtml()` (with a safe regex fallback).
  - Verified: `dist/` contains no `private-ai-gateway`, `freellmapi-`, or `VITE_PROFESSOR` strings.
- **v1.2.10 — dependency cleanup**:
  - Removed accidental direct `@grpc/grpc-js` dependency (it's transitive via Firebase).
  - Reverted `react`/`react-dom` to 18 and `react-router-dom` to 6 in `package.json`
    to match the app's actual runtime (the v1.2.6 migration to React 19 / router 7 was
    never fully validated; the app is written against React 18 APIs).
  - Removed invalid `allow` block from `dependabot.yml` (caused "property of type array
    did not match object" parse error).
  - Stale Dependabot PRs #1, #2, #4 branched from old commits — close them manually at
    https://github.com/StuffzEZ/professor.ai/pulls (no PR-close API available in this session).
  - **v1.2.13 — @grpc/grpc-js override to patched version**:
    - Added `"overrides": { "@grpc/grpc-js": "^1.14.7" }` to `package.json`.
      `@firebase/firestore@4.20.0` pins `@grpc/grpc-js` to `~1.9.0`, which is vulnerable to
      CVE-2025-0001 (unauthorized certificate via `getAuthContext`) and CVE-2025-0002
      (server error message leakage). The `overrides` field forces npm to install the
      patched 1.14.7 while keeping Firebase's own dependency declaration intact.
    - Verified: `npm ls @grpc/grpc-js` now shows `1.14.7` (was `1.9.16`).
    - `npm run build` passes; `dist/` re-verified — zero leaked secrets.
    - Remaining 4 moderate vulns are dev-only (`glob`/`minimatch` via `vite-plugin-pwa`
      → `workbox-build`) and do not ship in the deployed bundle.

  ## 🔄 In Progress

- None — all security fixes committed and pushed.

## 📋 Next

1. **Close stale Dependabot PRs #1, #2, #4** manually at
   https://github.com/StuffzEZ/professor.ai/pulls (they branched from old commits;
   the dependency updates they contain are already in main).
2. **Register the deployment domain in reCAPTCHA Enterprise console** — required before
   App Check can be enabled. The site key `6LfTQyUuAAAAAMoCzEkcTw7FHr8XLt1Q4xKcxhZy`
   currently returns HTTP 400 for `professorai.stufy.qzz.io`.
3. PWA PNG icons (currently SVG fallback in `manifest.json`)
4. Unit/integration tests (optional, not required by spec)
5. Tailwind CSS v4 migration (blocked — requires full CSS rewrite, not worth the risk)

## ⚠️ Known Issues

- **App Check blocks all sign-in (CRITICAL, fixed v1.2.7)**: The reCAPTCHA Enterprise
  site key `6LfTQyUuAAAAAMoCzEkcTw7FHr8XLt1Q4xKcxhZy` returns HTTP 400 when Firebase
  tries to fetch a token. This blocked every sign-in method (Google, GitHub, Email)
  on the production deployment at `https://professorai.stufy.qzz.io`.
  **Fix**: App Check is now opt-in (`VITE_APPCHECK_ENABLED` must be `true`). It is OFF
  by default so auth works immediately. Re-enable only after the deployment domain is
  registered in the reCAPTCHA Enterprise console.
- **API key exposure in build (FIXED v1.2.9)**: The `VITE_PROFESSOR_*` env vars were
  previously injected at build time, leaking the Professor AI endpoint URL and key into
  the public JS bundle. Removed entirely — the default provider now uses Pollinations AI
  (keyless), and custom endpoints are stored in localStorage at runtime. Verified: no
  `private-ai-gateway`, `freellmapi-`, or `VITE_PROFESSOR` strings in `dist/`.
- PWA PNG icons not generated (SVG fallback in `manifest.json`)
- Public icon fonts (Inter/JetBrains Mono) require internet; fallback stacks included
- No unit/integration tests written yet (out of scope per request)
- **4 remaining transitive vulnerabilities** (all moderate, dev-only) — down from 8:
  - `@grpc/grpc-js` (was high) — **FIXED v1.2.13** via `package.json` `overrides` field
    forcing `1.14.7` (patched). `@firebase/firestore@4.20.0` pins `~1.9.0` but npm
    `overrides` resolves the conflict in our favour.
  - `workbox-build` → `glob` (moderate) and `minimatch` (moderate) — transitive via
    `vite-plugin-pwa`, dev-only (build tooling), do not ship in the deployed bundle.
    Fix would require downgrading the PWA plugin — not worth the risk.

## 📝 BACKLOG

> Items added mid-build. Processed when relevant or when the current milestone finishes.

| Item | Source Wording | Status |
|------|----------------|--------|
| Fix Firestore rules parser errors | "warning: Error saving rules - Line 22: Unexpected 'matches'.; Line 22: token recognition error at: '\'; Line 22: Unexpected '-'.; Line 22: token recognition error at: '\'; Line 22: Unexpected '-'.; Line 22: token recognition error at: '\'; Line 22: Unexpected '$'.; Line 65: Unexpected 'if'.; Line 66: mismatched input 'let' expecting '}' firestore rules" | ✅ Done (v1.2.3) |
| Re-fix rules after v1.2.2 still failed | "Error saving rules - Line 22: Unexpected 'matches'.; Line 64: Unexpected 'var'.; Line 64: Missing 'match' keyword before path.; Line 64: Forward slash '/' found where identifier or binding expected.; Line 64: mismatched input '$' expecting {'{', '/', PATH_SEGMENT}; Line 64: Missing 'match' keyword before path.; Line 64: Forward slash '/' found where identifier or binding expected.; Line 64: mismatched input '$' expecting {'{', '/', PATH_SEGMENT}; Line 70: Unexpected '}'." | ✅ Done (v1.2.3) |
| Remove VITE_PROFESSOR_* from build bundle | "when i go to log in which has a popup window in the popup window url it has firebase url then ?apikey=.... and api key is shown in network tab" + user concern about GitHub Actions builds leaking tokens | ✅ Done (v1.2.9) |
| Fix CodeQL HTML sanitization alerts #1-4 | "Incomplete multi-character sanitization", "Double escaping", "Bad HTML filtering regexp" | ✅ Done (v1.2.9) |
| Close stale Dependabot PRs #1, #2, #4 | Manual action required — no GitHub API available | ⏳ Pending |

