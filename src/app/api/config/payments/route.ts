import { NextResponse } from "next/server";
import { getPaymentAvailability } from "@/lib/payments";

export async function GET() {
  const methods = getPaymentAvailability();
  return NextResponse.json({ methods });
}

