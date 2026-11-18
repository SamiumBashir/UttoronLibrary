import { notFound } from "next/navigation";
import { findBookBySlugOrId, readStore } from "@/lib/db";
import { getBookBySlugFromDb } from "@/lib/db-postgres";
import BookDetailClient from "@/components/books/BookDetailClient";

export const dynamic = "force-dynamic";

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // 1. Try PostgreSQL database first
  let book = await getBookBySlugFromDb(slug);

  // 2. Fallback to file/memory store
  const store = readStore();
  if (!book) {
    book = findBookBySlugOrId(store, slug) ?? null;
  }

  if (!book) {
    notFound();
  }

  const author = store.authors.find((a) => a.id === book!.authorId) ?? null;
  const reviews = store.reviews.filter((r) => r.bookId === book!.id);
  const relatedBooks = store.books
    .filter((b) => b.id !== book!.id && (b.category === book!.category || b.authorId === book!.authorId))
    .slice(0, 4);

  return (
    <BookDetailClient
      book={book}
      author={author}
      initialReviews={reviews}
      relatedBooks={relatedBooks}
    />
  );
}
