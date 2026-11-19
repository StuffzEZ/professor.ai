# Professor AI — Decisions

> Key choices and the reasoning behind them.

## 1. Firebase Spark Plan Only

**Decision:** Use only Firebase Auth and Firestore. No Cloud Functions, no phone/SMS auth, no Blaze plan features.

**Why:** The user explicitly requested the free Spark plan. This means:
- All logic runs client-side (React/Vite)
- Firestore security rules enforce quotas and access control
- No server-side code to maintain or scale
- App Check (reCAPTCHA Enterprise) is the only bot-deterrence available

**Trade-off:** Client-side code is visible to users, so quotas must be enforced in Firestore rules (not just client-side). We do this.

## 2. App Check (reCAPTCHA Enterprise) for Bot Deterrence — OPT-IN

**Decision:** Integrate Firebase App Check with reCAPTCHA Enterprise, but make it **opt-in** (`VITE_APPCHECK_ENABLED` must be `true`). It is OFF by default.

**Why:** On the free tier, there's no server to run server-side rate limiting. App Check is the best available bot-deterrence. It's best-effort — we document this honestly.

**Why opt-in:** A misconfigured reCAPTCHA Enterprise site key (wrong domain, expired key, etc.) returns HTTP 400 and blocks **all** auth. During production testing on `professorai.stufy.qzz.io`, every sign-in method (Google, GitHub, Email) failed with this exact error. Making App Check opt-in means the app stays usable while the domain registration is in progress, and prevents accidental lockout from a bad key.

**Trade-off:** reCAPTCHA Enterprise is not a guarantee. Bots can still bypass it. We mitigate with per-account quotas in Firestore rules and disposable email domain blocking. Without App Check enabled, there is no bot deterrence — rely on Firestore rules and email verification.

## 3. Pollinations AI as Default Fallback

**Decision:** Use Pollinations AI as the default AI provider when the Professor endpoint is not configured.

**Why:** Pollinations offers a free tier with no API key required, making the app usable out of the box. The Professor endpoint (when configured) takes priority.

**Trade-off:** Pollinations may be less reliable or slower than a dedicated endpoint. We handle this with graceful degradation and user-visible error messages.

## 4. Firestore Quota Enforcement (Server-Side Rules)

**Decision:** Enforce daily generation limits (5/day, 2/day for first 7 days) and publish limits in Firestore security rules.

**Why:** Client-side checks can be bypassed. Firestore rules run server-side and are the only reliable enforcement mechanism on the free tier.

**Trade-off:** Firestore rules are more complex to write and test. We mitigate with clear documentation and a local emulator for testing.

## 5. No Realtime Listeners — Polling Instead

**Decision:** Use polling (onFocus/refetch) instead of realtime listeners for lesson lists and discover feed.

**Why:** The free Spark plan has a limit of 100,000 reads/day. Realtime listeners can consume this quickly with multiple active users. Polling reduces read consumption.

**Trade-off:** Polling has slight latency (data appears after next focus/refetch). We mitigate with TanStack Query's caching and background refetch.

## 6. Doc Grounding for Lesson Generation

**Decision:** Fetch and include canonical documentation excerpts in the AI prompt when generating lessons.

**Why:** The user explicitly requested lessons "grounded in real documentation the AI has read, not guesses." This improves accuracy and reduces hallucinations.

**Trade-off:** Fetching docs adds latency and can fail. We handle this with graceful degradation (note when no docs available) and size limits (max 3 URLs, 1200 chars excerpt).

## 7. Email Verification Before Generation/Publish

**Decision:** Block lesson generation and public publishing until the user's email is verified.

**Why:** This is a free-tier abuse prevention measure. It reduces bots and spam accounts without requiring server-side logic.

**Trade-off:** Legitimate users who don't verify their email can't use the app. We mitigate with a clear verification prompt and resend button.

## 8. No Household/IP-Based Limiting

**Decision:** Do not implement household or IP-based rate limiting.

**Why:** On the free tier, there's no server to run this logic. IP-based limiting would wrongly block families, schools, and shared networks. Per-account quotas are the only reliable approach.

**Trade-off:** Users sharing an account can exceed quotas. We mitigate with per-account daily limits and cooldowns.

## 9. Adaptive Chat Bar — Hints Only

**Decision:** The chat bar never gives direct answers. It provides hints, asks guiding questions, and explains concepts.

**Why:** The user explicitly requested this. It encourages active learning rather than passive consumption.

**Trade-off:** Users may find it frustrating to not get direct answers. We mitigate with a clear "Hint mode" label and a Socratic questioning style.

## 10. GitHub Pages Deployment

**Decision:** Deploy the static frontend to GitHub Pages via GitHub Actions.

**Why:** The user explicitly requested GitHub Pages. It's free and integrates well with the GitHub repo.

**Trade-off:** GitHub Pages requires the repo to be public. We document this. The `base` path in `vite.config.ts` must match the repo name.

## 11. No Build-Time API Keys in Static Bundles

**Decision:** Do not configure any secret API keys as `VITE_*` environment variables. The Professor AI endpoint is configured at runtime in Settings (stored in localStorage). Custom endpoints work the same way — no secrets in the bundle.

**Why:** Vite replaces all `import.meta.env.VITE_*` references with actual string values **at build time**. On GitHub Pages, the resulting JS bundle (`dist/assets/*.js`) is publicly served. Anyone can read it and extract your API key. This is by design, not a bug — static sites have no server-side code to keep secrets private.

**What this means:**
- Firebase web config (`apiKey`, `projectId`, etc.) is safe — it's a public project identifier, not a secret. The real protection comes from Authorized Domains and Firestore rules.
- App Check reCAPTCHA site key is safe — it's a domain-registered identifier, not a secret.
- The Professor AI API key is intentionally NOT in the bundle. Users who want a dedicated endpoint configure it in Settings.
- Pollinations AI requires no key at all.

**Trade-off:** A dedicated Professor AI endpoint cannot be baked into the GitHub Actions build. Users who want one configure it themselves via Settings. This is the correct security posture for a fully-static deployment.

## 12. HTML Sanitization via DOMParser (Not Regex)

**Decision:** Strip HTML from fetched documentation using `DOMParser.parseFromString()` + `textContent`, with a safe regex fallback (built from `escapeRegExp`) for environments without DOMParser.

**Why:** CodeQL flagged the previous regex-based HTML stripping with four high-severity alerts (bad HTML filtering regexp, incomplete multi-character sanitization, double escaping). Regexes cannot reliably parse HTML; the DOM parser is the standards-compliant approach and handles all edge cases.

**Trade-off:** Slightly more code than a regex. The fallback path is only used in non-browser environments (e.g. tests) and is conservative (strips all tags).