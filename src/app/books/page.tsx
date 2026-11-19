import { readStore } from "@/lib/db";
import { getBooksFromDb } from "@/lib/db-postgres";
import BookCatalogClient from "@/components/books/BookCatalogClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Book Collection",
  description:
    "Browse Uttoron Prokasoni's 3D interactive catalog across fiction, science, history, technology, poetry, and archival editions.",
};

export default async function BooksPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const store = readStore();
  const dbBooks = await getBooksFromDb();
  const books = dbBooks && dbBooks.length > 0 ? dbBooks : store.books;

  return (
    <div className="paper-grain min-h-screen bg-[#F8F7F3] pb-24 pt-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="mb-10 max-w-2xl">
          <p className="inline-flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.26em] text-[#77736D]">
            <span className="h-2 w-2 rounded-full bg-[#722F37]" />
            The Complete Archive
          </p>
          <h1 className="mt-2 font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#252525]">
            Curated Literary Archive
          </h1>
          <p className="mt-3 text-sm sm:text-base text-[#77736D]">
            Explore physical editions designed with archival typography, smyth-sewn binding, and tactile elegance.
          </p>
        </header>

        <BookCatalogClient
          books={books}
          initialCategory={sp.category || "All"}
          initialQuery={sp.q || ""}
        />
      </div>
    </div>
  );
}
