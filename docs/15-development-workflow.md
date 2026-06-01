# 15 — Development Workflow

## 1. Purpose

Define the **feature-by-feature implementation order** and rules of engagement for humans and AI. No full codebase generation in one step.

---

## 2. Responsibilities

| Phase | Delivers |
|-------|----------|
| Phase 0 | Repo skeleton, lint, health check |
| Phase 1 | Auth + users collection |
| Phase 2 | Punch in/out + attendance |
| Phase 3 | Computation + dailySummary |
| Phase 4 | Employee dashboard + weekly |
| Phase 5 | Admin system |
| Phase 6 | Admin dashboard + reports |
| Phase 7 | Production deployment |

---

## 3. Architecture Decisions

### AD-01: Documentation is the contract

If code and docs conflict, **fix code or update docs first**—never silently diverge.

### AD-02: One phase per PR/session

Complete exit criteria before next phase.

### AD-03: No placeholder implementations

Each phase ships working behavior.

### AD-04: Stop after each phase

Wait for user approval before continuing (per project AI rules).

---

## 4. Folder / File Responsibilities

Create folders only when the phase needs them (`03-folder-structure.md`).

---

## 5. Business Rules

Implement rules exactly from:

- `06-attendance-system.md`
- `07-computation-engine.md`
- `04-firestore-schema.md`

---

## 6. Data Flow

Validate each phase with manual test script documented in PR description.

---

## 7. Firestore Usage

Deploy rules in Phase 1. Deploy indexes before Phase 2 load testing.

---

## 8. API Behavior

Implement endpoints only from `11-api-routes.md` for current phase.

---

## 9. Security Considerations

Phase 1: auth middleware + deny Firestore writes.  
Phase 5: admin middleware on all `/api/admin/*`.

---

## 10. Scalability Considerations

Do not over-build early phases; pagination can be added in Phase 5–6.

---

## 11. Reusable Utilities / Services

Build `utils/dates.js` and `computation.engine.js` before punch-out wiring (Phase 3).

---

## 12. Best Practices

- Read relevant docs before coding.
- List files to create/modify at start of session.
- Run lint before marking phase complete.

---

## 13. Error Handling Expectations

Implement `AppError` + `error.middleware` in Phase 0 or Phase 1.

---

## 14. Validation Rules

Add Zod schemas same phase as endpoints.

---

## Phase 0 — Bootstrap

| Step | Task | Exit |
|------|------|------|
| 0.1 | Init git, `.gitignore` | Clean repo |
| 0.2 | `client/` Vite + React + Tailwind | Dev server runs |
| 0.3 | `server/` Express + `/api/health` | Health 200 |
| 0.4 | ESLint + Prettier | `npm run lint` passes |
| 0.5 | `.env.example` files | Documented vars |

**Docs:** `02-tech-stack.md`, `03-folder-structure.md`

---

## Phase 1 — Auth

| Step | Task | Exit |
|------|------|------|
| 1.1 | Firebase client auth config | Login UI |
| 1.2 | Admin SDK + auth middleware | Token verify |
| 1.3 | `POST /api/auth/register`, `GET /api/auth/me` | users doc created |
| 1.4 | AuthContext, ProtectedRoute, AdminRoute | Route guards |
| 1.5 | Deploy `firestore.rules` | Client writes blocked |
| 1.6 | Bootstrap admin user | One admin can login |

**Docs:** `05-auth-system.md`, `04-firestore-schema.md` (users)

---

## Phase 2 — Attendance

| Step | Task | Exit |
|------|------|------|
| 2.1 | attendance repository | CRUD |
| 2.2 | punch-in, punch-out (close sets `timeOut`; metrics may be null until Phase 3) | open/closed status |
| 2.3 | today + history endpoints | History list |
| 2.4 | Punch + History pages | UI works |

**Docs:** `06-attendance-system.md`, `11-api-routes.md`

---

## Phase 3 — Computation & Daily Summary

| Step | Task | Exit |
|------|------|------|
| 3.1 | computation.engine + unit tests | Examples pass |
| 3.2 | Wire punch-out metrics on attendance | Fields populated |
| 3.3 | dailySummary sync | Summary doc upserted |
| 3.4 | summary API endpoints | GET daily/weekly |

