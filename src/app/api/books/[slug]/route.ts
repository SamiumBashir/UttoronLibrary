import { NextResponse } from "next/server";
import { findBookBySlugOrId, readStore, updateStore } from "@/lib/db";
import { getBookBySlugFromDb } from "@/lib/db-postgres";
import { getAuthenticatedUser } from "@/lib/auth";
import { isDatabaseConnected, prisma } from "@/lib/prisma";
import type { Book } from "@/lib/types";

export async function GET(
  _req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;

  // 1. Try PostgreSQL database first
  let book = await getBookBySlugFromDb(slug);

  // 2. Fallback to file/memory store
  const store = readStore();
  if (!book) {
    book = findBookBySlugOrId(store, slug) ?? null;
  }

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

  let patch: Partial<Book>;
  try {
    patch = (await request.json()) as typeof patch;
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  // Update in file store
  const updated = updateStore((store) => {
    const targetBook = findBookBySlugOrId(store, slug);
    if (!targetBook) return null;
    Object.assign(targetBook, {
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
    return targetBook;
  });

  // Update in PostgreSQL if connected
  if (isDatabaseConnected()) {
    try {
      await prisma.book.updateMany({
        where: { OR: [{ slug }, { id: slug }] },
        data: {
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
        },
      });
    } catch (err) {
      console.warn("[PostgreSQL] Book update error:", err);
    }
  }

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

  if (isDatabaseConnected()) {
    try {
      await prisma.book.deleteMany({
        where: { OR: [{ slug }, { id: slug }] },
      });
    } catch (err) {
      console.warn("[PostgreSQL] Book delete error:", err);
    }
  }

  if (!removed) {
    return NextResponse.json({ error: "Book not found." }, { status: 404 });
  }
  return NextResponse.json({ deleted: true });
}
