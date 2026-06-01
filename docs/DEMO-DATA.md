# Demo data (Firebase)

Populate your **real** Firebase project with demo users and attendance — no manual registration or punch-in required.

## Prerequisites

1. `server/.env` configured with Firebase Admin credentials (same as local dev).
2. **Email/Password** enabled in Firebase Console → Authentication → Sign-in method.
3. Firestore rules and indexes deployed: `npm run deploy:firestore`

## Seed demo data

From the project root:

```bash
npm run seed:demo
```

Options:

| Flag | Description |
|------|-------------|
| `--days=14` | Number of calendar days to seed (3–93, default 14) |
| `--seed=42` | Random seed for schedules/times (reproducible) |
| `--reset` | Delete demo Auth users + their Firestore data, then re-seed |
| `--dry-run` | Print plan only; no writes |

Example:

```bash
npm run seed:demo -- --days=21 --reset
```

## Demo login accounts

All accounts use the same password: **`password`**

| Role | Email |
|------|--------|
| Admin | `admin@demo.test` |
| Employee | `employee1@demo.test` |
| Employee | `employee2@demo.test` |
| Employee | `employee3@demo.test` |
| Employee | `employee4@demo.test` |
| Employee | `employee5@demo.test` |
| Employee | `employee6@demo.test` |
| Employee | `employee7@demo.test` |
| Employee | `employee8@demo.test` |
| Employee | `employee9@demo.test` |
| Employee | `employee10@demo.test` |

Log in at your client URL (e.g. http://localhost:5173/login).

## What gets created

- **Firebase Auth** users (email/password, verified for demo).
- **`users`** profiles with shifts and `Asia/Manila` (or your `DEFAULT_TIMEZONE`).
- **`attendance`** + **`dailySummary`** for each employee across the date range (with real computation: regular, OT, ND, late, undertime).

Your personal account (e.g. from normal registration) is **not** modified unless it uses the same `@demo.test` email.

## In-memory simulation (no Firebase)

For automated checks without touching Firebase:

```bash
npm run simulate
```

See [SIMULATION.md](./SIMULATION.md).

## Promote your own account to admin

If you also want your real login as admin:

```bash
npm run seed:admin -- --uid=YOUR_FIREBASE_AUTH_UID
```

Then log out and log back in.
