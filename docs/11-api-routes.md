# 11 — API Routes

## 1. Purpose

**Canonical REST API contract** for the Express server. All implementations must match paths, methods, auth, and payloads exactly. Do not add endpoints without updating this file first.

---

## 2. Responsibilities

| Router file | Prefix | Owns |
|-------------|--------|------|
| `auth.routes.js` | `/api/auth` | Register profile, current user |
| `attendance.routes.js` | `/api/attendance` | Employee punch, today, history |
| `summary.routes.js` | `/api/summaries` | Employee daily/weekly reads |
| `admin.routes.js` | `/api/admin` | Users, attendance admin, reports, KPIs |
| `app.js` | `/api/health` | Liveness |

**Rule:** Controllers call services only. Services call repositories + `computation.engine`. No Firestore in routes/controllers.

---

## 3. Architecture Decisions

### AD-01: JSON REST under `/api`

### AD-02: Bearer authentication

`Authorization: Bearer <Firebase ID token>`

Email on register comes from the **verified token**, never from an unverified request body.

### AD-03: Standard error envelope

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

### AD-04: Success list envelope

```json
{
  "items": [],
  "page": 1,
  "limit": 20,
  "total": 100
}
```

### AD-05: No duplicate “today” endpoints

Admin “who is punched in today” uses **`GET /api/admin/attendance?date=`** only. There is no separate `attendance-today` route.

### AD-06: Computed fields are read-only

Requests that include `regularHours`, `overtimeHours`, `role`, etc. are rejected (Zod `.strict()`).

### AD-07: JSON timestamp format

Firestore `Timestamp` fields are serialized to **ISO 8601 UTC strings** in all API responses (repository or controller layer). Clients never receive raw Firestore types.

### AD-08: `req.user` shape

After `auth.middleware`:

```json
{
  "uid": "<Firebase uid>",
  "email": "user@company.com",
  "role": "employee",
  "fullName": "Maria Santos",
  "timezone": "Asia/Manila",
  "schedule": { "start": "09:00", "end": "18:00" }
}
```

`uid` is used in API responses for the current user; `attendance` documents use field name `userId` (same value).

---

## 4. Folder / File Responsibilities

Each route: `auth.middleware` → optional `requireAdmin` → `validate(schema)` → `controller` → `service`.

---

## 5. Business Rules

- Employees access only their `uid`.
- Admins access any user via `/api/admin/*`.
- Field names match Firestore exactly (`fullName`, `regularHours`, `totalRegularHours`, …).
- One `attendance` document per `userId` + `date`.
- `dailySummary` written only when `attendance.status === "closed"`.

---

## 6. Data Flow

`HTTP → middleware → controller → service → repository → Firestore`  
Punch out / admin save: `service → computation.engine → batch write attendance + dailySummary`.

---

## 7. Firestore Usage

| Endpoint group | Collections |
|----------------|-------------|
| Auth | `users` |
| Attendance | `attendance`, `dailySummary` (on close) |
| Summaries | `dailySummary` (read) |
| Admin | `users`, `attendance`, `dailySummary` |

---

## 8. API Behavior

