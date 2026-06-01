# HCM usage simulation

Script: `scripts/simulate-hcm.mjs`

Simulates realistic usage for **5 employees** and **1 admin** over **3–5 weekdays** with random shifts, punch times, and absences. Data is written to an **in-memory Firestore** (same mock as automated tests) and verified against the real computation engine.

## Run

```bash
npm run simulate
```

Options:

```bash
npm run simulate -- --days=4 --seed=42
```

| Flag | Default | Description |
|------|---------|-------------|
| `--days=` | `5` | `3`, `4`, or `5` calendar days |
| `--seed=` | current time | PRNG seed for reproducible runs |

## What it simulates

1. **Register** — `auth.service.registerProfile` for each user (mock Firebase Auth token).
2. **Random schedules** — per employee (`07:30–17:00` style, varies).
3. **Login** — `getProfileByUid` after register (profile load).
4. **Admin** — sixth user promoted to `admin` role.
5. **Attendance** — ~12% absent days; random punch in/out around shift; writes `attendance` + `dailySummary` via `closeAttendanceWithSummary` (same path as punch-out).
6. **Verify** — document counts, IDs, recomputed metrics vs stored attendance, summary totals vs engine.

## Verification checks

- 6 `users` documents (5 employees + 1 admin)
- `attendance` count = number of simulated sessions
- `dailySummary` count = same (one per closed day)
- Each session: `regularHours`, OT, ND, late, undertime match `computeAttendanceMetrics`
- `dailySummary` mirrors attendance metrics
- Admin `listUsers({ role: 'employee' })` returns 5

## Sample output

See [simulation-sample-output.txt](../scripts/simulation-sample-output.txt) (generated with `--seed=42 --days=5`).

## Live Firebase (optional)

This script does **not** write to your real Firebase project. For production-like data:

1. Run the app locally with `server/.env` configured.
2. Register users in the UI or use Firebase Console.
3. Use admin tools to backfill days.

A future `--live` flag could call `http://localhost:3001` with real Auth tokens; not required for verification today.

## Related

- [TESTING.md](./TESTING.md) — `npm test` API feature suite
- [07-computation-engine.md](./07-computation-engine.md) — metric formulas
