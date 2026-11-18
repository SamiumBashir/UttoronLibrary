import { readStore } from "@/lib/db";
import { getBooksFromDb, getAuthorsFromDb } from "@/lib/db-postgres";
import HomeExperience from "@/components/home/HomeExperience";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const store = readStore();
  const dbBooks = await getBooksFromDb();
  const books = dbBooks && dbBooks.length > 0 ? dbBooks : store.books;
  const dbAuthors = await getAuthorsFromDb();
  const authors = dbAuthors && dbAuthors.length > 0 ? dbAuthors : store.authors;

  return (
    <HomeExperience
      books={books}
      authors={authors}
      testimonials={store.testimonials}
    />
  );
}
