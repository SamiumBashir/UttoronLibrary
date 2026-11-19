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
    <div className="paper-grain min-h-screen bg-[#f6f5f0] pb-24 pt-20 sm:pt-28 text-[#141413]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="max-w-2xl">
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#62605a]">
            <span className="h-2 w-2 rounded-full bg-[#d93829]" />
            বিষয়শ্রেণী ও গ্রন্থমালা
          </p>
          <h1 className="mt-1.5 sm:mt-2 font-serif text-2xl xs:text-3xl sm:text-4xl sm:text-5xl font-bold text-[#141413]">
            বিষয়ভিত্তিক গ্রন্থসম্ভার
          </h1>
          <p className="mt-2 sm:mt-3 text-xs sm:text-base text-[#62605a]">
            উত্তরণ প্রকাশনীর সম্পাদকীয় পর্ষদ কর্তৃক সুবিন্যস্ত সাহিত্য, ইতিহাস, কবিতা, দর্শন ও বিজ্ঞানের শ্রেষ্ঠ গ্রন্থমালা।
          </p>
        </header>

        <div className="mt-8 sm:mt-12 grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {store.categories.map((cat) => {
            const count = store.books.filter((b) => b.category === cat.name).length;
            return (
              <Link
                key={cat.id}
                href={`/books?category=${encodeURIComponent(cat.name)}`}
                className="group flex cursor-pointer flex-col justify-between rounded-2xl sm:rounded-3xl border border-[#dedbd2] bg-white p-5 sm:p-7 transition hover:-translate-y-1 hover:border-[#141413] hover:shadow-xl shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full"
                      style={{ backgroundColor: cat.accentColor }}
                    />
                    <span className="text-xs font-bold text-[#62605a]">
                      {count}টি বই
                    </span>
                  </div>
                  <h2 className="mt-3 sm:mt-4 font-serif text-xl sm:text-2xl font-bold text-[#141413] group-hover:text-[#d93829]">
                    {cat.name}
                  </h2>
                  <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-[#62605a] leading-relaxed">{cat.description}</p>
                  <p className="mt-2 sm:mt-3 text-xs text-[#62605a]/80">
                    {cat.editorialNote}
                  </p>
                </div>

                <div className="mt-5 sm:mt-6 flex items-center gap-1.5 border-t border-[#eceae3] pt-3.5 sm:pt-4 text-xs font-bold text-[#141413] group-hover:text-[#d93829]">
                  বইগুলো দেখুন <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

