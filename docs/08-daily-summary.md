# 08 — Daily Summary

## 1. Purpose

Define how **`dailySummary` documents** are created, updated, queried, and aggregated into **weekly summaries** for reports and dashboards.

---

## 2. Responsibilities

| Component | Responsibility |
|-----------|----------------|
| `summary.service.js` | Sync `dailySummary` from closed `attendance` |
| `dailySummary.repository.js` | Firestore read/write |
| `summary.controller.js` | HTTP handlers |
| Weekly aggregation | Sum `dailySummary` docs in date range |

---

## 3. Architecture Decisions

### AD-01: dailySummary mirrors attendance (MVP)

With one `attendance` per `userId` + `date`:

```
totalRegularHours = attendance.regularHours
totalOvertimeHours = attendance.overtimeHours
... etc.
```

### AD-02: Upsert on punch out and admin edit

`dailySummary/{userId}_{date}` created or overwritten whenever attendance becomes `closed` or is corrected.

### AD-03: Weekly = sum of dailySummary

No separate `weeklySummary` collection. Weekly report queries 7 (or fewer) `dailySummary` documents.

### AD-04: Week starts Monday

Week boundary in `users.timezone`: **Monday** = `weekStart`, **Sunday** = `weekEnd`.

---

## 4. Folder / File Responsibilities

| File | Role |
|------|------|
| `summary.routes.js` | `/api/summaries/*` |
| `summary.service.js` | `syncDailySummary`, `getDaily`, `getWeekly` |
| `dailySummary.repository.js` | Firestore access |
| `client/src/api/summary.api.js` | Client HTTP |
| `DashboardPage.jsx` | Today + week widgets |

---

## 5. Business Rules

| Rule | Behavior |
|------|----------|
| Summary exists | Only after attendance `status: closed` |
| Missing day | Treated as 0 totals in weekly sum |
| Employee access | Own summaries only |
| Admin access | Any user's summaries |
| Totals units | Hours (decimal) for regular/OT/ND; minutes for late/undertime |

---

## 6. Data Flow

### Sync after punch out

```
attendance.service.punchOut
  → computation.engine (metrics on attendance)
  → summary.service.syncDailySummary(userId, date, metrics)
      → dailySummary.repository.upsert({
           userId, date,
           totalRegularHours, totalOvertimeHours,
           totalNightDifferentialHours, totalLateMinutes, totalUndertimeMinutes
         })
```

### Weekly read

```
GET /api/summaries/weekly?weekStart=2026-06-01
  → compute weekEnd = weekStart + 6 days
  → query dailySummary where userId == uid AND date >= weekStart AND date <= weekEnd
  → return { days: [...], totals: { sum fields } }
```

---

## 7. Firestore Usage

**Collection:** `dailySummary`  
**Document ID:** `{userId}_{date}`

Fields per `04-firestore-schema.md` — no additional fields in MVP.

**Query patterns:**

- Get one: `dailySummary/{userId}_{date}`
- Range: `where('userId','==',uid).where('date','>=',from).where('date','<=',to)`

---

## 8. API Behavior

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/summaries/daily` | Employee | `?date=YYYY-MM-DD` |
| GET | `/api/summaries/daily/range` | Employee | `?from=&to=` |
| GET | `/api/summaries/weekly` | Employee | `?weekStart=YYYY-MM-DD` (Monday) |
| GET | `/api/admin/summaries/daily` | Admin | `?userId=&date=` |
| GET | `/api/admin/reports/daily` | Admin | Team report for `?date=` |
| GET | `/api/admin/reports/weekly` | Admin | Team report for `?weekStart=` |

---

## 9. Security Considerations

- Non-admin cannot pass another `userId`.
- Admin team reports return only summary fields, not passwords/tokens.

---

## 10. Scalability Considerations

- Team daily report: query all `dailySummary` where `date == X` (index on `date` if volume grows).
- Cap date ranges (93 days) on range endpoints.
- Cache admin dashboard KPIs in memory per request only (no Redis MVP).

---

## 11. Reusable Utilities / Services

| Function | Purpose |
|----------|---------|
| `syncDailySummary(userId, date, attendance)` | Map closed `attendance` → `dailySummary` (see mapping table below) |

### Field mapping (attendance → dailySummary)

| attendance | dailySummary |
|------------|--------------|
| `regularHours` | `totalRegularHours` |
| `overtimeHours` | `totalOvertimeHours` |
| `nightDifferentialHours` | `totalNightDifferentialHours` |
| `lateMinutes` | `totalLateMinutes` |
| `undertimeMinutes` | `totalUndertimeMinutes` |

Must be called inside the same Firestore batch as attendance close/update.
| `aggregateWeekly(summaries[])` | Sum totals |
| `getWeekStart(date, timezone)` | Monday calculation |
| `formatHours(decimal)` | Client display |

---

## 12. Best Practices

- **Missing summary:** always `200` with `{ "data": null }` for single-day GET (not `404`). Use `404` only when the route targets a resource by ID that must exist (e.g. invalid admin user).
- Include `date` on each day object in weekly response for chart labels.

---

## 13. Error Handling Expectations

| Case | HTTP | Code |
|------|------|------|
| Invalid weekStart (not Monday) | 400 | `VALIDATION_ERROR` |
| Invalid date format | 400 | `VALIDATION_ERROR` |
| Range too large | 400 | `RANGE_TOO_LARGE` |

---

## 14. Validation Rules

| Param | Rule |
|-------|------|
| `date` | `YYYY-MM-DD` |
| `weekStart` | `YYYY-MM-DD`, must be Monday |
| `from`, `to` | `to >= from`, max 93 days |
| Admin `userId` | required, non-empty string |

---

## Response Examples

### Daily (employee `GET /api/summaries/daily`)

```json
{
  "data": {
    "userId": "uid123",
    "date": "2026-06-01",
    "totalRegularHours": 8,
    "totalOvertimeHours": 1.5,
    "totalNightDifferentialHours": 0,
    "totalLateMinutes": 15,
    "totalUndertimeMinutes": 0
  }
}
```

If no closed attendance for that date: `{ "data": null }`.

### Weekly

```json
{
  "weekStart": "2026-06-01",
  "weekEnd": "2026-06-07",
  "days": [
    { "date": "2026-06-01", "totalRegularHours": 8, "totalOvertimeHours": 1.5, "totalLateMinutes": 15, "totalUndertimeMinutes": 0, "totalNightDifferentialHours": 0 },
    { "date": "2026-06-02", "totalRegularHours": 0, "totalOvertimeHours": 0, "totalLateMinutes": 0, "totalUndertimeMinutes": 0, "totalNightDifferentialHours": 0 }
  ],
  "totals": {
    "totalRegularHours": 40,
    "totalOvertimeHours": 5,
    "totalNightDifferentialHours": 0,
    "totalLateMinutes": 30,
    "totalUndertimeMinutes": 0
  }
}
```

---

## Related Documents

- `04-firestore-schema.md`
- `07-computation-engine.md`
- `10-dashboard-ui.md`
- `11-api-routes.md`
