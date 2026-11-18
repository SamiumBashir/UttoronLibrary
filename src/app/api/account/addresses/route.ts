import { NextResponse } from "next/server";
import crypto from "crypto";
import { getAuthenticatedUser } from "@/lib/auth";
import { updateStore } from "@/lib/db";
import type { Address } from "@/lib/types";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  return NextResponse.json({ addresses: user.addresses });
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  let body: Partial<Address>;
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }
  if (!body.fullName || !body.phone || !body.addressLine || !body.city || !body.postalCode) {
    return NextResponse.json(
      { error: "All address fields are required." },
      { status: 400 }
    );
  }

  const addresses = updateStore((store) => {
    const target = store.users.find((u) => u.id === user.id);
    if (!target) return [];
    const newAddr: Address = {
      id: `addr-${crypto.randomUUID().slice(0, 6)}`,
      label: body.label?.trim() || "Home",
      fullName: body.fullName!.trim(),
      phone: body.phone!.trim(),
      addressLine: body.addressLine!.trim(),
      city: body.city!.trim(),
      postalCode: body.postalCode!.trim(),
      isDefault: target.addresses.length === 0 || Boolean(body.isDefault),
    };
    if (newAddr.isDefault) {
      target.addresses.forEach((a) => {
        a.isDefault = false;
      });
    }
    target.addresses.push(newAddr);
    return target.addresses;
  });

  return NextResponse.json({ addresses }, { status: 201 });
}

export async function DELETE(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Address id is required." }, { status: 400 });
  }

  const addresses = updateStore((store) => {
    const target = store.users.find((u) => u.id === user.id);
    if (!target) return [];
    target.addresses = target.addresses.filter((a) => a.id !== id);
    return target.addresses;
  });

  return NextResponse.json({ addresses });
}

