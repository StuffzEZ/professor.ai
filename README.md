# Professor AI

<div align="center">

[![License: GPLv3](https://img.shields.io/badge/license-GPLv3-blue)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.2.6-blue)]()
[![Build Status](https://github.com/StuffzEZ/professor.ai/actions/workflows/ci.yml/badge.svg)](https://github.com/StuffzEZ/professor.ai/actions)
[![Dependabot](https://img.shields.io/badge/dependabot-active-green)](https://github.com/StuffzEZ/professor.ai/blob/main/.github/dependabot.yml)
[![Issues](https://img.shields.io/github/issues/StuffzEZ/professor.ai)](https://github.com/StuffzEZ/professor.ai/issues)
[![Pull Requests](https://img.shields.io/github/issues-pr/StuffzEZ/professor.ai)](https://github.com/StuffzEZ/professor.ai/pulls)
[![Last Commit](https://img.shields.io/github/last-commit/StuffzEZ/professor.ai)](https://github.com/StuffzEZ/professor.ai/commits/main)
[![CodeQL](https://github.com/StuffzEZ/professor.ai/actions/workflows/github-code-scanning/codeql/badge.svg)](https://github.com/StuffzEZ/professor.ai/security/code-scanning)
[![Vulnerabilities](https://img.shields.io/badge/vulnerabilities-8-orange)](SECURITY.md)

An AI-powered coding learning platform focused on **goal-driven, project-based learning**.
Generates interactive lessons that build toward a learner's stated end goal — by the
end of a course, you have actually built what you asked for.

**Tech:** Vite 8 · React 19 · TypeScript · Tailwind CSS 3 · Firebase 13 · Spark Plan

</div>

---

## Quick Links

| Resource | Description |
|----------|-------------|
| [🚀 Setup Guide](private-setup.example/README.md) | Step-by-step Firebase configuration |
| [🏗️ Architecture](ARCHITECTURE.md) | Deep technical documentation |
| [📋 Progress](PROGRESS.md) | Current status and backlog |
| [🔒 Security Policy](SECURITY.md) | Vulnerability reporting & posture |
| [💡 Decisions](DECISIONS.md) | Key architectural choices |
| [🤖 Agent Guidelines](AGENTS.md) | Conventions for AI contributors |

---

## Features

- **Goal-driven curriculum**: Lessons structured as a progression from fundamentals to a working final project with visible milestones
- **AI-guided chat**: Adaptive chat bar with rainbow outline — gives hints, asks guiding questions, never direct answers
- **Progress tracking**: Saved to Firestore, resumed across sessions
- **Public lesson discovery**: Browse and copy lessons created by others
- **Multi-provider support**: Default endpoint, Pollinations AI (free), or any OpenAI-compatible custom API
- **Free-tier safe**: Quota enforcement in Firestore rules; no Cloud Functions needed
- **Accessibility first**: WCAG 2.2 AA, keyboard navigation, `prefers-reduced-motion`
- **Mobile responsive**: Works on all screen sizes

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Firebase](https://console.firebase.google.com/) project (Spark / free plan)
- A GitHub account (for Pages deployment)

### Setup

Follow the step-by-step instructions in [private-setup.example/README.md](private-setup.example/README.md).

At minimum:

1. Create a Firebase project
2. Enable **Email/Password**, **Google**, and **GitHub** sign-in providers
3. Create a Firestore database (start in test mode — rules will lock it down)
4. Copy the web app config values
5. Register an App Check reCAPTCHA Enterprise site key (opt-in — see private-setup/README.md)
6. Add your domain(s) to the authorised domains list

### Install & Run

```bash
cp .env.example .env.local
npm install
npm run dev
```

The app starts at `http://localhost:5173`.

### Deploy to GitHub Pages

```bash
npm run build
```

A workflow is provided at [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). See [SECURITY.md](SECURITY.md) for required Firebase Console settings before deploying.

---

## Quick Stats

- **Firestore reads/day**: ~50 (well under 50,000 free tier limit)
- **Daily generations**: 5 (established), 2 (new accounts)
- **Monthly publishes**: 10 max per account
- **Auth methods**: Email/Password, Google, GitHub
- **Bot protection**: reCAPTCHA Enterprise via Firebase App Check (opt-in — OFF by default)

---

## 📊 Progress Tracker

| Milestone | Status | Notes |
|-----------|--------|-------|
| Core architecture & routing | ✅ Complete | v1.0.0 |
| Firebase auth & Firestore | ✅ Complete | v1.1.0 |
| Onboarding & settings | ✅ Complete | v1.2.0 |
| Dashboard & category cards | ✅ Complete | v1.2.1 |
| Lesson creation flow | ✅ Complete | v1.2.2 |
| Lesson player & progress | ✅ Complete | v1.2.3 |
| Adaptive chat bar | ✅ Complete | v1.2.4 |
| Sharing & public discovery | ✅ Complete | v1.2.5 |
| Dependency migration (39→8 vulns) | ✅ Complete | v1.2.6 |
| Dependabot PRs #1, #2, #3 | ❌ Open | Superseded by manual migration |
| GitHub Pages deployment | ✅ Ready | Workflow configured |
| CodeQL scanning | ✅ Passing | CI workflow active |

**Current version:** `1.2.6` · **Next:** Close stale Dependabot PRs

---

## License

GNU General Public License v3.0 — see [LICENSE](LICENSE).
