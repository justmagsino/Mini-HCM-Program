# Architecture Overview (Production)

High-level system design for the Mini HCM Time Tracking System. For field-level contracts see `04-firestore-schema.md` and `11-api-routes.md`.

---

## System context

```
┌─────────────────────────────────────────────────────────────────┐
│                        Employee / Admin Browser                  │
└───────────────┬───────────────────────────────┬─────────────────┘
                │ Firebase Auth SDK              │ HTTPS (REST)
                │ (register / login / token)     │
                ▼                                ▼
┌───────────────────────┐              ┌─────────────────────────┐
│   Firebase Auth       │              │   Express API (Node)     │
│   (identity only)     │              │   Render / Vercel        │
└───────────────────────┘              └───────────┬─────────────┘
                                                 │ Admin SDK
                                                 ▼
                                     ┌─────────────────────────┐
                                     │   Cloud Firestore        │
                                     │   users | attendance     │
                                     │   dailySummary           │
                                     └─────────────────────────┘

┌───────────────────────┐
│  Firebase Hosting     │  ← static React SPA (client/dist)
└───────────────────────┘
```

---

## Architectural principles

| Principle | Implementation |
|-----------|----------------|
| **Server-authoritative data** | All Firestore writes via Express + Firebase Admin SDK |
| **Client auth only** | SPA uses Firebase Auth for ID tokens; no Firestore client SDK for business data |
| **Layered backend** | `routes → controllers → services → repositories → Firestore` |
| **Pure computation** | `computation.engine.js` has no I/O; called from services |
| **RBAC from Firestore** | `users.role` loaded per request; admin routes gated |
| **Atomic close** | Punch-out and admin edits batch `attendance` + `dailySummary` |

---

## Frontend architecture

### Stack

- **Vite** — build tool, code splitting, production chunks (`vendor`, `firebase`, `charts`, `forms`)
- **React Router** — client-side routing with lazy-loaded pages
- **Tailwind CSS** — design system via `styles/index.css` component layer
- **Axios** — API client with Bearer token interceptor
- **React Hook Form + Zod** — forms and validation

### Key modules

| Area | Responsibility |
|------|----------------|
| `contexts/AuthContext.jsx` | Firebase auth state + profile; split into state vs actions contexts to limit re-renders |
| `api/*.api.js` | Domain API calls (auth, attendance, summary, admin) |
| `hooks/` | Page data loading (`useAttendance`, `useEmployeeDashboard`, etc.) |
| `components/layout/` | `AppShell`, `Sidebar`, `ProtectedRoute`, `AdminRoute` |
| `pages/` | Route-level screens (lazy loaded) |

### Request flow (employee punch out)

1. User clicks Punch Out → `useAttendance` → `attendance.api.punchOut()`
2. Axios attaches Firebase ID token
3. API computes metrics, updates Firestore, returns JSON
4. Hook refreshes today + history state → UI updates

---

## Backend architecture

### Middleware pipeline (`app.js`)

```
helmet → cors → express.json
→ GET /api/health (no rate limit)
→ /api rate limiter (skips auth/admin/summaries dedicated limiters)
→ /api/auth rate limiter
→ /api/admin rate limiter
→ /api/summaries rate limiter
→ /api routes
→ 404 → error middleware
```

### Protected route stack

```
authenticate          verifyIdToken (revocation check)
→ requireVerifiedEmail production: email_verified required
→ requireUser         load users/{uid} (30s in-memory cache)
→ requireAdmin        admin routes only
→ validate(schema)    Zod query/body
→ controller → service → repository
```

### Services (business logic)

| Service | Role |
|---------|------|
| `auth.service` | Register profile, get me |
| `attendance.service` | Punch in/out, today, history |
| `summary.service` | Employee daily/weekly reads |
| `admin.service` | Users, attendance admin, dashboard, search |
| `report.service` | Team daily/weekly, exceptions |
| `computation.service` | Wraps `computation.engine` for attendance close |

### Repositories (Firestore only)

| Repository | Collection |
|------------|------------|
| `users.repository` | `users` |
| `attendance.repository` | `attendance` |
| `dailySummary.repository` | `dailySummary` |
| `attendanceWrite.repository` | Batch write attendance + summary on close |

---

## Data model (summary)

Three collections only:

| Collection | Document ID | Purpose |
|------------|---------------|---------|
| `users` | Firebase `uid` | Profile, role, schedule, timezone |
| `attendance` | `{userId}_{date}` | Punch times + computed metrics when closed |
| `dailySummary` | `{userId}_{date}` | Report-friendly daily totals |

See **[04-firestore-schema.md](./04-firestore-schema.md)**.

---

## Computation pipeline

On punch-out or admin save:

1. Load `users/{uid}` → `schedule`, `timezone`
2. `computation.engine` → regular, OT, ND, late, undertime
3. Batch write closed `attendance` + upsert `dailySummary`
4. Return DTOs to client (ISO 8601 timestamps)

Night differential: **22:00–06:00** in user timezone, additive metric.

Default shift: **09:00–18:00** (configurable per user).

---

## Security model

| Layer | Control |
|-------|---------|
| Firestore rules | Deny all client read/write on business collections |
| Storage rules | Deny all (no client uploads in MVP) |
| API | Firebase ID token + Firestore role |
| Validation | Zod strict schemas; no client-supplied computed fields |
| Rate limits | Global, auth, admin, summaries, punch, attendance read |
| CORS | Allowlist only; HTTPS enforced in production |
| Email | Verified email required in production |

---

## Deployment topology

| Artifact | Host |
|----------|------|
| `client/dist` | Firebase Hosting |
| `server` | Render Web Service (preferred) or Vercel serverless |
| Rules + indexes | `firebase deploy` |
| Secrets | Render/Vercel env, not in repo |

---

## Scalability notes (MVP)

- Employee list capped at **500** users for in-memory admin filters
- Date queries use composite indexes; `getAll` batched in chunks of **10**
- Profile cache **30s** per API instance (invalidate on admin user update)
- Multi-instance: use Redis for shared rate limits if scaling horizontally

---

## Documentation map

| Topic | File |
|-------|------|
| API contract | `11-api-routes.md` |
| Schema | `04-firestore-schema.md` |
| Auth | `05-auth-system.md` |
| Attendance | `06-attendance-system.md` |
| Computation | `07-computation-engine.md` |
| Security | `12-security-rules.md` |
| Deploy | `../DEPLOYMENT.md` |
| Env vars | `ENVIRONMENT.md` |

**Conflict resolution order:** `04` → `11` → `07` → others.
