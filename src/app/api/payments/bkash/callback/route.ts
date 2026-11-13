import { NextResponse } from "next/server";
import { updateStore } from "@/lib/db";
import { executeBkashPayment, getSiteBaseUrl } from "@/lib/payments";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const paymentID = url.searchParams.get("paymentID") || "";
  const status = url.searchParams.get("status") || "";
  const orderNumber = url.searchParams.get("orderNumber") || "";
  const baseUrl = getSiteBaseUrl(request);

  if (status !== "success" || !paymentID || !orderNumber) {
    return NextResponse.redirect(
      `${baseUrl}/checkout?paymentError=${encodeURIComponent("bKash payment was cancelled or failed.")}`
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
    return NextResponse.redirect(
      `${baseUrl}/checkout?paymentError=${encodeURIComponent(
        verification.statusMessage || "bKash payment verification failed."
      )}`
    );
  }

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
    }
  });

  return NextResponse.redirect(
    `${baseUrl}/orders/${encodeURIComponent(orderNumber)}?paid=1`
  );
}

