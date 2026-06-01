# 04 — Firestore Schema

## 1. Purpose

Define the **only allowed Firestore collections, document IDs, field names, types, and indexes**. This is the canonical data model. No undocumented collections or fields may be used in code.

---

## 2. Responsibilities

| Collection | Responsibility |
|------------|----------------|
| `users` | Identity profile, role, schedule, timezone |
| `attendance` | Per-day punch times and computed metrics |
| `dailySummary` | Per-day totals for reporting and dashboards |

---

## 3. Architecture Decisions

### AD-01: Exactly three collections (MVP)

`users`, `attendance`, `dailySummary` only.

### AD-02: Document ID for attendance and dailySummary

**Format:** `{userId}_{date}`  
**Example:** `k9abc123_2026-06-01`

Ensures one document per employee per calendar day.

### AD-03: users document ID

**Format:** Firebase Auth `uid`

### AD-04: Hours vs minutes

| Field suffix | Unit |
|--------------|------|
| `*Hours` (regular, overtime, night differential) | **Decimal hours** (e.g. `8.5` = 8h 30m) |
| `*Minutes` (late, undertime) | **Integer minutes** |

### AD-05: Timestamps

- `createdAt`: Firestore `Timestamp` (server-set on create)
- `timeIn` / `timeOut`: Firestore `Timestamp` (UTC instant)

### AD-06: Date field

- `date`: string `YYYY-MM-DD` in user's `timezone` (see `users.timezone`)

---

## 4. Folder / File Responsibilities

| Server file | Collection access |
|-------------|-------------------|
| `repositories/users.repository.js` | `users` |
| `repositories/attendance.repository.js` | `attendance` |
| `repositories/dailySummary.repository.js` | `dailySummary` |

---

## 5. Business Rules

- Schedule defaults: `start: "09:00"`, `end: "18:00"` on every `users` document.
- `attendance.status`: `open` (punched in, no `timeOut`) | `closed` (punch out complete).
- When `status` is `open`: `timeOut` is `null`; computed fields (`regularHours`, `overtimeHours`, `nightDifferentialHours`, `lateMinutes`, `undertimeMinutes`) are **absent or `null`** — never `0` until closed (avoids ambiguous UI).
- When `status` becomes `closed`, all five computed fields **must** be populated (numbers ≥ 0).
- `dailySummary` exists only when `attendance.status === 'closed'`; upserted in the same batch as close/edit.

---

## 6. Data Flow

```
Register/Login → create/read users/{uid}
Punch In → create attendance/{uid}_{date} (status: open)
Punch Out → update attendance (metrics) → upsert dailySummary/{uid}_{date}
Admin Edit → update attendance → recompute → upsert dailySummary
Weekly Report → query dailySummary by userId + date range
```

---

## 7. Firestore Usage

### Collection: `users`

**Path:** `users/{uid}`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `fullName` | string | yes | Display name |
| `email` | string | yes | Matches Firebase Auth email |
| `role` | string | yes | `employee` \| `admin` |
| `timezone` | string | yes | IANA e.g. `Asia/Manila` |
| `createdAt` | timestamp | yes | Profile creation |
| `schedule` | map | yes | Shift definition |
| `schedule.start` | string | yes | `HH:mm` e.g. `"09:00"` |
| `schedule.end` | string | yes | `HH:mm` e.g. `"18:00"` |

**Example:**

```json
{
  "fullName": "Maria Santos",
  "email": "maria@company.com",
  "role": "employee",
  "timezone": "Asia/Manila",
  "createdAt": "<Timestamp>",
  "schedule": {
    "start": "09:00",
    "end": "18:00"
  }
}
```

---

### Collection: `attendance`

**Path:** `attendance/{userId}_{date}`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | string | yes | Firebase uid |
| `date` | string | yes | `YYYY-MM-DD` |
| `timeIn` | timestamp | yes | Punch in instant |
| `timeOut` | timestamp | no | Null when `status: open` |
| `regularHours` | number | no | Set on close |
| `overtimeHours` | number | no | Set on close |
| `nightDifferentialHours` | number | no | Set on close |
| `lateMinutes` | number | no | Set on close |
| `undertimeMinutes` | number | no | Set on close |
| `status` | string | yes | `open` \| `closed` |
| `createdAt` | timestamp | yes | Record creation |

