# 05 — Auth System

## 1. Purpose

Specify **authentication flows, role-based access control (RBAC), protected routes, and token handling** using Firebase Authentication (client) and Express middleware (server).

---

## 2. Responsibilities

| Component | Responsibility |
|-----------|----------------|
| Firebase Auth | Email/password register, login, logout, ID tokens |
| `AuthContext` (client) | Auth state, profile, role helpers |
| `auth.middleware.js` | Verify Bearer token on every protected API call |
| `role.middleware.js` | Enforce `admin` role |
| `auth.service.js` | Create `users` document on register |
| Firestore `users` | Source of truth for `role`, `fullName`, `schedule` |

---

## 3. Architecture Decisions

### AD-01: Client signs in; server authorizes

Client uses Firebase Auth SDK. Server never stores passwords.

### AD-02: Profile creation via API only

After Firebase `createUserWithEmailAndPassword`, client calls `POST /api/auth/register` to create `users/{uid}`. Client cannot write `users` in Firestore directly.

### AD-03: Role from Firestore

`req.user` loaded from `users/{uid}` on **every** authenticated request (Firestore read once per HTTP request). Do not trust client-sent role. Do not use Firebase custom claims in MVP.

### AD-04: Default role on register

New users receive `role: "employee"` and default `schedule: { start: "09:00", end: "18:00" }`, `timezone: "Asia/Manila"` (or org default from env).

### AD-05: Stateless API

No session cookies; `Authorization: Bearer <Firebase ID token>`.

### AD-06: Public registration flag

When `ALLOW_PUBLIC_REGISTER=false`, `POST /api/auth/register` returns **403** `FORBIDDEN` (only pre-provisioned users may complete profile via admin-created Auth accounts — future script; MVP may keep `true`).

---

## 4. Folder / File Responsibilities

| File | Role |
|------|------|
| `client/src/config/firebase.js` | Initialize Firebase app + auth |
| `client/src/contexts/AuthContext.jsx` | `onAuthStateChanged`, profile fetch |
| `client/src/components/layout/ProtectedRoute.jsx` | Redirect unauthenticated users |
| `client/src/components/layout/AdminRoute.jsx` | Block non-admin |
| `client/src/pages/auth/LoginPage.jsx` | Login form (RHF + Zod) |
| `client/src/pages/auth/RegisterPage.jsx` | Register form |
| `client/src/api/auth.api.js` | `register`, `getMe` |
| `server/src/middleware/auth.middleware.js` | `verifyIdToken` |
| `server/src/middleware/role.middleware.js` | `requireAdmin` |
| `server/src/services/auth.service.js` | Register profile logic |
| `server/src/repositories/users.repository.js` | CRUD `users` |

---

## 5. Business Rules

- Only **admin** can change another user's `role`.
- Inactive/deleted users: MVP uses manual process; optional `isActive` field requires schema doc update before use.
- Logout clears client auth state only; no server session to destroy.

---

## 6. Data Flow

### Register

```
1. Client: createUserWithEmailAndPassword(email, password)
2. Client: POST /api/auth/register { fullName } with Bearer token (email from verified token, not body)
3. Server: verify token → create users/{uid} (respect `ALLOW_PUBLIC_REGISTER`)
4. Client: GET /api/auth/me → store profile in AuthContext
```

### Login

```
1. Client: signInWithEmailAndPassword
2. Client: GET /api/auth/me
   - If `404 PROFILE_NOT_FOUND`: redirect to complete registration (call register) or show error
3. Client: navigate to /dashboard
```

### Protected API call

```
1. Client: getIdToken() → Authorization header
2. Server: verifyIdToken → attach req.user { uid, email, role, ... }
3. Controller executes
```

---

## 7. Firestore Usage

**Collection:** `users` only for auth profile.

| Operation | Who |
|-----------|-----|
| Create on register | Server (`auth.service`) |
| Read own profile | Server `/api/auth/me` only (no client Firestore read in MVP) |
| Update profile | Server (`PATCH` admin or future profile endpoint) |
| Role change | Server admin API only |

---

## 8. API Behavior

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | Bearer (new user) | Create `users` doc |
| GET | `/api/auth/me` | Yes | Return current user |
| POST | `/api/auth/logout` | Yes | Optional audit stub (204) |

See `11-api-routes.md` for request/response bodies.

---

## 9. Security Considerations

- Verify token on **every** protected route.
- Rate-limit `/api/auth/*` (e.g. 20 requests / 15 min / IP).
- Generic login error message: "Invalid email or password."
- Never return whether email exists in different endpoints.
- Admin promotion: `PATCH /api/admin/users/:uid/role` only.

---

## 10. Scalability Considerations

- `getMe` is one Firestore read per session start; cache profile in `AuthContext`.
- Bulk user import: Admin SDK script (future), not MVP UI.

---

## 11. Reusable Utilities / Services

| Utility | Location |
|---------|----------|
| `getAuthHeaders()` | `client/src/api/axios.js` interceptor |
| `verifyToken(token)` | `auth.middleware.js` |
| `loadUserProfile(uid)` | `users.repository.js` |

---

## 12. Best Practices

- Refresh profile after admin changes role (call `getMe` again).
- Wrap app in `AuthProvider` at root.
- Show loading spinner while `authLoading === true` on protected routes.

---

## 13. Error Handling Expectations

| Case | HTTP | Code |
|------|------|------|
| Missing token | 401 | `UNAUTHORIZED` |
| Invalid/expired token | 401 | `UNAUTHORIZED` |
| Profile already exists on register | 409 | `PROFILE_EXISTS` |
| Auth OK but no `users` doc on `/me` | 404 | `PROFILE_NOT_FOUND` |
| Non-admin on admin route | 403 | `FORBIDDEN` |
| Register when public sign-up disabled | 403 | `FORBIDDEN` |

Firebase client errors: map `auth/wrong-password` to user-friendly message without leaking details.

---

## 14. Validation Rules

### Register body (Zod)

| Field | Rule |
|-------|------|
| `fullName` | string, min 2, max 100 |
| `email` | Handled by Firebase on client form |
| `password` | min 8 chars (client + Firebase policy) |

### Firestore `users` on create

| Field | Default |
|-------|---------|
| `role` | `"employee"` |
| `timezone` | `process.env.DEFAULT_TIMEZONE` or `"Asia/Manila"` |
| `schedule.start` | `"09:00"` |
| `schedule.end` | `"18:00"` |
| `createdAt` | server timestamp |

---

## Frontend Route Protection

| Route | Guard |
|-------|-------|
| `/login`, `/register` | Public |
| `/dashboard`, `/punch`, `/history` | `ProtectedRoute` |
| `/admin/*` | `ProtectedRoute` + `AdminRoute` |

---

## Related Documents

- `04-firestore-schema.md`
- `09-admin-system.md`
- `11-api-routes.md`
- `12-security-rules.md`
