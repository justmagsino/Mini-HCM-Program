# 06 — Attendance System

## 1. Purpose

Define **punch in, punch out, attendance history, status lifecycle, and admin edit behavior** for the `attendance` collection.

---

## 2. Responsibilities

| Function | Owner |
|----------|-------|
| Punch in | `attendance.service.js` |
| Punch out + compute | `attendance.service.js` + `computation.engine.js` |
| History list | `attendance.service.js` |
| Admin edit / create | `admin.service.js` |
| Sync dailySummary | `summary.service.js` (single owner; called by attendance/admin services) |

---

## 3. Architecture Decisions

### AD-01: One attendance document per user per date

Document ID: `{userId}_{date}`.

### AD-02: Server timestamps for punch times

`timeIn` and `timeOut` are set on the **server** from server clock (`new Date()` at mutation time) to prevent client clock manipulation and to return accurate ISO strings in the API response.

Do not accept punch times from the client body on employee punch routes.

### AD-03: Status machine

| Status | Meaning |
|--------|---------|
| `open` | Punched in; `timeOut` is null |
| `closed` | Punched out; metrics populated |

### AD-04: No delete

Attendance records are corrected via admin update or admin create — never deleted.

### AD-05: Work date = calendar date in user timezone

`date` is computed at punch in from server clock + `users.timezone`. It does not change on punch out.

### AD-06: Cross-midnight work

If `timeOut` falls on the next calendar day, the record stays on **punch-in `date`**; computation engine uses full `timeIn`→`timeOut` interval (`07-computation-engine.md`).

---

## 4. Folder / File Responsibilities

| File | Role |
|------|------|
| `attendance.routes.js` | Employee punch + history endpoints |
| `attendance.controller.js` | Request/response mapping |
| `attendance.service.js` | Business rules, orchestration |
| `attendance.repository.js` | Firestore CRUD |
| `computation.engine.js` | Metric calculation |
| `client/.../PunchPage.jsx` | Punch UI |
| `client/.../HistoryPage.jsx` | History table |
| `client/src/api/attendance.api.js` | HTTP calls |

---

## 5. Business Rules

| Rule | Behavior |
|------|----------|
| Default shift | `users.schedule` — default `09:00`–`18:00` |
| Punch in | Allowed only if no `open` attendance for today |
| Punch out | Allowed only if today's attendance is `open` |
| `timeOut` | Must be after `timeIn` |
| Late | `timeIn` after `schedule.start` |
| Undertime | `timeOut` before `schedule.end` |
| Regular / OT / ND | Computed on punch out (`07-computation-engine.md`) |
| History range | Max 93 days per request (configurable) |

---

## 6. Data Flow

### Punch In

```
POST /api/attendance/punch-in
  → auth.middleware
  → attendance.service.punchIn(uid)
      → resolve date (users.timezone)
      → if attendance/{uid}_{date} exists and status=open → 409
      → if exists closed → 409 (one record per day MVP)
      → else create attendance { userId, date, timeIn, status: open, createdAt }
  → 201 response
```

### Punch Out

```
POST /api/attendance/punch-out
  → load open attendance for today
  → set timeOut
  → computation.engine.compute(...)
  → update attendance fields + status: closed
  → summary.service.syncDailySummary(...)
  → 200 response with attendance + dailySummary
```

---

## 7. Firestore Usage

**Collection:** `attendance`  
**Path:** `attendance/{userId}_{date}`

Fields per `04-firestore-schema.md`.  
On punch out, populate: `regularHours`, `overtimeHours`, `nightDifferentialHours`, `lateMinutes`, `undertimeMinutes`.

---

## 8. API Behavior

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/attendance/punch-in` | Authenticated | Create open attendance (self only) |
| POST | `/api/attendance/punch-out` | Authenticated | Close + compute (self only) |
| GET | `/api/attendance/today` | Authenticated | Today's record (self only) |
| GET | `/api/attendance/history` | Authenticated | `?from=&to=` (self only) |

Admin endpoints: `11-api-routes.md` → `/api/admin/attendance/*`.

### Admin create (no record for date)

If employee forgot to punch and no `attendance/{userId}_{date}` exists, admin uses `POST /api/admin/attendance` (not PATCH) to create a **closed** record with `timeIn`, `timeOut`, and `reason`.

---

## 9. Security Considerations

- Employees can only punch for `req.user.uid`.
- Employees cannot PATCH attendance directly.
- Admin edits require `role === admin` and should log reason (server log MVP; audit collection requires schema update).

---

## 10. Scalability Considerations

- Index: `userId` + `date` for history queries.
- Debounce punch buttons (client) + reject duplicate requests within 2s (server).
- For large history, paginate with `limit` + `startAfter` (add query params in API doc when implemented).

---

## 11. Reusable Utilities / Services

| Service | Methods |
|---------|---------|
| `attendance.service` | `punchIn`, `punchOut`, `getToday`, `getHistory` |
| `attendance.repository` | `getById`, `create`, `update`, `queryByUserAndDateRange` |
| `computation.engine` | `computeAttendanceMetrics` |
| `summary.service` | `syncDailySummary` |

---

## 12. Best Practices

- Disable punch button while request in flight.
- Show open session: "Punched in at {time}" using `users.timezone`.
- After punch out, refresh dashboard summary.

---

## 13. Error Handling Expectations

| Case | HTTP | Code |
|------|------|------|
| Already punched in (open) | 409 | `ALREADY_PUNCHED_IN` |
| No open attendance for punch out | 409 | `NO_OPEN_ATTENDANCE` |
| Already closed today | 409 | `ATTENDANCE_ALREADY_CLOSED` |
| Invalid date range | 400 | `VALIDATION_ERROR` |

---

## 14. Validation Rules

### Punch in

- Empty body allowed.
- Server derives `date` from timezone.

### Punch out

- Empty body allowed.
- Reject if `timeOut <= timeIn`.

### History query

| Param | Rule |
|-------|------|
| `from` | required, `YYYY-MM-DD` |
| `to` | required, `YYYY-MM-DD`, `to >= from` |
| range | max 93 days |

### Admin POST body (create)

| Field | Rule |
|-------|------|
| `userId` | required uid |
| `date` | `YYYY-MM-DD` |
| `timeIn` | ISO 8601 |
| `timeOut` | ISO 8601, after timeIn |
| `reason` | min 10 chars |

### Admin PATCH body (edit)

| Field | Rule |
|-------|------|
| `timeIn` | ISO 8601 string |
| `timeOut` | ISO 8601, after timeIn |
| `reason` | string, min 10 chars |

---

## Implementation Example (Response — Punch Out)

```json
{
  "attendance": {
    "userId": "uid123",
    "date": "2026-06-01",
    "timeIn": "2026-06-01T01:00:00.000Z",
    "timeOut": "2026-06-01T11:30:00.000Z",
    "regularHours": 8,
    "overtimeHours": 1.5,
    "nightDifferentialHours": 0,
    "lateMinutes": 0,
    "undertimeMinutes": 0,
    "status": "closed"
  },
  "dailySummary": {
    "userId": "uid123",
    "date": "2026-06-01",
    "totalRegularHours": 8,
    "totalOvertimeHours": 1.5,
    "totalNightDifferentialHours": 0,
    "totalLateMinutes": 0,
    "totalUndertimeMinutes": 0
  }
}
```

---

## Related Documents

- `04-firestore-schema.md`
- `07-computation-engine.md`
- `08-daily-summary.md`
- `09-admin-system.md`