**Example (closed):**

```json
{
  "userId": "k9abc123",
  "date": "2026-06-01",
  "timeIn": "<Timestamp>",
  "timeOut": "<Timestamp>",
  "regularHours": 8.5,
  "overtimeHours": 1.5,
  "nightDifferentialHours": 0,
  "lateMinutes": 15,
  "undertimeMinutes": 0,
  "status": "closed",
  "createdAt": "<Timestamp>"
}
```

---

### Collection: `dailySummary`

**Path:** `dailySummary/{userId}_{date}`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | string | yes | Firebase uid |
| `date` | string | yes | `YYYY-MM-DD` |
| `totalRegularHours` | number | yes | Mirrors closed attendance (MVP) |
| `totalOvertimeHours` | number | yes | |
| `totalNightDifferentialHours` | number | yes | |
| `totalLateMinutes` | number | yes | |
| `totalUndertimeMinutes` | number | yes | |

**Example:**

```json
{
  "userId": "k9abc123",
  "date": "2026-06-01",
  "totalRegularHours": 8.5,
  "totalOvertimeHours": 1.5,
  "totalNightDifferentialHours": 0,
  "totalLateMinutes": 15,
  "totalUndertimeMinutes": 0
}
```

**MVP rule:** One `attendance` per day ⇒ `dailySummary` totals equal that attendance's computed fields. If schema later allows multiple segments per day, `dailySummary` becomes sum of segments (doc update required).

---

## 8. API Behavior

API maps DTOs to these field names exactly. No aliasing (e.g. do not use `displayName` in Firestore—use `fullName`).

---

## 9. Security Considerations

- Clients must not write to `attendance` or `dailySummary`.
- Clients must not write to `users` (prevents role escalation).
- **MVP reads:** client does not use Firestore SDK for data; all reads via API (`12-security-rules.md`).

---

## 10. Scalability Considerations

**Composite indexes (create in Firebase console or `firestore.indexes.json`):**

| Collection | Fields | Use |
|------------|--------|-----|
| `attendance` | `userId` ASC, `date` DESC | Employee history |
| `attendance` | `date` ASC, `status` ASC | Admin filter by date/status |
| `dailySummary` | `userId` ASC, `date` DESC | Weekly aggregation |
| `dailySummary` | `date` ASC | Admin team daily report |
| `users` | `role` ASC, `fullName` ASC | Admin employee list (optional) |

Admin search by name: in-memory filter on `fullName` / `email` after query (MVP &lt; 500 users).

### Document ID constraints

- `userId` must equal Firebase Auth `uid` (alphanumeric).
- `date` must be `YYYY-MM-DD` without underscores.
- Pattern: `{userId}_{date}` — example `k9abc123_2026-06-01`.

---

## 11. Reusable Utilities / Services

| Utility | Function |
|---------|----------|
| `buildAttendanceId(userId, date)` | Returns `{userId}_{date}` |
| `buildDailySummaryId(userId, date)` | Same pattern |
| `parseDateString(date)` | Validate `YYYY-MM-DD` |

---

## 12. Best Practices

- Use batched writes when updating `attendance` + `dailySummary` together.
- Never delete `attendance`; admin sets corrected `timeIn`/`timeOut` via API.
- Store UTC in timestamps; derive `date` string using `users.timezone`.

---

## 13. Error Handling Expectations

| Condition | Code |
|-----------|------|
| Document not found | `ATTENDANCE_NOT_FOUND` |
| Duplicate punch in | `ALREADY_PUNCHED_IN` |
| Invalid date format | `VALIDATION_ERROR` |

---

## 14. Validation Rules

| Field | Rule |
|-------|------|
| `fullName` | 2–100 chars, trimmed |
| `email` | Valid email |
| `role` | `employee` or `admin` |
| `timezone` | Valid IANA string |
| `schedule.start`, `schedule.end` | Regex `^([01]\d|2[0-3]):[0-5]\d$` |
| `date` | Regex `^\d{4}-\d{2}-\d{2}$` |
| `status` | `open` or `closed` |
| `*Hours` | Number ≥ 0, max 24 per field sanity check |
| `*Minutes` | Integer ≥ 0 |

---

## Related Documents

- `06-attendance-system.md`
- `07-computation-engine.md`
- `08-daily-summary.md`
- `12-security-rules.md`
