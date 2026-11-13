import { NextResponse } from "next/server";
import { readStore } from "@/lib/db";
import {
  getSiteBaseUrl,
  initiateSSLCommerzCheckout,
  initiateStripeCheckout,
  isPaymentMethodAvailable,
} from "@/lib/payments";

export async function POST(request: Request) {
  const avail = isPaymentMethodAvailable("CARD");
  if (!avail?.configured) {
    return NextResponse.json(
      {
        error: "Card payment gateway credentials are not configured on the server.",
        missingEnvVars: avail?.missingEnvVars || [],
      },
      { status: 503 }
    );
  }

  const { orderNumber } = (await request.json()) as { orderNumber?: string };
  const store = readStore();
  const order = store.orders.find((o) => o.orderNumber === orderNumber);
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const baseUrl = getSiteBaseUrl(request);
  try {
    const result =
      process.env.CARD_GATEWAY_PROVIDER === "stripe"
        ? await initiateStripeCheckout(order, baseUrl)
        : await initiateSSLCommerzCheckout(order, baseUrl);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Card gateway error." },
      { status: 502 }
    );
  }
}

