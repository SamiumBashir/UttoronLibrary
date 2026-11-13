import { NextResponse } from "next/server";
import { readStore, validateCouponOnSubtotal } from "@/lib/db";

export async function POST(request: Request) {
  const body = (await request.json()) as { code?: string; subtotal?: number };
  const code = (body.code || "").trim().toUpperCase();
  const subtotal = Number(body.subtotal || 0);

  if (!code) {
    return NextResponse.json({ error: "Please enter a coupon code." }, { status: 400 });
  }

  const store = readStore();
  const coupon = store.coupons.find((c) => c.code.toUpperCase() === code);
  const result = validateCouponOnSubtotal(coupon, subtotal);

  if (!result.valid) {
    return NextResponse.json(
      { valid: false, discount: 0, error: result.reason },
      { status: 400 }
    );
  }

  return NextResponse.json({
    valid: true,
    code: coupon!.code,
    discount: result.discount,
    description: coupon!.description,
  });
}

