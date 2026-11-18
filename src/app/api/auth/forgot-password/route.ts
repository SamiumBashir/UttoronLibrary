import { NextResponse } from "next/server";
import crypto from "crypto";
import { updateStore } from "@/lib/db";

export async function POST(request: Request) {
  let body: { email?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request body." },
      { status: 400 }
    );
  }

  const email = body.email?.trim().toLowerCase() || "";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 }
    );
  }

  let devToken: string | undefined;
  updateStore((store) => {
    const user = store.users.find((u) => u.email === email);
    if (!user) return;
    const rawToken = crypto.randomBytes(16).toString("hex");
    user.resetTokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    user.resetTokenExpiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    console.info(
      `[Uttoron Auth] Password reset requested for ${email}. Token: ${rawToken}`
    );
    if (process.env.NODE_ENV !== "production") {
      devToken = rawToken;
    }
  });

  return NextResponse.json({
    sent: true,
    message:
      "If an account exists for that email, password reset instructions have been issued.",
    ...(devToken ? { devResetToken: devToken } : {}),
  });
}
