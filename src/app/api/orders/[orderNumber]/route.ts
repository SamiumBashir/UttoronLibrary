import { NextResponse } from "next/server";
import { readStore, updateStore } from "@/lib/db";
import { getOrderFromDb, updateOrderStatusInDb } from "@/lib/db-postgres";
import { getAuthenticatedUser } from "@/lib/auth";
import type { Order, OrderStatus } from "@/lib/types";

export async function GET(
  req: Request,
  context: { params: Promise<{ orderNumber: string }> }
) {
  const { orderNumber } = await context.params;
  const normalizedNumber = (orderNumber || "").trim().toUpperCase();

  // 1. Try PostgreSQL database first
  let order = await getOrderFromDb(normalizedNumber);

  // 2. Fallback to file/memory store
  if (!order) {
    const store = readStore();
    order = store.orders.find(
      (o) => o.orderNumber.toUpperCase() === normalizedNumber
    ) ?? null;
  }

  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  // SEC-03 Fix: Verify ownership before returning full PII
  const user = await getAuthenticatedUser();
  const url = new URL(req.url);
  const verifyPhone = (url.searchParams.get("phone") || "").trim();
  const verifyEmail = (url.searchParams.get("email") || "").trim().toLowerCase();

  const isOwner = Boolean(
    user && (user.id === order.userId || user.email.toLowerCase() === order.customer.email.toLowerCase())
  );
  const isAdmin = Boolean(user && user.role === "admin");
  const isVerifiedGuest = Boolean(
    (verifyPhone && order.customer.phone.includes(verifyPhone)) ||
    (verifyEmail && order.customer.email.toLowerCase() === verifyEmail)
  );

  if (isOwner || isAdmin || isVerifiedGuest) {
    return NextResponse.json({ order });
  }

  // For unverified public queries (e.g. tracking view without authentication),
  // mask sensitive customer PII to prevent data harvesting and IDOR attacks.
  const sanitizedOrder: Order = {
    ...order,
    customer: {
      fullName: order.customer.fullName,
      city: order.customer.city,
      postalCode: order.customer.postalCode,
      address: "•••• Protected for Privacy",
      phone: "•••• Protected for Privacy",
      email: "•••• Protected for Privacy",
      instructions: "",
    },
  };

  return NextResponse.json({ order: sanitizedOrder, isSanitized: true });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ orderNumber: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const { orderNumber } = await context.params;
  let body: {
    orderStatus?: OrderStatus;
    note?: string;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  if (body.orderStatus) {
    await updateOrderStatusInDb(orderNumber, body.orderStatus, body.note);
  }

  const updated = updateStore((store) => {
    const order = store.orders.find(
      (o) => o.orderNumber.toUpperCase() === orderNumber.toUpperCase()
    );
    if (!order) return null;
    if (body.orderStatus) {
      order.orderStatus = body.orderStatus;
      order.updatedAt = new Date().toISOString();
      order.timeline.unshift({
        status: body.orderStatus,
        label: `Order ${body.orderStatus}`,
        note: body.note || `Status updated to ${body.orderStatus} by curator.`,
        timestamp: order.updatedAt,
      });
    }
    return order;
  });

  const refreshed = (await getOrderFromDb(orderNumber)) || updated;
  if (!refreshed) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  return NextResponse.json({ order: refreshed });
}
