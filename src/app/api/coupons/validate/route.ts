import { NextResponse } from "next/server";
import { readStore, validateCouponOnSubtotal } from "@/lib/db";

export async function POST(request: Request) {
  let body: { code?: string; subtotal?: number };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request body." },
      { status: 400 }
    );
  }

  const code = (body?.code || "").trim().toUpperCase();
  const rawSubtotal = Number(body?.subtotal);
  const subtotal = Number.isFinite(rawSubtotal) ? Math.max(0, rawSubtotal) : 0;

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
