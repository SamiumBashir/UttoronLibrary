import { NextResponse } from "next/server";
import { readStore, updateStore } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth";
import type { OrderStatus } from "@/lib/types";

export async function GET(
  _req: Request,
  context: { params: Promise<{ orderNumber: string }> }
) {
  const { orderNumber } = await context.params;
  const store = readStore();
  const order = store.orders.find(
    (o) => o.orderNumber.toUpperCase() === orderNumber.toUpperCase()
  );

  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  return NextResponse.json({ order });
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
  const body = (await request.json()) as {
    orderStatus?: OrderStatus;
    note?: string;
  };

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

  if (!updated) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  return NextResponse.json({ order: updated });
}