**Docs:** `07-computation-engine.md`, `08-daily-summary.md`

---

## Phase 4 — Employee Dashboard

| Step | Task | Exit |
|------|------|------|
| 4.1 | DashboardPage + StatCards | Today metrics |
| 4.2 | WeeklyHoursChart (Recharts) | Week chart |
| 4.3 | Polish history table | Formatted hours/minutes |

**Docs:** `10-dashboard-ui.md`

---

## Phase 5 — Admin System

| Step | Task | Exit |
|------|------|------|
| 5.1 | requireAdmin middleware | 403 for employees |
| 5.2 | Admin users list/search | EmployeesPage |
| 5.3 | Admin attendance edit + recalc | PATCH works |
| 5.4 | Admin attendance search/filter | Query params |
| 5.5 | `POST /api/admin/attendance` (create missing day) | Admin create flow |

**Docs:** `09-admin-system.md`

---

## Phase 6 — Admin Dashboard & Reports

| Step | Task | Exit |
|------|------|------|
| 6.1 | Admin KPI + report endpoints | APIs return data |
| 6.2 | Admin dashboard UI | KPIs + table |
| 6.3 | ReportsPage | Daily/weekly team view |

**Docs:** `10-dashboard-ui.md`, `11-api-routes.md`

---

## Phase 7 — Deployment

| Step | Task | Exit |
|------|------|------|
| 7.1 | Firebase Hosting deploy | Live SPA |
| 7.2 | Render/Vercel API deploy | Live API |
| 7.3 | Production env + CORS | End-to-end punch |
| 7.4 | Post-deploy checklist | `13-deployment.md` |

---

## AI Assistant Checklist (Each Session)

1. State phase number and step.
2. List docs read.
3. List files to create/modify.
4. Implement **only** current phase scope.
5. No libraries outside `02-tech-stack.md`.
6. No undocumented Firestore fields/collections.
7. Provide manual test steps.
8. **Stop** and wait for user instruction.

---

## Definition of Done

- [ ] Matches `11-api-routes.md` and `04-firestore-schema.md`
- [ ] RBAC per `05-auth-system.md`
- [ ] Computation tests if touching engine
- [ ] Lint passes
- [ ] No secrets committed
- [ ] Manual test steps documented

---

## Doc Index

| # | File | Topic |
|---|------|-------|
| 01 | project-overview | Scope, architecture |
| 02 | tech-stack | Libraries |
| 03 | folder-structure | Repo layout |
| 04 | firestore-schema | **users, attendance, dailySummary** |
| 05 | auth-system | Login, RBAC |
| 06 | attendance-system | Punch in/out |
| 07 | computation-engine | OT, ND, late, undertime |
| 08 | daily-summary | Reports |
| 09 | admin-system | Admin features |
| 10 | dashboard-ui | UI + Recharts |
| 11 | api-routes | REST contract |
| 12 | security-rules | Rules + hardening |
| 13 | deployment | Hosting |
| 14 | coding-standards | Style |
| 15 | development-workflow | This file |

---

## Documentation review checklist (finalized)

| Check | Status |
|-------|--------|
| Only `users`, `attendance`, `dailySummary` (`04`) | Done |
| Field names match spec (`fullName`, `timeIn`, `totalRegularHours`, …) | Done |
| API-only Firestore from client (`12`, `02`, `05`) | Done |
| Error codes aligned (`01`, `11`) | Done |
| No duplicate admin today endpoint | Done |
| `summary.service` owns `dailySummary` sync | Done |
| Computation `date` param + ND additive (`07`) | Done |
| Admin POST missing attendance + `ATTENDANCE_ALREADY_EXISTS` | Done |
| Admin roster = users + attendance merge (`09`, `10`) | Done |
| Intl-only dates; no extra date libs (`02`) | Done |
| KPI definitions documented (`09`) | Done |

**Doc conflict order:** `04` → `11` → `07` → others.

---

## Next Step — Phase 0

Documentation is **finalized**. Proceed with **Phase 0 — Bootstrap** when approved:

1. Init repo, `client/` (Vite + React + Tailwind), `server/` (Express + `/api/health`)
2. ESLint, Prettier, `.env.example`
3. No Firebase or business logic until Phase 1

Do not skip phases. Do not generate application code beyond Phase 0 scope until instructed.
