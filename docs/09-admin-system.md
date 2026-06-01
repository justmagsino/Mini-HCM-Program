# 09 — Admin System

## 1. Purpose

Define **admin-only features**: view employees, edit attendance, view reports, and search/filter attendance. All admin actions require `users.role === 'admin'`.

---

## 2. Responsibilities

| Feature | Service |
|---------|---------|
| List/search employees | `admin.service.js` + `users.repository.js` |
| View user detail | `admin.service.js` |
| Update user profile/schedule | `admin.service.js` |
| Change user role | `admin.service.js` |
| Create attendance (missing day) | `admin.service.js` + `computation.engine.js` |
| Edit attendance | `admin.service.js` + `computation.engine.js` |
| Team reports | `admin.service.js` + `dailySummary.repository.js` |
| Search/filter attendance | `admin.service.js` + `attendance.repository.js` |
| Dashboard KPIs | `admin.service.js` (derived queries; no new collection) |

---

## 3. Architecture Decisions

### AD-01: Admin namespace

All routes under `/api/admin/*` with `requireAdmin` middleware.

### AD-02: Edit attendance = recalculate

Admin PATCH updates `timeIn`/`timeOut`, reruns engine, updates `attendance` + `dailySummary`.

### AD-03: Last-admin guard

At least one `role: "admin"` must remain; service returns `409 LAST_ADMIN` when demoting the only admin.

### AD-04: Search/filter MVP

Query params on `GET /api/admin/attendance` — filter by `date`, `userId`, `status`, `q` (employee name via users lookup). At least one of `date` or `userId` is required.

### AD-05: Admin “today roster” = client merge (no extra endpoint)

`GET /api/admin/attendance?date=` returns only rows with an **existing** `attendance` document. It does **not** list absent employees.

For the admin dashboard table (in/out/absent):

1. `GET /api/admin/users?limit=100` (employees; exclude or include admins per product choice — **MVP: list `role=employee` only**).
2. `GET /api/admin/attendance?date={today}`.
3. **Client merge:** for each user, `status = absent` if no attendance doc; else `open` or `closed` from attendance.

KPI `absentToday` from `/api/admin/dashboard/kpis` is the authoritative absent **count**; the table uses merge for names.

---

## 4. Folder / File Responsibilities

| File | Role |
|------|------|
| `admin.routes.js` | Admin route mounting |
| `admin.controller.js` | Handlers |
| `admin.service.js` | Business logic |
| `client/pages/admin/EmployeesPage.jsx` | Employee table |
| `client/pages/admin/AttendanceEditPage.jsx` | Edit form |
| `client/pages/admin/ReportsPage.jsx` | Reports UI |
| `client/src/api/admin.api.js` | HTTP client |

---

## 5. Business Rules

- Only admin can edit another user's `attendance`.
- Edit requires `reason` (min 10 characters) logged server-side.
- Admin can view all `users`, `attendance`, `dailySummary`.
- Promoting/demoting roles: admin only.
- Default employee list sort: `fullName` ascending.

---

## 6. Data Flow

### Edit attendance

```
PATCH /api/admin/attendance/:userId/:date
  → requireAdmin
  → load attendance/{userId}_{date}
  → validate timeIn, timeOut, reason
  → computation.engine.compute(...)
  → update attendance (metrics + status: closed)
  → sync dailySummary
  → log admin action (console structured log MVP)
  → 200 response
```

### Search attendance

```
GET /api/admin/attendance?date=2026-06-01&status=open&q=maria
  → list attendance for date (index)
  → if q: filter by matching user fullName from users collection
  → return enriched rows { attendance, fullName, email }
```

---

## 7. Firestore Usage

| Collection | Admin access |
|------------|--------------|
| `users` | Read all; update via API |
| `attendance` | Read/update all |
| `dailySummary` | Read all; upsert via sync |

No extra collections for audit in MVP (server logs only).

---

