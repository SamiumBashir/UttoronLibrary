import { readStore } from "@/lib/db";
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

  return (
    <div className="paper-grain min-h-screen bg-[#f6f5f0] pb-24 pt-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="mb-10 max-w-2xl">
          <p className="inline-flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.26em] text-[#62605a]">
            <span className="h-2 w-2 rounded-full bg-[#d93829]" />
            The Complete Archive
          </p>
          <h1 className="mt-2 font-serif text-4xl font-semibold text-[#141413] sm:text-5xl">
            Interactive Book Collection
          </h1>
          <p className="mt-3 text-base text-[#62605a]">
            Switch between 3D Gallery Grid and Hover-Preview Index, or open any volume in
            full 360° 3D.
          </p>
        </header>

        <BookCatalogClient
          books={store.books}
          initialCategory={sp.category || "All"}
          initialQuery={sp.q || ""}
        />
      </div>
    </div>
  );
}

