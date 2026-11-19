import { NextResponse, after } from "next/server";
import { updateStore } from "@/lib/db";
import { updateOrderPaymentInDb } from "@/lib/db-postgres";
import { executeBkashPayment, getSiteBaseUrl } from "@/lib/payments";
import { sendOrderConfirmationEmail } from "@/lib/email";
import type { Order } from "@/lib/types";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const paymentID = url.searchParams.get("paymentID") || "";
  const status = url.searchParams.get("status") || "";
  const orderNumber = url.searchParams.get("orderNumber") || "";
  const baseUrl = getSiteBaseUrl(request);

  if (status !== "success" || !paymentID || !orderNumber) {
    return NextResponse.redirect(
      `${baseUrl}/checkout?paymentError=${encodeURIComponent("bKash payment was cancelled or failed.")}`,
      303
    );
  }

  const verification = await executeBkashPayment(paymentID);
  if (!verification.verified) {
    updateStore((store) => {
      const order = store.orders.find((o) => o.orderNumber === orderNumber);
      if (order) {
        order.paymentStatus = "FAILED";
        order.orderStatus = "CANCELLED";
        order.timeline.unshift({
          status: "CANCELLED",
          label: "bKash Verification Failed",
          note: verification.statusMessage || "Transaction could not be verified.",
          timestamp: new Date().toISOString(),
        });
      }
    });
    await updateOrderPaymentInDb(
      orderNumber,
      "FAILED",
      "CANCELLED",
      paymentID,
      verification.statusMessage || "Transaction could not be verified."
    ).catch(() => {});

    return NextResponse.redirect(
      `${baseUrl}/checkout?paymentError=${encodeURIComponent(
        verification.statusMessage || "bKash payment verification failed."
      )}`
    );
  }

  let confirmedOrder: Order | undefined;
  updateStore((store) => {
    const order = store.orders.find((o) => o.orderNumber === orderNumber);
    if (order) {
      order.paymentStatus = "PAID";
      order.orderStatus = "CONFIRMED";
      order.paymentRef = verification.trxID || paymentID;
      order.updatedAt = new Date().toISOString();
      order.timeline.unshift({
        status: "CONFIRMED",
        label: "bKash Payment Verified & Order Confirmed",
        note: `Transaction ID: ${order.paymentRef}`,
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
    verification.trxID || paymentID,
    "bKash Payment Verified & Order Confirmed"
  ).catch(() => {});

  if (confirmedOrder) {
    const orderToSend = confirmedOrder;
    try {
      after(async () => {
        try {
          await sendOrderConfirmationEmail({ order: orderToSend, siteUrl: baseUrl });
        } catch (err) {
          console.warn("[Email] bKash confirmation email error:", err);
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

