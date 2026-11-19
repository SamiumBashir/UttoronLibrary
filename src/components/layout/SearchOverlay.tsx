"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useStore } from "@/components/providers/StoreProvider";
import type { Book } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import BookCoverArt from "@/components/books/BookCoverArt";
import { ArrowRight, Search, X } from "lucide-react";

export default function SearchOverlay() {
  const { isSearchOpen, setSearchOpen } = useStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(!isSearchOpen);
      }
      if (e.key === "Escape" && isSearchOpen) {
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isSearchOpen, setSearchOpen]);

  useEffect(() => {
    if (!isSearchOpen) return;
    let active = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/books?q=${encodeURIComponent(query.trim())}`
        );
        if (res.ok && active) {
          const data = (await res.json()) as { books: Book[] };
          setResults(data.books.slice(0, 6));
        }
      } finally {
        if (active) setLoading(false);
      }
    }, 180);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, isSearchOpen]);

  return (
    <AnimatePresence>
      {isSearchOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-start justify-center bg-[#141413]/45 px-4 pt-20 backdrop-blur-md"
          onClick={() => setSearchOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl overflow-hidden rounded-[2rem] border border-[#dedbd2] bg-[#f6f5f0] shadow-2xl"
          >
            <div className="flex items-center gap-3 border-b border-[#dedbd2] bg-white px-5 py-4">
              <Search className="h-5 w-5 text-[#d93829]" />
              <input
                type="search"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="বইয়ের নাম, লেখক, আইএসবিএন বা বিষয় দিয়ে খুঁজুন..."
                className="flex-1 bg-transparent text-base text-[#141413] placeholder:text-[#62605a]/70 focus:outline-none"
              />
              <button
                type="button"
                aria-label="অনুসন্ধান বন্ধ করুন"
                onClick={() => setSearchOpen(false)}
                className="cursor-pointer rounded-full p-1.5 text-[#62605a] hover:bg-[#eceae3] hover:text-[#141413]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-4">
              {loading ? (
                <p className="py-8 text-center text-sm text-[#62605a]">
                  উত্তরণ প্রকাশনীর বইসমগ্র অনুসন্ধান করা হচ্ছে...
                </p>
              ) : results.length === 0 ? (
                <p className="py-8 text-center text-sm text-[#62605a]">
                  “{query}” দিয়ে কোনো বই পাওয়া যায়নি। ভিন্ন কোনো বইয়ের নাম বা লেখক দিয়ে চেষ্টা করুন।
                </p>
              ) : (
                <div className="grid gap-2.5">
                  {results.map((book) => (
                    <Link
                      key={book.id}
                      href={`/books/${book.slug}`}
                      onClick={() => setSearchOpen(false)}
                      className="cursor-pointer flex items-center gap-4 rounded-2xl border border-transparent bg-white/75 p-2.5 transition hover:border-[#dedbd2] hover:bg-white"
                    >
                      <div className="h-16 w-11 shrink-0 overflow-hidden rounded-r shadow-md">
                        <BookCoverArt
                          title={book.title}
                          authorName={book.authorName}
                          category={book.category}
                          palette={book.coverPalette}
                          compact
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-[#d93829]">
                          {book.category} • আইএসবিএন {book.isbn}
                        </p>
                        <h4 className="truncate font-serif text-lg font-bold text-[#141413]">
                          {book.title}
                        </h4>
                        <p className="truncate text-xs text-[#62605a]">
                          {book.authorName}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-serif text-base font-bold text-[#141413]">
                          {formatPrice(book.price)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-[#dedbd2] bg-[#eceae3] px-5 py-3 text-xs text-[#62605a]">
              <span>Esc চাপলে বন্ধ হবে</span>
              <Link
                href={query ? `/books?q=${encodeURIComponent(query)}` : "/books"}
                onClick={() => setSearchOpen(false)}
                className="inline-flex cursor-pointer items-center gap-1 font-bold text-[#141413] hover:text-[#d93829]"
              >
                সম্পূর্ণ ক্যাটালগ দেখুন <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

