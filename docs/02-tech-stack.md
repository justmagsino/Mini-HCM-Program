# 02 — Tech Stack

## 1. Purpose

Lock the **only approved technologies, libraries, and version policy** for the Mini HCM project. Prevents dependency drift and AI hallucination of frameworks.

---

## 2. Responsibilities

| Layer | Technology | Responsibility |
|-------|------------|----------------|
| UI runtime | React.js 18+ | Components, SPA |
| Routing | React Router v6+ | Public/protected/admin routes |
| Styling | TailwindCSS v3+ | Layout, responsive UI |
| HTTP client | Axios | API requests, interceptors |
| Forms | React Hook Form | Form state |
| Client validation | Zod | Schemas aligned with API |
| Charts | Recharts | Dashboard analytics |
| Runtime | Node.js LTS | Server |
| HTTP server | Express.js 4+ | REST API |
| Database | Firebase Firestore | Persistent data |
| Auth | Firebase Authentication | Email/password identity |
| FE hosting | Firebase Hosting | Static SPA |
| BE hosting | Render **or** Vercel | Express deployment |

---

## 3. Architecture Decisions

### AD-01: Vite for React bundling

Use **Vite** (not Create React App, not Next.js) for `client/` builds.

### AD-02: REST, not GraphQL

Express exposes JSON REST endpoints documented in `11-api-routes.md`.

### AD-03: Zod on server and client

Server validates all POST/PATCH bodies. Client forms use Zod via `@hookform/resolvers/zod`.

### AD-04: Firebase modular SDK (v9+)

Client: `firebase/auth` only for sign-in/out.  
Server: `firebase-admin` for token verification and Firestore.

### AD-05: JavaScript or TypeScript

Either is allowed per package; if TypeScript is chosen, use it consistently in that package. Default recommendation: **JavaScript** for MVP unless team prefers TS.

### AD-06: Timezone/date handling without extra libraries

Use **native `Intl.DateTimeFormat`** and `Temporal` (if Node version supports) or manual offset via `Intl` in `server/src/utils/dates.js` and `client/src/utils/dates.js`.

Do **not** add `date-fns`, `luxon`, or `dayjs` unless this document is updated first.

---

## 4. Folder / File Responsibilities

| Path | Stack usage |
|------|-------------|
| `client/package.json` | React, Vite, Tailwind, Axios, RHF, Zod, Recharts, firebase |
| `server/package.json` | express, cors, helmet, firebase-admin, zod, dotenv |
| `client/vite.config.js` | Dev server, build |
| `client/tailwind.config.js` | Design tokens |
| `client/src/config/firebase.js` | Firebase app init (auth) |
| `server/src/config/firebase.js` | Admin SDK init |

---

## 5. Business Rules

Tech stack does not alter business rules. Computation and schedule rules live in `07-computation-engine.md`.

---

## 6. Data Flow

```
React (Vite) ──Axios──► Express ──firebase-admin──► Firestore
     │
     └── firebase/auth (ID token)
```

---

## 7. Firestore Usage

- **Writes:** server (Admin SDK) only.
- **Reads (MVP):** server only; React app does not import `firebase/firestore` (`12-security-rules.md`).

---

## 8. API Behavior

- Base URL from env: `VITE_API_BASE_URL` (client), `PORT` (server).
- JSON `Content-Type: application/json`.
- CORS: allow Firebase Hosting origin only in production.

---

## 9. Security Considerations

| Package | Security use |
|---------|----------------|
| `helmet` | HTTP headers |
| `cors` | Origin restriction |
| `express-rate-limit` | Brute-force mitigation |
| `firebase-admin` | Verify ID tokens |
| `dotenv` | Local secrets (never commit) |

**Forbidden in repo:** service account JSON files, `.env` with real secrets.

---

## 10. Scalability Considerations

- Vite code-splitting: lazy-load `/admin` routes.
- Recharts: limit points returned by API (e.g. 7–31 days).
- Stateless Express instances behind Render/Vercel load balancer.
- Firestore scales horizontally; design indexed queries (`04-firestore-schema.md`).

---

## 11. Reusable Utilities / Services

| Module | Location |
|--------|----------|
| Axios instance + interceptors | `client/src/api/axios.js` |
| Firebase auth helpers | `client/src/config/firebase.js` |
| Env validation (Zod) | `server/src/config/env.js` |
| Logger | `morgan` or `pino` (pick one at bootstrap) |

---

## 12. Best Practices

- Pin dependency versions in `package.json`.
- Use `npm ci` in CI/CD.
- Run `npm audit` before production deploy.
- Single package manager (npm) for entire repo.

---

## 13. Error Handling Expectations

- Axios response interceptor: on `401`, attempt one token refresh; then logout.
- Server: centralized error middleware; no stack traces in production responses.

---

## 14. Validation Rules

### Client env (Vite)

| Variable | Required | Example |
|----------|----------|---------|
| `VITE_FIREBASE_API_KEY` | yes | public |
| `VITE_FIREBASE_AUTH_DOMAIN` | yes | `project.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | yes | |
| `VITE_API_BASE_URL` | yes | `http://localhost:3001` |

### Server env

| Variable | Required | Example |
|----------|----------|---------|
| `PORT` | yes | `3001` |
| `NODE_ENV` | yes | `development` |
| `FIREBASE_PROJECT_ID` | yes | |
| `FIREBASE_CLIENT_EMAIL` | yes | service account |
| `FIREBASE_PRIVATE_KEY` | yes | escaped newlines |
| `CORS_ORIGIN` | yes | `http://localhost:5173` |
| `DEFAULT_TIMEZONE` | yes | `Asia/Manila` |
| `DEFAULT_SHIFT_START` | yes | `09:00` |
| `DEFAULT_SHIFT_END` | yes | `18:00` |
| `LATE_ALERT_MINUTES` | no | `15` (admin exceptions report) |
| `UNDERTIME_ALERT_MINUTES` | no | `30` (admin exceptions report) |
| `ALLOW_PUBLIC_REGISTER` | no | `true` |

---

## Explicitly Forbidden Technologies

| Technology | Reason |
|------------|--------|
| Next.js | Not in approved stack |
| MongoDB, PostgreSQL | Not in approved stack |
| Prisma, TypeORM | Not in approved stack |
| Supabase | Not in approved stack |
| GraphQL | REST only |
| Redux | React Context + API sufficient |

---

## Related Documents

- `03-folder-structure.md`
- `13-deployment.md`
- `14-coding-standards.md`
