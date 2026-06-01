# 10 — Dashboard UI

## 1. Purpose

Specify **employee and admin dashboard layouts**, Recharts usage, Tailwind patterns, and data binding to summary/attendance APIs.

---

## 2. Responsibilities

| Screen | Responsibility |
|--------|----------------|
| Employee dashboard | Today status, metrics, week chart, quick links |
| Admin dashboard | KPIs, today attendance table, OT chart, exceptions |
| Punch page | Punch in/out actions |
| History page | Past attendance list |
| Reports page (admin) | Date/week pickers, tables |

---

## 3. Architecture Decisions

### AD-01: Tailwind-only styling

No CSS-in-JS libraries. Utility classes in components.

### AD-02: Recharts for analytics only

Bar/line charts per approved stack. No Chart.js, D3 direct.

### AD-03: Container/presentational split

Pages fetch via hooks/API modules; chart components receive props.

### AD-04: Responsive mobile-first

Sidebar collapses on small screens.

---

## 4. Folder / File Responsibilities

| File | Role |
|------|------|
| `pages/employee/DashboardPage.jsx` | Employee dashboard |
| `pages/admin/AdminDashboardPage.jsx` | Admin dashboard (or under Reports) |
| `components/ui/StatCard.jsx` | KPI cards |
| `components/ui/DataTable.jsx` | Tabular data |
| `components/charts/WeeklyHoursChart.jsx` | Recharts bar chart |
| `api/summary.api.js`, `api/attendance.api.js` | Data fetching |

---

## 5. Business Rules

- Display times in `users.timezone` (from profile).
- Hours: show decimal or `H:MM` via `format.js` (consistent app-wide).
- Late/undertime: always show in **minutes**.
- OT/Regular/ND: show in **hours**.
- Empty states when no `dailySummary` for date.

---

## 6. Data Flow

```
DashboardPage mount
  → GET /api/attendance/today
  → GET /api/summaries/daily?date=today
  → GET /api/summaries/weekly?weekStart=currentMonday
  → render StatCards + WeeklyHoursChart + status banner
```

```
AdminDashboardPage mount
  → GET /api/admin/dashboard/kpis?date=today
  → GET /api/admin/users?limit=100              ← all employees
  → GET /api/admin/attendance?date=today        ← punch rows for today only
  → client merge → table rows: absent | open | closed per employee
  → GET /api/admin/reports/exceptions?from=weekStart&to=today
```

There is **no** `attendance-today` endpoint. See `09-admin-system.md` AD-05 for merge rules.

---

## 7. Firestore Usage

**None on client for MVP.** All dashboard data via Express API.

---

## 8. API Behavior

| Widget | Endpoint |
|--------|----------|
| Today punch status | `GET /api/attendance/today` |
| Today totals | `GET /api/summaries/daily?date=` |
| Week chart | `GET /api/summaries/weekly?weekStart=` |
| Admin KPIs | `GET /api/admin/dashboard/kpis?date=` |
| Admin today table | `GET /api/admin/attendance?date=` (includes `fullName`, `email`, `status`) |

---

## 9. Security Considerations

- Admin dashboard routes behind `AdminRoute`.
- Do not render admin components based on client-only role without server verification on each API call.

---

## 10. Scalability Considerations

- `React.lazy` for admin routes and Recharts.
- `useMemo` for chart data arrays.
- Limit table rows with server pagination when employee count grows.

---

## 11. Reusable Utilities / Services

| Component/Util | Use |
|----------------|-----|
| `StatCard` | `{ label, value, subtext }` |
| `WeeklyHoursChart` | `{ days: [{ date, totalRegularHours, totalOvertimeHours }] }` |
| `formatHours(h)` | `8.5 → "8h 30m"` |
| `formatMinutes(m)` | `15 → "15m"` |
| `useAuth()` | Role, profile |

---

## 12. Best Practices

- Loading skeletons while fetching.
- Toast on API errors (Axios interceptor).
- Refetch summaries after punch out.
- Accessible: `aria-label` on punch buttons, chart titles as headings.

---

## 13. Error Handling Expectations

| UI state | Behavior |
|----------|----------|
| 401 | Redirect to login |
| 403 on admin | Show "Access denied" |
| Network error | Toast + retry button |
| Empty data | `EmptyState` component |

---

## 14. Validation Rules

Client-side date pickers:

- Cannot select future dates for reports (optional toggle for admin).
- Week picker snaps to Monday.

---

## Chart Specifications

### Employee — Weekly Hours (BarChart)

| Prop | Source field |
|------|----------------|
| X axis | `date` (formatted Mon, Tue, …) |
| Bar 1 | `totalRegularHours` |
| Bar 2 | `totalOvertimeHours` (stacked optional) |

### Admin — OT by day (LineChart or BarChart)

| Prop | Source |
|------|--------|
| X | date |
| Y | sum of `totalOvertimeHours` across team (from admin report API) |

---

## Layout Wireframe

```
┌─────────────────────────────────────────┐
│ Navbar (logo, user, logout)             │
├──────────┬──────────────────────────────┤
│ Sidebar  │  [StatCard] [StatCard] [Stat] │
│ (admin)  │  ┌──────────────────────────┐  │
│          │  │ WeeklyHoursChart         │  │
│          │  └──────────────────────────┘  │
│          │  ┌──────────────────────────┐  │
│          │  │ DataTable (history)      │  │
│          │  └──────────────────────────┘  │
└──────────┴──────────────────────────────┘
```

---

## Tailwind Tokens (tailwind.config.js)

```javascript
colors: {
  primary: { DEFAULT: '#2563eb' },
  success: '#16a34a',
  danger: '#dc2626',
}
```

---

## Frontend routes (canonical)

| Path | Page | Guard |
|------|------|-------|
| `/login` | LoginPage | Public |
| `/register` | RegisterPage | Public |
| `/dashboard` | DashboardPage | Protected |
| `/punch` | PunchPage | Protected |
| `/history` | HistoryPage | Protected |
| `/admin/dashboard` | AdminDashboardPage | Admin |
| `/admin/employees` | EmployeesPage | Admin |
| `/admin/attendance/:userId` | AttendanceEditPage | Admin |
| `/admin/reports` | ReportsPage | Admin |

---

## Related Documents

- `08-daily-summary.md`
- `09-admin-system.md`
- `11-api-routes.md`
- `02-tech-stack.md`
