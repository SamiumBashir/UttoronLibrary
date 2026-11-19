import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { readStore, updateStore } from "@/lib/db";
import { isDatabaseConnected, prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  // 1. Fetch from PostgreSQL if connected
  if (isDatabaseConnected()) {
    try {
      const dbUser = await prisma.user.findFirst({
        where: {
          OR: [
            { id: user.id },
            { email: { equals: user.email, mode: "insensitive" } },
          ],
        },
        select: { wishlist: true },
      });
      if (dbUser && Array.isArray(dbUser.wishlist)) {
        return NextResponse.json({ wishlist: dbUser.wishlist });
      }
    } catch (err) {
      console.warn("[Wishlist GET] Database lookup error:", err);
    }
  }

  // 2. Fallback to session / local store
  const store = readStore();
  const localUser = store.users.find(
    (u) => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase()
  );
  return NextResponse.json({ wishlist: localUser?.wishlist || user.wishlist || [] });
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  let body: {
    bookId?: string;
    wishlist?: string[];
    action?: "toggle" | "add" | "remove" | "clear" | "sync";
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  const { bookId, wishlist: incomingWishlist, action = "toggle" } = body;

  if (!bookId && !incomingWishlist && action !== "clear") {
    return NextResponse.json(
      { error: "bookId or wishlist array is required." },
      { status: 400 }
    );
  }

  // Fetch current wishlist from DB or store
  let currentList: string[] = user.wishlist || [];

  if (isDatabaseConnected()) {
    try {
      const dbUser = await prisma.user.findFirst({
        where: {
          OR: [
            { id: user.id },
            { email: { equals: user.email, mode: "insensitive" } },
          ],
        },
        select: { wishlist: true },
      });
      if (dbUser && Array.isArray(dbUser.wishlist)) {
        currentList = dbUser.wishlist;
      }
    } catch (err) {
      console.warn("[Wishlist POST] DB read error:", err);
    }
  }

  let updatedList: string[] = [];

  if (action === "clear") {
    updatedList = [];
  } else if (action === "sync" || Array.isArray(incomingWishlist)) {
    // Merge or sync provided array
    const validIncoming = (incomingWishlist || []).filter(Boolean);
    if (action === "sync") {
      updatedList = Array.from(new Set([...currentList, ...validIncoming]));
    } else {
      updatedList = Array.from(new Set(validIncoming));
    }
  } else if (bookId) {
    const cleanId = bookId.trim();
    if (action === "add") {
      updatedList = currentList.includes(cleanId) ? currentList : [...currentList, cleanId];
    } else if (action === "remove") {
      updatedList = currentList.filter((id) => id !== cleanId);
    } else {
      // default: toggle
      if (currentList.includes(cleanId)) {
        updatedList = currentList.filter((id) => id !== cleanId);
      } else {
        updatedList = [...currentList, cleanId];
      }
    }
  }

  // 1. Persist to PostgreSQL if connected
  if (isDatabaseConnected()) {
    try {
      const targetUser = await prisma.user.findFirst({
        where: {
          OR: [
            { id: user.id },
            { email: { equals: user.email, mode: "insensitive" } },
          ],
        },
        select: { id: true },
      });

      if (targetUser) {
        await prisma.user.update({
          where: { id: targetUser.id },
          data: { wishlist: updatedList },
        });
      }
    } catch (err) {
      console.error("[Wishlist POST] PostgreSQL update failed:", err);
    }
  }

  // 2. Persist to local fallback store
  updateStore((store) => {
    let target = store.users.find(
      (u) => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase()
    );
    if (!target) {
      target = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone || "",
        passwordHash: user.passwordHash || "",
        wishlist: updatedList,
        addresses: user.addresses || [],
        createdAt: user.createdAt || new Date().toISOString(),
      };
      store.users.push(target);
    } else {
      target.wishlist = updatedList;
    }
    return target.wishlist;
  });

  return NextResponse.json({ success: true, wishlist: updatedList });
}
