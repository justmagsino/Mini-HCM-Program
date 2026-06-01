# 01 — Project Overview

## 1. Purpose

This document defines the **product scope, goals, constraints, and high-level architecture** for the Mini HCM Time Tracking System. It is the entry point for all implementation work. No application code may be written that contradicts this document or the other files in `/docs`.

---

## 2. Responsibilities

| Responsibility | Owner (doc) |
|----------------|-------------|
| Product vision and MVP boundaries | This file |
| Feature list and user roles | This file |
| System context diagram | This file |
| Detailed schema | `04-firestore-schema.md` |
| API contracts | `11-api-routes.md` |
| Build sequence | `15-development-workflow.md` |

---

## 3. Architecture Decisions

### AD-01: Documentation-first development

All features are specified in `/docs` before code. Docs are the **single source of truth**.

### AD-02: Approved stack only

Frontend: React, React Router, TailwindCSS, Axios, React Hook Form, Zod, Recharts.  
Backend: Node.js, Express.  
Data/Auth: Firebase Firestore, Firebase Authentication.  
Hosting: Firebase Hosting (frontend), Render or Vercel (backend).

No Next.js, MongoDB, Prisma, PostgreSQL, Supabase, GraphQL, TypeORM, Redux, or other undocumented libraries.

### AD-03: Server-authoritative writes

Firestore collections `users`, `attendance`, and `dailySummary` are written through the **Express API** using the Firebase Admin SDK. The client uses Firebase Auth for identity only.

### AD-04: Three Firestore collections (MVP)

Only these collections exist in MVP:

- `users`
- `attendance`
- `dailySummary`

No additional collections without updating `04-firestore-schema.md` first.

### AD-05: Default shift

Organization default and per-user override: **09:00–18:00** (9:00 AM–6:00 PM) via `users.schedule`.

---

## 4. Folder / File Responsibilities

| Path (future) | Responsibility |
|---------------|----------------|
| `docs/` | Architecture, contracts, business rules |
| `client/` | React SPA, routing, UI, API calls |
| `server/` | Express API, services, computation engine |
| `client/src/api/` | Axios modules per domain |
| `server/src/services/` | Business logic orchestration |
| `server/src/engines/` | Pure time computations |

See `03-folder-structure.md` for full tree.

---

## 5. Business Rules

| Rule | Definition |
|------|------------|
| Regular hours | Time worked **up to scheduled shift end**, capped at shift length |
| Overtime (OT) | Time worked **beyond** scheduled shift end |
| Night differential (ND) | Time worked between **22:00** and **06:00** (user timezone); **additive** payroll metric (does not reduce regular or OT) |
| Late | Arrival **after** `schedule.start` |
| Undertime | Departure **before** `schedule.end` |
| Default schedule | `start: "09:00"`, `end: "18:00"` |
| Roles | `employee`, `admin` |
| One attendance per user per date | One `attendance` document per `userId` + `date` (see `06-attendance-system.md`) |

---

## 6. Data Flow

```
Employee Browser
    │
    ├─► Firebase Auth (register/login/logout)
    │
    └─► React SPA ──Axios──► Express API ──Admin SDK──► Firestore
                                    │
                                    ├─ users
                                    ├─ attendance
                                    └─ dailySummary
```

**Punch out flow (summary):**

1. Client sends authenticated punch-out request.
2. API loads `users/{uid}` for `schedule` and `timezone`.
3. API updates `attendance` with `timeOut` and computed fields.
4. API upserts `dailySummary` for that `userId` + `date`.
5. API returns updated attendance and summary to client.

---

## 7. Firestore Usage

| Collection | Purpose |
|------------|---------|
| `users` | Profile, role, schedule, timezone |
| `attendance` | Daily punch record and computed metrics for that day |
| `dailySummary` | Report-optimized daily totals (updated on punch out) |

**MVP:** Client does **not** read or write Firestore for `users`, `attendance`, or `dailySummary`. All data access is via the Express API (`12-security-rules.md`).

---

## 8. API Behavior

- REST JSON API under `/api`
- Bearer token: Firebase ID token
- Employee endpoints: own attendance and summaries only
- Admin endpoints: all users, edit attendance, reports

Full route list: `11-api-routes.md`.

---

## 9. Security Considerations

- Never trust client-submitted `role` or computed hours.
- All mutations require valid Firebase ID token verified on server.
- Admin routes require `role === 'admin'` from Firestore `users` document.
- Firestore rules deny client writes to business data (`12-security-rules.md`).

---

## 10. Scalability Considerations

