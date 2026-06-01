# 03 — Folder Structure

## 1. Purpose

Define the **canonical repository layout** and which files own which concerns. Ensures every feature is implemented in a predictable location following the service-layer architecture.

---

## 2. Responsibilities

| Area | Owns |
|------|------|
| `client/` | UI, routing, forms, charts, Axios API clients |
| `server/` | REST API, auth middleware, services, computation engine, Firestore repositories |
| `docs/` | Single source of truth (no runtime code) |

---

## 3. Architecture Decisions

### AD-01: Monorepo with two packages

Single git repository; `client/` and `server/` are independent Node packages.

### AD-02: Service layer required

**Flow:** `routes → controllers → services → repositories → Firestore`

Controllers do not call Firestore directly. Computation does not live in routes.

### AD-03: No client-side Firestore writes

`client/src` has no `firebase/firestore` imports for MVP.

### AD-04: Engine isolation

`server/src/engines/computation.engine.js` is **pure** (no I/O).

---

## 4. Folder / File Responsibilities

### Repository root

```
mini-hcm/
├── client/
├── server/
├── docs/
├── .gitignore
└── README.md
```

### Client (`client/`)

```
client/
├── public/
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── config/
│   │   └── firebase.js              # Auth only
│   ├── api/
│   │   ├── axios.js
│   │   ├── auth.api.js
│   │   ├── attendance.api.js
│   │   ├── summary.api.js
│   │   └── admin.api.js
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── AdminRoute.jsx
│   │   └── attendance/
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── LoginPage.jsx
│   │   │   └── RegisterPage.jsx
│   │   ├── employee/
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── PunchPage.jsx
│   │   │   └── HistoryPage.jsx
│   │   └── admin/
│   │       ├── AdminDashboardPage.jsx
│   │       ├── EmployeesPage.jsx
│   │       ├── AttendanceEditPage.jsx
│   │       └── ReportsPage.jsx
│   ├── contexts/
│   │   └── AuthContext.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   └── useAttendance.js
│   ├── routes/
│   │   └── AppRoutes.jsx
│   ├── schemas/
│   │   ├── auth.schema.js
│   │   ├── attendance.schema.js
│   │   ├── summary.schema.js
│   │   └── admin.schema.js
│   └── utils/
│       ├── dates.js
│       └── format.js
├── tailwind.config.js
├── vite.config.js
├── .env.example
└── package.json
```

### Server (`server/`)

```
server/
├── src/
│   ├── index.js
│   ├── app.js
│   ├── config/
│   │   ├── env.js
│   │   └── firebase.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── role.middleware.js
│   │   ├── validate.middleware.js
│   │   └── error.middleware.js
│   ├── routes/
│   │   ├── index.js
│   │   ├── auth.routes.js
│   │   ├── attendance.routes.js
│   │   ├── summary.routes.js
│   │   └── admin.routes.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── attendance.controller.js
│   │   ├── summary.controller.js
│   │   └── admin.controller.js
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── attendance.service.js
│   │   ├── summary.service.js
│   │   └── admin.service.js
│   ├── repositories/
│   │   ├── users.repository.js
│   │   ├── attendance.repository.js
│   │   └── dailySummary.repository.js
│   ├── engines/
│   │   └── computation.engine.js
│   ├── schemas/
│   │   ├── auth.schema.js
│   │   ├── attendance.schema.js
│   │   └── admin.schema.js
│   └── utils/
│       ├── dates.js
│       └── errors.js
├── .env.example
└── package.json
```

---

## 5. Business Rules

- All attendance mutations go through `attendance.service.js`.
- All metric calculations go through `computation.engine.js`.
- **`summary.service.js` only** syncs `dailySummary` after attendance close/edit (called from `attendance.service` and `admin.service`; no duplicate sync logic elsewhere).

---

## 6. Data Flow

```
Client Page → api/*.api.js → Express routes → controller → service → repository → Firestore
                                                      ↘ engine (pure)
```

---

## 7. Firestore Usage

Repositories are the **only** server modules that import Firestore references:

- `users.repository.js` → `users`
- `attendance.repository.js` → `attendance`
- `dailySummary.repository.js` → `dailySummary`

---

## 8. API Behavior

- `routes/` mounts paths from `11-api-routes.md`.
- `schemas/` defines Zod validators used by `validate.middleware.js`.

---

## 9. Security Considerations

- `middleware/auth.middleware.js` runs before all protected routes.
- `middleware/role.middleware.js` guards `/api/admin/*`.
- No secrets in `client/` except Firebase public config.

---

## 10. Scalability Considerations

- Split large route files by sub-router when &gt; ~200 lines.
- Future `packages/shared/` only if Zod schemas must be duplicated—requires doc update.

---

## 11. Reusable Utilities / Services

| Path | Reuse |
|------|-------|
| `server/src/utils/dates.js` | Timezone, work date |
| `server/src/utils/errors.js` | `AppError` class |
| `client/src/utils/format.js` | Hours/minutes display |
| `client/src/api/axios.js` | Shared HTTP client |

---

## 12. Best Practices

- One React component per file.
- Match API module names to server route domains.
- Colocate Zod schemas with the feature (`schemas/attendance.schema.js`).

---

## 13. Error Handling Expectations

- `error.middleware.js` catches all thrown `AppError` and unknown errors.
- Client API modules rethrow or return normalized `{ error }` for UI toasts.

---

## 14. Validation Rules

- Every `POST`/`PATCH` in `routes/` must chain `validate(schema)`.
- Client forms must use the same field names as Firestore (`fullName`, not `displayName`).

---

## Related Documents

- `11-api-routes.md`
- `14-coding-standards.md`
- `15-development-workflow.md`
