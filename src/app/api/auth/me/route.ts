import { NextResponse } from "next/server";
import { getAuthenticatedUser, toPublicUser } from "@/lib/auth";
import { readStore, updateStore } from "@/lib/db";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ user: null });
  }
  const store = readStore();
  const orders = store.orders.filter(
    (o) => o.userId === user.id || o.customer.email === user.email
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

