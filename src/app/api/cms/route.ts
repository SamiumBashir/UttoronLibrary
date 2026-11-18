import { NextResponse } from "next/server";
import crypto from "crypto";
import { readStore, updateStore } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth";
import type { Author, Coupon } from "@/lib/types";

export async function GET() {
  const store = readStore();
  const user = await getAuthenticatedUser();

  // SEC-05 Fix: Sensitive promotional coupons, customer orders, reviews, and contact inquiries
  // are strictly restricted to authenticated administrators.
  return NextResponse.json({
    books: store.books,
    authors: store.authors,
    categories: store.categories,
    publishers: store.publishers,
    testimonials: store.testimonials,
    ...(user?.role === "admin"
      ? {
          coupons: store.coupons,
          orders: store.orders,
          reviews: store.reviews,
          newsletterCount: store.newsletter.length,
          contacts: store.contacts,
        }
      : {}),
  });
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json(
      { error: "Admin privileges required for CMS mutations." },
      { status: 403 }
    );
  }

  let body: {
    entity?: "author" | "coupon" | "inventory";
    payload?: Record<string, unknown>;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request body." },
      { status: 400 }
    );
  }

  if (body.entity === "inventory" && body.payload) {
    const { bookId, stock, price } = body.payload as {
      bookId?: string;
      stock?: number;
      price?: number;
    };
    const updated = updateStore((store) => {
      const book = store.books.find((b) => b.id === bookId);
      if (!book) return null;
      if (stock !== undefined) book.stock = Math.max(0, Number(stock));
      if (price !== undefined) book.price = Math.max(0, Number(price));
      return book;
    });
    return updated
      ? NextResponse.json({ book: updated })
      : NextResponse.json({ error: "Book not found." }, { status: 404 });
  }

  if (body.entity === "coupon" && body.payload) {
    const p = body.payload as Partial<Coupon>;
    if (!p.code || p.value === undefined) {
      return NextResponse.json(
        { error: "Coupon code and numeric value required." },
        { status: 400 }
      );
    }
    const created = updateStore((store) => {
      const coupon: Coupon = {
        code: p.code!.trim().toUpperCase(),
        type: p.type === "percentage" ? "percentage" : "fixed",
        value: Number(p.value),
        minOrderAmount: Number(p.minOrderAmount || 0),
        maxDiscount: p.maxDiscount ? Number(p.maxDiscount) : undefined,
        active: p.active ?? true,
        expiresAt: p.expiresAt || "2027-12-31T23:59:59Z",
        description: p.description || "Editorial promotional discount",
      };
      const idx = store.coupons.findIndex((c) => c.code === coupon.code);
      if (idx >= 0) store.coupons[idx] = coupon;
      else store.coupons.unshift(coupon);
      return coupon;
    });
    return NextResponse.json({ coupon: created }, { status: 201 });
  }

  if (body.entity === "author" && body.payload) {
    const p = body.payload as Partial<Author>;
    if (!p.name || !p.bio) {
      return NextResponse.json(
        { error: "Author name and bio required." },
        { status: 400 }
      );
    }
    const created = updateStore((store) => {
      const author: Author = {
        id: `auth-${crypto.randomUUID().slice(0, 6)}`,
        slug:
          p.slug ||
          p.name!
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, ""),
        name: p.name!,
        roleTitle: p.roleTitle || "Author",
        nationality: p.nationality || "Bangladeshi",
        bio: p.bio!,
        longBio: p.longBio || p.bio!,
        awards: p.awards || [],
        quote: p.quote || "Literature endures through patient craft.",
        portraitColors: p.portraitColors || ["#17392C", "#C6A25A", "#EFE6D5"],
        featured: p.featured ?? true,
      };
      store.authors.push(author);
      return author;
    });
    return NextResponse.json({ author: created }, { status: 201 });
  }

  return NextResponse.json({ error: "Unsupported CMS operation." }, { status: 400 });
}
