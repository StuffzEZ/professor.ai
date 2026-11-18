# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.2.4+  | ✅                 |
| < 1.2   | ❌                 |

## Reporting a Vulnerability

Please report security vulnerabilities via GitHub Issues with the label **security**. Do **not** open a public issue — use private reports or email the repository owner directly.

## Current Security Posture

### Firestore Security Rules

- All data access gated by Firebase Auth (`request.auth`)
- Per-document ownership enforced on reads/writes (`resource.data.ownerId == request.auth.uid`)
- Quota enforcement via Cloud Function-style rules (`isCooldown()`)
- Write size limits to prevent abuse (`request.resource.data.size() < 2000`)
- Email verification required before write operations

### Authentication & Abuse Prevention

- Firebase App Check with reCAPTCHA Enterprise reduces bot traffic
- Verified email required for lesson generation and publishing
- Disposable email domain blocklist prevents throwaway accounts
- New account cooldown (7 days) limits rapid account creation
- Daily generation quotas: 5/day established, 2/day new accounts
- Monthly publish cap: 10 public lessons per account

### Transitive Dependency Vulnerabilities

The project uses Firebase Web SDK v10 which has known transitive vulnerabilities in its dependencies (`@grpc/grpc-js`, `esbuild`, `glob`). These are inherent to the Firebase SDK architecture and cannot be resolved without major breaking changes.

**Mitigation**: The vulnerabilities affect server-side gRPC connections, not client-side API requests. The app's own codebase has no direct input validation bypass or injection vectors.

## Configuration Checklist

Before deploying, verify these settings in Firebase Console:

- [ ] Firestore rules published from `firestore/firestore.rules`
- [ ] App Check enabled with reCAPTCHA Enterprise
- [ ] Authorized domains added under Authentication → Settings
- [ ] All auth providers (Email/Password, Google, GitHub) enabled
- [ ] Email template configured for verification flows

See [private-setup.example/README.md](private-setup.example/README.md) for step-by-step setup.