## 8. API Behavior

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/users` | List employees (`?q&role&page&limit`) |
| GET | `/api/admin/users/:uid` | User detail + recent attendance |
| PATCH | `/api/admin/users/:uid` | Update fullName, schedule, timezone |
| PATCH | `/api/admin/users/:uid/role` | `{ "role": "admin" \| "employee" }` |
| GET | `/api/admin/attendance` | Search/filter attendance |
| POST | `/api/admin/attendance` | Create closed record for a date |
| PATCH | `/api/admin/attendance/:userId/:date` | Edit punches |
| GET | `/api/admin/reports/daily` | Team daily summaries |
| GET | `/api/admin/reports/weekly` | Team weekly aggregates |
| GET | `/api/admin/reports/exceptions` | High late/undertime |

Full contracts: `11-api-routes.md`.

### Dashboard KPI definitions (`GET /api/admin/dashboard/kpis`)

| KPI | Calculation (for `?date=YYYY-MM-DD`) |
|-----|--------------------------------------|
| `activeEmployees` | Count `users` where `role == "employee"` |
| `punchedInNow` | Count `attendance` where `date == date` AND `status == "open"` |
| `absentToday` | `activeEmployees` minus employees with `attendance` doc for `date` (any status) |
| `totalOvertimeHours` | Sum `dailySummary.totalOvertimeHours` where `date == date` |
| `totalLateMinutes` | Sum `dailySummary.totalLateMinutes` where `date == date` |

### Exceptions report (`GET /api/admin/reports/exceptions`)

Return employees where **closed** attendance or `dailySummary` for any day in range has:

- `totalLateMinutes >= LATE_ALERT_MINUTES` (env, default 15), or
- `totalUndertimeMinutes >= UNDERTIME_ALERT_MINUTES` (env, default 30)

---

## 9. Security Considerations

- `requireAdmin` on every admin route.
- Validate `userId` in path exists before update.
- Rate-limit admin write endpoints (30/15min).
- Do not expose Firebase private keys or service accounts to admin UI.

---

## 10. Scalability Considerations

- Paginate `GET /api/admin/users` (default `limit=20`).
- Team daily report: batch-fetch users for displayed rows only.
- For &gt;1000 employees, add Algolia/search service (out of scope MVP).

---

## 11. Reusable Utilities / Services

| Utility | Use |
|---------|-----|
| `enrichAttendanceWithUser(attendance)` | Join fullName, email |
| `filterByQuery(users, q)` | Case-insensitive name/email match |
| `canChangeRole(actor, target, newRole)` | Last-admin guard |

---

## 12. Best Practices

- Confirm dialog before saving attendance edits.
- Show before/after times in admin UI.
- Filter inactive users only when schema adds `isActive` (future).

---

## 13. Error Handling Expectations

| Case | HTTP | Code |
|------|------|------|
| Not admin | 403 | `FORBIDDEN` |
| User not found | 404 | `USER_NOT_FOUND` |
| Attendance not found | 404 | `ATTENDANCE_NOT_FOUND` |
| Last admin demotion | 409 | `LAST_ADMIN` |
| Missing reason | 400 | `VALIDATION_ERROR` |

---

## 14. Validation Rules

### PATCH user

| Field | Rule |
|-------|------|
| `fullName` | optional, 2–100 chars |
| `schedule.start`, `schedule.end` | optional, `HH:mm` |
| `timezone` | optional, IANA |

### PATCH role

| Field | Rule |
|-------|------|
| `role` | required, `employee` \| `admin` |

### POST attendance (create)

| Field | Rule |
|-------|------|
| `userId` | required, valid uid |
| `date` | required `YYYY-MM-DD` |
| `timeIn` | required ISO 8601 |
| `timeOut` | required ISO 8601, after timeIn |
| `reason` | required, min 10, max 500 |

### PATCH attendance

| Field | Rule |
|-------|------|
| `timeIn` | required ISO 8601 |
| `timeOut` | required ISO 8601, after timeIn |
| `reason` | required, min 10, max 500 |

### GET attendance filters

| Param | Rule |
|-------|------|
| `date` | `YYYY-MM-DD`; required unless `userId` set |
| `status` | optional `open` \| `closed` |
| `q` | optional string, max 100 |
| `userId` | optional uid |
| (rule) | at least one of `date` or `userId` required |

---

## Related Documents

- `05-auth-system.md`
- `06-attendance-system.md`
- `11-api-routes.md`
- `10-dashboard-ui.md`
