import assert from "node:assert/strict";
import { calculateDeliveryCharge, validateCouponOnSubtotal } from "../src/lib/db";
import type { Coupon } from "../src/lib/types";

export async function runCalculationTests() {
  console.log(" Running Calculation Tests...");

  // 1. Delivery Charge Calculation
  assert.equal(
    calculateDeliveryCharge(500, "Dhaka"),
    60,
    "Delivery inside Dhaka under ৳2,000 should be ৳60"
  );
  assert.equal(
    calculateDeliveryCharge(500, "dhaka city"),
    60,
    "Delivery in 'dhaka city' (case-insensitive substring) should be ৳60"
  );
  assert.equal(
    calculateDeliveryCharge(500, "Chittagong"),
    120,
    "Delivery outside Dhaka under ৳2,000 should be ৳120"
  );
  assert.equal(
    calculateDeliveryCharge(500, "Sylhet"),
    120,
    "Delivery to Sylhet under ৳2,000 should be ৳120"
  );
  assert.equal(
    calculateDeliveryCharge(2000, "Chittagong"),
    0,
    "Delivery at exactly ৳2,000 should be free (৳0)"
  );
  assert.equal(
    calculateDeliveryCharge(3500, "Dhaka"),
    0,
    "Delivery above ৳2,000 should be free (৳0)"
  );
  assert.equal(
    calculateDeliveryCharge(0, "Dhaka"),
    0,
    "Subtotal 0 should incur ৳0 delivery"
  );
  assert.equal(
    calculateDeliveryCharge(-100, "Dhaka"),
    0,
    "Negative subtotal should safely return ৳0 delivery"
  );
  assert.equal(
    calculateDeliveryCharge(NaN, "Dhaka"),
    0,
    "NaN subtotal should safely return ৳0 delivery"
  );

  // 2. Coupon Validation & Math
  const activePercentageCoupon: Coupon = {
    code: "WELCOME10",
    description: "10% off for new readers",
    type: "percentage",
    value: 10,
    minOrderAmount: 500,
    maxDiscount: 100,
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    active: true,
  };

  // Valid percentage coupon
  const res1 = validateCouponOnSubtotal(activePercentageCoupon, 800);
  assert.equal(res1.valid, true, "Valid coupon above minOrderAmount should pass");
  assert.equal(res1.discount, 80, "10% of 800 should be 80");

  // Percentage coupon capped by maxDiscount
  const res2 = validateCouponOnSubtotal(activePercentageCoupon, 2000);
  assert.equal(res2.valid, true);
  assert.equal(
    res2.discount,
    100,
    "10% of 2000 is 200, but should be capped at maxDiscount 100"
  );

  // Subtotal below minOrderAmount
  const res3 = validateCouponOnSubtotal(activePercentageCoupon, 400);
  assert.equal(res3.valid, false, "Order below minOrderAmount should be invalid");
  assert.equal(res3.discount, 0);

  // Inactive coupon
  const inactiveCoupon: Coupon = {
    ...activePercentageCoupon,
    code: "DISABLED",
    active: false,
  };
  const res4 = validateCouponOnSubtotal(inactiveCoupon, 1000);
  assert.equal(res4.valid, false, "Inactive coupon should be rejected");
  assert.equal(res4.discount, 0);

  // Expired coupon
  const expiredCoupon: Coupon = {
    ...activePercentageCoupon,
    code: "EXPIRED",
    expiresAt: new Date(Date.now() - 86400000).toISOString(),
  };
  const res5 = validateCouponOnSubtotal(expiredCoupon, 1000);
  assert.equal(res5.valid, false, "Expired coupon should be rejected");
  assert.equal(res5.discount, 0);

  // Fixed discount coupon
  const fixedCoupon: Coupon = {
    code: "FLAT150",
    description: "Flat 150 discount",
    type: "fixed",
    value: 150,
    minOrderAmount: 300,
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    active: true,
  };
  const res6 = validateCouponOnSubtotal(fixedCoupon, 500);
  assert.equal(res6.valid, true);
  assert.equal(res6.discount, 150, "Fixed discount should return exact value");

  // Fixed discount larger than subtotal
  const res7 = validateCouponOnSubtotal(fixedCoupon, 100);
  // minOrderAmount is 300, so it fails minOrder check
  assert.equal(res7.valid, false);

  const noMinFixedCoupon: Coupon = {
    ...fixedCoupon,
    minOrderAmount: 0,
    value: 200,
  };
  const res8 = validateCouponOnSubtotal(noMinFixedCoupon, 120);
  assert.equal(res8.valid, true);
  assert.equal(
    res8.discount,
    120,
    "Discount should never exceed order subtotal"
  );

  // Robustness: Undefined coupon, NaN subtotal, negative subtotal
  const resUndefined = validateCouponOnSubtotal(undefined, 1000);
  assert.equal(resUndefined.valid, false);
  assert.equal(resUndefined.discount, 0);

  const resNaN = validateCouponOnSubtotal(activePercentageCoupon, NaN);
  assert.equal(resNaN.valid, false);
  assert.equal(resNaN.discount, 0);

  const resNeg = validateCouponOnSubtotal(activePercentageCoupon, -500);
  assert.equal(resNeg.valid, false);
  assert.equal(resNeg.discount, 0);

  console.log("  Calculation Tests Passed (Delivery charges, tiered shipping, coupon percentages, limits, edge cases)");
}

if (require.main === module || process.argv[1]?.endsWith("calculations.test.ts")) {
  runCalculationTests().catch((err) => {
    console.error("Calculation test failed:", err);
    process.exit(1);
  });
}
