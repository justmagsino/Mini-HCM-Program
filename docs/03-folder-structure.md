# 03 — Folder Structure

## 1. Purpose

Define the **canonical repository layout** and which files own which concerns. Ensures every feature is implemented in a predictable location following the service-layer architecture.

**Production overview:** [ARCHITECTURE.md](./ARCHITECTURE.md) · **Local setup:** [../README.md](../README.md)

---

## 2. Responsibilities

| Area | Owns |
|------|------|
| `client/` | UI, routing, forms, charts, Axios API clients |
| `server/` | REST API, auth middleware, services, computation engine, Firestore repositories |
| `docs/` | Specifications and production guides |
| `scripts/` | Env validation, admin seed |
| Root config | Firebase Hosting, Firestore rules/indexes, CI workflows |

---

## 3. Architecture Decisions

### AD-01: Monorepo with two packages

Single git repository; `client/` and `server/` are independent Node packages. Root `package.json` orchestrates scripts.

### AD-02: Service layer required

**Flow:** `routes → controllers → services → repositories → Firestore`

Controllers do not call Firestore directly. Computation does not live in routes.

### AD-03: No client-side Firestore data access

`client/src/config/firebase.js` — **Auth only**. No `getFirestore` in the SPA.

### AD-04: Engine isolation

`server/src/engines/computation.engine.js` is **pure** (no I/O).

### AD-05: Lazy-loaded routes

`client/src/routes/AppRoutes.jsx` uses `React.lazy` per page for smaller initial bundle.

---

## 4. Repository root

```
Mini HCM Program/
├── client/                    # Vite + React SPA
├── server/                    # Express API
├── docs/                      # Specifications + ENVIRONMENT, ARCHITECTURE
├── scripts/                   # check-client-env, check-server-env, seed-admin
├── .github/workflows/         # ci.yml, deploy.yml
├── firebase.json              # Hosting, Firestore, Storage
├── firestore.rules
├── firestore.indexes.json
├── storage.rules
├── .firebaserc
├── package.json               # Root scripts (deploy, test, dev)
├── README.md
└── DEPLOYMENT.md
```

---

## 5. Client (`client/`)

```
client/
├── public/
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── config/
│   │   ├── env.js             # Zod-validated Vite env
│   │   └── firebase.js        # Firebase Auth only
│   ├── api/
│   │   ├── axios.js           # Base URL + Bearer interceptor
│   │   ├── auth.api.js
│   │   ├── attendance.api.js
│   │   ├── summary.api.js
│   │   └── admin.api.js
│   ├── components/
│   │   ├── ui/                # Button, Input, Card, DataTable, …
│   │   ├── layout/            # AppShell, Sidebar, AppNavbar, routes
│   │   ├── attendance/        # PunchControls, AttendanceTable, badges
│   │   ├── dashboard/         # StatusBanner
│   │   ├── summary/           # SummaryTable, WeeklyAnalyticsCards
│   │   └── charts/            # WeeklyHoursChart, TeamOvertimeChart (lazy)
│   ├── pages/
│   │   ├── auth/              # LoginPage, RegisterPage
│   │   ├── employee/          # Dashboard, Attendance, Reports
│   │   └── admin/             # Admin dashboard, employees, attendance, reports
│   ├── contexts/
│   │   └── AuthContext.jsx    # AuthState + AuthActions providers
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useProfileTimezone.js
│   │   ├── useDebouncedValue.js
│   │   ├── useAsyncLoad.js
│   │   ├── useAttendance.js
│   │   ├── useSummary.js
│   │   ├── useEmployeeDashboard.js
│   │   └── useAdminDashboard.js
│   ├── routes/
│   │   └── AppRoutes.jsx      # Lazy route definitions
│   ├── schemas/               # Zod (forms)
│   ├── styles/
│   │   └── index.css          # Tailwind + component layer
│   └── utils/
│       ├── cn.js
│       ├── dates.js
│       ├── timezone.js
│       ├── format.js
│       └── chartData.js
├── index.html
├── tailwind.config.js
├── vite.config.js             # manualChunks: vendor, firebase, charts, forms
├── .env.example
├── .env.production.example
└── package.json
```

---

## 6. Server (`server/`)

```
server/
├── api/
│   └── index.js               # Vercel serverless entry
├── src/
│   ├── index.js               # HTTP server listen
│   ├── app.js                 # Express app + middleware order
│   ├── config/
│   │   ├── env.js             # Zod-validated process.env
│   │   └── firebaseAdmin.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── emailVerified.middleware.js
│   │   ├── role.middleware.js
│   │   ├── rateLimiters.js
│   │   ├── userCache.middleware.js
│   │   ├── validate.middleware.js
│   │   └── error.middleware.js
│   ├── routes/
│   │   ├── index.js
│   │   ├── auth.routes.js
│   │   ├── attendance.routes.js
│   │   ├── summary.routes.js
│   │   └── admin.routes.js
│   ├── controllers/
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── attendance.service.js
│   │   ├── summary.service.js
│   │   ├── admin.service.js
│   │   ├── report.service.js
│   │   └── computation.service.js
│   ├── repositories/
│   │   ├── users.repository.js
│   │   ├── attendance.repository.js
│   │   ├── attendanceWrite.repository.js
│   │   └── dailySummary.repository.js
│   ├── engines/
│   │   └── computation.engine.js
│   ├── schemas/
│   ├── utils/
│   │   ├── dates.js
│   │   ├── errors.js
│   │   ├── metrics.js
│   │   ├── firestoreBatch.js
│   │   ├── adminHelpers.js
│   │   ├── attendanceValidation.js
│   │   └── summaryAggregate.js
│   └── __tests__/
├── render.yaml
├── vercel.json
├── .env.example
├── .env.production.example
└── package.json
```

---

## 7. Data flow

```
Client Page → api/*.api.js → Express routes → controller → service → repository → Firestore
                                                      ↘ engine (pure)
```

---

## 8. Related documents

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [11-api-routes.md](./11-api-routes.md)
- [14-coding-standards.md](./14-coding-standards.md)
- [15-development-workflow.md](./15-development-workflow.md)
