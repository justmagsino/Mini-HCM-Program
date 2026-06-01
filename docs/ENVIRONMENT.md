# Environment Variables

Complete reference for local development and production. **Never commit** filled `.env` or `.env.production` files or service account JSON.

Templates:

- `client/.env.example` — local dev
- `client/.env.production.example` — production build
- `server/.env.example` — local dev
- `server/.env.production.example` — production server

Validate before deploy:

```bash
npm run check:env          # both
npm run check:env:client   # client only
npm run check:env:server   # server only
```

---

## Client (Vite — public at build time)

These are embedded in the static bundle. Safe for Firebase web config only (not secrets).

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_FIREBASE_API_KEY` | yes | Firebase Web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | yes | e.g. `your-project.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | yes | Firebase project ID |
| `VITE_API_BASE_URL` | yes | API **origin only** — no trailing slash, **no** `/api` suffix |

### Examples

**Local:**

```env
VITE_API_BASE_URL=http://localhost:3001
```

**Production (Render):**

```env
VITE_API_BASE_URL=https://mini-hcm-api.onrender.com
```

The client normalizes the base URL and requests `https://host/api/...` automatically (`client/src/api/axios.js`).

### Where to set production values

- Local build: `client/.env.production` (gitignored)
- CI: GitHub Actions secrets `VITE_*`
- Rebuild required after any change

---

## Server (runtime — secret)

Set in `server/.env` locally or in Render/Vercel **Environment** dashboard.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | yes | `development` | Use `production` in prod |
| `PORT` | no | `3001` | HTTP port (Render sets `PORT` automatically) |
| `CORS_ORIGIN` | yes | — | Comma-separated allowed browser origins |
| `TRUST_PROXY` | prod | `false` | Set `true` behind Render/Vercel/nginx |
| `FIREBASE_PROJECT_ID` | yes | — | Same as Firebase project |
| `FIREBASE_CLIENT_EMAIL` | yes | — | Service account email |
| `FIREBASE_PRIVATE_KEY` | yes | — | PEM private key; use `\n` for newlines in `.env` |
| `DEFAULT_TIMEZONE` | no | `Asia/Manila` | New user profile default (IANA) |
| `DEFAULT_SHIFT_START` | no | `09:00` | Shift start `HH:mm` |
| `DEFAULT_SHIFT_END` | no | `18:00` | Shift end `HH:mm` |
| `ALLOW_PUBLIC_REGISTER` | no | `false` | `true` = allow `POST /api/auth/register` |
| `LATE_ALERT_MINUTES` | no | `15` | Exceptions report threshold |
| `UNDERTIME_ALERT_MINUTES` | no | `30` | Exceptions report threshold |

### CORS (production)

Must be **HTTPS** origins only (validated when `NODE_ENV=production`):

```env
CORS_ORIGIN=https://your-project.web.app,https://your-project.firebaseapp.com
```

Include preview channel URLs if you test preview Hosting.

### Private key formatting

**Option A — escaped newlines in `.env`:**

```env
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
```

**Option B — multiline** in host dashboard secret field (Render supports this).

### Registration flag

| Value | Behavior |
|-------|----------|
| `false` (production) | Only existing Auth users can complete profile if allowed by ops; blocks open signup API |
| `true` (local dev) | Users can register via app |

Bootstrap flow when `false`: create user in Firebase Auth console → register profile via app or admin tooling.

---

## Firebase Console (not env files)

Configure manually:

| Setting | Location |
|---------|----------|
| Email/Password provider | Authentication → Sign-in method |
| Authorized domains | Authentication → Settings → Authorized domains (add Hosting URL) |
| Email verification | Recommended; production API requires verified email |
| Firestore database | Firestore → Create database |
| Service account | Project settings → Service accounts → Generate key |

---

## GitHub Actions secrets (CI / deploy workflow)

For client build in CI (`.github/workflows/ci.yml`, `deploy.yml`):

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_API_BASE_URL`

Deploy workflow additionally:

- `FIREBASE_PROJECT_ID` (variable)
- `FIREBASE_SERVICE_ACCOUNT_JSON` (secret — full JSON)

API deploy to Render/Vercel is configured in those platforms, not only via GitHub Actions.

---

## Environment checklist

### Local dev

- [ ] `client/.env` from `client/.env.example`
- [ ] `server/.env` from `server/.env.example`
- [ ] `CORS_ORIGIN=http://localhost:5173`
- [ ] `ALLOW_PUBLIC_REGISTER=true` (optional)
- [ ] `npm run check:env` passes
- [ ] `npm run deploy:firestore` run once

### Production

- [ ] `client/.env.production` for builds (or CI secrets)
- [ ] Server vars on Render/Vercel from `server/.env.production.example`
- [ ] `NODE_ENV=production`, `TRUST_PROXY=true`
- [ ] `CORS_ORIGIN` lists all Hosting URLs (HTTPS)
- [ ] `ALLOW_PUBLIC_REGISTER=false`
- [ ] Auth authorized domains include Hosting URL
- [ ] Service account key not in git

---

## Related

- [DEPLOYMENT.md](../DEPLOYMENT.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [12-security-rules.md](./12-security-rules.md)
