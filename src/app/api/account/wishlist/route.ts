import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { updateStore } from "@/lib/db";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  return NextResponse.json({ wishlist: user.wishlist });
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  let body: { bookId?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }
  const bookId = body.bookId;
  if (!bookId) {
    return NextResponse.json({ error: "bookId is required." }, { status: 400 });
  }

  const wishlist = updateStore((store) => {
    const target = store.users.find((u) => u.id === user.id);
    if (!target) return [];
    if (target.wishlist.includes(bookId)) {
      target.wishlist = target.wishlist.filter((id) => id !== bookId);
    } else {
      target.wishlist.push(bookId);
    }
    return target.wishlist;
  });

  return NextResponse.json({ wishlist });
}

