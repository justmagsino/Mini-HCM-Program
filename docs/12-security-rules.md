# 12 — Security Rules

## 1. Purpose

Define **Firestore Security Rules, API security controls, secrets handling, and threat mitigations** for defense in depth.

---

## 2. Responsibilities

| Layer | Responsibility |
|-------|----------------|
| Firebase Auth | Identity (email/password) |
| Express + Admin SDK | **All** reads and writes to `users`, `attendance`, `dailySummary` in MVP |
| Firestore rules | Deny client SDK access to business data |
| Hosting HTTPS | Transport encryption |
| CORS / Helmet / rate limit | API hardening |

---

## 3. Architecture Decisions

### AD-01: API-only data access (MVP)

The React app uses **Firebase Auth SDK only**. It does **not** import `firebase/firestore` for MVP.

All profile, attendance, and summary data flows through Express with a verified ID token.

### AD-02: Deny all client Firestore access to business collections

```javascript
match /users/{userId} {
  allow read, write: if false;
}
match /attendance/{docId} {
  allow read, write: if false;
}
match /dailySummary/{docId} {
  allow read, write: if false;
}
```

Optional later: allow `read` on own `users` doc — requires doc update and README note.

### AD-03: No custom claims in MVP

`requireAdmin` loads `role` from Firestore `users` via Admin SDK on each request (cached per request in memory). Do not depend on `request.auth.token.role` in rules or middleware.

### AD-04: Role from Firestore only

Never accept `role` from request body except on `PATCH /api/admin/users/:uid/role` by an admin.

---

## 4. Folder / File Responsibilities

| File | Role |
|------|------|
| `firestore.rules` (repo root) | Deployed rules |
| `server/src/middleware/auth.middleware.js` | Verify token, attach `req.user` |
| `server/src/middleware/role.middleware.js` | Admin check |
| `server/src/app.js` | helmet, cors, rateLimit |

---

## 5. Business Rules

- Employees cannot set `regularHours`, `timeIn`, or `role` via API (strict schemas).
- Punch times are server-authoritative on punch in/out.
- Admin edits require `reason` (logged; no audit collection in MVP).

---

## 6. Data Flow

```
Client → Firebase Auth (login)
Client → Express API (Bearer) → Admin SDK → Firestore
Client ✗ Firestore (blocked by rules + no SDK usage)
```

---

## 7. Firestore Usage

### Canonical `firestore.rules` (MVP)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if false;
    }
    match /attendance/{docId} {
      allow read, write: if false;
    }
    match /dailySummary/{docId} {
      allow read, write: if false;
    }
  }
}
```

Deploy: `firebase deploy --only firestore:rules`

---

## 8. API Behavior

| Control | Setting |
|---------|---------|
| CORS | `origin: process.env.CORS_ORIGIN` |
| General rate limit | 100 req / 15 min / IP |
| Auth routes | 20 req / 15 min / IP |
| Punch routes | 10 req / 1 min / uid |
| Admin writes | 30 req / 15 min / uid |
| Body size | `100kb` |
| Headers | `helmet()` defaults |

---

## 9. Security Considerations

| Threat | Mitigation |
|--------|------------|
| Role escalation | No client Firestore; strict Zod |
| Time theft | Server timestamps on punch |
| IDOR | Services compare `req.user.uid` to resource `userId` |
| Token theft | HTTPS; short-lived Firebase tokens |
| Mass assignment | Zod `.strict()` strips unknown keys |
| Secret leak | Env vars only; `.gitignore` |

---

## 10. Scalability Considerations

- Firebase App Check (phase 2).
- Structured logs without PII (use `uid` only in debug).

---

## 11. Reusable Utilities / Services

| Utility | Purpose |
|---------|---------|
| `verifyIdToken` | Auth middleware |
| `requireAdmin` | Firestore `users.role` check |
| `AppError` | Safe client-facing codes |

---

## 12. Best Practices

- Separate Firebase projects for dev/prod.
- Rotate service account if leaked.
- Run pre-launch checklist before go-live.

---

## 13. Error Handling Expectations

- Production `500`: `{ "code": "INTERNAL_ERROR", "message": "Something went wrong" }` — no stack trace.
- Log full errors server-side only.

---

## 14. Validation Rules

Reject bodies containing any of: `role`, `regularHours`, `overtimeHours`, `nightDifferentialHours`, `lateMinutes`, `undertimeMinutes`, `totalRegularHours`, … on employee routes.

Admin role change: only `{ "role" }` allowed on role endpoint.

---

## Pre-Launch Checklist

- [ ] `firestore.rules` deployed (deny all client access)
- [ ] Client bundle has no `firebase/firestore` import
- [ ] Service account not in git
- [ ] CORS production origin set
- [ ] First admin bootstrapped via secure process (`13-deployment.md`)
- [ ] HTTPS on Hosting and API
- [ ] Default Firestore rules are not left open

---

## Related Documents

- `05-auth-system.md`
- `11-api-routes.md`
- `13-deployment.md`
