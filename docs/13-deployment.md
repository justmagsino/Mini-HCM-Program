# 13 — Deployment

## 1. Purpose

Document **environment setup, deployment steps, and verification** for Firebase Hosting (frontend) and Render or Vercel (backend).

**Operational runbook:** [DEPLOYMENT.md](../DEPLOYMENT.md) at the repository root.

**Also see:**

- [ENVIRONMENT.md](./ENVIRONMENT.md) — all env vars
- [ARCHITECTURE.md](./ARCHITECTURE.md) — deployment topology
- [README.md](../README.md) — local development setup

---

## 2. Responsibilities

| Target | Deploys |
|--------|---------|
| Firebase Hosting | `client/dist` SPA |
| Render (preferred) or Vercel | Express `server/` |
| Firebase Console | Auth, Firestore, rules |
| GitHub Actions | CI + optional Hosting/Firestore deploy |

---

## 3. Architecture Decisions

### AD-01: Separate dev and prod Firebase projects

Use `.firebaserc` aliases (`default`, `production`).

### AD-02: SPA rewrite to index.html

Configured in `firebase.json` — all routes → `/index.html` for React Router.

### AD-03: API on separate host

Example: `https://mini-hcm-api.onrender.com` with `CORS_ORIGIN` listing Hosting URL(s).

### AD-04: Render preferred for Express

Long-running process; in-memory punch debounce and rate limits behave correctly. Vercel supported via `server/api/index.js` with serverless caveats.

### AD-05: Client API base URL normalization

`VITE_API_BASE_URL` is the API origin; `client/src/api/axios.js` appends `/api`.

### AD-06: Secrets never in git

Use `client/.env.production` (gitignored), host dashboards, and GitHub Actions secrets.

---

## 4. Folder / File Responsibilities

| File | Role |
|------|------|
| `firebase.json` | Hosting + Firestore deploy |
| `.firebaserc` | Project aliases |
| `firestore.rules` | Deny-all client Firestore access |
| `firestore.indexes.json` | Composite indexes |
| `client/.env.production.example` | Production Vite vars template |
| `server/.env.production.example` | Server production template |
| `server/render.yaml` | Render Blueprint |
| `server/vercel.json` | Vercel routing |
| `server/api/index.js` | Vercel Express entry |
| `package.json` (root) | Deploy orchestration scripts |
| `scripts/check-*-env.mjs` | Pre-deploy validation |
| `.github/workflows/ci.yml` | Test + build on PR |
| `.github/workflows/deploy.yml` | Firestore + Hosting on tag |

---

## 5. Business Rules

- Production uses same computation rules as dev.
- `DEFAULT_TIMEZONE=Asia/Manila` unless org differs.
- `ALLOW_PUBLIC_REGISTER` defaults to `false` in production.

---

## 6. Data Flow

```
Developer → npm run build:client → client/dist
         → firebase deploy --only hosting
         → Render/Vercel auto-deploy (server/)
         → firebase deploy --only firestore:rules,firestore:indexes
```

---

## 7. Firestore Usage

Indexes defined in `firestore.indexes.json` at repo root. Deploy before queries that need composites.

---

## 8. API Behavior

- `GET /api/health` — uptime checks (Render health check path).
- `NODE_ENV=production` — generic 500 messages, no stack in responses.

---

## 9. Security Considerations

- `FIREBASE_PRIVATE_KEY` in host secret manager with `\n` escaped.
- Never commit `.env`, `.env.production`, or service account JSON.
- `CORS_ORIGIN` comma-separated; only Hosting (and preview) origins.
- `TRUST_PROXY=true` behind Render/Vercel for rate limiting.

---

## 10. Scalability Considerations

- Firebase Hosting CDN for static assets.
- Render: scale instance when CPU sustained high.
- Monitor Firestore read/write quotas.

---

## 11. Reusable Utilities / Services

| Script | Purpose |
|--------|---------|
| `npm run seed:admin` | Promote first admin |
| `npm run build:client` | Vite production build + env check |
| `npm start` (server) | Production API entry |

---

## 12. Best Practices

- Preview channels: `npm run deploy:hosting:preview`
- Tag releases: `v1.0.0` triggers deploy workflow
- Run `npm run check:env` before first production deploy

---

## 13. Error Handling Expectations

- Failed deploy: roll back Hosting release / redeploy previous Render build.
- Health check failure: verify `/api/health` and env vars.

---

## 14. Validation Rules

- Zod in `server/src/config/env.js` fails fast on boot.
- `scripts/check-client-env.mjs` before client build.
- `scripts/check-server-env.mjs` before server start in CI.

---

## Related Documents

- [DEPLOYMENT.md](../DEPLOYMENT.md)
- `02-tech-stack.md`
- `12-security-rules.md`
- `15-development-workflow.md`
