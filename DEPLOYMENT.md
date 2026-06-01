# Deployment Guide — Mini HCM

Production deployment runbook. For architecture context see [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md). For every environment variable see [docs/ENVIRONMENT.md](./docs/ENVIRONMENT.md).

## Production layout

| Component | Platform | Example URL |
|-----------|----------|-------------|
| React SPA | **Firebase Hosting** | `https://YOUR_PROJECT.web.app` |
| Express API | **Render** (recommended) or **Vercel** | `https://mini-hcm-api.onrender.com` |
| Auth + Firestore | **Firebase** | Same Firebase project |

---

## Prerequisites

- Node.js **20+**
- [Firebase CLI](https://firebase.google.com/docs/cli): `npm install -g firebase-tools`
- Firebase project with **Email/Password Auth** and **Firestore** enabled
- Service account key (Firebase Console → Project settings → Service accounts)

---

## 1. Environment setup

### Client (build-time, public)

1. Copy `client/.env.production.example` → `client/.env.production` (never commit).
2. Set Firebase web config and API URL:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=YOUR_PROJECT.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=YOUR_PROJECT
VITE_API_BASE_URL=https://mini-hcm-api.onrender.com
```

`VITE_API_BASE_URL` is the API **origin only** (no `/api` suffix). The client appends `/api` automatically.

3. Validate:

```bash
npm run check:env:client
```

### Server (runtime, secret)

Set in **Render/Vercel dashboard** (or `server/.env` for local production smoke tests). Template: `server/.env.production.example`.

| Variable | Production notes |
|----------|------------------|
| `NODE_ENV` | `production` |
| `CORS_ORIGIN` | Comma-separated HTTPS Hosting URLs |
| `TRUST_PROXY` | `true` on Render/Vercel |
| `FIREBASE_PRIVATE_KEY` | Paste with `\n` escapes or multiline secret |
| `ALLOW_PUBLIC_REGISTER` | `false` unless open signup is intended |

Validate:

```bash
npm run check:env:server
```

### Firebase project config

1. Edit `.firebaserc` — set your Firebase project ID.
2. **Authentication → Settings → Authorized domains** — add Hosting domain(s).
3. Enable **Email verification** (recommended; API enforces in production).
4. Deploy rules and indexes before first API use.

---

## 2. Production scripts (repo root)

| Script | Purpose |
|--------|---------|
| `npm run install:all` | Install client + server dependencies |
| `npm run build:client` | Validate client env + Vite production build → `client/dist` |
| `npm run check:env` | Validate client + server env files |
| `npm run deploy:firestore` | Deploy Firestore rules, indexes, Storage rules |
| `npm run deploy:hosting` | Build client + deploy Firebase Hosting |
| `npm run deploy:hosting:preview` | Preview channel deploy |
| `npm run seed:admin -- --uid=UID` | Promote user to admin in Firestore |
| `npm test` | Server unit tests |
| `npm run test:all` | Tests + client production build |

---

## 3. Deploy Firestore (rules + indexes + storage)

```bash
firebase login
firebase use production   # or: firebase use YOUR_PROJECT_ID
npm run deploy:firestore
```

This deploys:

- `firestore.rules` — deny-all client access to business data
- `firestore.indexes.json` — composite indexes for queries
- `storage.rules` — deny-all (MVP)

Wait until composite indexes show **Enabled** in Firebase Console (Firestore → Indexes). Queries fail with `FAILED_PRECONDITION` until indexes are ready.

---

## 4. Deploy API — Render (recommended)

Express runs as a long-lived Node process (rate limits, punch debounce, profile cache behave as designed).

1. [Render Dashboard](https://dashboard.render.com) → **New → Web Service**.
2. Connect repository; set **Root Directory** to `server`.
3. **Build command:** `npm ci --omit=dev && npm run build`
4. **Start command:** `npm start`
5. **Health check path:** `/api/health`
6. Add environment variables from `server/.env.production.example`.
7. Set `CORS_ORIGIN` to your Firebase Hosting URL(s), comma-separated, HTTPS only.
8. Copy the service URL → set `VITE_API_BASE_URL` for client builds.

**Blueprint:** use `server/render.yaml` (New → Blueprint).

Render sets `PORT` automatically; do not hardcode it in the dashboard.

---

## 5. Deploy API — Vercel (alternative)

Serverless-friendly but **not ideal** for in-memory punch debounce and per-instance profile cache across cold starts. Use Render unless you require Vercel.

1. Import repo; set **Root Directory** to `server`.
2. Framework preset: **Other** (uses `server/vercel.json`).
3. Entry: `api/index.js` exports the Express app.
4. Add the same env vars as Render.
5. `CORS_ORIGIN` must include your Hosting origin(s).

After deploy: `GET https://YOUR_PROJECT.vercel.app/api/health`

---

## 6. Deploy frontend — Firebase Hosting

```bash
# 1. Configure client/.env.production (or CI secrets)
npm run check:env:client

# 2. Build + deploy
npm run deploy:hosting
```

`firebase.json` serves `client/dist` with SPA rewrites and security/cache headers.

**Preview channel:**

```bash
npm run deploy:hosting:preview
```

Add the preview URL to server `CORS_ORIGIN` (comma-separated).

---

## 7. Bootstrap first admin

1. Create a user:
   - Temporarily set `ALLOW_PUBLIC_REGISTER=true` and register via app, **or**
   - Create user in Firebase Auth console (Email/Password).
2. Promote in Firestore:

```bash
npm run seed:admin -- --uid=FIREBASE_AUTH_UID
```

3. User signs out and back in to refresh JWT/profile role.

---

## 8. CI/CD (GitHub Actions)

### CI (`.github/workflows/ci.yml`)

Runs on push/PR to `main`: server tests + client production build.

**Repository secrets** (client build):

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_API_BASE_URL`

### Deploy (`.github/workflows/deploy.yml`)

Triggered on `workflow_dispatch` or version tags `v*`.

**Secrets / variables:**

- Variable `FIREBASE_PROJECT_ID`
- Secret `FIREBASE_SERVICE_ACCOUNT_JSON` (full JSON key)
- Client `VITE_*` secrets (same as CI)

API deploy to Render/Vercel is configured in those dashboards (auto-deploy on git push), not only in this workflow.

---

## 9. Post-deploy verification

| Check | Command / action |
|-------|------------------|
| API health | `GET https://YOUR_API/api/health` → `{ "status": "ok" }` |
| SPA loads | Open Hosting URL |
| Login / register | Firebase Auth + profile flow |
| Punch in/out | Employee attendance; summary after punch out |
| Admin dashboard | After `seed:admin`; KPIs and roster load |
| Firestore rules | Browser devtools: direct Firestore write **fails** |
| CORS | No CORS errors in Network tab for API calls |

---

## 10. Security checklist

- [ ] Never commit `.env`, `.env.production`, or service account JSON
- [ ] `ALLOW_PUBLIC_REGISTER=false` in production
- [ ] `CORS_ORIGIN` HTTPS origins only (comma-separated)
- [ ] Email verification enabled; production API rejects unverified tokens
- [ ] `npm run deploy:firestore` deployed (Firestore + Storage deny-all)
- [ ] Hosting domains in Firebase Auth **Authorized domains**
- [ ] Rotate service account keys if leaked
- [ ] Firebase Hosting serves static files only; all data via API

---

## Troubleshooting

### API and client connectivity

| Symptom | Cause | Fix |
|---------|-------|-----|
| API 404 from app | Wrong base URL or missing `/api` handling | Set `VITE_API_BASE_URL` to host **without** `/api`; rebuild client |
| CORS error | Origin not allowlisted | Add exact Hosting URL (scheme + host) to `CORS_ORIGIN`; redeploy API |
| Network error / timeout | API down or wrong URL | Verify `GET /api/health`; check Render/Vercel logs |
| 502 / 503 from API | Cold start or crash | Check server logs; verify env vars and Firebase credentials |

### Firebase Auth

| Symptom | Fix |
|---------|-----|
| 401 after deploy | Add Hosting domain to **Authorized domains** |
| `auth/unauthorized-domain` | Same as above |
| Registration fails with 403 | Set `ALLOW_PUBLIC_REGISTER=true` temporarily or create Auth user manually |
| Email not verified (403) | Verify email in Firebase Auth or disable requirement in dev only |

### Firestore

| Symptom | Fix |
|---------|-----|
| `FAILED_PRECONDITION` | Run `npm run deploy:firestore`; wait for indexes **Enabled** |
| `PROFILE_NOT_FOUND` | User has Auth account but no `users` doc — complete registration |
| Permission denied in browser on Firestore | **Expected** — client must use API only |

### Render / Vercel

| Symptom | Fix |
|---------|-----|
| Health check fails | Path must be `/api/health` |
| Rate limit seems too strict | Dedicated limiters apply per route; global limiter skips `/auth`, `/admin`, `/summaries` |
| Wrong client IP in logs | Set `TRUST_PROXY=true` |

### Build

| Symptom | Fix |
|---------|-----|
| `check:env` fails | Fill all required vars per `docs/ENVIRONMENT.md` |
| Blank white page | Open browser console; verify `VITE_*` at build time |
| Old API URL after deploy | Rebuild client after changing `VITE_API_BASE_URL` |

### Application logic

| Symptom | Fix |
|---------|-----|
| Admin menu missing | `npm run seed:admin`; sign out/in |
| No weekly chart data | Complete closed attendance days first |
| Punch rejected (409) | Check today’s attendance status (already open/closed) |
| Team report empty | Ensure `dailySummary` exists for closed days |

---

## Local production smoke test

```bash
# Terminal 1
cd server && NODE_ENV=production npm start

# Terminal 2 — build with production API URL pointing to localhost
npm run build:client
npx serve client/dist
```

Useful to verify CORS and env before Hosting deploy.

---

## Related docs

| Doc | Topic |
|-----|-------|
| [README.md](./README.md) | Quick start, scripts, doc index |
| [docs/ENVIRONMENT.md](./docs/ENVIRONMENT.md) | Full env reference |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | System design |
| [docs/11-api-routes.md](./docs/11-api-routes.md) | API reference |
| [docs/04-firestore-schema.md](./docs/04-firestore-schema.md) | Data model |
| [docs/12-security-rules.md](./docs/12-security-rules.md) | Security model |
| [docs/13-deployment.md](./docs/13-deployment.md) | Deployment architecture notes |
