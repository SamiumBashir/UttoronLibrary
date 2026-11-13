import { NextResponse } from "next/server";
import crypto from "crypto";
import { readStore, updateStore } from "@/lib/db";
import { getBooksFromDb } from "@/lib/db-postgres";
import { getAuthenticatedUser } from "@/lib/auth";
import type { Book, BookCategory } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const sort = searchParams.get("sort") || "newest";
  const q = (searchParams.get("q") || "").trim().toLowerCase();
  const flag = searchParams.get("flag"); // new | bestseller | editorial

  const store = readStore();
  const dbBooks = await getBooksFromDb();
  let books = [...(dbBooks && dbBooks.length > 0 ? dbBooks : store.books)];

  if (category && category !== "All") {
    books = books.filter(
      (b) => b.category.toLowerCase() === category.toLowerCase()
    );
  }

  if (flag === "new") books = books.filter((b) => b.isNewArrival);
  if (flag === "bestseller") books = books.filter((b) => b.isBestSeller);
  if (flag === "editorial") books = books.filter((b) => b.isEditorialPick);

  if (q) {
    books = books.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.authorName.toLowerCase().includes(q) ||
        b.isbn.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q) ||
        b.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  if (sort === "bestselling") {
    books.sort((a, b) => b.soldCount - a.soldCount);
  } else if (sort === "price-asc") {
    books.sort((a, b) => a.price - b.price);
  } else if (sort === "price-desc") {
    books.sort((a, b) => b.price - a.price);
  } else {
    books.sort(
      (a, b) =>
        new Date(b.publicationDate).getTime() - new Date(a.publicationDate).getTime()
    );
  }

  return NextResponse.json({ books, total: books.length });
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json(
      { error: "Admin authentication required to publish books." },
      { status: 403 }
    );
  }

  const body = (await request.json()) as Partial<Book>;
  if (!body.title || !body.authorName || !body.category || !body.price) {
    return NextResponse.json(
      { error: "Title, authorName, category, and price are required." },
      { status: 400 }
    );
  }

  const slug =
    body.slug ||
    body.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  const created = updateStore((store) => {
    const newBook: Book = {
      id: `book-${crypto.randomUUID().slice(0, 8)}`,
      slug,
      title: body.title!,
      subtitle: body.subtitle || "",
      isbn: body.isbn || `978-984-${Math.floor(1000 + Math.random() * 9000)}-0`,
      authorId: body.authorId || store.authors[0]?.id || "auth-ananya",
      authorName: body.authorName!,
      publisherId: body.publisherId || "pub-uttoron",
      publisherName: body.publisherName || "Uttoron Prokasoni",
      category: body.category as BookCategory,
      tags: body.tags || [body.category!.toLowerCase()],
      description: body.description || "An editorial release from Uttoron Prokasoni.",
      longDescription: body.longDescription || body.description || "",
      publicationDate: body.publicationDate || new Date().toISOString().slice(0, 10),
      pages: Number(body.pages) || 240,
      language: body.language || "English",
      edition: body.edition || "First Edition",
      binding: body.binding || "Hardcover",
      dimensions: body.dimensions || "145 × 220 mm",
      originalPrice: Number(body.originalPrice) || Number(body.price),
      price: Number(body.price),
      stock: Number(body.stock ?? 15),
      soldCount: 0,
      rating: 5.0,
      reviewCount: 0,
      isNewArrival: Boolean(body.isNewArrival ?? true),
      isBestSeller: Boolean(body.isBestSeller ?? false),
      isEditorialPick: Boolean(body.isEditorialPick ?? false),
      coverPalette: body.coverPalette || {
        primary: "#0E281F",
        secondary: "#173D30",
        accent: "#D6B87A",
        text: "#F6F1E7",
        pattern: "arch",
      },
      spineColor: body.spineColor || "#0B2019",
      createdAt: new Date().toISOString(),
    };
    store.books.unshift(newBook);
    return newBook;
  });

  return NextResponse.json({ book: created }, { status: 201 });
}

