# Bug Fix and Remediation Report: Uttoron Prokasoni (Library Platform)

**Date:** November 19, 2026  
**Auditor & Engineer:** Senior Full-Stack & Application Security Engineer  
**Repository:** [UttoronLibrary](https://github.com/SamiumBashir/UttoronLibrary) (Local Workspace: `d:\Uttoron_prokasoni`)  
**Commit Policy:** All fixes applied locally; no unauthorized push to remote repository.

---

## 1. Executive Summary

Following a deep, file-by-file security and code audit of the entire codebase, 13 security vulnerabilities, runtime defects, database synchronization gaps, and calculation flaws were identified. All 13 items have been resolved directly in code, accompanied by strict type verification and a comprehensive automated regression test suite.

---

## 2. Itemized Bug Fixes & Security Remediations

### Fix 1: SEC-01 — Critical Privilege Escalation via Sign-Up
- **File:** `src/app/api/auth/signup/route.ts`
- **Issue:** The first registered user was automatically granted the `admin` role (`store.users.length === 0`), and client requests could trigger administrative takeover if the JSON store was empty or re-initialized.
- **Root Cause:** Insecure default role assignment without administrative whitelist enforcement.
- **Remediation:** Removed the `store.users.length === 0` check. Role assignment now strictly requires matching the trusted environment variable `ADMIN_SETUP_EMAIL`. Added database synchronization (`prisma.user.create`) alongside the fallback store.
- **Verification:** Unit test in `tests/security.test.ts` asserts that `determineAssignedRole("attacker@evil.com", 0)` returns `"customer"`.

### Fix 2: SEC-02 — Broken Authentication & Insecure Session via Firebase Sign-In
- **File:** `src/app/api/auth/firebase/route.ts`
- **Issue:** Firebase Google sign-in set an unverified raw JSON cookie named `uttoron_user`, whereas all protected API routes checked `uttoron_session` signed with HMAC-SHA256 via `getAuthenticatedUser()`. Google-authenticated users were effectively unauthenticated across all API endpoints.
- **Root Cause:** Session mechanism mismatch between social login and password login.
- **Remediation:** Refactored `firebase/route.ts` to sign and set the standard `uttoron_session` cookie via `signSessionToken()`, and added user upsert synchronization in PostgreSQL via `syncFirebaseUserInDb()`.
- **Verification:** Verified cookie issuance and HMAC validation in `tests/auth.test.ts`.

### Fix 3: SEC-03 — IDOR & Excessive PII Exposure in Orders API
- **File:** `src/app/api/orders/[orderNumber]/route.ts`
- **Issue:** Any unauthenticated visitor who guessed or found an order number could view the customer's full phone number, full delivery address, and personal email.
- **Root Cause:** Lack of ownership and verification gating on public order lookup endpoint.
- **Remediation:** Added viewer verification against session (owner/admin) or query verification (`phone` or `email`). If neither matches, customer phone, email, and street address are masked before serialization while allowing public status tracking.
- **Verification:** Unit test in `tests/security.test.ts` asserts that unverified queries receive masked PII.

### Fix 4: SEC-04 — Timing Attack Vulnerability in Password Reset Verification
- **File:** `src/app/api/auth/reset-password/route.ts`
- **Issue:** Token verification used standard JavaScript equality (`===`), making token hashes susceptible to side-channel timing analysis.
- **Root Cause:** Non-constant-time string comparison on cryptographic token hashes.
- **Remediation:** Replaced standard equality with `crypto.timingSafeEqual()` with strict buffer length equality checks.
- **Verification:** Verified constant-time buffer comparison in `tests/auth.test.ts`.

### Fix 5: SEC-05 — Coupon Information Disclosure via Public CMS API
- **File:** `src/app/api/cms/route.ts`
- **Issue:** The public CMS GET endpoint dumped all coupons, including private, inactive, and unreleased promo codes, in plain JSON.
- **Root Cause:** Over-broad data exposure in CMS query handler.
- **Remediation:** Restricted coupon payload in `cms/route.ts` strictly to authenticated users with `role: "admin"`. Public readers receive an empty array.
- **Verification:** Tested role gating logic in route handler.

### Fix 6: SEC-06 — Missing HTTP Security Headers
- **File:** `next.config.ts`
- **Issue:** Missing standard clickjacking, MIME-sniffing, and cross-origin protection headers.
- **Remediation:** Added `headers()` configuration returning `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, and `X-DNS-Prefetch-Control: on`.
- **Verification:** Verified `next.config.ts` compilation and type safety.

### Fix 7: SEC-07 — Unhandled JSON Parsing Crashes Across API Routes
- **Files:**
  - `src/app/api/auth/signup/route.ts`
  - `src/app/api/auth/login/route.ts`
  - `src/app/api/auth/firebase/route.ts`
  - `src/app/api/auth/reset-password/route.ts`
  - `src/app/api/auth/forgot-password/route.ts`
  - `src/app/api/cms/route.ts`
  - `src/app/api/orders/route.ts`
  - `src/app/api/coupons/validate/route.ts`
  - `src/app/api/account/addresses/route.ts`
  - `src/app/api/account/wishlist/route.ts`
  - `src/app/api/contact/route.ts`
  - `src/app/api/newsletter/route.ts`
- **Issue:** Calling `await request.json()` without try/catch resulted in uncaught JSON parse exceptions and 500 errors when malformed payloads were sent.
- **Remediation:** Wrapped body extraction in safe `try { await request.json() } catch { return 400 }` pattern across all mutation handlers.

### Fix 8: BUG-01 — Database Disconnection on Book & Author Detail Pages
- **Files:**
  - `src/app/books/[slug]/page.tsx`
  - `src/app/books/page.tsx`
  - `src/app/authors/[slug]/page.tsx`
  - `src/app/authors/page.tsx`
  - `src/app/page.tsx`
  - `src/app/api/books/[slug]/route.ts`
- **Issue:** Server-rendered pages queried only the local file store `readStore()`. Books and authors stored in PostgreSQL returned 404.
- **Root Cause:** Architectural disconnect between the dual-layer data store.
- **Remediation:** Updated all server page components and API routes to query `getBookBySlugFromDb()`, `getBooksFromDb()`, and `getAuthorsFromDb()` with fallback to `readStore()`.

### Fix 9: BUG-02 — Payment Gateway Callbacks Not Synchronized with PostgreSQL
- **Files:**
  - `src/app/api/payments/bkash/callback/route.ts`
  - `src/app/api/payments/card/callback/route.ts`
  - `src/lib/db-postgres.ts`
- **Issue:** bKash and Card (Stripe/SSLCommerz) callbacks updated only the JSON file store. Orders in PostgreSQL remained stuck in `AWAITING_GATEWAY`.
- **Root Cause:** Missing DB synchronization call in payment webhooks.
- **Remediation:** Implemented and integrated `updateOrderPaymentInDb(orderNumber, status, orderStatus, ref, note)` in both callback handlers.

### Fix 10: BUG-03 — Defensive Palette Normalization for Cover Art
- **Files:**
  - `src/lib/types.ts`
  - `src/lib/db-postgres.ts`
  - `src/components/books/BookCoverArt.tsx`
  - `src/lib/book-texture.ts`
- **Issue:** Books loaded from custom or partially populated records threw client-side runtime errors (`Cannot read properties of undefined (reading 'primary')`).
- **Remediation:** Added `DEFAULT_COVER_PALETTE` and `normalizeCoverPalette()` helper in `types.ts`. Applied normalization in database deserialization, React component rendering, and Three.js canvas texture creation.
- **Verification:** Unit tests in `tests/security.test.ts` verify recovery from undefined, empty, and partial palette objects.

### Fix 11: BUG-04 — Three.js Book Mesh Raycaster Selection Failure
- **File:** `src/components/three/HeroLibraryCanvas.tsx`
- **Issue:** In the 3D gallery, clicking books frequently failed to trigger `onSelect` because child submeshes (cover, spine, pages) do not carry `userData.book` directly.
- **Root Cause:** `handleClick` inspected only `hits[0].object.userData?.book` without traversing up to the parent group.
- **Remediation:** Added recursive parent traversal loop identical to `handlePointerMove`.
- **Verification:** Manual code trace and simulated raycast hierarchy inspection.

### Fix 12: BUG-05 — Coupon Subtotal Sanitization & Zero/Negative Clamping
- **File:** `src/lib/db.ts`
- **Issue:** Missing `Number.isFinite()` and non-negative clamping on `subtotal` allowed potential NaN propagation or invalid negative calculations.
- **Remediation:** Added `safeSubtotal = Number.isFinite(subtotal) ? Math.max(0, subtotal) : 0` in `calculateDeliveryCharge` and `validateCouponOnSubtotal`.
- **Verification:** Regression test suite `tests/calculations.test.ts` passes with NaN, negative, and extreme values.

### Fix 13: BUG-06 — Automated Test Suite Implementation
- **Files:**
  - `tests/auth.test.ts`
  - `tests/calculations.test.ts`
  - `tests/security.test.ts`
  - `tests/run-all.ts`
  - `package.json`
- **Issue:** The repository lacked an automated test script and regression suites.
- **Remediation:** Added `"test": "tsx tests/run-all.ts"` and implemented 3 comprehensive test suites.
- **Verification:** `npm test` runs with 3 passing suites (0 failures).

---

## 3. Summary of Verification Status

| Category | Total Issues | Resolved | In-Progress | Failed |
| :--- | :---: | :---: | :---: | :---: |
| **Security Vulnerabilities** | 7 | 7 | 0 | 0 |
| **Database & Persistence Disconnects** | 2 | 2 | 0 | 0 |
| **Runtime & UI Defects** | 2 | 2 | 0 | 0 |
| **Business Logic & Calculations** | 1 | 1 | 0 | 0 |
| **Test Automation & Quality Gates** | 1 | 1 | 0 | 0 |
| **Total** | **13** | **13** | **0** | **0** |
