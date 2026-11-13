import { readStore } from "@/lib/db";
import HomeExperience from "@/components/home/HomeExperience";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const store = readStore();
  return (
    <HomeExperience
      books={store.books}
      authors={store.authors}
      testimonials={store.testimonials}
    />
  );
}

