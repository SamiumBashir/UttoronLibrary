import { NextResponse } from "next/server";
import { readStore, updateStore } from "@/lib/db";
import { setSessionCookie, toPublicUser, verifyPassword } from "@/lib/auth";
import { isDatabaseConnected, prisma } from "@/lib/prisma";
import type { UserRecord } from "@/lib/types";

export async function POST(request: Request) {
  let body: { email?: string; password?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request body." },
      { status: 400 }
    );
  }

  const email = body.email?.trim().toLowerCase() || "";
  const password = body.password || "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 }
    );
  }

  const store = readStore();
  let user = store.users.find((u) => u.email === email);

  // If user not in memory/file store but PostgreSQL is connected, check PostgreSQL
  if (!user && isDatabaseConnected()) {
    try {
      const dbUser = await prisma.user.findUnique({
        where: { email },
        include: { addresses: true },
      });
      if (dbUser) {
        user = {
          id: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
          phone: dbUser.phone || "",
          passwordHash: dbUser.passwordHash || "",
          role: dbUser.role as "customer" | "admin",
          wishlist: dbUser.wishlist || [],
          addresses: (dbUser.addresses || []).map((a) => ({
            id: a.id,
            label: a.label,
            fullName: a.fullName,
            phone: a.phone,
            addressLine: a.addressLine,
            city: a.city,
            postalCode: a.postalCode,
            isDefault: a.isDefault,
          })),
          createdAt: dbUser.createdAt.toISOString(),
        };
        // Cache to local store for session consistency
        updateStore((s) => {
          if (!s.users.some((u) => u.id === user!.id)) {
            s.users.push(user!);
          }
        });
      }
    } catch (err) {
      console.warn("[PostgreSQL] User lookup error during login:", err);
    }
  }

  if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 }
    );
  }

  await setSessionCookie(user);
  return NextResponse.json({ user: toPublicUser(user) });
}
