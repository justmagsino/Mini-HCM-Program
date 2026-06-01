# 14 — Coding Standards

## 1. Purpose

Enforce **consistent, readable, maintainable code** across `client/` and `server/` aligned with approved stack and service-layer architecture.

---

## 2. Responsibilities

| Standard | Applies to |
|----------|------------|
| Formatting | All JS/JSX files |
| Linting | ESLint |
| Architecture | routes → controllers → services → repositories |
| Naming | Files, variables, Firestore fields |
| Testing | computation engine (required) |

---

## 3. Architecture Decisions

### AD-01: No business logic in React pages

Pages call hooks/API; logic in services (server) or hooks (client).

### AD-02: No Firestore in controllers

Controllers call services only.

### AD-03: No duplicate computation on client for persistence

Display formatting only.

### AD-04: ES modules

`import`/`export` in both packages.

---

## 4. Folder / File Responsibilities

See `03-folder-structure.md`. Max file length guideline: **400 lines** — split if exceeded.

---

## 5. Business Rules

- Use Firestore field names exactly: `fullName`, `timeIn`, `regularHours`, `totalRegularHours`.
- Default schedule in code must match docs: `09:00`–`18:00`.
- Date/time: use `utils/dates.js` with **Intl** only — no `date-fns` / `luxon` (`02-tech-stack.md`).
- Error codes must match `01-project-overview.md` / `11-api-routes.md`.

---

## 6. Data Flow

Match documented flow; no shortcut imports (e.g. controller → repository).

---

## 7. Firestore Usage

- Repositories only touch allowed collections.
- Use `serverTimestamp()` for `createdAt` on create.
- Batch writes when updating `attendance` + `dailySummary`.

---

## 8. API Behavior

- Controllers return proper HTTP status from `AppError.statusCode`.
- Validate with Zod before service layer.
- Serialize Firestore timestamps to ISO 8601 strings before `res.json()` (`11-api-routes.md` AD-07).

---

## 9. Security Considerations

- Never commit secrets.
- Never `console.log` tokens.
- Use `.strict()` Zod schemas on API inputs.

---

## 10. Scalability Considerations

- Avoid N+1 Firestore reads in loops; batch get where possible.
- Lazy-load admin routes in React.

---

## 11. Reusable Utilities / Services

| Pattern | Example |
|---------|---------|
| `AppError` | `throw new AppError(409, 'ALREADY_PUNCHED_IN', '...')` |
| `asyncHandler` | Wrap async controllers |
| `formatHours` | Client display |

---

## 12. Best Practices

- Prettier on save.
- Conventional Commits: `feat(attendance): add punch-out`.
- PR references doc section implemented.
- Remove dead code in same PR.

---

## 13. Error Handling Expectations

### Server

```javascript
export async function punchIn(req, res, next) {
  try {
    const result = await attendanceService.punchIn(req.user.uid);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}
```

### Client

- Axios interceptor: handle 401, show toast on 4xx/5xx.

---

## 14. Validation Rules

- Mirror Zod schemas between client forms and server (`fullName`, `reason`, dates).
- Password min 8 on register form.

---

## Style Guide

| Item | Rule |
|------|------|
| Indent | 2 spaces |
| Quotes | Single |
| Semicolons | Yes (Prettier) |
| Components | PascalCase, one per file |
| Functions | camelCase |
| Constants | SCREAMING_SNAKE |
| React | Functional components + hooks only |

---

## Forbidden Patterns

| Pattern | Reason |
|---------|--------|
| Redux, MobX | Not in stack |
| Client Firestore writes | Security |
| `displayName` instead of `fullName` | Schema mismatch |
| GraphQL | Not in stack |
| Placeholder `TODO` in production paths | Incomplete features |

---

## Testing Requirements

| Module | Minimum tests |
|--------|----------------|
| `computation.engine.js` | All examples in `07-computation-engine.md` |
| Auth middleware | Invalid token → 401 (integration) |
| Punch flow | Supertest happy path (integration) |

---

## ESLint Scripts (when initialized)

```json
{
  "scripts": {
    "lint": "eslint src --max-warnings 0",
    "format": "prettier --write \"src/**/*.{js,jsx}\""
  }
}
```

---

## Related Documents

- `03-folder-structure.md`
- `07-computation-engine.md`
- `15-development-workflow.md`
