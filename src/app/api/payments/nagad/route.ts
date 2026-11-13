import { NextResponse } from "next/server";
import { isPaymentMethodAvailable } from "@/lib/payments";

export async function POST() {
  const avail = isPaymentMethodAvailable("NAGAD");
  if (!avail?.configured) {
    return NextResponse.json(
      {
        error: "Nagad gateway credentials are not configured on the server.",
        missingEnvVars: avail?.missingEnvVars || [],
      },
      { status: 503 }
    );
  }
  return NextResponse.json(
    { error: "Nagad gateway RSA initialization requires live merchant keys." },
    { status: 503 }
  );
}

