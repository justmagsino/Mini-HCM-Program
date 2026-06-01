# 07 — Computation Engine

## 1. Purpose

Define the **canonical algorithms** for Regular Hours, Overtime (OT), Night Differential (ND), Late, and Undertime. This logic lives exclusively in `server/src/engines/computation.engine.js` as pure functions.

---

## 2. Responsibilities

| Output | Unit | Stored on |
|--------|------|-----------|
| `regularHours` | decimal hours | `attendance` |
| `overtimeHours` | decimal hours | `attendance` |
| `nightDifferentialHours` | decimal hours | `attendance` |
| `lateMinutes` | integer minutes | `attendance` |
| `undertimeMinutes` | integer minutes | `attendance` |

Engine does **not** write to Firestore.

---

## 3. Architecture Decisions

### AD-01: Pure function module

```javascript
computeAttendanceMetrics({ date, timeIn, timeOut, schedule, timezone }) → metrics
```

- `date`: `YYYY-MM-DD` — calendar work date (punch-in date in user timezone)

No Express, no Firebase imports.

### AD-02: Inputs from user document

- `schedule.start`, `schedule.end` from `users.schedule`
- `timezone` from `users.timezone`

### AD-03: Night differential window

**22:00 – 06:00** in user's timezone (inclusive start of ND at 22:00, through 06:00 next calendar day).

### AD-04: Precision

- Internal math in **minutes** (integers).
- Convert to **decimal hours** for output: `roundTo2(minutes / 60)`.

### AD-05: Single interval MVP

One `timeIn`–`timeOut` pair per day. Multi-break support requires doc update.

### AD-06: Night differential is additive

`nightDifferentialHours` counts overlap with 22:00–06:00 only. It does **not** reduce `regularHours` or `overtimeHours`. Total payroll interpretation is out of scope; store all metrics independently.

### AD-07: Timezone implementation

Use `server/src/utils/dates.js` with **Intl** APIs only (`02-tech-stack.md` AD-06). No third-party date libraries.

### AD-08: Metric independence

`regularHours`, `overtimeHours`, and `nightDifferentialHours` are stored independently. Do not force them to sum to total worked time. `lateMinutes` and `undertimeMinutes` are informational and do not reduce regular hours.

---

## 4. Folder / File Responsibilities

| File | Role |
|------|------|
| `engines/computation.engine.js` | All formulas |
| `utils/dates.js` | Build shift DateTimes in timezone |
| `attendance.service.js` | Calls engine on punch out / admin edit |
| `__tests__/computation.engine.test.js` | Table-driven unit tests |

---

## 5. Business Rules

| Metric | Rule |
|--------|------|
| **Regular hours** | Minutes worked within `[schedule.start, schedule.end]` on `date`, capped by actual presence |
| **Overtime** | Minutes worked **after** `schedule.end` |
| **Night differential** | Minutes worked overlapping **22:00–06:00** |
| **Late** | Minutes from `schedule.start` to `timeIn` if `timeIn` is late |
| **Undertime** | Minutes from `timeOut` to `schedule.end` if `timeOut` is early |

Default schedule: **09:00 – 18:00**.

---

## 6. Data Flow

```
attendance.service
  → load users.schedule, users.timezone
  → computation.engine.computeAttendanceMetrics({ date, timeIn, timeOut, schedule, timezone })
  → returns { regularHours, overtimeHours, nightDifferentialHours, lateMinutes, undertimeMinutes }
  → attendance.repository.update(...)
```

---

## 7. Firestore Usage

Engine does not touch Firestore. Output field names must match `attendance` schema exactly.

---

## 8. API Behavior

API returns computed fields in punch-out and admin-edit responses. Clients **display only**; never recalculate for persistence.

Optional: client `format.js` for display preview (must match engine tests if used).

---

## 9. Security Considerations

- Reject client-supplied `regularHours` etc. on any endpoint.
- Admin edit recalculates server-side from `timeIn`/`timeOut`.

---

## 10. Scalability Considerations

- O(1) segment math for single interval.
- Batch recompute (admin): process with concurrency limit if added later.

