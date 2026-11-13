import type { Order, PaymentGatewayAvailability, PaymentMethod } from "@/lib/types";

export function getPaymentAvailability(): PaymentGatewayAvailability[] {
  const codEnabled = process.env.PAYMENTS_ENABLE_COD !== "false";

  const bkashMissing: string[] = [];
  if (!process.env.BKASH_APP_KEY) bkashMissing.push("BKASH_APP_KEY");
  if (!process.env.BKASH_APP_SECRET) bkashMissing.push("BKASH_APP_SECRET");
  if (!process.env.BKASH_USERNAME) bkashMissing.push("BKASH_USERNAME");
  if (!process.env.BKASH_PASSWORD) bkashMissing.push("BKASH_PASSWORD");
  const bkashConfigured = bkashMissing.length === 0;

  const nagadMissing: string[] = [];
  if (!process.env.NAGAD_MERCHANT_ID) nagadMissing.push("NAGAD_MERCHANT_ID");
  if (!process.env.NAGAD_PRIVATE_KEY) nagadMissing.push("NAGAD_PRIVATE_KEY");
  const nagadConfigured = nagadMissing.length === 0;

  const useStripe = process.env.CARD_GATEWAY_PROVIDER === "stripe";
  const cardMissing: string[] = [];
  if (useStripe) {
    if (!process.env.STRIPE_SECRET_KEY) cardMissing.push("STRIPE_SECRET_KEY");
  } else {
    if (!process.env.SSLCOMMERZ_STORE_ID) cardMissing.push("SSLCOMMERZ_STORE_ID");
    if (!process.env.SSLCOMMERZ_STORE_PASSWD) cardMissing.push("SSLCOMMERZ_STORE_PASSWD");
  }
  const cardConfigured = cardMissing.length === 0;

  return [
    {
      method: "COD",
      label: "Cash on Delivery",
      subtitle: "Pay in cash upon receiving your parcel at your doorstep",
      enabled: codEnabled,
      configured: codEnabled,
      requiresRedirect: false,
    },
    {
      method: "BKASH",
      label: "bKash",
      subtitle: bkashConfigured
        ? "Pay securely via bKash Tokenized Checkout"
        : "Requires bKash merchant API credentials on server",
      enabled: true,
      configured: bkashConfigured,
      requiresRedirect: true,
      missingEnvVars: bkashConfigured ? undefined : bkashMissing,
    },
    {
      method: "NAGAD",
      label: "Nagad",
      subtitle: nagadConfigured
        ? "Pay securely via Nagad Checkout Gateway"
        : "Requires Nagad merchant API credentials on server",
      enabled: true,
      configured: nagadConfigured,
      requiresRedirect: true,
      missingEnvVars: nagadConfigured ? undefined : nagadMissing,
    },
    {
      method: "CARD",
      label: "Card / Online Banking",
      subtitle: cardConfigured
        ? "Visa, Mastercard, AMEX & Net Banking via verified gateway"
        : "Requires SSLCommerz or Stripe API credentials on server",
      enabled: true,
      configured: cardConfigured,
      requiresRedirect: true,
      missingEnvVars: cardConfigured ? undefined : cardMissing,
    },
  ];
}

export function isPaymentMethodAvailable(method: PaymentMethod): PaymentGatewayAvailability | undefined {
  return getPaymentAvailability().find((g) => g.method === method);
}

export function getSiteBaseUrl(req?: Request): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  if (req) {
    const url = new URL(req.url);
    return `${url.protocol}//${url.host}`;
  }
  return "http://localhost:3000";
}

export async function initiateBkashCheckout(
  order: Order,
  callbackUrl: string
): Promise<{ redirectUrl: string; paymentId: string }> {
  const baseUrl =
    process.env.BKASH_BASE_URL || "https://tokenized.sandbox.bka.sh/v1.2.0-beta";
  const appKey = process.env.BKASH_APP_KEY;
  const appSecret = process.env.BKASH_APP_SECRET;
  const username = process.env.BKASH_USERNAME;
  const password = process.env.BKASH_PASSWORD;

  if (!appKey || !appSecret || !username || !password) {
    throw new Error("bKash merchant gateway credentials are not configured.");
  }

  const grantRes = await fetch(`${baseUrl}/tokenized/checkout/token/grant`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      username,
      password,
    },
    body: JSON.stringify({ app_key: appKey, app_secret: appSecret }),
  });

  if (!grantRes.ok) {
    throw new Error(`bKash token grant failed (${grantRes.status}).`);
  }

  const grantJson = (await grantRes.json()) as { id_token?: string; statusMessage?: string };
  if (!grantJson.id_token) {
    throw new Error(grantJson.statusMessage || "Failed to obtain bKash auth token.");
  }

  const createRes = await fetch(`${baseUrl}/tokenized/checkout/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: grantJson.id_token,
      "X-APP-Key": appKey,
    },
    body: JSON.stringify({
      mode: "0011",
      payerReference: order.customer.phone,
      callbackURL: callbackUrl,
      amount: String(order.total),
      currency: "BDT",
      intent: "sale",
      merchantInvoiceNumber: order.orderNumber,
    }),
  });

  const createJson = (await createRes.json()) as {
    bkashURL?: string;
    paymentID?: string;
    statusMessage?: string;
  };

  if (!createRes.ok || !createJson.bkashURL || !createJson.paymentID) {
    throw new Error(createJson.statusMessage || "Failed to create bKash checkout session.");
  }

  return {
    redirectUrl: createJson.bkashURL,
    paymentId: createJson.paymentID,
  };
}

export async function executeBkashPayment(paymentID: string): Promise<{
  verified: boolean;
  trxID?: string;
  statusMessage?: string;
}> {
  const baseUrl =
    process.env.BKASH_BASE_URL || "https://tokenized.sandbox.bka.sh/v1.2.0-beta";
  const appKey = process.env.BKASH_APP_KEY;
  const appSecret = process.env.BKASH_APP_SECRET;
  const username = process.env.BKASH_USERNAME;
  const password = process.env.BKASH_PASSWORD;

  if (!appKey || !appSecret || !username || !password) {
    return { verified: false, statusMessage: "bKash credentials not configured." };
  }

  const grantRes = await fetch(`${baseUrl}/tokenized/checkout/token/grant`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      username,
      password,
    },
    body: JSON.stringify({ app_key: appKey, app_secret: appSecret }),
  });

  const grantJson = (await grantRes.json()) as { id_token?: string };
  if (!grantJson.id_token) {
    return { verified: false, statusMessage: "bKash token grant failed." };
  }

  const execRes = await fetch(`${baseUrl}/tokenized/checkout/execute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: grantJson.id_token,
      "X-APP-Key": appKey,
    },
    body: JSON.stringify({ paymentID }),
  });

  const execJson = (await execRes.json()) as {
    transactionStatus?: string;
    trxID?: string;
    statusMessage?: string;
  };

  return {
    verified: execJson.transactionStatus === "Completed",
    trxID: execJson.trxID,
    statusMessage: execJson.statusMessage,
  };
}

