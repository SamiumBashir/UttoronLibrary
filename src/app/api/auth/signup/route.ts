import { NextResponse } from "next/server";
import crypto from "crypto";
import { readStore, updateStore } from "@/lib/db";
import { hashPassword, setSessionCookie, toPublicUser } from "@/lib/auth";
import { isDatabaseConnected, prisma } from "@/lib/prisma";
import { sendWelcomeEmail } from "@/lib/email";
import { getSiteBaseUrl } from "@/lib/payments";
import type { UserRecord } from "@/lib/types";

export async function POST(request: Request) {
  let body: {
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request body." },
      { status: 400 }
    );
  }

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

  // Basic email syntax check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "Please provide a valid email address." },
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

  // SEC-01 Fix: Admin status is ONLY granted if explicitly matching ADMIN_SETUP_EMAIL
  const adminSetupEmail = process.env.ADMIN_SETUP_EMAIL?.trim().toLowerCase();
  const isBootstrapAdmin = Boolean(adminSetupEmail && email === adminSetupEmail);

  const passwordHashed = hashPassword(password);
  const newUser: UserRecord = {
    id: `usr-${crypto.randomUUID().slice(0, 8)}`,
    name,
    email,
    phone,
    passwordHash: passwordHashed,
    role: isBootstrapAdmin ? "admin" : "customer",
    wishlist: [],
    addresses: [],
    createdAt: new Date().toISOString(),
  };

  updateStore((s) => {
    s.users.push(newUser);
  });

  // Sync into PostgreSQL if connected
  if (isDatabaseConnected()) {
    try {
      await prisma.user.upsert({
        where: { email },
        update: {
          name,
          phone,
          passwordHash: passwordHashed,
          role: newUser.role,
        },
        create: {
          id: newUser.id,
          email,
          name,
          phone,
          passwordHash: passwordHashed,
          role: newUser.role,
        },
      });
    } catch (err) {
      console.warn("[PostgreSQL] User signup sync skipped:", err);
    }
  }

  await setSessionCookie(newUser);

  // Send welcome email (waiting up to 5s so Vercel Serverless doesn't cancel it)
  const baseUrl = getSiteBaseUrl(request);
  try {
    await Promise.race([
      sendWelcomeEmail({
        email: newUser.email,
        name: newUser.name,
        siteUrl: baseUrl,
      }),
      new Promise((resolve) => setTimeout(resolve, 5000)),
    ]);
  } catch (err) {
    console.warn("[Email] Welcome email dispatch warning:", err);
  }

  return NextResponse.json({ user: toPublicUser(newUser) }, { status: 201 });
}
