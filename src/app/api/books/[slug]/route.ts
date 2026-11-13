import { NextResponse } from "next/server";
import { findBookBySlugOrId, readStore, updateStore } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth";
import type { Book } from "@/lib/types";

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
  const author = store.authors.find((a) => a.id === book.authorId) ?? null;
  const reviews = store.reviews.filter((r) => r.bookId === book.id);
  const related = store.books
    .filter((b) => b.id !== book.id && b.category === book.category)
    .slice(0, 4);

  return NextResponse.json({ book, author, reviews, related });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }
  const { slug } = await context.params;
  const patch = (await request.json()) as Partial<Book>;

  const updated = updateStore((store) => {
    const book = findBookBySlugOrId(store, slug);
    if (!book) return null;
    Object.assign(book, {
      ...(patch.title !== undefined ? { title: patch.title } : {}),
      ...(patch.price !== undefined ? { price: Number(patch.price) } : {}),
      ...(patch.originalPrice !== undefined
        ? { originalPrice: Number(patch.originalPrice) }
        : {}),
      ...(patch.stock !== undefined ? { stock: Math.max(0, Number(patch.stock)) } : {}),
      ...(patch.isNewArrival !== undefined ? { isNewArrival: patch.isNewArrival } : {}),
      ...(patch.isBestSeller !== undefined ? { isBestSeller: patch.isBestSeller } : {}),
      ...(patch.isEditorialPick !== undefined
        ? { isEditorialPick: patch.isEditorialPick }
        : {}),
      ...(patch.description !== undefined ? { description: patch.description } : {}),
    });
    return book;
  });

  if (!updated) {
    return NextResponse.json({ error: "Book not found." }, { status: 404 });
  }
  return NextResponse.json({ book: updated });
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }
  const { slug } = await context.params;
  const removed = updateStore((store) => {
    const idx = store.books.findIndex((b) => b.slug === slug || b.id === slug);
    if (idx < 0) return false;
    store.books.splice(idx, 1);
    return true;
  });
  if (!removed) {
    return NextResponse.json({ error: "Book not found." }, { status: 404 });
  }
  return NextResponse.json({ deleted: true });
}

