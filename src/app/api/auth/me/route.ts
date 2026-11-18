import { NextResponse } from "next/server";
import { getAuthenticatedUser, toPublicUser } from "@/lib/auth";
import { readStore, updateStore } from "@/lib/db";
import { getOrdersFromDb } from "@/lib/db-postgres";
import type { Order } from "@/lib/types";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ user: null, orders: [] });
  }

  // 1. Fetch from PostgreSQL
  let dbOrders: Order[] | null = null;
  try {
    dbOrders = await getOrdersFromDb({
      userId: user.id,
      email: user.email,
      isAdmin: user.role === "admin",
    });
  } catch (err) {
    console.warn("[Auth/Me] PostgreSQL orders lookup error:", err);
  }

  // 2. Fetch from local store
  const store = readStore();
  const fileOrders =
    user.role === "admin"
      ? store.orders
      : store.orders.filter(
          (o) =>
            o.userId === user.id ||
            (o.customer?.email &&
              o.customer.email.toLowerCase() === user.email.toLowerCase())
        );

  // 3. Merge unique orders by orderNumber
  const orderMap = new Map<string, Order>();
  for (const o of fileOrders) {
    if (o.orderNumber) orderMap.set(o.orderNumber.toUpperCase(), o);
  }
  if (dbOrders) {
    for (const o of dbOrders) {
      if (o.orderNumber) orderMap.set(o.orderNumber.toUpperCase(), o);
    }
  }

  const orders = Array.from(orderMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return NextResponse.json({ user: toPublicUser(user), orders });
}

export async function PATCH(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  const body = (await request.json()) as { name?: string; phone?: string };
  const updated = updateStore((store) => {
    const target = store.users.find((u) => u.id === user.id);
    if (!target) return null;
    if (body.name?.trim()) target.name = body.name.trim();
    if (body.phone !== undefined) target.phone = body.phone.trim();
    return toPublicUser(target);
  });
  return NextResponse.json({ user: updated });
}