export async function initiateSSLCommerzCheckout(
  order: Order,
  baseUrl: string
): Promise<{ redirectUrl: string; sessionKey: string }> {
  const storeId = process.env.SSLCOMMERZ_STORE_ID;
  const storePasswd = process.env.SSLCOMMERZ_STORE_PASSWD;
  if (!storeId || !storePasswd) {
    throw new Error("SSLCommerz credentials are not configured.");
  }

  const isSandbox = process.env.SSLCOMMERZ_IS_SANDBOX !== "false";
  const endpoint = isSandbox
    ? "https://sandbox.sslcommerz.com/gwprocess/v4/api.php"
    : "https://securepay.sslcommerz.com/gwprocess/v4/api.php";

  const params = new URLSearchParams({
    store_id: storeId,
    store_passwd: storePasswd,
    total_amount: String(order.total),
    currency: "BDT",
    tran_id: order.orderNumber,
    success_url: `${baseUrl}/api/payments/card/callback?status=success&orderNumber=${encodeURIComponent(order.orderNumber)}`,
    fail_url: `${baseUrl}/api/payments/card/callback?status=fail&orderNumber=${encodeURIComponent(order.orderNumber)}`,
    cancel_url: `${baseUrl}/api/payments/card/callback?status=cancel&orderNumber=${encodeURIComponent(order.orderNumber)}`,
    cus_name: order.customer.fullName,
    cus_email: order.customer.email,
    cus_add1: order.customer.address,
    cus_city: order.customer.city,
    cus_postcode: order.customer.postalCode,
    cus_country: "Bangladesh",
    cus_phone: order.customer.phone,
    shipping_method: "Courier",
    product_name: order.items.map((i) => i.title).join(", ").slice(0, 200),
    product_category: "Books",
    product_profile: "physical-goods",
  });

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const json = (await res.json()) as {
    status?: string;
    GatewayPageURL?: string;
    sessionkey?: string;
    failedreason?: string;
  };

  if (json.status !== "SUCCESS" || !json.GatewayPageURL) {
    throw new Error(json.failedreason || "Failed to initialize SSLCommerz payment session.");
  }

  return {
    redirectUrl: json.GatewayPageURL,
    sessionKey: json.sessionkey || order.orderNumber,
  };
}

export async function initiateStripeCheckout(
  order: Order,
  baseUrl: string
): Promise<{ redirectUrl: string; sessionId: string }> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Stripe secret key is not configured.");
  }

  const params = new URLSearchParams();
  params.append("mode", "payment");
  params.append(
    "success_url",
    `${baseUrl}/api/payments/card/callback?provider=stripe&status=success&orderNumber=${encodeURIComponent(order.orderNumber)}&session_id={CHECKOUT_SESSION_ID}`
  );
  params.append(
    "cancel_url",
    `${baseUrl}/api/payments/card/callback?provider=stripe&status=cancel&orderNumber=${encodeURIComponent(order.orderNumber)}`
  );
  params.append("customer_email", order.customer.email);
  params.append("client_reference_id", order.orderNumber);

  order.items.forEach((item, idx) => {
    params.append(`line_items[${idx}][price_data][currency]`, "bdt");
    params.append(`line_items[${idx}][price_data][product_data][name]`, item.title);
    params.append(
      `line_items[${idx}][price_data][unit_amount]`,
      String(Math.round(item.unitPrice * 100))
    );
    params.append(`line_items[${idx}][quantity]`, String(item.quantity));
  });

  if (order.deliveryCharge > 0) {
    const idx = order.items.length;
    params.append(`line_items[${idx}][price_data][currency]`, "bdt");
    params.append(`line_items[${idx}][price_data][product_data][name]`, "Archival Courier Delivery");
    params.append(
      `line_items[${idx}][price_data][unit_amount]`,
      String(Math.round(order.deliveryCharge * 100))
    );
    params.append(`line_items[${idx}][quantity]`, "1");
  }

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const json = (await res.json()) as {
    id?: string;
    url?: string;
    error?: { message?: string };
  };

  if (!res.ok || !json.url || !json.id) {
    throw new Error(json.error?.message || "Failed to initialize Stripe checkout.");
  }

  return {
    redirectUrl: json.url,
    sessionId: json.id,
  };
}

