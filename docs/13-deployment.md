# 13 — Deployment

## 1. Purpose

Document **environment setup, deployment steps, and verification** for Firebase Hosting (frontend) and Render or Vercel (backend).

---

## 2. Responsibilities

| Target | Deploys |
|--------|---------|
| Firebase Hosting | `client/dist` SPA |
| Render or Vercel | Express `server/` |
| Firebase Console | Auth, Firestore, rules |
| GitHub Actions (optional) | CI/CD |

---

## 3. Architecture Decisions

### AD-01: Separate dev and prod Firebase projects

### AD-02: SPA rewrite to index.html

All routes → `/index.html` for React Router.

### AD-03: API on subdomain

Example: `api.yourdomain.com` → CORS allows `https://app.yourdomain.com`.

### AD-04: Render preferred for long-running Express

Vercel requires serverless adapter; use Render unless team standard is Vercel.

---

## 4. Folder / File Responsibilities

| File | Role |
|------|------|
| `firebase.json` | Hosting config |
| `.firebaserc` | Project aliases |
| `firestore.rules` | Security rules |
| `firestore.indexes.json` | Composite indexes |
| `client/.env.production` | Build-time Vite vars (CI secrets) |
| Render/Vercel dashboard | Server env vars |

---

## 5. Business Rules

- Production uses same computation rules as dev.
- `DEFAULT_TIMEZONE=Asia/Manila` unless org differs.
- `ALLOW_PUBLIC_REGISTER` env controls open registration (default `true` for MVP).

---

## 6. Data Flow

```
Developer push → CI build client → firebase deploy --only hosting
              → CI deploy server → Render/Vercel
              → firebase deploy --only firestore:rules,firestore:indexes
```

---

## 7. Firestore Usage

**Indexes required:**

| Collection | Fields |
|------------|--------|
| `attendance` | `userId` ASC, `date` DESC |
| `dailySummary` | `userId` ASC, `date` DESC |
| `attendance` | `date` ASC, `status` ASC (admin filter) |
| `dailySummary` | `date` ASC (team daily report) |

### `firestore.indexes.json` (starter)

```json
{
  "indexes": [
    {
      "collectionGroup": "attendance",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "attendance",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "date", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "dailySummary",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "dailySummary",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "date", "order": "ASCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

---

## 8. API Behavior

- Production `GET /api/health` monitored by uptime checker.
- `NODE_ENV=production` disables stack traces.

---

## 9. Security Considerations

- Store `FIREBASE_PRIVATE_KEY` in host secret manager with `\n` escaped.
- Never commit `.env` or service account JSON.
- Restrict CORS to production Hosting URL only.

---

## 10. Scalability Considerations

- Firebase Hosting CDN for static assets.
- Render: scale instance when CPU sustained &gt; 70%.
- Monitor Firestore read/write quotas.

---

## 11. Reusable Utilities / Services

| Script | Purpose |
|--------|---------|
| `scripts/seed-admin.js` | Promote first admin (future) |
| `npm run build` (client) | Vite production build |
| `npm start` (server) | Production server entry |

---

## 12. Best Practices

- Use preview channels: `firebase hosting:channel:deploy preview`.
- Tag releases in git.
- Document production URLs in README.

---

## 13. Error Handling Expectations

- Failed deploy: roll back to previous Hosting release / Render deploy.
- Health check failure: alert on-call (manual MVP).

---

## 14. Validation Rules

- Verify all required env vars present before `npm start` (Zod in `config/env.js`).
- Fail fast if `FIREBASE_PRIVATE_KEY` missing in production.

---

## Environment Variables

### Client (Vite)

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_API_BASE_URL=https://your-api.onrender.com
```

### Server

```env
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://your-app.web.app
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
DEFAULT_TIMEZONE=Asia/Manila
DEFAULT_SHIFT_START=09:00
DEFAULT_SHIFT_END=18:00
ALLOW_PUBLIC_REGISTER=true
LATE_ALERT_MINUTES=15
UNDERTIME_ALERT_MINUTES=30
```

---

## Deployment Steps

### 1. Firebase project

1. Enable Auth (Email/Password).
2. Create Firestore (production mode).
3. Register web app → copy config to client env.

### 2. Deploy rules and indexes

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

### 3. Deploy API (Render example)

1. Connect repository; root directory `server`.
2. Build: `npm ci`
3. Start: `npm start`
4. Set environment variables in dashboard.

### 4. Deploy frontend

```bash
cd client && npm ci && npm run build
firebase deploy --only hosting
```

### 5. Bootstrap first admin

1. Register user via app.
2. In Firestore Console: set `users/{uid}.role` to `admin` **or** run seed script with Admin SDK.
3. Re-login to refresh access.

---

## Post-Deploy Verification

- [ ] `/api/health` returns 200
- [ ] Register + login works
- [ ] Punch in/out + summary created
- [ ] Admin can list users
- [ ] Firestore client write fails (security test)

---

## firebase.json Example

```json
{
  "hosting": {
    "public": "client/dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [{ "source": "**", "destination": "/index.html" }]
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  }
}
```

---

## Related Documents

- `02-tech-stack.md`
- `12-security-rules.md`
- `15-development-workflow.md`
