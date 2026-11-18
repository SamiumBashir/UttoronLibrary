# Application Security Checklist & Verification: Uttoron Prokasoni

**Date:** November 19, 2026  
**Standard:** OWASP Top 10 Web Application Security & Production Readiness  
**Target:** [UttoronLibrary](https://github.com/SamiumBashir/UttoronLibrary)

---

## 1. Authentication & Session Management

- [x] **Secure Password Storage**: Passwords hashed using `scrypt` with unique 16-byte random salts per user (`src/lib/auth.ts:hashPassword`).
- [x] **Timing-Safe Password Verification**: Password verification uses `crypto.timingSafeEqual` on constant-length buffers (`src/lib/auth.ts:verifyPassword`).
- [x] **Timing-Safe Password Reset**: Reset token hashes verified with `crypto.timingSafeEqual` preventing side-channel timing discovery (`src/app/api/auth/reset-password/route.ts`).
- [x] **Tamper-Proof Session Tokens**: User sessions use HMAC-SHA256 signed tokens (`uttoron_session`) with cryptographically secure secret generation and verification.
- [x] **Session Expiration**: Token payload enforces timestamp expiration (`exp`) with 14-day TTL.
- [x] **Social Login Hardening**: Firebase Google sign-in securely issues and signs standard HMAC session tokens rather than unverified client cookies (`src/app/api/auth/firebase/route.ts`).
- [x] **Privilege Escalation Prevention**: Automatic admin promotion (`store.users.length === 0`) removed. Admin assignment restricted exclusively to `ADMIN_SETUP_EMAIL`.

---

## 2. Authorization & Access Control

- [x] **Role-Based Access Control (RBAC)**: Admin endpoints (`/api/cms`, etc.) verify `role === "admin"` before serving sensitive data or executing mutations.
- [x] **IDOR & PII Protection**: Order tracking (`/api/orders/[orderNumber]`) masks customer phone number, street address, and email for unverified public queries. Full details available only to verified owner or admin.
- [x] **Data Isolation**: User address book and wishlist APIs enforce authenticated user identity and reject cross-account modifications.

---

## 3. Input Validation & Resilience

- [x] **Safe JSON Parsing**: All mutation API handlers wrap body parsing (`await request.json()`) in defensive `try/catch` blocks, returning structured 400 Bad Request responses instead of throwing uncaught 500 exceptions.
- [x] **Subtotal & Math Sanitization**: Coupon discount and shipping fee calculators sanitize inputs with `Number.isFinite()` and non-negative clamping (`Math.max(0, val)`), preventing `NaN` or negative price manipulation.
- [x] **Defensive Data Models**: Palette normalization helper (`normalizeCoverPalette`) guarantees valid fallback theme properties even if database records contain malformed or partial JSON.

---

## 4. API & Infrastructure Security

- [x] **Clickjacking Protection**: Configured `X-Frame-Options: SAMEORIGIN` via `next.config.ts`.
- [x] **MIME-Sniffing Prevention**: Configured `X-Content-Type-Options: nosniff` via `next.config.ts`.
- [x] **Referrer Policy**: Set `Referrer-Policy: strict-origin-when-cross-origin`.
- [x] **Permissions Policy**: Restricted sensitive browser capabilities (`camera=()`, `microphone=()`, `geolocation=()`).
- [x] **Payment Verification**: bKash and Card (SSLCommerz/Stripe) webhooks verify signatures and status with gateway servers before confirming order status in the database.

---

## 5. Secrets & Environment Configuration

- [x] **Zero Hardcoded Secrets**: All production credentials (database URLs, Stripe keys, SSLCommerz passwords, Firebase credentials) load exclusively through environment variables.
- [x] **Local Fallback Protection**: Session secret generation falls back to an uncommitted `.session-secret` stored with restrictive file permissions (`0o600`).
- [x] **Client-Side Secret Isolation**: No server secrets or database strings exposed to `NEXT_PUBLIC_*` prefixes.

---

## 6. Automated Verification & Quality Gates

- [x] **Type Safety**: TypeScript strict check (`npm run typecheck`) passes with 0 errors.
- [x] **Automated Regression Suite**: 3 dedicated test suites (`auth.test.ts`, `calculations.test.ts`, `security.test.ts`) executed via `npm test` with 100% pass rate.
- [x] **Production Build**: Next.js production build configured for webpack optimization.
