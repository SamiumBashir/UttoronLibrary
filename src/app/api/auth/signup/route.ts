import { NextResponse } from "next/server";
import crypto from "crypto";
import { readStore, updateStore } from "@/lib/db";
import { hashPassword, setSessionCookie, toPublicUser } from "@/lib/auth";
import type { UserRecord } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
  };

  const name = body.name?.trim() || "";
  const email = body.email?.trim().toLowerCase() || "";
  const phone = body.phone?.trim() || "";
  const password = body.password || "";

  if (!name || !email || password.length < 6) {
    return NextResponse.json(
      { error: "Name, valid email, and a password of at least 6 characters are required." },
      { status: 400 }
    );
  }

  const store = readStore();
  if (store.users.some((u) => u.email === email)) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 }
    );
  }

  const isBootstrapAdmin =
    store.users.length === 0 ||
    (process.env.ADMIN_SETUP_EMAIL &&
      email === process.env.ADMIN_SETUP_EMAIL.trim().toLowerCase());

  const newUser: UserRecord = {
    id: `usr-${crypto.randomUUID().slice(0, 8)}`,
    name,
    email,
    phone,
    passwordHash: hashPassword(password),
    role: isBootstrapAdmin ? "admin" : "customer",
    wishlist: [],
    addresses: [],
    createdAt: new Date().toISOString(),
  };

  updateStore((s) => {
    s.users.push(newUser);
  });

  await setSessionCookie(newUser);
  return NextResponse.json({ user: toPublicUser(newUser) }, { status: 201 });
}

