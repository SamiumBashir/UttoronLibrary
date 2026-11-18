import { NextResponse } from "next/server";
import { verifyFirebaseIdToken, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { syncFirebaseUserInDb } from "@/lib/db-postgres";
import { saveUserRecord, readStore } from "@/lib/db";
import { SESSION_COOKIE_NAME, signSessionToken } from "@/lib/auth";
import { sendWelcomeEmail } from "@/lib/email";
import { getSiteBaseUrl } from "@/lib/payments";
import type { UserRecord } from "@/lib/types";

export async function POST(request: Request) {
  try {
    let body: { idToken?: string };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
    }

    if (!body?.idToken) {
      return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
    }

    if (!isFirebaseAdminConfigured()) {
      return NextResponse.json(
        { error: "Firebase Admin is not configured on the server." },
        { status: 503 }
      );
    }

    const decoded = await verifyFirebaseIdToken(body.idToken);
    const email = (decoded.email || "").trim().toLowerCase();
    const name = decoded.name || email.split("@")[0] || "Reader";
    const firebaseUid = decoded.uid;

    if (!email) {
      return NextResponse.json(
        { error: "Firebase token does not contain a verified email address." },
        { status: 400 }
      );
    }

    // 1. Sync into PostgreSQL if connected
    await syncFirebaseUserInDb({
      firebaseUid,
      email,
      name,
    });

    // 2. Sync into local fallback store for seamless session consistency
    const store = readStore();
    const adminEmail = process.env.ADMIN_SETUP_EMAIL?.trim().toLowerCase();
    const isTargetAdmin = Boolean(adminEmail && email === adminEmail);

    let existing = store.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    const isNewUser = !existing;
    if (!existing) {
      existing = {
        id: `usr-${firebaseUid.slice(0, 10)}`,
        email,
        name,
        passwordHash: "",
        role: isTargetAdmin ? "admin" : "customer",
        phone: "",
        addresses: [],
        wishlist: [],
        createdAt: new Date().toISOString(),
      };
      saveUserRecord(existing);

      // Send welcome email asynchronously for first-time Google sign-ups
      const baseUrl = getSiteBaseUrl(request);
      sendWelcomeEmail({
        email,
        name,
        siteUrl: baseUrl,
      }).catch((err) => {
        console.warn("[Email] Google signup welcome email error:", err);
      });
    } else {
      if (isTargetAdmin && existing.role !== "admin") {
        existing.role = "admin";
        saveUserRecord(existing);
      }
    }

    const userPayload: UserRecord = {
      ...existing,
      email,
      name,
    };

    const res = NextResponse.json({
      success: true,
      user: {
        id: userPayload.id,
        email: userPayload.email,
        name: userPayload.name,
        role: userPayload.role,
        phone: userPayload.phone,
        addresses: userPayload.addresses,
        wishlist: userPayload.wishlist,
      },
    });

    // SEC-02 FIX: Issue the HMAC-SHA256 signed uttoron_session token
    const signedToken = signSessionToken(userPayload);
    res.cookies.set(SESSION_COOKIE_NAME, signedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 14, // 14 days
    });

    // Clean up any stale unhashed cookies
    res.cookies.delete("uttoron_user");

    return res;
  } catch (error) {
    console.error("[Firebase Auth API] Error:", error);
    return NextResponse.json({ error: "Authentication failed." }, { status: 401 });
  }
}
