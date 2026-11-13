import Link from "next/link";
import { readStore } from "@/lib/db";
import { ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Categories",
};

export default function CategoriesPage() {
  const store = readStore();

  return (
    <div className="paper-grain min-h-screen bg-[#f6f5f0] pb-24 pt-28 text-[#141413]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="max-w-2xl">
          <p className="inline-flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.26em] text-[#62605a]">
            <span className="h-2 w-2 rounded-full bg-[#d93829]" />
            Library Wings
          </p>
          <h1 className="mt-2 font-serif text-4xl font-semibold text-[#141413] sm:text-5xl">
            Curated Categories
          </h1>
          <p className="mt-3 text-base text-[#62605a]">
            Explore nine literary and scholarly wings curated by the Uttoron Prokasoni
            editorial board.
          </p>
        </header>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {store.categories.map((cat) => {
            const count = store.books.filter((b) => b.category === cat.name).length;
            return (
              <Link
                key={cat.id}
                href={`/books?category=${encodeURIComponent(cat.name)}`}
                className="group flex flex-col justify-between rounded-3xl border border-[#dedbd2] bg-white p-7 transition hover:-translate-y-1 hover:border-[#141413] hover:shadow-xl"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: cat.accentColor }}
                    />
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[#62605a]">
                      {count} {count === 1 ? "Title" : "Titles"}
                    </span>
                  </div>
                  <h2 className="mt-4 font-serif text-3xl font-semibold text-[#141413] group-hover:text-[#d93829]">
                    {cat.name}
                  </h2>
                  <p className="mt-2 text-sm text-[#62605a]">{cat.description}</p>
                  <p className="mt-3 text-xs italic text-[#62605a]/80">
                    {cat.editorialNote}
                  </p>
                </div>

                <div className="mt-6 flex items-center gap-1.5 border-t border-[#eceae3] pt-4 font-mono text-xs font-bold uppercase tracking-[0.16em] text-[#141413] group-hover:text-[#d93829]">
                  Enter Wing <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

