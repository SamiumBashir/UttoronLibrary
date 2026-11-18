import { NextResponse } from "next/server";
import crypto from "crypto";
import { updateStore } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export async function POST(request: Request) {
  let body: {
    email?: string;
    token?: string;
    newPassword?: string;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request body." },
      { status: 400 }
    );
  }

  const email = body.email?.trim().toLowerCase() || "";
  const token = body.token?.trim() || "";
  const newPassword = body.newPassword || "";

  if (!email || !token || newPassword.length < 6) {
    return NextResponse.json(
      { error: "Email, reset token, and a new password (6+ chars) are required." },
      { status: 400 }
    );
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const tokenHashBuf = Buffer.from(tokenHash, "hex");

  const ok = updateStore((store) => {
    const user = store.users.find((u) => u.email === email);
    if (!user || !user.resetTokenHash || !user.resetTokenExpiresAt) return false;
    if (new Date(user.resetTokenExpiresAt).getTime() < Date.now()) return false;

    // SEC-04 Fix: Constant-time comparison to prevent timing attacks
    const storedHashBuf = Buffer.from(user.resetTokenHash, "hex");
    if (storedHashBuf.length !== tokenHashBuf.length) return false;
    if (!crypto.timingSafeEqual(storedHashBuf, tokenHashBuf)) return false;

    user.passwordHash = hashPassword(newPassword);
    delete user.resetTokenHash;
    delete user.resetTokenExpiresAt;
    return true;
  });

  if (!ok) {
    return NextResponse.json(
      { error: "Invalid or expired password reset token." },
      { status: 400 }
    );
  }

  return NextResponse.json({ reset: true });
}
