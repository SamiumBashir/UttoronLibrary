import { NextResponse } from "next/server";
import { getSiteBaseUrl } from "@/lib/payments";

export async function GET(request: Request) {
  const baseUrl = getSiteBaseUrl(request);
  return NextResponse.redirect(
    `${baseUrl}/checkout?paymentError=${encodeURIComponent(
      "Nagad gateway callback cannot verify without live merchant keys."
    )}`
  );
}

