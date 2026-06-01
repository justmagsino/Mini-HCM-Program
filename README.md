# Mini HCM — Time Tracking System

Production-ready employee attendance, payroll metrics (regular, overtime, night differential, late, undertime), daily summaries, and admin reporting. Built as a **React SPA** + **Express API** with **Firebase Authentication** and **Firestore** (server writes only).

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, React Router, Tailwind CSS, React Hook Form, Zod, Recharts |
| Backend | Node.js 20+, Express, Zod, Firebase Admin SDK |
| Identity & data | Firebase Auth, Firestore, Firebase Hosting |
| API hosting | Render (recommended) or Vercel |

---

## Documentation index

| Document | Description |
|----------|-------------|
| **[DEPLOYMENT.md](./DEPLOYMENT.md)** | Production deploy: Firebase, Render/Vercel, CI/CD, verification |
| **[docs/ENVIRONMENT.md](./docs/ENVIRONMENT.md)** | All environment variables (client + server) |
| **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** | System architecture, data flow, security model |
| **[docs/11-api-routes.md](./docs/11-api-routes.md)** | REST API reference |
| **[docs/04-firestore-schema.md](./docs/04-firestore-schema.md)** | Firestore collections, fields, indexes |
| **[docs/03-folder-structure.md](./docs/03-folder-structure.md)** | Repository layout |
| **[docs/](./docs/)** | Full product & technical specifications (01–15) |

---

## Features

- **Auth** — Register, login, logout, protected routes, `employee` / `admin` roles
- **Attendance** — Punch in/out, today’s status, history (up to 93 days)
- **Metrics** — Regular hours, OT, night differential (22:00–06:00), late, undertime
- **Reports** — Daily and weekly summaries, employee dashboard charts
- **Admin** — Employee management, attendance corrections, team reports, KPI dashboard

---

## Prerequisites

- **Node.js 20+** and npm
- **Firebase project** with Email/Password Auth and Firestore enabled
- **Firebase CLI** (for hosting and rules deploy): `npm install -g firebase-tools`
- **Service account key** (Firebase Console → Project settings → Service accounts)

---

## Installation

```bash
git clone <repository-url>
cd "Mini HCM Program"

npm run install:all
```

This installs dependencies for both `client/` and `server/`.

---

## Local development setup

### 1. Environment files

```bash
cp client/.env.example client/.env
cp server/.env.example server/.env
```

Fill in values per **[docs/ENVIRONMENT.md](./docs/ENVIRONMENT.md)**.

| File | Purpose |
|------|---------|
| `client/.env` | Firebase web config + `VITE_API_BASE_URL=http://localhost:3001` |
| `server/.env` | Firebase Admin credentials, CORS, defaults |

Validate:

```bash
npm run check:env
```

### 2. Firebase setup (local)

1. Create a Firebase project (or use an existing dev project).
2. Enable **Authentication → Sign-in method → Email/Password**.
3. Create a **Firestore** database (production mode is fine; rules deny client access).
4. Generate a **service account** JSON and copy `project_id`, `client_email`, and `private_key` into `server/.env`.
5. Register a **Web app** in Project settings and copy config into `client/.env` (`VITE_FIREBASE_*`).
6. For local dev, set `ALLOW_PUBLIC_REGISTER=true` in `server/.env` if you need open registration.

Deploy rules and indexes (required before attendance queries work):

```bash
firebase login
# Edit .firebaserc — set your project ID
firebase use default
npm run deploy:firestore
```

Wait until composite indexes show **Enabled** in the Firebase Console.

### 3. Run the app

**Terminal 1 — API:**

```bash
npm run dev:server
```

**Terminal 2 — SPA:**

```bash
npm run dev:client
```

Open **http://localhost:5173**

### 4. Bootstrap an admin user

1. Register through the UI (or create a user in Firebase Auth console).
2. Promote to admin:

```bash
npm run seed:admin -- --uid=FIREBASE_AUTH_UID
```

3. Sign out and sign back in to refresh the role.

---

## Project structure

