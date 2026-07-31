# 🚀 Phase 4: Authentication & Authorization System - Execution Prompts

**Instructions:** Copy and paste each prompt below into the chat **one at a time**. Wait for the AI to provide the complete response and for you to verify the output in your terminal/VS Code before pasting the next prompt. 
*Critical Note: Auth code is verbose. If the AI stops generating mid-file, reply with "Continue exactly where you left off" until the file is 100% complete. Never accept partial code or "// TODO" placeholders.*

---

## Sub-Phase 4.1: Implement User Model & Update DAO for Auth
**Prompt:**
> Execute Phase 4, Sub-phase 4.1: Update the existing `server/src/repositories/UserRepo.ts` and `shared/types/index.ts` to fully support authentication needs. Ensure the `User` interface includes `password_hash`, `phone`, and `status`. Verify that `findByEmail` and `findByPhone` methods are optimized and that the `create` method properly handles nullable password hashes for OTP/OAuth users. Strictly follow the engineering protocol: provide exact ready-to-run terminal syntax (if any updates are needed), complete production-ready TypeScript code files with detailed inline comments explaining their systemic role, a line-by-line mechanical breakdown, expected output, common edge-case failures (e.g., missing indexes on email/phone, null pointer exceptions on nullable fields) with fixes, and precise verification steps. Do not proceed until I confirm.

---

## Sub-Phase 4.2: Implement JWT Auth Middleware (Dual-Token Architecture)
**Prompt:**
> Execute Phase 4, Sub-phase 4.2: Implement the JWT authentication middleware in `server/src/middleware/auth.middleware.ts`. It must support a dual-token architecture: a short-lived Access Token (verified via `Authorization` header) and a long-lived Refresh Token (stored in an `httpOnly`, `secure`, `sameSite='strict'` cookie). Use `jsonwebtoken` and `cookie-parser`. Include token generation, validation, and rotation logic. Strictly follow the engineering protocol: provide exact ready-to-run terminal syntax (including `npm install jsonwebtoken cookie-parser`), complete production-ready code files with detailed inline comments, a line-by-line mechanical breakdown of the token lifecycle, expected output, common edge-case failures (e.g., refresh token reuse attacks, missing cookie parsing) with fixes, and precise verification steps. Do not proceed until I confirm.

---

## Sub-Phase 4.3: Implement Role-Based Access Control (RBAC) Middleware
**Prompt:**
> Execute Phase 4, Sub-phase 4.3: Implement the Role-Based Access Control (RBAC) middleware in `server/src/middleware/rbac.middleware.ts`. It must protect routes by verifying the user's role (from the JWT payload) against an allowed list of roles (e.g., `['SUPER_ADMIN', 'TEAM_LEAD']`) and optionally verify team membership. Strictly follow the engineering protocol: provide exact ready-to-run terminal syntax, complete production-ready code files with detailed inline comments, a line-by-line mechanical breakdown of the permission checking logic, expected output, common edge-case failures (e.g., privilege escalation via token tampering, missing role checks) with fixes, and precise verification steps. Do not proceed until I confirm.

---

