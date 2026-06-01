# Testing — Mini HCM

Automated tests use **Node.js built-in test runner** (`node:test`) and **no paid services**. Firebase and Firestore are replaced with an in-memory mock during API tests.

## Run tests

From the repository root:

```bash
npm test
```

Or from `server/`:

```bash
npm test
```

Run everything including client production build:

```bash
npm run test:all
```

## What runs

| Suite | File | Covers |
|-------|------|--------|
| Computation (docs examples) | `server/src/__tests__/computation.engine.test.js` | Engine scenarios A–D, cross-midnight |
| Computation checklist | `server/src/__tests__/computation.checklist.test.js` | OT, late, undertime, night differential |
| Feature / API | `server/src/__tests__/hcm.features.test.js` | Auth, attendance, admin RBAC, daily summary |

## Feature checklist mapping

### AUTH
- Registration → `POST /api/auth/register` with mock token `new-user-001`
- Login → `GET /api/auth/me` with valid Bearer token
- Invalid login → `401 UNAUTHORIZED` for bad token

### ATTENDANCE
- Punch in / out → `POST /api/attendance/punch-in|punch-out`
- Duplicate punch in → `409 ALREADY_PUNCHED_IN`
- Punch out without open row → `409 NO_OPEN_ATTENDANCE`

### COMPUTATION
- Pure unit tests on `computation.engine.js` (no HTTP)

### DAILY SUMMARY
- Admin creates closed day with known times → employee `GET /api/summaries/daily` matches totals

### ADMIN
- Admin → `GET /api/admin/users` → `200`
- Employee → same route → `403 FORBIDDEN`

## Logs

Passing integration cases print lines like:

```text
✓ PASS: punch in works
```

Failures show Node’s usual assertion output with file and line.

## Requirements

- **Node.js 20+**
- **No** running dev server required
- **No** Firebase project or emulator required for `npm test`

Optional: copy `server/.env` only if you add future live integration scripts; the default suite does not use it.

## Helpers

| Path | Role |
|------|------|
| `server/src/__tests__/helpers/testEnv.js` | Sets `NODE_ENV=test` and generates a throwaway RSA key |
| `server/src/__tests__/helpers/memoryFirestore.js` | In-memory Firestore + `verifyIdToken` mock |
| `server/src/__tests__/helpers/testHarness.js` | Boots Express on random port with mocks |

## Extending tests

1. Add cases to `hcm.features.test.js` or new `*.test.js` under `server/src/__tests__/`.
2. Seed extra users in `testHarness.js` via `memory.db.seed(...)`.
3. Issue tokens with `harness.bearer('uid')` (maps to `token-{uid}`).

Tests set `globalThis.__MINI_HCM_TEST_MOCK__` before loading the Express app (see `firebaseAdmin.js`). Keep `--test-concurrency=1` so integration tests do not clash.