```
Mini HCM Program/
├── client/                 # Vite + React SPA
│   ├── src/
│   │   ├── api/            # Axios API modules
│   │   ├── components/     # UI, layout, charts, attendance
│   │   ├── contexts/       # Auth (state + actions split)
│   │   ├── hooks/          # Data fetching hooks
│   │   ├── pages/          # Route pages (lazy-loaded)
│   │   ├── routes/         # React Router
│   │   ├── schemas/        # Zod (client forms)
│   │   └── styles/         # Tailwind entry (index.css)
│   └── dist/               # Production build output
├── server/                 # Express API
│   └── src/
│       ├── routes/         # HTTP routers
│       ├── controllers/    # Thin handlers
│       ├── services/       # Business logic
│       ├── repositories/   # Firestore access
│       ├── engines/        # Pure computation (no I/O)
│       └── middleware/     # Auth, validation, rate limits
├── docs/                   # Specifications (01–15 + guides)
├── scripts/                # Env checks, admin seed
├── firebase.json           # Hosting + Firestore + Storage deploy
├── firestore.rules         # Deny-all client Firestore access
├── firestore.indexes.json  # Composite indexes
└── DEPLOYMENT.md           # Production deployment runbook
```

Details: **[docs/03-folder-structure.md](./docs/03-folder-structure.md)**

---

## Scripts (repository root)

| Command | Description |
|---------|-------------|
| `npm run install:all` | Install client + server dependencies |
| `npm run dev:client` | Vite dev server (port 5173) |
| `npm run dev:server` | API with watch mode (port 3001) |
| `npm run build:client` | Validate env + production SPA build |
| `npm run build:server` | Server build (if used by host) |
| `npm run start:server` | Run production server locally |
| `npm test` | Server unit tests (computation, aggregates) |
| `npm run test:all` | Tests + client production build |
| `npm run check:env` | Validate client + server env files |
| `npm run deploy:firestore` | Deploy rules, indexes, storage rules |
| `npm run deploy:hosting` | Build client + deploy Firebase Hosting |
| `npm run deploy:hosting:preview` | Preview channel deploy |
| `npm run seed:admin -- --uid=UID` | Set `users/{uid}.role` to `admin` |

---

## Production deployment (summary)

| Component | Platform |
|-----------|----------|
| React SPA | Firebase Hosting |
| Express API | Render (recommended) or Vercel |
| Auth + Firestore | Firebase (same project) |

1. Configure `server/.env` on Render/Vercel and `client/.env.production` for builds.
2. `npm run deploy:firestore`
3. Deploy API → note HTTPS URL → set `VITE_API_BASE_URL` on client.
4. `npm run deploy:hosting`
5. Add Hosting domains to Firebase Auth **Authorized domains**.
6. `npm run seed:admin` for first admin.

Full steps: **[DEPLOYMENT.md](./DEPLOYMENT.md)**

---

## API overview

- Base path: `/api`
- Auth: `Authorization: Bearer <Firebase ID token>`
- Health: `GET /api/health` (no auth)

Full reference: **[docs/11-api-routes.md](./docs/11-api-routes.md)**

---

## Architecture overview

```
Browser → Firebase Auth (login)
       → React SPA → Axios → Express API → Admin SDK → Firestore
```

- Clients **never** read or write business Firestore data directly.
- All mutations and queries go through the API with RBAC and validation.
- Metrics are computed on the server at punch-out and admin corrections.

Details: **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)**

---

## Troubleshooting (quick reference)

| Symptom | Likely fix |
|---------|------------|
| Blank page after deploy | Check `VITE_*` vars; rebuild client; verify Hosting deploy |
| API 404 from browser | `VITE_API_BASE_URL` = API origin **without** `/api`; rebuild client |
| CORS error | Add exact Hosting URL to server `CORS_ORIGIN` (HTTPS in prod) |
| `FAILED_PRECONDITION` on queries | Run `npm run deploy:firestore`; wait for indexes |
| 401 / login fails | Add domain under Firebase Auth → Authorized domains |
| `PROFILE_NOT_FOUND` | Call `POST /api/auth/register` or complete registration flow |
| 403 on admin pages | Run `npm run seed:admin`; re-login |
| Render health check fails | Use path `/api/health` |
| Registration disabled | Set `ALLOW_PUBLIC_REGISTER=true` temporarily or create Auth user manually |

More: **[DEPLOYMENT.md § Troubleshooting](./DEPLOYMENT.md#troubleshooting)**

---

## Security notes

- Do not commit `.env`, `.env.production`, or service account JSON.
- Production: `ALLOW_PUBLIC_REGISTER=false`, HTTPS-only `CORS_ORIGIN`, email verification enforced on API.
- Firestore rules deny all client SDK access to `users`, `attendance`, `dailySummary`.

See **[docs/12-security-rules.md](./docs/12-security-rules.md)**.

---

## License

Private / internal use unless otherwise specified.
