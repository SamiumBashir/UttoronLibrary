import { NextResponse } from "next/server";
import { verifyFirebaseIdToken, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { syncFirebaseUserInDb } from "@/lib/db-postgres";
import { saveUserRecord, readStore } from "@/lib/db";
import type { UserRecord } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { idToken?: string };
    if (!body.idToken) {
      return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
    }

    if (!isFirebaseAdminConfigured()) {
      return NextResponse.json(
        { error: "Firebase Admin is not configured on the server." },
        { status: 503 }
      );
    }

    const decoded = await verifyFirebaseIdToken(body.idToken);
    const email = decoded.email || "";
    const name = decoded.name || email.split("@")[0] || "Reader";
    const firebaseUid = decoded.uid;

    // 1. Sync into PostgreSQL if connected
    await syncFirebaseUserInDb({
      firebaseUid,
      email,
      name,
    });

    // 2. Sync into local fallback store for seamless session consistency
    const store = readStore();
    let existing = store.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!existing) {
      existing = {
        id: `usr-${firebaseUid.slice(0, 10)}`,
        email,
        name,
        passwordHash: "",
        role: email === process.env.ADMIN_SETUP_EMAIL ? "admin" : "customer",
        phone: "",
        addresses: [],
        wishlist: [],
        createdAt: new Date().toISOString(),
      };
      saveUserRecord(existing);
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

    // Set standard session cookie
    res.cookies.set("uttoron_user", JSON.stringify(userPayload), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return res;
  } catch (error) {
    console.error("[Firebase Auth API] Error:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
  }
}