## Sub-Phase 4.4: Implement Email/Password Registration & Login Endpoints
**Prompt:**
> Execute Phase 4, Sub-phase 4.4: Implement the core Auth Controller (`server/src/controllers/auth.controller.ts`) and Routes (`server/src/routes/auth.routes.ts`) for Email/Password registration and login. Endpoints must include: `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, and `POST /auth/refresh`. Ensure passwords are hashed using `bcrypt` before storage and compared using `bcrypt.compare` during login. Strictly follow the engineering protocol: provide exact ready-to-run terminal syntax (including `npm install bcrypt`), complete production-ready code files with detailed inline comments, a line-by-line mechanical breakdown, expected output, common edge-case failures (e.g., timing attacks on login, weak password validation, duplicate email handling) with fixes, and precise verification steps. Do not proceed until I confirm.

---

## Sub-Phase 4.5: Implement Mock OTP System (Email + SMS Simulation)
**Prompt:**
> Execute Phase 4, Sub-phase 4.5: Implement a Mock OTP (One-Time Password) system in `server/src/services/otp.service.ts` and corresponding routes. It must generate secure 6-digit codes, store them temporarily (in-memory Map or DB with TTL), and "send" them by logging to the server console with a clear, formatted message (e.g., `[MOCK SMS] OTP for +1234567890 is 849201`). Include endpoints to request and verify OTP. Strictly follow the engineering protocol: provide exact ready-to-run terminal syntax, complete production-ready code files with detailed inline comments, a line-by-line mechanical breakdown, expected output, common edge-case failures (e.g., OTP brute force, expiration handling, rate limiting) with fixes, and precise verification steps. Do not proceed until I confirm.

---

## Sub-Phase 4.6: Implement Phone OTP Registration (Public Portal)
**Prompt:**
> Execute Phase 4, Sub-phase 4.6: Implement the Phone OTP registration flow in `server/src/controllers/auth.controller.ts`. Endpoints: `POST /auth/phone/request-otp` and `POST /auth/phone/verify-and-register`. Upon successful OTP verification, it must create a new `CUSTOMER` user account in the database and return valid JWTs. Strictly follow the engineering protocol: provide exact ready-to-run terminal syntax, complete production-ready code files with detailed inline comments, a line-by-line mechanical breakdown, expected output, common edge-case failures (e.g., duplicate phone numbers, unverified OTP attempts, missing role assignment) with fixes, and precise verification steps. Do not proceed until I confirm.

---

## Sub-Phase 4.7: Implement Mock Gmail OAuth Flow (Public Portal)
**Prompt:**
> Execute Phase 4, Sub-phase 4.7: Implement a Mock Gmail OAuth flow in `server/src/controllers/auth.controller.ts`. Since this is a self-contained offline demo, simulate the OAuth redirect and token exchange. Create a `POST /auth/google/mock` endpoint that accepts a mock code, instantly returns a simulated Google profile payload, and uses it to create or link a `CUSTOMER` account and issue JWTs. Strictly follow the engineering protocol: provide exact ready-to-run terminal syntax, complete production-ready code files with detailed inline comments explaining the simulation logic, a line-by-line mechanical breakdown, expected output, common edge-case failures (e.g., account linking conflicts, missing email from mock payload) with fixes, and precise verification steps. Do not proceed until I confirm.

---

## Sub-Phase 4.8: Implement Super Admin User Management CRUD
**Prompt:**
> Execute Phase 4, Sub-phase 4.8: Implement the Super Admin User Management Controller (`server/src/controllers/admin.controller.ts`) and Routes (`server/src/routes/admin.routes.ts`). This allows the Super Admin to list all users, create new employees (Team Leads/Staff), edit user details, reassign roles/teams, and deactivate accounts. Protect these routes with the RBAC middleware. Strictly follow the engineering protocol: provide exact ready-to-run terminal syntax, complete production-ready code files with detailed inline comments, a line-by-line mechanical breakdown, expected output, common edge-case failures (e.g., Admin deleting themselves, assigning invalid roles/teams, bypassing RBAC) with fixes, and precise verification steps. Do not proceed until I confirm.

---

## Sub-Phase 4.9: Create Auth Context & Protected Route HOC on Client
**Prompt:**
> Execute Phase 4, Sub-phase 4.9: Create the React Authentication Context (`client/src/context/AuthContext.tsx`), Axios interceptors (`client/src/services/api.ts`) for automatic token refresh and attaching headers, and a `ProtectedRoute` Higher-Order Component (`client/src/components/ProtectedRoute.tsx`). It must handle login state, auto-redirect unauthenticated users to `/login`, and manage loading states. Strictly follow the engineering protocol: provide exact ready-to-run terminal syntax, complete, unabridged production-ready TypeScript/React code files with detailed inline comments explaining their systemic role, a line-by-line mechanical breakdown, expected output, common edge-case failures (e.g., infinite redirect loops, refresh token race conditions, axios interceptor duplication) with fixes, and precise verification steps. Do not proceed until I confirm.

---

## Phase 4 Completion Check
**Prompt:**
> Phase 4 is complete. Verify that all sub-phases (4.1 to 4.9) are successfully executed. Summarize the final state of the authentication system. Provide a step-by-step manual testing checklist (using `curl` or Postman) to verify: 1) Email/Password registration and login, 2) Token refresh mechanism via cookie, 3) RBAC blocking unauthorized routes (e.g., non-admin accessing admin routes), 4) Mock OTP console output and verification, 5) Client-side auto-redirects via `ProtectedRoute`. State that we are ready to proceed to Phase 5: Super Admin Portal.