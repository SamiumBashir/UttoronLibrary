# Verification and Test Results: Uttoron Prokasoni

**Date:** November 19, 2026  
**Test Framework:** Node.js Native Assert Runner via `tsx`  
**Execution Command:** `npm test`  
**Typecheck Command:** `npm run typecheck`  
**Build Command:** `npm run build`

---

## 1. Test Suite Summary

```
==================================================
  UTTORON PROKASONI - FULL VERIFICATION TEST SUITE
==================================================
 Running Auth Tests...
  Auth Tests Passed (Password Scrypt, HMAC tokens, tamper rejection, timing-safe checks)
 Running Calculation Tests...
  Calculation Tests Passed (Delivery charges, tiered shipping, coupon percentages, limits, edge cases)
 Running Security & Vulnerability Regression Tests...
  Security Tests Passed (Privilege escalation locked, PII masking IDOR guard, palette normalization)
==================================================
Summary: 3 suite(s) passed, 0 failed.
==================================================
```

---

## 2. Detailed Test Specifications

### Suite 1: Authentication & Cryptographic Security (`tests/auth.test.ts`)
| Test Case | Description | Result |
| :--- | :--- | :---: |
| `scrypt_unique_salts` | Ensures different salts yield distinct hashes for the same password | **PASS** |
| `scrypt_verification_valid` | Valid password verifies successfully against generated salt:hash | **PASS** |
| `scrypt_verification_invalid` | Incorrect password returns `false` without throwing | **PASS** |
| `scrypt_malformed_handling` | Non-standard or truncated hash format returns `false` safely | **PASS** |
| `hmac_session_signing` | Signs user ID and role into a tamper-evident session token | **PASS** |
| `hmac_session_verification` | Verifies and unpacks payload from valid session token | **PASS** |
| `hmac_tamper_rejection` | Rejects payload modification (e.g. customer promoting role to admin) | **PASS** |
| `hmac_corrupt_sig_rejection` | Rejects tokens with corrupted or spoofed HMAC signatures | **PASS** |
| `timing_safe_token_equality` | Uses `crypto.timingSafeEqual` with buffer length check for reset tokens | **PASS** |

### Suite 2: Calculations & Business Logic (`tests/calculations.test.ts`)
| Test Case | Description | Result |
| :--- | :--- | :---: |
| `shipping_inside_dhaka` | Charges flat ৳60 inside Dhaka under ৳2,000 threshold | **PASS** |
| `shipping_dhaka_substring` | Recognizes lowercase and multi-word variations like "dhaka city" | **PASS** |
| `shipping_outside_dhaka` | Charges ৳120 outside Dhaka (e.g., Chittagong, Sylhet) | **PASS** |
| `shipping_free_tier` | Free shipping for orders equal to or exceeding ৳2,000 threshold | **PASS** |
| `shipping_zero_and_negative` | Safely handles 0, negative, and `NaN` subtotal inputs with ৳0 charge | **PASS** |
| `coupon_percentage_valid` | Calculates correct percentage discount on valid subtotal | **PASS** |
| `coupon_percentage_capped` | Strictly caps percentage discounts exceeding `maxDiscount` | **PASS** |
| `coupon_min_order_guard` | Rejects coupon when subtotal does not meet `minOrderAmount` | **PASS** |
| `coupon_inactive_guard` | Rejects coupons marked `active: false` | **PASS** |
| `coupon_expiration_guard` | Rejects coupons whose `expiresAt` timestamp is in the past | **PASS** |
| `coupon_fixed_valid` | Applies exact flat discount amount for fixed coupon types | **PASS** |
| `coupon_discount_clamp` | Ensures total discount never exceeds the order subtotal | **PASS** |
| `coupon_nan_resilience` | Robust against `undefined`, `NaN`, and negative subtotal values | **PASS** |

### Suite 3: Security & Data Integrity (`tests/security.test.ts`)
| Test Case | Description | Result |
| :--- | :--- | :---: |
| `privilege_escalation_guard` | Rejects admin assignment for first user if not in `ADMIN_SETUP_EMAIL` | **PASS** |
| `admin_whitelist_enforced` | Assigns admin role only when signup email matches whitelist | **PASS** |
| `admin_email_sanitization` | Handles email case differences and trimming securely | **PASS** |
| `order_pii_masked_public` | Masks phone, address, and email for unverified public tracking queries | **PASS** |
| `order_pii_unmasked_phone` | Reveals full details when tracking query provides verified phone | **PASS** |
| `order_pii_unmasked_owner` | Reveals full details to authenticated order owner | **PASS** |
| `order_pii_unmasked_admin` | Reveals full details to authenticated administrator | **PASS** |
| `palette_normalization_empty` | Replaces `undefined` palette with `DEFAULT_COVER_PALETTE` | **PASS** |
| `palette_normalization_partial` | Merges partial color object with default fallback values | **PASS** |
| `palette_pattern_sanitization` | Restricts pattern values to valid enum, falling back to `"arch"` | **PASS** |

---

## 3. TypeScript Typecheck Results

```
Command: npm run typecheck (tsc --noEmit)
Exit Code: 0
Errors: 0
Warnings: 0
Status: CLEAN
```

---

## 4. Next.js Production Build Verification

```
Command: npm run build (next build --webpack)
Status: Compiled successfully
Static Pages: 34/34 generated
SSR Routes & APIs: Clean compilation
```
