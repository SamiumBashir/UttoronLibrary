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
            className="w-full max-w-2xl overflow-hidden rounded-2xl border border-[#DDD9D1] bg-[#F8F7F3] shadow-2xl"
          >
            <div className="flex items-center gap-3 border-b border-[#DDD9D1] bg-white px-5 py-4">
              <Search className="h-5 w-5 text-[#722F37]" />
              <input
                type="search"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by book title, author, ISBN, or category..."
                className="flex-1 bg-transparent text-base text-[#252525] placeholder:text-[#77736D]/70 focus:outline-none"
              />
              <button
                type="button"
                aria-label="Close search"
                onClick={() => setSearchOpen(false)}
                className="rounded-full p-1.5 text-[#77736D] hover:bg-[#E9E6DF] hover:text-[#252525]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-4">
              {loading ? (
                <p className="py-8 text-center text-sm text-[#77736D]">
                  Searching the Uttoron catalog...
                </p>
              ) : results.length === 0 ? (
                <p className="py-8 text-center text-sm text-[#77736D]">
                  No volumes matched &ldquo;{query}&rdquo;. Try another title, author, or ISBN.
                </p>
              ) : (
                <div className="grid gap-2.5">
                  {results.map((book) => (
                    <Link
                      key={book.id}
                      href={`/books/${book.slug}`}
                      onClick={() => setSearchOpen(false)}
                      className="flex items-center gap-4 rounded-xl border border-transparent bg-white p-2.5 transition hover:border-[#DDD9D1] hover:shadow-xs"
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
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#722F37]">
                          {book.category} • {book.isbn}
                        </p>
                        <h4 className="truncate font-serif text-lg font-semibold text-[#252525]">
                          {book.title}
                        </h4>
                        <p className="truncate text-xs text-[#77736D]">
                          {book.authorName}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-base font-bold text-[#252525]">
                          {formatPrice(book.price)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-[#dedbd2] bg-[#eceae3] px-5 py-3 text-xs text-[#62605a]">
              <span>Press Esc to close</span>
              <Link
                href={query ? `/books?q=${encodeURIComponent(query)}` : "/books"}
                onClick={() => setSearchOpen(false)}
                className="inline-flex items-center gap-1 font-semibold text-[#141413] hover:text-[#d93829]"
              >
                Explore full catalog <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

