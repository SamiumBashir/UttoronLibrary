import { notFound } from "next/navigation";
import Link from "next/link";
import { findAuthorBySlugOrId, readStore } from "@/lib/db";
import { getAuthorsFromDb, getBooksFromDb } from "@/lib/db-postgres";
import BookCard3D from "@/components/books/BookCard3D";
import { Award, Quote } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AuthorDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const store = readStore();
  const dbAuthors = await getAuthorsFromDb();
  const allAuthors = dbAuthors && dbAuthors.length > 0 ? dbAuthors : store.authors;
  const author = allAuthors.find((a) => a.slug === slug || a.id === slug) || findAuthorBySlugOrId(store, slug);
  if (!author) notFound();

  const dbBooks = await getBooksFromDb();
  const allBooks = dbBooks && dbBooks.length > 0 ? dbBooks : store.books;
  const works = allBooks.filter((b) => b.authorId === author.id);

  return (
    <div className="paper-grain min-h-screen bg-[#F8F7F3] pb-24 pt-28 text-[#252525]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 font-mono text-xs text-[#77736D]">
          <Link href="/authors" className="hover:text-[#252525]">
            ← Back to Authors
          </Link>
        </div>

        <section className="grid gap-10 rounded-2xl border border-[#DDD9D1] bg-white p-8 text-[#252525] shadow-sm sm:p-12 lg:grid-cols-12">
          <div className="flex flex-col items-start lg:col-span-4">
            <div
              className="flex h-32 w-32 items-center justify-center rounded-2xl border border-[#DDD9D1] font-serif text-5xl font-bold shadow-md"
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
            <p className="mt-5 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.22em] text-[#77736D]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#722F37]" />
              {author.nationality}
            </p>
            <h1 className="mt-1 font-serif text-3xl sm:text-4xl font-semibold text-[#252525]">{author.name}</h1>
            <p className="mt-1 text-sm text-[#77736D]">{author.roleTitle}</p>

            {author.awards.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {author.awards.map((award) => (
                  <span
                    key={award}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#DDD9D1] bg-[#F8F7F3] px-3 py-1 font-mono text-xs text-[#252525]"
                  >
                    <Award className="h-3.5 w-3.5 text-[#722F37]" /> {award}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col justify-between lg:col-span-8">
            <div>
              <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.24em] text-[#77736D]">
                Biography
              </h2>
              <p className="mt-4 text-sm sm:text-base leading-relaxed text-[#77736D]">
                {author.longBio}
              </p>
            </div>

            <blockquote className="mt-8 rounded-xl border border-[#DDD9D1] bg-[#F8F7F3] p-6">
              <Quote className="h-5 w-5 text-[#722F37]" />
              <p className="mt-2 font-serif text-xl sm:text-2xl italic text-[#252525]">
                &ldquo;{author.quote}&rdquo;
              </p>
            </blockquote>
          </div>
        </section>

        <section className="mt-16">
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#252525]">
            Published Editions by {author.name}
          </h2>
          <div className="mt-8 grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4 items-stretch">
            {works.map((book) => (
              <BookCard3D key={book.id} book={book} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
