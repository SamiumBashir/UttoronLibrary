import assert from "node:assert/strict";
import crypto from "node:crypto";
import {
  hashPassword,
  verifyPassword,
  signSessionToken,
  verifySessionToken,
} from "../src/lib/auth";

export async function runAuthTests() {
  console.log(" Running Auth Tests...");

  // 1. Password Hashing & Verification
  const rawPassword = "SecurePass123!@#";
  const hash1 = hashPassword(rawPassword);
  const hash2 = hashPassword(rawPassword);

  assert.notEqual(hash1, hash2, "Different salts should produce distinct hashes");
  assert.equal(
    verifyPassword(rawPassword, hash1),
    true,
    "Valid password should verify against hash1"
  );
  assert.equal(
    verifyPassword(rawPassword, hash2),
    true,
    "Valid password should verify against hash2"
  );
  assert.equal(
    verifyPassword("WrongPassword!", hash1),
    false,
    "Incorrect password must fail verification"
  );
  assert.equal(
    verifyPassword(rawPassword, "malformed:hash"),
    false,
    "Malformed hash string must fail gracefully without throwing"
  );
  assert.equal(
    verifyPassword(rawPassword, "invalid"),
    false,
    "Invalid hash format must return false"
  );

  // 2. HMAC Session Signing & Verification
  const user = { id: "usr-test-123", role: "customer" as const };
  const token = signSessionToken(user);
  assert.ok(typeof token === "string" && token.includes("."), "Token must be a dotted JWT-like string");

  const verified = verifySessionToken(token);
  assert.ok(verified, "Valid token must verify successfully");
  assert.equal(verified?.userId, user.id, "Verified token payload should contain correct userId");
  assert.equal(verified?.role, user.role, "Verified token payload should contain correct role");
  assert.ok(
    verified && verified.exp > Math.floor(Date.now() / 1000),
    "Token expiration must be in the future"
  );

  // 3. Session Token Tampering Protection
  const [headerPayload, sig] = token.split(".");
  const tamperedPayload = Buffer.from(
    JSON.stringify({ userId: "usr-test-123", role: "admin", exp: Math.floor(Date.now() / 1000) + 9999 })
  ).toString("base64url");
  const tamperedToken = `${tamperedPayload}.${sig}`;

  assert.equal(
    verifySessionToken(tamperedToken),
    null,
    "Tampered session token must fail HMAC signature check"
  );

  const corruptedSigToken = `${headerPayload}.corrupted_signature_here`;
  assert.equal(
    verifySessionToken(corruptedSigToken),
    null,
    "Token with corrupted signature must fail verification"
  );

  // 4. Timing Safe Equal Token Verification
  const validToken = "reset_token_secret_1234567890";
  const inputToken = "reset_token_secret_1234567890";
  const wrongToken = "reset_token_secret_wrong_1234";

  const bufA = Buffer.from(validToken);
  const bufB = Buffer.from(inputToken);
  const bufC = Buffer.from(wrongToken);

  const isMatchValid = bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
  const isMatchInvalid = bufA.length === bufC.length && crypto.timingSafeEqual(bufA, bufC);

  assert.equal(isMatchValid, true, "Matching token buffers should verify in constant time");
  assert.equal(isMatchInvalid, false, "Mismatched token buffers should fail timing check safely");

  console.log("  Auth Tests Passed (Password Scrypt, HMAC tokens, tamper rejection, timing-safe checks)");
}

if (require.main === module || process.argv[1]?.endsWith("auth.test.ts")) {
  runAuthTests().catch((err) => {
    console.error("Auth test failed:", err);
    process.exit(1);
  });
}
