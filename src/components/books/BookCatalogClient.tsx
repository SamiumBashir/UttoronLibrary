"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import type { Book } from "@/lib/types";
import { BOOK_CATEGORIES } from "@/lib/types";
import { formatPrice, getStockBadge } from "@/lib/format";
import { useStore } from "@/components/providers/StoreProvider";
import BookCard3D from "@/components/books/BookCard3D";
import BookCoverArt from "@/components/books/BookCoverArt";
import { ArrowUpDown, ArrowUpRight, LayoutGrid, List, Search, ShoppingBag, X } from "lucide-react";

interface BookCatalogClientProps {
  books: Book[];
  initialCategory?: string;
  initialQuery?: string;
  compactLimit?: number;
}

type SortOption = "newest" | "bestselling" | "price-asc" | "price-desc";
type ViewMode = "grid" | "index";

export default function BookCatalogClient({
  books,
  initialCategory = "All",
  initialQuery = "",
  compactLimit,
}: BookCatalogClientProps) {
  const { addToCart } = useStore();
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [searchQuery, setSearchQuery] = useState<string>(initialQuery);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [hoveredRowBook, setHoveredRowBook] = useState<Book | null>(null);

  const categories = ["All", ...BOOK_CATEGORIES];

  const filteredBooks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = books.filter((b) => {
      const catOk =
        selectedCategory === "All" ||
        b.category.toLowerCase() === selectedCategory.toLowerCase();
      if (!catOk) return false;
      if (!q) return true;
      return (
        b.title.toLowerCase().includes(q) ||
        b.authorName.toLowerCase().includes(q) ||
        b.isbn.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q) ||
        b.tags.some((t) => t.toLowerCase().includes(q))
      );
    });

    list = [...list];
    if (sortBy === "bestselling") {
      list.sort((a, b) => b.soldCount - a.soldCount);
    } else if (sortBy === "price-asc") {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      list.sort((a, b) => b.price - a.price);
    } else {
      list.sort(
        (a, b) =>
          new Date(b.publicationDate).getTime() -
          new Date(a.publicationDate).getTime()
      );
    }

    return compactLimit ? list.slice(0, compactLimit) : list;
  }, [books, selectedCategory, sortBy, searchQuery, compactLimit]);

  return (
    <div>
      {/* Search + Sort + Grid/Index View Switcher */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#dedbd2] bg-white p-3.5 shadow-xs md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#62605a]" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, author, ISBN, or category..."
            aria-label="Search book catalog"
            className="w-full rounded-xl border border-[#dedbd2] bg-[#f6f5f0] py-2.5 pl-10 pr-9 text-sm text-[#141413] placeholder:text-[#62605a] focus:border-[#141413] focus:bg-white focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#62605a] hover:text-[#141413]"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-[#d93829]" />
            <label htmlFor="catalog-sort" className="font-mono text-xs text-[#62605a]">
              SORT:
            </label>
            <select
              id="catalog-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="rounded-xl border border-[#dedbd2] bg-[#f6f5f0] px-3 py-2 text-xs font-semibold text-[#141413] focus:border-[#141413] focus:outline-none"
            >
              <option value="newest">Newest</option>
              <option value="bestselling">Best Selling</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>

          {/* Minimaze Grid vs Work Index Toggle */}
          <div className="inline-flex rounded-xl border border-[#dedbd2] bg-[#f6f5f0] p-1">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              aria-label="3D Grid View"
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${viewMode === "grid"
                ? "bg-[#141413] text-white"
                : "text-[#62605a] hover:text-[#141413]"
                }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              3D Grid
            </button>
            <button
              type="button"
              onClick={() => setViewMode("index")}
              aria-label="Gallery Index View"
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${viewMode === "index"
                ? "bg-[#141413] text-white"
                : "text-[#62605a] hover:text-[#141413]"
                }`}
            >
              <List className="h-3.5 w-3.5" />
              Index
            </button>
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div
        role="tablist"
        aria-label="Book categories"
        className="mt-4 sm:mt-5 flex gap-2 overflow-x-auto pb-2 scrollbar-none sm:flex-wrap"
      >
        {categories.map((cat) => {
          const active = selectedCategory.toLowerCase() === cat.toLowerCase();
          return (
            <button
              key={cat}
              role="tab"
              aria-selected={active}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`shrink-0 rounded-full px-3.5 sm:px-4 py-1.5 sm:py-2 font-mono text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.12em] transition ${active
                ? "bg-[#141413] text-white shadow-sm"
                : "border border-[#dedbd2] bg-white text-[#62605a] hover:border-[#141413] hover:text-[#141413]"
                }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Results */}
      {filteredBooks.length === 0 ? (
        <div className="mt-12 rounded-3xl border border-[#dedbd2] bg-white px-6 py-16 text-center">
          <p className="font-serif text-2xl font-semibold text-[#141413]">
            No volumes matched your filter
          </p>
          <p className="mt-2 text-sm text-[#62605a]">
            Reset the category or search query to browse our complete archive.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory("All");
              setSearchQuery("");
            }}
            className="mt-5 rounded-full bg-[#141413] px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-white"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="mt-6 sm:mt-8 grid grid-cols-2 gap-3 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-stretch">
          {filteredBooks.map((book) => (
            <BookCard3D key={book.id} book={book} />
          ))}
        </div>
      ) : (
        /* Minimaze-Inspired Index List with Live Hover Cover Preview */
        <div className="relative mt-6 sm:mt-8 grid gap-8 lg:grid-cols-12">
          <div className="divide-y divide-[#dedbd2] rounded-3xl border border-[#dedbd2] bg-white lg:col-span-8">
            {filteredBooks.map((book, idx) => {
              const badge = getStockBadge(book.stock);
              return (
                <div
                  key={book.id}
                  onMouseEnter={() => setHoveredRowBook(book)}
                  className="group flex flex-wrap items-center justify-between gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 sm:py-4 transition hover:bg-[#f6f5f0]"
                >
                  <div className="flex min-w-0 items-baseline gap-3 sm:gap-4">
                    <span className="font-mono text-xs text-[#d93829]">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <Link
                        href={`/books/${book.slug}`}
                        className="block truncate font-serif text-base sm:text-2xl font-semibold text-[#141413] group-hover:text-[#d93829]"
                      >
                        {book.title}
                      </Link>
                      <p className="font-mono text-[10px] sm:text-[11px] text-[#62605a]">
                        {book.authorName} • {book.category} • {badge.label}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-[#141413]">
                      {formatPrice(book.price)}
                    </span>
                    <button
                      type="button"
                      disabled={book.stock <= 0}
                      onClick={() => addToCart(book, 1)}
                      aria-label={`Add ${book.title} to bag`}
                      className="rounded-full border border-[#dedbd2] bg-white p-2 text-[#141413] transition hover:border-[#141413] hover:bg-[#141413] hover:text-white disabled:opacity-40"
                    >
                      <ShoppingBag className="h-3.5 w-3.5" />
                    </button>
                    <Link
                      href={`/books/${book.slug}`}
                      aria-label={`Open ${book.title}`}
                      className="rounded-full bg-[#141413] p-2 text-white transition hover:bg-[#d93829]"
                    >
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sticky Hover Cover Preview Stage */}
          <aside className="hidden lg:col-span-4 lg:block">
            <div className="sticky top-28 rounded-3xl border border-[#dedbd2] bg-white p-6 text-center">
              {(() => {
                const preview = hoveredRowBook || filteredBooks[0];
                return (
                  <>
                    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#62605a]">
                      Archive Cover Preview
                    </p>
                    <div className="perspective-1200 mx-auto my-6 flex h-72 items-center justify-center rounded-2xl bg-[#f6f5f0]">
                      <div
                        className="h-56 w-38 overflow-hidden rounded-r shadow-2xl transition-transform duration-300"
                        style={{ transform: "rotateY(-14deg) rotateX(4deg)" }}
                      >
                        <BookCoverArt
                          title={preview.title}
                          authorName={preview.authorName}
                          category={preview.category}
                          palette={preview.coverPalette}
                        />
                      </div>
                    </div>
                    <h3 className="font-serif text-2xl font-semibold text-[#141413]">
                      {preview.title}
                    </h3>
                    <p className="mt-1 text-xs text-[#62605a]">{preview.authorName}</p>
                    <Link
                      href={`/books/${preview.slug}`}
                      className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-[#141413] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#d93829]"
                    >
                      Inspect 3D Edition <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </>
                );
              })()}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
