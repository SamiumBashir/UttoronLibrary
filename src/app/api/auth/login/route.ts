import { NextResponse } from "next/server";
import { readStore } from "@/lib/db";
import { setSessionCookie, toPublicUser, verifyPassword } from "@/lib/auth";

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string };
  const email = body.email?.trim().toLowerCase() || "";
  const password = body.password || "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 }
    );
  }

  const store = readStore();
  const user = store.users.find((u) => u.email === email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 }
    );
  }

  await setSessionCookie(user);
  return NextResponse.json({ user: toPublicUser(user) });
}

