import { notFound } from "next/navigation";
import { findBookBySlugOrId, readStore } from "@/lib/db";
import BookDetailClient from "@/components/books/BookDetailClient";

export const dynamic = "force-dynamic";

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const store = readStore();
  const book = findBookBySlugOrId(store, slug);
  if (!book) {
    notFound();
  }

  const author = store.authors.find((a) => a.id === book.authorId) ?? null;
  const reviews = store.reviews.filter((r) => r.bookId === book.id);
  const relatedBooks = store.books
    .filter((b) => b.id !== book.id && (b.category === book.category || b.authorId === book.authorId))
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