---

## 11. Reusable Utilities / Services

| Function | Description |
|----------|-------------|
| `minutesBetween(a, b)` | Difference in minutes |
| `overlapMinutes(workStart, workEnd, windowStart, windowEnd)` | Interval overlap |
| `toDecimalHours(minutes)` | `Math.round((minutes/60)*100)/100` |
| `buildShiftBounds(date, schedule, timezone)` | Shift start/end instants |

---

## 12. Best Practices

- Unit test every example in section **Worked Examples** below.
- Comment formulas with doc section references.
- Use shared `utils/dates.js` (Intl) on server; client uses same display helpers for consistency.

---

## 13. Error Handling Expectations

| Case | Thrown error |
|------|----------------|
| `timeOut` missing | `INVALID_ATTENDANCE_STATE` |
| `timeOut <= timeIn` | `VALIDATION_ERROR` |
| Invalid schedule format | `VALIDATION_ERROR` |

---

## 14. Validation Rules

| Input | Rule |
|-------|------|
| `date` | `YYYY-MM-DD` |
| `timeIn`, `timeOut` | Valid Date objects |
| `schedule.start`, `schedule.end` | `HH:mm` |
| `timezone` | Valid IANA |
| Output hours | ≥ 0, ≤ 24 per field sanity |
| Output minutes | integer ≥ 0 |

---

## Algorithm Detail

### Step 1 — Shift boundaries

On `date` in `timezone`:

- `shiftStart` = `date` + `schedule.start`
- `shiftEnd` = `date` + `schedule.end`

### Step 2 — Late (minutes)

```
if timeIn > shiftStart:
  lateMinutes = minutesBetween(shiftStart, timeIn)
else:
  lateMinutes = 0
```

### Step 3 — Undertime (minutes)

```
if timeOut < shiftEnd:
  undertimeMinutes = minutesBetween(timeOut, shiftEnd)
else:
  undertimeMinutes = 0
```

### Step 4 — Regular (minutes → hours)

```
effectiveStart = max(timeIn, shiftStart)
effectiveEnd = min(timeOut, shiftEnd)
regularMinutes = max(0, minutesBetween(effectiveStart, effectiveEnd))
regularHours = toDecimalHours(regularMinutes)
```

### Step 5 — Overtime (minutes → hours)

```
if timeOut > shiftEnd:
  otMinutes = minutesBetween(max(timeIn, shiftEnd), timeOut)
else:
  otMinutes = 0
overtimeHours = toDecimalHours(otMinutes)
```

### Step 6 — Night differential (minutes → hours)

For each calendar day touched by `[timeIn, timeOut]`:

- ND windows: `[22:00, 24:00)` and `[00:00, 06:00)`

```
ndMinutes = overlap(workInterval, ND windows)
nightDifferentialHours = toDecimalHours(ndMinutes)
```

---

## Worked Examples

### A — On time, full day

| | |
|-|-|
| schedule | 09:00–18:00 |
| timeIn | 09:00 |
| timeOut | 18:00 |

| Output | Value |
|--------|-------|
| lateMinutes | 0 |
| undertimeMinutes | 0 |
| regularHours | 9 |
| overtimeHours | 0 |
| nightDifferentialHours | 0 |

### B — Late + OT

| timeIn | 09:15 |
| timeOut | 19:00 |

| Output | Value |
|--------|-------|
| lateMinutes | 15 |
| regularHours | 8.75 (09:15–18:00) |
| overtimeHours | 1 |
| undertimeMinutes | 0 |

### C — Early departure

| timeIn | 09:00 |
| timeOut | 17:00 |

| Output | Value |
|--------|-------|
| undertimeMinutes | 60 |
| regularHours | 8 |
| overtimeHours | 0 |

### D — Night differential

| timeIn | 21:00 |
| timeOut | 23:00 |

| Output | Value |
|--------|-------|
| nightDifferentialHours | 1 (22:00–23:00) |
| total worked | 2 hours |

---

## Related Documents

- `06-attendance-system.md`
- `08-daily-summary.md`
- `04-firestore-schema.md`