- Query by `userId` + `date` with composite document IDs or indexes.
- Precompute metrics on `attendance` at punch out; mirror to `dailySummary` for reporting.
- Weekly reports aggregate `dailySummary` documents (no full-table scans).
- Single-organization MVP; `organizationId` field is **out of scope** unless added via schema doc update.

---

## 11. Reusable Utilities / Services

| Utility (server) | Purpose |
|------------------|---------|
| `computation.engine` | Regular, OT, ND, late, undertime |
| `date.utils` | Timezone, parse `HH:mm`, resolve `date` string |
| `auth.middleware` | Verify token, attach `req.user` |
| `validate.middleware` | Zod validation |

| Utility (client) | Purpose |
|------------------|---------|
| `axios.instance` | Base URL, auth header |
| `formatHours` / `formatMinutes` | Display helpers |

---

## 12. Best Practices

- Implement one phase at a time (`15-development-workflow.md`).
- Update docs before changing contracts.
- Keep computation logic in one server module.
- Use environment variables for API URL and Firebase config.

---

## 13. Error Handling Expectations

| Scenario | HTTP | Code |
|----------|------|------|
| Unauthenticated | 401 | `UNAUTHORIZED` |
| Wrong role | 403 | `FORBIDDEN` |
| Already punched in | 409 | `ALREADY_PUNCHED_IN` |
| No open attendance | 409 | `NO_OPEN_ATTENDANCE` |
| Validation failure | 400 | `VALIDATION_ERROR` |
| User not found | 404 | `USER_NOT_FOUND` |

Consistent body: `{ "error": { "code": "...", "message": "..." } }`.

### Canonical error codes (registry)

| Code | HTTP | When |
|------|------|------|
| `UNAUTHORIZED` | 401 | Missing/invalid token |
| `FORBIDDEN` | 403 | Valid user, insufficient role |
| `VALIDATION_ERROR` | 400 | Zod/business validation failed |
| `USER_NOT_FOUND` | 404 | `users/{uid}` missing |
| `PROFILE_NOT_FOUND` | 404 | Auth user exists, no `users` doc (call register) |
| `PROFILE_EXISTS` | 409 | Register when profile already exists |
| `ATTENDANCE_NOT_FOUND` | 404 | No `attendance/{uid}_{date}` |
| `ALREADY_PUNCHED_IN` | 409 | Punch in while today's record is `open` |
| `ATTENDANCE_ALREADY_CLOSED` | 409 | Punch in when today's record is `closed` |
| `NO_OPEN_ATTENDANCE` | 409 | Punch out with no `open` record |
| `LAST_ADMIN` | 409 | Demoting the only remaining admin |
| `RANGE_TOO_LARGE` | 400 | Date range exceeds 93 days |
| `ATTENDANCE_ALREADY_EXISTS` | 409 | Admin POST when `attendance` doc already exists |
| `INTERNAL_ERROR` | 500 | Unhandled server error |

Full API mapping: `11-api-routes.md`.

### Doc conflict resolution

If documents disagree, apply this order: **`04-firestore-schema.md` → `11-api-routes.md` → `07-computation-engine.md` → all others**.

---

## 14. Validation Rules

- Email: valid format, managed by Firebase Auth on register.
- Password: minimum 8 characters (Firebase Auth policy + Zod on client form).
- `schedule.start` / `schedule.end`: `HH:mm` 24-hour format.
- `date`: `YYYY-MM-DD`.
- `role`: enum `employee` | `admin` (admin assign only via admin API).

---

## Features (MVP Checklist)

### Authentication

- [ ] Register
- [ ] Login
- [ ] Logout
- [ ] Protected routes
- [ ] Role-based access

### Attendance

- [ ] Punch in
- [ ] Punch out
- [ ] Attendance history

### Computations

- [ ] Regular hours
- [ ] Overtime
- [ ] Night differential
- [ ] Late
- [ ] Undertime

### Reports

- [ ] Daily summaries
- [ ] Weekly summaries
- [ ] Dashboard analytics

### Admin

- [ ] View employees
- [ ] Edit attendance
- [ ] Create attendance (missing day)
- [ ] View reports
- [ ] Search/filter attendance

---

## Documentation status

**Version:** MVP 1.0 (finalized for implementation)  
**Last reviewed:** ready for Phase 0  
**Collections:** `users`, `attendance`, `dailySummary` only  
**Conflict order:** `04` → `11` → `07` → others

---

## Related Documents

| Topic | File |
|-------|------|
| Tech stack | `02-tech-stack.md` |
| Schema | `04-firestore-schema.md` |
| API | `11-api-routes.md` |
| Security | `12-security-rules.md` |
| Workflow | `15-development-workflow.md` |
