import { NextResponse } from "next/server";
import { readStore } from "@/lib/db";
import {
  getSiteBaseUrl,
  initiateBkashCheckout,
  isPaymentMethodAvailable,
} from "@/lib/payments";

export async function POST(request: Request) {
  const avail = isPaymentMethodAvailable("BKASH");
  if (!avail?.configured) {
    return NextResponse.json(
      {
        error: "bKash gateway credentials are not configured on the server.",
        missingEnvVars: avail?.missingEnvVars || [],
      },
      { status: 503 }
    );
  }

  const { orderNumber } = (await request.json()) as { orderNumber?: string };
  if (!orderNumber) {
    return NextResponse.json({ error: "orderNumber is required." }, { status: 400 });
  }

  const store = readStore();
  const order = store.orders.find((o) => o.orderNumber === orderNumber);
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  try {
    const baseUrl = getSiteBaseUrl(request);
    const result = await initiateBkashCheckout(
      order,
      `${baseUrl}/api/payments/bkash/callback?orderNumber=${encodeURIComponent(order.orderNumber)}`
    );
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "bKash initiation failed." },
      { status: 502 }
    );
  }
}

