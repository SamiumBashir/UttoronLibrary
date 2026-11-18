import Link from "next/link";
import { readStore } from "@/lib/db";
import { getAuthorsFromDb, getBooksFromDb } from "@/lib/db-postgres";
import { ArrowRight, Award } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Authors",
};

export default async function AuthorsPage() {
  const store = readStore();
  const dbAuthors = await getAuthorsFromDb();
  const authors = dbAuthors && dbAuthors.length > 0 ? dbAuthors : store.authors;
  const dbBooks = await getBooksFromDb();
  const books = dbBooks && dbBooks.length > 0 ? dbBooks : store.books;

  return (
    <div className="paper-grain min-h-screen bg-[#f6f5f0] pb-24 pt-20 sm:pt-28 text-[#141413]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="max-w-2xl">
          <p className="inline-flex items-center gap-2 font-mono text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.26em] text-[#62605a]">
            <span className="h-2 w-2 rounded-full bg-[#d93829]" />
            Literary Roster
          </p>
          <h1 className="mt-1.5 sm:mt-2 font-serif text-2xl xs:text-3xl sm:text-4xl sm:text-5xl font-semibold text-[#141413]">
            Authors &amp; Fellows
          </h1>
          <p className="mt-2 sm:mt-3 text-xs sm:text-base text-[#62605a]">
            Novelists, astrophysicists, archivists, poets, and systems thinkers shaping
            Uttoron Prokasoni&apos;s catalog.
          </p>
        </header>

        <div className="mt-8 sm:mt-12 grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {authors.map((author) => {
            const authoredCount = books.filter(
              (b) => b.authorId === author.id
            ).length;
            return (
              <Link
                key={author.id}
                href={`/authors/${author.slug}`}
                className="group flex flex-col justify-between rounded-2xl sm:rounded-3xl border border-[#dedbd2] bg-white p-5 sm:p-7 transition hover:-translate-y-1 hover:border-[#141413] hover:shadow-xl"
              >
                <div>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div
                      className="flex h-12 w-12 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl border border-[#dedbd2] font-serif text-lg sm:text-2xl font-bold"
                      style={{
                        background: `linear-gradient(135deg, ${author.portraitColors[0]}, ${author.portraitColors[1]})`,
                        color: author.portraitColors[2],
                      }}
                    >
                      {author.name
                        .split(" ")
                        .slice(0, 2)
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <h2 className="font-serif text-lg sm:text-2xl font-semibold text-[#141413] group-hover:text-[#d93829]">
                        {author.name}
                      </h2>
                      <p className="font-mono text-[10px] sm:text-[11px] font-medium text-[#62605a]">
                        {author.roleTitle}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 sm:mt-4 text-xs sm:text-sm leading-relaxed text-[#62605a] line-clamp-3 sm:line-clamp-none">
                    {author.bio}
                  </p>
                </div>

                <div className="mt-5 sm:mt-6 flex items-center justify-between border-t border-[#eceae3] pt-3.5 sm:pt-4 text-xs">
                  <span className="inline-flex items-center gap-1 font-mono text-[10px] sm:text-[11px] text-[#62605a]">
                    <Award className="h-3.5 w-3.5 text-[#d93829]" />
                    {authoredCount} {authoredCount === 1 ? "Volume" : "Volumes"}
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-[#141413] group-hover:text-[#d93829]">
                    Read Bio <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
