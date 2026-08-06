# Checklist 02 — Authentication & RBAC

Implement full JWT auth with httpOnly cookies, role-based access control, and multi-tenant org scoping.

---

## A. Express API — Auth Endpoints

- [x] `POST /api/v1/auth/register` — hash password (bcryptjs), create `User`, issue access + refresh tokens
  - Zod validate: email, password (min 8), role (`hr` | `candidate`), org_name (if hr)
  - If role = `hr`: create `Organization` record, link `user.org_id`
  - Set httpOnly cookie `access_token` (1h) and `refresh_token` (7d)
  - Response: `ApiEnvelope<{ user: UserPublic }>`

- [x] `POST /api/v1/auth/login` — verify email + bcrypt hash, issue tokens
  - Lookup `User` by email, compare hash
  - Re-issue both cookies on success
  - Response: `ApiEnvelope<{ user: UserPublic, role: string }>`

- [x] `POST /api/v1/auth/logout` — clear both cookies
- [x] `POST /api/v1/auth/refresh` — validate refresh token cookie, rotate + re-issue both tokens
- [x] `GET /api/v1/auth/me` — return authenticated user from JWT (no DB hit unless profile needed)
- [x] `POST /api/v1/auth/forgot-password` — generate reset token, store hash+expiry on `User`, send email
- [x] `POST /api/v1/auth/reset-password` — validate token, hash new password, clear token fields
- [x] `PATCH /api/v1/auth/change-password` — verify current password, set new hash (authenticated)

---

## B. Express Middleware — Auth, RBAC, OrgScope

- [x] `authenticate` middleware:
  - Extract `access_token` from httpOnly cookie
  - Verify JWT signature with `JWT_SECRET`
  - Attach `req.user = { id, role, org_id }` to request
  - Return 401 on missing/expired token

- [x] `requireRole(role: 'hr' | 'candidate')` middleware:
  - Check `req.user.role === role`
  - Return 403 if mismatch

- [x] `requireOrgScope` middleware (applied to all `/hr/*` routes):
  - Assert `req.user.org_id` is non-null (from JWT)
  - Attach `req.orgId = req.user.org_id` to request
  - NEVER read `org_id` from `req.body` or `req.query`

- [x] `requireInternalSecret` middleware (applied to all `/internal/*` routes):
  - Validate `X-Internal-Service-Secret` header matches env var
  - Return 403 on missing/wrong secret

---

## C. Next.js Frontend — Auth Flow

- [x] `apps/web/src/lib/api.ts` — add `credentials: 'include'` to all fetch calls (send cookies)
- [x] `apps/web/src/contexts/AuthContext.tsx` — create context: `user`, `login()`, `logout()`, `register()`
- [x] `apps/web/src/hooks/useAuth.ts` — wrap AuthContext, expose typed helpers
- [x] `apps/web/src/middleware.ts` — Next.js edge middleware: redirect unauthenticated users from `/hr/*` and `/candidate/*`; redirect authenticated users away from `/login`, `/signup`
- [x] `apps/web/src/app/(auth)/login/page.tsx` — wire `POST /api/v1/auth/login`, handle errors, redirect by role
- [x] `apps/web/src/app/(auth)/signup/page.tsx` — wire `POST /api/v1/auth/register`, handle org creation for HR
- [x] `apps/web/src/app/(auth)/forgot-password/page.tsx` — wire `POST /api/v1/auth/forgot-password`
- [x] `apps/web/src/app/(auth)/reset-password/[token]/page.tsx` — wire `POST /api/v1/auth/reset-password`
- [x] HR layout guard — verify `role === 'hr'` from `GET /api/v1/auth/me`, else redirect
- [x] Candidate layout guard — verify `role === 'candidate'` from `GET /api/v1/auth/me`, else redirect

---

## D. Onboarding Flows (post-registration)

- [x] `POST /api/v1/organizations` — HR: complete org profile (name, logo, size, industry)
- [x] `POST /api/v1/candidate/profile` — Candidate: create `CandidateProfile` (skills, resume upload, target role)
- [x] `apps/web/src/app/onboarding/company/page.tsx` — wire org creation form to API
- [x] `apps/web/src/app/onboarding/candidate/page.tsx` — wire candidate profile creation; resume PDF upload to S3
- [x] `apps/web/src/app/hr/onboarding/page.tsx` — wire org setup wizard to API

---

## E. Token Refresh Strategy

- [x] Configure Axios interceptor (or fetch wrapper) to auto-retry on 401 by calling `/auth/refresh`
- [x] On refresh failure (refresh token expired): redirect to `/login`
- [x] Prevent infinite retry loop (max 1 retry per request)

---

## F. Security Hardening

- [x] Confirm `SameSite=Strict` and `Secure` flags on all auth cookies (in prod)
- [x] Rate-limit `POST /auth/login` and `POST /auth/register` (express-rate-limit, max 10/min per IP)
- [x] Rate-limit `POST /auth/forgot-password` (max 3/hr per email)
- [x] Confirm `org_id` is NEVER accepted from request body on any HR route (grep audit)

---

## Done When

- New user can register as `hr` or `candidate` and be redirected to correct portal
- Login issues httpOnly cookies; browser cannot read token value via `document.cookie`
- HR routes return 403 for `candidate` role; vice versa
- `/api/v1/internal/*` routes return 403 without `X-Internal-Service-Secret` header
- Token refresh works transparently without user seeing a logout
- Password reset email is received and new password is accepted