### Health

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/health` | No |

**Response 200:** `{ "status": "ok", "timestamp": "<ISO8601>" }`

---

### Auth

| Method | Path | Auth | Role |
|--------|------|------|------|
| POST | `/api/auth/register` | Bearer | any authenticated |
| GET | `/api/auth/me` | Bearer | any |
| POST | `/api/auth/logout` | Bearer | any (204, optional stub) |

**POST `/api/auth/register`**

Request:

```json
{ "fullName": "Maria Santos" }
```

Response **201:** user object (`uid`, `fullName`, `email`, `role`, `timezone`, `schedule`, `createdAt`).

Errors:

- `409 PROFILE_EXISTS` if `users/{uid}` already exists.
- `403 FORBIDDEN` if `ALLOW_PUBLIC_REGISTER=false`.

**GET `/api/auth/me`**

Response **200:** user object.  
Response **404:** `PROFILE_NOT_FOUND` if Firebase Auth user has no `users` document.

---

### Attendance (Employee)

| Method | Path | Auth | Role |
|--------|------|------|------|
| POST | `/api/attendance/punch-in` | Bearer | employee or admin |
| POST | `/api/attendance/punch-out` | Bearer | employee or admin |
| GET | `/api/attendance/today` | Bearer | employee or admin |
| GET | `/api/attendance/history` | Bearer | employee or admin |

**POST `/api/attendance/punch-in`** — body `{}`  
**201:** open `attendance` (see `04-firestore-schema.md`).  
**409:** `ALREADY_PUNCHED_IN` or `ATTENDANCE_ALREADY_CLOSED`.

**POST `/api/attendance/punch-out`** — body `{}`  
**200:** `{ "attendance": { ...closed }, "dailySummary": { ... } }`  
**409:** `NO_OPEN_ATTENDANCE`.

**GET `/api/attendance/today`**  
**200:** `{ "data": <attendance|null> }` for today in user timezone.

**GET `/api/attendance/history?from=&to=&page=1&limit=31`**

| Param | Required | Rules |
|-------|----------|-------|
| `from` | yes | `YYYY-MM-DD` |
| `to` | yes | `YYYY-MM-DD`, `to >= from`, max 93 days |
| `page` | no | default 1 |
| `limit` | no | default 31, max 93 |

**200:** `{ "items": [ attendance, ... ], "page", "limit", "total" }`

---

### Summaries (Employee)

| Method | Path | Auth | Role |
|--------|------|------|------|
| GET | `/api/summaries/daily` | Bearer | employee or admin (own data only) |
| GET | `/api/summaries/daily/range` | Bearer | employee or admin |
| GET | `/api/summaries/weekly` | Bearer | employee or admin |

**GET `/api/summaries/daily?date=YYYY-MM-DD`**  
**200:** `{ "data": <dailySummary|null> }` — `null` if no closed day (not 404).

**GET `/api/summaries/daily/range?from=&to=`** — max 93 days.  
**200:** `{ "items": [ dailySummary, ... ] }`

**GET `/api/summaries/weekly?weekStart=YYYY-MM-DD`** — `weekStart` must be a **Monday**.  
**200:** weekly object per `08-daily-summary.md`.

---

### Admin — Users

| Method | Path | Auth | Role |
|--------|------|------|------|
| GET | `/api/admin/users` | Bearer | admin |
| GET | `/api/admin/users/:uid` | Bearer | admin |
| PATCH | `/api/admin/users/:uid` | Bearer | admin |
| PATCH | `/api/admin/users/:uid/role` | Bearer | admin |

**GET `/api/admin/users?q=&role=&page=1&limit=20`**

| Param | Rules |
|-------|-------|
| `q` | optional; matches `fullName` or `email` (case-insensitive) |
| `role` | optional; `employee` \| `admin` (dashboard roster: use `role=employee`) |
| `page` | default 1 |
| `limit` | default 20, max 100 |

**GET `/api/admin/users/:uid`**  
**200:**

```json
{
  "user": { "uid", "fullName", "email", "role", "timezone", "schedule", "createdAt" },
  "recentAttendance": [ { "...attendance fields..." }, ... ]
}
```

`recentAttendance`: last 14 days, `date` descending (configurable in service, max 31).

**PATCH `/api/admin/users/:uid`** — partial: `fullName`, `schedule`, `timezone`.

**PATCH `/api/admin/users/:uid/role`** — `{ "role": "admin" | "employee" }`.  
**409:** `LAST_ADMIN` when demoting the only admin.

---

### Admin — Attendance

| Method | Path | Auth | Role |
|--------|------|------|------|
| GET | `/api/admin/attendance` | Bearer | admin |
| POST | `/api/admin/attendance` | Bearer | admin |
| PATCH | `/api/admin/attendance/:userId/:date` | Bearer | admin |

**GET `/api/admin/attendance?date=&status=&q=&userId=&page=1&limit=50`**

| Param | Rules |
|-------|-------|
| `date` | `YYYY-MM-DD`; **required unless** `userId` provided |
| `status` | optional `open` \| `closed` |
| `q` | optional; filter by employee name/email (applied after fetch) |
| `userId` | optional uid; when set, returns that user's attendance (optionally filtered by `date`) |

Validation: **at least one of** `date` or `userId` must be present; else `400 VALIDATION_ERROR`.

**200 item:**

```json
{
  "attendance": { },
  "fullName": "Maria Santos",
  "email": "maria@company.com"
}
```

**POST `/api/admin/attendance`** — create **closed** record when none exists.

```json
{
  "userId": "abc123",
  "date": "2026-06-01",
  "timeIn": "2026-06-01T01:00:00.000Z",
  "timeOut": "2026-06-01T10:00:00.000Z",
  "reason": "No punch recorded; verified with supervisor."
}
```

**201:** `{ "attendance", "dailySummary" }`  
**409:** `ATTENDANCE_ALREADY_EXISTS` if document already exists for `userId` + `date`.

**PATCH `/api/admin/attendance/:userId/:date`**

```json
{
  "timeIn": "2026-06-01T01:00:00.000Z",
  "timeOut": "2026-06-01T10:00:00.000Z",
  "reason": "Forgot to punch out; verified with supervisor."
}
```

**200:** `{ "attendance", "dailySummary" }`  
**404:** `ATTENDANCE_NOT_FOUND`.

---

### Admin — Summaries & Reports

| Method | Path | Auth | Role |
|--------|------|------|------|
| GET | `/api/admin/summaries/daily` | Bearer | admin |
| GET | `/api/admin/reports/daily` | Bearer | admin |
| GET | `/api/admin/reports/weekly` | Bearer | admin |
| GET | `/api/admin/reports/exceptions` | Bearer | admin |
| GET | `/api/admin/dashboard/kpis` | Bearer | admin |

**GET `/api/admin/summaries/daily?userId=&date=`** — required params.  
**200:** `{ "data": <dailySummary|null> }`

**GET `/api/admin/reports/daily?date=`**  
**200:** `{ "items": [ { ...dailySummary, "fullName", "email" }, ... ] }`

**GET `/api/admin/reports/weekly?weekStart=`** (Monday)  
**200:** per-user weekly totals for all employees (paginated `page`, `limit`).

**GET `/api/admin/reports/exceptions?from=&to=`**  
**200:** `{ "items": [ { userId, fullName, date, totalLateMinutes, totalUndertimeMinutes }, ... ] }`  
Thresholds: `LATE_ALERT_MINUTES`, `UNDERTIME_ALERT_MINUTES` (env).

**GET `/api/admin/dashboard/kpis?date=`**

```json
{
  "date": "2026-06-01",
  "activeEmployees": 45,
  "punchedInNow": 38,
  "absentToday": 7,
  "totalOvertimeHours": 12.5,
  "totalLateMinutes": 120
}
```

Definitions: `09-admin-system.md`.

---

## 9. Security Considerations

- CORS: `process.env.CORS_ORIGIN` only.
- `helmet()`, `express-rate-limit` on `/api`.
- Auth routes: 20 req / 15 min / IP.
- Punch routes: 10 req / 1 min / user.
- Admin writes: 30 req / 15 min / user.
- Zod `.strict()` on all POST/PATCH bodies.

---

## 10. Scalability Considerations

- Paginate all list endpoints (`page`, `limit`).
- Admin team daily report: query `dailySummary` by `date` index.
- Avoid N+1: batch `getUsers` for ids in report results.

---

## 11. Reusable Utilities / Services

| Middleware | Role |
|------------|------|
| `auth.middleware` | `verifyIdToken`, load `users` → `req.user` |
| `requireAdmin` | `req.user.role === 'admin'` |
| `validate(schema)` | Zod |
| `error.middleware` | Map `AppError` → HTTP |

---

## 12. Best Practices

- Controllers &lt; 30 lines.
- New endpoints require updates to this file **and** `04-firestore-schema.md` if storage changes.
- ISO 8601 strings in JSON for timestamps.

---

## 13. Error Handling Expectations

| Code | HTTP |
|------|------|
| `UNAUTHORIZED` | 401 |
| `FORBIDDEN` | 403 |
| `VALIDATION_ERROR` | 400 |
| `USER_NOT_FOUND` | 404 |
| `PROFILE_NOT_FOUND` | 404 |
| `PROFILE_EXISTS` | 409 |
| `ATTENDANCE_NOT_FOUND` | 404 |
| `ALREADY_PUNCHED_IN` | 409 |
| `ATTENDANCE_ALREADY_CLOSED` | 409 |
| `NO_OPEN_ATTENDANCE` | 409 |
| `LAST_ADMIN` | 409 |
| `ATTENDANCE_ALREADY_EXISTS` | 409 |
| `RANGE_TOO_LARGE` | 400 |
| `INTERNAL_ERROR` | 500 |

Full registry: `01-project-overview.md`.

---

## 14. Validation Rules

| Endpoint | Body/query rules |
|----------|------------------|
| Register | `fullName` 2–100 chars |
| Punch in/out | empty object `{}` |
| History | `from`, `to`, max 93 days |
| Weekly | `weekStart` is Monday |
| Admin POST attendance | `userId`, `date`, `timeIn`, `timeOut`, `reason` (10–500 chars); `timeOut > timeIn` |
| Admin PATCH attendance | same time/reason rules |
| Admin PATCH role | `role` enum |

---

## HTTP Status Summary

| Code | Use |
|------|-----|
| 200 | OK |
| 201 | Created |
| 204 | No content (logout) |
| 400 | Validation |
| 401 | Auth |
| 403 | Role |
| 404 | Not found |
| 409 | Conflict |
| 500 | Server error |

---

## Related Documents

- `01-project-overview.md` — error registry
- `04-firestore-schema.md`
- `06-attendance-system.md`
- `09-admin-system.md`
- `12-security-rules.md`
