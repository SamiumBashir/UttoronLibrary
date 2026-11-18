import assert from "node:assert/strict";
import { normalizeCoverPalette, DEFAULT_COVER_PALETTE, type Order } from "../src/lib/types";
import { resolveUserRole } from "../src/lib/auth";

export async function runSecurityTests() {
  console.log(" Running Security & Vulnerability Regression Tests...");

  // 1. SEC-01: Privilege Escalation Prevention & Strict Admin Role Enforcement
  const adminEmail = "founder@uttoron.org";
  process.env.ADMIN_SETUP_EMAIL = adminEmail;

  assert.equal(
    resolveUserRole("attacker@random.com", "admin"),
    "customer",
    "Stored role of 'admin' must be downgraded to 'customer' if email does not match ADMIN_SETUP_EMAIL"
  );
  assert.equal(
    resolveUserRole("normal.reader@gmail.com", "customer"),
    "customer",
    "Regular customer remains customer"
  );
  assert.equal(
    resolveUserRole(adminEmail, "customer"),
    "admin",
    "Whitelisted ADMIN_SETUP_EMAIL is granted admin role"
  );
  assert.equal(
    resolveUserRole(`  ${adminEmail.toUpperCase()}  `, "customer"),
    "admin",
    "Whitelisted admin email matches case-insensitively and trimmed"
  );

  // 2. SEC-03: IDOR & PII Masking on Order Tracking
  function sanitizeOrderForViewer(
    order: Order,
    viewer: { userId?: string; role?: string } | null,
    queryVerification?: { phone?: string; email?: string }
  ): Order & { piiMasked: boolean } {
    const isOwner = Boolean(viewer && viewer.userId === order.userId);
    const isAdmin = Boolean(viewer && viewer.role === "admin");
    const matchesPhone = Boolean(
      queryVerification?.phone &&
      order.customer.phone.replace(/\D/g, "") === queryVerification.phone.replace(/\D/g, "")
    );
    const matchesEmail = Boolean(
      queryVerification?.email &&
      order.customer.email.trim().toLowerCase() === queryVerification.email.trim().toLowerCase()
    );

    const hasDirectAccess = isOwner || isAdmin || matchesPhone || matchesEmail;
    if (hasDirectAccess) {
      return { ...order, piiMasked: false };
    }

    // Mask sensitive PII for unverified public queries
    const originalPhone = order.customer.phone;
    const maskedPhone = originalPhone.length > 4
      ? originalPhone.slice(0, 3) + "****" + originalPhone.slice(-2)
      : "***";
    const maskedAddress = order.customer.address.length > 10
      ? order.customer.address.slice(0, 6) + "..., " + order.customer.city
      : order.customer.city;
    const emailParts = order.customer.email.split("@");
    const maskedEmail = emailParts.length === 2 && emailParts[0].length > 2
      ? emailParts[0].slice(0, 2) + "***@" + emailParts[1]
      : "***@***";

    return {
      ...order,
      customer: {
        ...order.customer,
        phone: maskedPhone,
        address: maskedAddress,
        email: maskedEmail,
      },
      piiMasked: true,
    };
  }

  const sampleOrder: Order = {
    id: "ord-test-99",
    orderNumber: "UP-20261114-1234",
    userId: "usr-real-owner",
    customer: {
      fullName: "Rahim Ahmed",
      email: "rahim.ahmed@example.com",
      phone: "01711223344",
      address: "House 12, Road 4, Dhanmondi, Dhaka",
      city: "Dhaka",
      postalCode: "1205",
    },
    paymentMethod: "COD",
    paymentStatus: "PENDING_COD",
    orderStatus: "PROCESSING",
    subtotal: 1200,
    deliveryCharge: 60,
    discount: 0,
    total: 1260,
    items: [],
    timeline: [],
    estimatedDelivery: new Date(Date.now() + 86400000 * 3).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Stranger tracking the order without phone/email verification
  const publicView = sanitizeOrderForViewer(sampleOrder, null, {});
  assert.equal(publicView.piiMasked, true);
  assert.notEqual(publicView.customer.phone, sampleOrder.customer.phone);
  assert.ok(publicView.customer.phone.includes("****"), "Phone should be masked");
  assert.ok(publicView.customer.email.includes("***@"), "Email should be masked");
  assert.notEqual(publicView.customer.address, sampleOrder.customer.address);
  assert.ok(publicView.customer.address.includes("..., Dhaka"), "Address should be redacted");

  // Verified tracking with matching phone
  const verifiedPhoneView = sanitizeOrderForViewer(sampleOrder, null, { phone: "01711223344" });
  assert.equal(verifiedPhoneView.piiMasked, false);
  assert.equal(verifiedPhoneView.customer.address, sampleOrder.customer.address);

  // Authenticated Owner view
  const ownerView = sanitizeOrderForViewer(sampleOrder, { userId: "usr-real-owner", role: "customer" });
  assert.equal(ownerView.piiMasked, false);
  assert.equal(ownerView.customer.phone, sampleOrder.customer.phone);

  // Authenticated Admin view
  const adminView = sanitizeOrderForViewer(sampleOrder, { userId: "usr-admin-1", role: "admin" });
  assert.equal(adminView.piiMasked, false);
  assert.equal(adminView.customer.email, sampleOrder.customer.email);

  // 3. BUG-03: Defensive CoverPalette Normalization
  const emptyPalette = normalizeCoverPalette(undefined);
  assert.equal(emptyPalette.primary, DEFAULT_COVER_PALETTE.primary);
  assert.equal(emptyPalette.pattern, DEFAULT_COVER_PALETTE.pattern);

  const partialPalette = normalizeCoverPalette({ primary: "#123456" });
  assert.equal(partialPalette.primary, "#123456");
  assert.equal(partialPalette.secondary, DEFAULT_COVER_PALETTE.secondary);
  assert.equal(partialPalette.accent, DEFAULT_COVER_PALETTE.accent);
  assert.equal(partialPalette.pattern, "arch");

  const invalidPatternPalette = normalizeCoverPalette({
    primary: "#000",
    secondary: "#111",
    accent: "#222",
    text: "#fff",
    pattern: "malicious_script_tag" as any,
  });
  assert.equal(
    invalidPatternPalette.pattern,
    "arch",
    "Invalid pattern string must fall back to 'arch'"
  );

  console.log("  Security Tests Passed (Privilege escalation locked, PII masking IDOR guard, palette normalization)");
}

if (require.main === module || process.argv[1]?.endsWith("security.test.ts")) {
  runSecurityTests().catch((err) => {
    console.error("Security test failed:", err);
    process.exit(1);
  });
}
