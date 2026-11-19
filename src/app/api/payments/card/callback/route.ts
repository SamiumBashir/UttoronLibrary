import { NextResponse, after } from "next/server";
import { updateStore } from "@/lib/db";
import { updateOrderPaymentInDb } from "@/lib/db-postgres";
import { getSiteBaseUrl } from "@/lib/payments";
import { sendOrderConfirmationEmail } from "@/lib/email";
import type { Order } from "@/lib/types";

async function handleCallback(request: Request) {
  const url = new URL(request.url);
  const status = url.searchParams.get("status") || "";
  const orderNumber = url.searchParams.get("orderNumber") || "";
  const provider = url.searchParams.get("provider") || "sslcommerz";
  const sessionId = url.searchParams.get("session_id") || "";
  const baseUrl = getSiteBaseUrl(request);

  if (status !== "success" || !orderNumber) {
    return NextResponse.redirect(
      `${baseUrl}/checkout?paymentError=${encodeURIComponent("Card payment was cancelled or declined.")}`,
      303
    );
  }

  let verified = false;
  let ref = "";

  if (provider === "stripe" && sessionId && process.env.STRIPE_SECRET_KEY) {
    const verifyRes = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
      { headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` } }
    );
    const json = (await verifyRes.json()) as { payment_status?: string; id?: string };
    verified = verifyRes.ok && json.payment_status === "paid";
    ref = json.id || sessionId;
  } else if (
    process.env.SSLCOMMERZ_STORE_ID &&
    process.env.SSLCOMMERZ_STORE_PASSWD
  ) {
    let valId = url.searchParams.get("val_id") || "";
    let tranId = url.searchParams.get("tran_id") || "";
    let bankTranId = url.searchParams.get("bank_tran_id") || "";

    if (request.method === "POST") {
      try {
        const formData = await request.formData();
        valId = (formData.get("val_id") as string) || valId;
        tranId = (formData.get("tran_id") as string) || tranId;
        bankTranId = (formData.get("bank_tran_id") as string) || bankTranId;
      } catch {}
    }

    if (valId) {
      const storeId = process.env.SSLCOMMERZ_STORE_ID.trim();
      const storePasswd = process.env.SSLCOMMERZ_STORE_PASSWD.trim();
      const isSandbox = process.env.SSLCOMMERZ_IS_SANDBOX !== "false";
      const valUrl = isSandbox
        ? "https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php"
        : "https://securepay.sslcommerz.com/validator/api/validationserverAPI.php";

      const validate = async (sPass: string) => {
        const vRes = await fetch(
          `${valUrl}?val_id=${encodeURIComponent(valId)}&store_id=${encodeURIComponent(
            storeId
          )}&store_passwd=${encodeURIComponent(sPass)}&format=json`
        );
        return (await vRes.json()) as { status?: string; bank_tran_id?: string };
      };

      let vJson = await validate(storePasswd);
      if (
        isSandbox &&
        vJson.status !== "VALID" &&
        vJson.status !== "VALIDATED" &&
        storePasswd !== `${storeId}@ssl`
      ) {
        const retryJson = await validate(`${storeId}@ssl`);
        if (retryJson.status === "VALID" || retryJson.status === "VALIDATED") {
          vJson = retryJson;
        }
      }

      verified = vJson.status === "VALID" || vJson.status === "VALIDATED";
      ref = vJson.bank_tran_id || bankTranId || valId;
    }
  }

  if (!verified) {
    await updateOrderPaymentInDb(
      orderNumber,
      "FAILED",
      "CANCELLED",
      undefined,
      "Card payment could not be verified with the gateway."
    ).catch(() => {});

    return NextResponse.redirect(
      `${baseUrl}/checkout?paymentError=${encodeURIComponent(
        "Card payment could not be verified with the gateway."
      )}`,
      303
    );
  }

  let confirmedOrder: Order | undefined;
  updateStore((store) => {
    const order = store.orders.find((o) => o.orderNumber === orderNumber);
    if (order) {
      order.paymentStatus = "PAID";
      order.orderStatus = "CONFIRMED";
      order.paymentRef = ref;
      order.updatedAt = new Date().toISOString();
      order.timeline.unshift({
        status: "CONFIRMED",
        label: "Card Payment Verified & Order Confirmed",
        note: `Gateway Reference: ${ref}`,
        timestamp: order.updatedAt,
      });
      for (const item of order.items) {
        const book = store.books.find((b) => b.id === item.bookId);
        if (book) book.soldCount += item.quantity;
      }
      confirmedOrder = { ...order };
    }
  });

  await updateOrderPaymentInDb(
    orderNumber,
    "PAID",
    "CONFIRMED",
    ref,
    "Card Payment Verified & Order Confirmed"
  ).catch(() => {});

  if (confirmedOrder) {
    const orderToSend = confirmedOrder;
    try {
      after(async () => {
        try {
          await sendOrderConfirmationEmail({ order: orderToSend, siteUrl: baseUrl });
        } catch (err) {
          console.warn("[Email] Card payment confirmation email error:", err);
        }
      });
    } catch {
      void sendOrderConfirmationEmail({ order: orderToSend, siteUrl: baseUrl }).catch(() => {});
    }
  }

  return NextResponse.redirect(
    `${baseUrl}/orders/${encodeURIComponent(orderNumber)}?paid=1`,
    303
  );
}

export async function GET(request: Request) {
  return handleCallback(request);
}

export async function POST(request: Request) {
  return handleCallback(request);
}

