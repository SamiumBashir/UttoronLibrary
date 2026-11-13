import { NextResponse } from "next/server";
import { addReviewToStore, findBookBySlugOrId, readStore } from "@/lib/db";
import { addReviewInDb } from "@/lib/db-postgres";
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET(
  _req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const store = readStore();
  const book = findBookBySlugOrId(store, slug);
  if (!book) {
    return NextResponse.json({ error: "Book not found." }, { status: 404 });
  }
  const reviews = store.reviews.filter((r) => r.bookId === book.id);
  return NextResponse.json({ reviews });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const body = (await request.json()) as {
    reviewerName?: string;
    rating?: number;
    title?: string;
    comment?: string;
  };

  if (!body.reviewerName?.trim() || !body.comment?.trim() || !body.rating) {
    return NextResponse.json(
      { error: "Reviewer name, rating, and comment are required." },
      { status: 400 }
    );
  }

  const user = await getAuthenticatedUser();
  const store = readStore();
  const book = findBookBySlugOrId(store, slug);
  if (!book) {
    return NextResponse.json({ error: "Book not found." }, { status: 404 });
  }

  const verifiedPurchase = user
    ? store.orders.some(
        (o) =>
          o.userId === user.id &&
          o.orderStatus !== "CANCELLED" &&
          o.items.some((i) => i.bookId === book.id)
      )
    : false;

  const review = addReviewToStore(slug, {
    reviewerName: body.reviewerName.trim(),
    rating: Number(body.rating),
    title: body.title?.trim() || "Reader Review",
    comment: body.comment.trim(),
    verifiedPurchase,
  });

  await addReviewInDb(slug, {
    reviewerName: body.reviewerName.trim(),
    rating: Number(body.rating),
    title: body.title?.trim() || "Reader Review",
    comment: body.comment.trim(),
    verifiedPurchase,
  });

  if (!review) {
    return NextResponse.json({ error: "Book not found." }, { status: 404 });
  }

  return NextResponse.json({ review }, { status: 201 });
}

