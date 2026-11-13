"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Author, Book, Review } from "@/lib/types";
import { formatPrice, getDiscountPercent, getStockBadge } from "@/lib/format";
import { useStore } from "@/components/providers/StoreProvider";
import BookCoverArt from "@/components/books/BookCoverArt";
import BookCard3D from "@/components/books/BookCard3D";
import {
  ArrowRight,
  BookOpen,
  Check,
  Heart,
  Minus,
  Plus,
  ShoppingBag,
  Star,
  Zap,
} from "lucide-react";

const BookDetail3DCanvas = dynamic(
  () => import("@/components/three/BookDetail3DCanvas"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[480px] items-center justify-center rounded-3xl bg-[#0d221a] text-xs uppercase tracking-[0.22em] text-[#d6b87a]/75">
        Loading 3D Edition...
      </div>
    ),
  }
);

interface BookDetailClientProps {
  book: Book;
  author: Author | null;
  initialReviews: Review[];
  relatedBooks: Book[];
}

export default function BookDetailClient({
  book,
  author,
  initialReviews,
  relatedBooks,
}: BookDetailClientProps) {
  const router = useRouter();
  const { addToCart, toggleWishlist, isInWishlist, user, notify } = useStore();
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState<Review[]>(initialReviews);

  // Review form state
  const [reviewerName, setReviewerName] = useState(user?.name || "");
  const [rating, setRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const wishlisted = isInWishlist(book.id);
  const discount = getDiscountPercent(book.originalPrice, book.price);
  const stockBadge = getStockBadge(book.stock);

  const handleBuyNow = () => {
    if (book.stock <= 0) return;
    addToCart(book, quantity, false);
    router.push("/checkout");
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName.trim() || !reviewComment.trim()) return;
    setSubmittingReview(true);
    try {
      const res = await fetch(`/api/books/${book.slug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewerName,
          rating,
          title: reviewTitle,
          comment: reviewComment,
        }),
      });
      const data = (await res.json()) as { review?: Review; error?: string };
      if (!res.ok || !data.review) {
        notify(data.error || "Could not submit review.", "error");
      } else {
        setReviews((prev) => [data.review!, ...prev]);
        setReviewTitle("");
        setReviewComment("");
        notify("Thank you! Your review has been published.", "success");
      }
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="paper-grain bg-[#f6f5f0] pb-24 pt-28 text-[#141413]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-2 text-xs text-[#62605a]">
          <Link href="/" className="hover:text-[#141413]">Home</Link>
          <span>/</span>
          <Link href="/books" className="hover:text-[#141413]">Books</Link>
          <span>/</span>
          <Link
            href={`/books?category=${encodeURIComponent(book.category)}`}
            className="hover:text-[#141413]"
          >
            {book.category}
          </Link>
          <span>/</span>
          <span className="truncate font-medium text-[#141413]">{book.title}</span>
        </nav>

        {/* Main 2-Column Stage */}
        <div className="grid gap-12 lg:grid-cols-12">
          {/* LEFT: Interactive 3D Book Model + Visual Previews */}
          <div className="lg:col-span-6">
            <BookDetail3DCanvas book={book} />

            {/* Additional Plate Previews (Front / Spine / Back) */}
            <div className="mt-5 grid grid-cols-3 gap-4">
              <div className="rounded-2xl border border-[#dedbd2] bg-white p-3 text-center">
                <div className="mx-auto aspect-[2/3] w-20 overflow-hidden rounded-r shadow-md">
                  <BookCoverArt
                    title={book.title}
                    authorName={book.authorName}
                    category={book.category}
                    palette={book.coverPalette}
                    compact
                  />
                </div>
                <p className="mt-2 text-[11px] font-semibold text-[#141413]">Front Cover</p>
              </div>

              <div className="flex flex-col items-center justify-between rounded-2xl border border-[#dedbd2] bg-white p-3 text-center">
                <div
                  className="mx-auto flex h-28 w-7 items-center justify-center rounded shadow-md"
                  style={{ backgroundColor: book.spineColor }}
                >
                  <span
                    className="font-serif text-[8px] tracking-widest uppercase"
                    style={{
                      color: book.coverPalette.text,
                      writingMode: "vertical-rl",
                    }}
                  >
                    {book.title.slice(0, 18)}
                  </span>
                </div>
                <p className="mt-2 text-[11px] font-semibold text-[#141413]">Cloth Spine</p>
              </div>

              <div className="rounded-2xl border border-[#dedbd2] bg-white p-3 text-center">
                <div
                  className="mx-auto flex aspect-[2/3] w-20 flex-col justify-between rounded-l p-2 shadow-md"
                  style={{
                    backgroundColor: book.coverPalette.secondary,
                    color: book.coverPalette.text,
                  }}
                >
                  <span className="text-[6px] uppercase tracking-widest opacity-80">
                    {book.publisherName}
                  </span>
                  <span className="text-[6px] leading-tight opacity-75 line-clamp-4">
                    {book.description}
                  </span>
                  <span className="bg-white/90 px-1 py-0.5 font-mono text-[5px] text-black">
                    {book.isbn}
                  </span>
                </div>
                <p className="mt-2 text-[11px] font-semibold text-[#141413]">Back &amp; ISBN</p>
              </div>
            </div>
          </div>

          {/* RIGHT: Book Metadata & Purchase Actions */}
          <div className="lg:col-span-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#dedbd2] bg-white px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#141413]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#d93829]" />
                {book.category}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  stockBadge.tone === "out"
                    ? "bg-red-50 text-[#d93829]"
                    : stockBadge.tone === "low"
                    ? "bg-amber-50 text-amber-800"
                    : "bg-[#eceae3] text-[#141413]"
                }`}
              >
                {stockBadge.label} ({book.stock} available)
              </span>
              {book.rating > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#62605a]">
                  <Star className="h-3.5 w-3.5 fill-[#d93829] text-[#d93829]" />
                  {book.rating} ({reviews.length} reviews)
                </span>
              )}
            </div>

            <h1 className="mt-4 font-serif text-4xl font-semibold leading-tight text-[#141413] sm:text-5xl">
              {book.title}
            </h1>
            {book.subtitle && (
              <p className="mt-2 font-serif text-xl italic text-[#62605a]">
                {book.subtitle}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[#62605a]">
              <span>
                By{" "}
                {author ? (
                  <Link
                    href={`/authors/${author.slug}`}
                    className="font-semibold text-[#141413] underline decoration-[#d93829] underline-offset-4 hover:text-[#d93829]"
                  >
                    {book.authorName}
                  </Link>
                ) : (
                  <strong className="text-[#141413]">{book.authorName}</strong>
                )}
              </span>
              <span>
                Publisher: <strong className="text-[#141413]">{book.publisherName}</strong>
              </span>
            </div>

            <p className="mt-6 text-base leading-relaxed text-[#62605a]">
              {book.description}
            </p>

            {/* Quick Spec Grid */}
            <div className="mt-6 grid grid-cols-2 gap-3 rounded-2xl border border-[#dedbd2] bg-white p-4 text-xs sm:grid-cols-4">
              <div>
                <span className="block text-[#62605a]">ISBN</span>
                <span className="mt-0.5 block font-mono font-semibold text-[#141413]">
                  {book.isbn}
                </span>
              </div>
              <div>
                <span className="block text-[#62605a]">Published</span>
                <span className="mt-0.5 block font-semibold text-[#141413]">
                  {book.publicationDate}
                </span>
              </div>
              <div>
                <span className="block text-[#62605a]">Pages</span>
                <span className="mt-0.5 block font-semibold text-[#141413]">
                  {book.pages} pages
                </span>
              </div>
              <div>
                <span className="block text-[#62605a]">Language</span>
                <span className="mt-0.5 block font-semibold text-[#141413]">
                  {book.language}
                </span>
              </div>
            </div>

            {/* Pricing Block */}
            <div className="mt-8 flex items-baseline gap-3">
              <span className="font-serif text-4xl font-bold text-[#141413]">
                {formatPrice(book.price)}
              </span>
              {book.originalPrice > book.price && (
                <>
                  <span className="text-lg text-[#62605a]/70 line-through">
                    {formatPrice(book.originalPrice)}
                  </span>
                  <span className="rounded-full bg-[#d93829]/10 px-3 py-1 text-xs font-bold text-[#d93829]">
                    Save {discount}%
                  </span>
                </>
              )}
            </div>

            {/* Quantity + Cart / Buy Now / Wishlist */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center rounded-full border border-[#dedbd2] bg-white px-2 py-1">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  disabled={quantity <= 1 || book.stock <= 0}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-2 text-[#141413] disabled:opacity-40"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="min-w-8 text-center text-sm font-bold text-[#141413]">
                  {quantity}
                </span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  disabled={quantity >= book.stock || book.stock <= 0}
                  onClick={() => setQuantity((q) => Math.min(book.stock, q + 1))}
                  className="p-2 text-[#141413] disabled:opacity-40"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <button
                type="button"
                disabled={book.stock <= 0}
                onClick={() => addToCart(book, quantity)}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#141413] px-6 py-3.5 text-xs font-bold uppercase tracking-[0.16em] text-white shadow-lg transition hover:bg-[#d93829] disabled:cursor-not-allowed disabled:opacity-45"
              >
                <ShoppingBag className="h-4 w-4" />
                {book.stock > 0 ? "Add to Cart" : "Out of Stock"}
              </button>

              <button
                type="button"
                disabled={book.stock <= 0}
                onClick={handleBuyNow}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#dedbd2] bg-white px-6 py-3.5 text-xs font-bold uppercase tracking-[0.16em] text-[#141413] transition hover:border-[#141413] disabled:cursor-not-allowed disabled:opacity-45"
              >
                <Zap className="h-4 w-4 text-[#d93829]" />
                Buy Now
              </button>

              <button
                type="button"
                aria-label={wishlisted ? "Saved in wishlist" : "Add to wishlist"}
                onClick={() => void toggleWishlist(book.id, book.title)}
                className={`inline-flex items-center justify-center gap-2 rounded-full border px-4 py-3.5 text-xs font-semibold transition ${
                  wishlisted
                    ? "border-[#d93829] bg-[#141413] text-white"
                    : "border-[#dedbd2] bg-white text-[#141413] hover:border-[#141413]"
                }`}
              >
                <Heart className={`h-4 w-4 ${wishlisted ? "fill-[#d93829] text-[#d93829]" : ""}`} />
                <span className="hidden sm:inline">
                  {wishlisted ? "Wishlisted" : "Wishlist"}
                </span>
              </button>
            </div>

            <div className="mt-6 flex flex-wrap gap-4 border-t border-[#dedbd2] pt-5 text-xs text-[#62605a]">
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-[#d93829]" /> Acid-free archival paper
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-[#d93829]" /> Free delivery over ৳2,000
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-[#d93829]" /> 7-day collector return policy
              </span>
            </div>
          </div>
        </div>

        {/* Lower Editorial Sections: Description, Specs, Author, Reviews */}
        <div className="mt-20 grid gap-10 lg:grid-cols-12">
          <div className="space-y-10 lg:col-span-7">
            <section className="rounded-[2rem] border border-[#dedbd2] bg-white p-7 sm:p-9">
              <h2 className="font-serif text-3xl font-semibold text-[#141413]">
                About This Edition
              </h2>
              <div className="mt-4 space-y-4 text-base leading-relaxed text-[#62605a] whitespace-pre-line">
                {book.longDescription}
              </div>
            </section>

            <section className="rounded-[2rem] border border-[#dedbd2] bg-white p-7 sm:p-9">
              <h2 className="font-serif text-3xl font-semibold text-[#141413]">
                Book Specifications
              </h2>
              <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
                {[
                  ["Edition", book.edition],
                  ["Binding", book.binding],
                  ["Dimensions", book.dimensions],
                  ["Page Count", `${book.pages} pages`],
                  ["ISBN-13", book.isbn],
                  ["Publisher", book.publisherName],
                  ["Language", book.language],
                  ["Publication Date", book.publicationDate],
                ].map(([label, val]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between border-b border-[#dedbd2] pb-2.5"
                  >
                    <dt className="text-[#62605a]">{label}</dt>
                    <dd className="font-semibold text-[#141413]">{val}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </div>

          {/* Right Lower Column: Author + Reviews */}
          <div className="space-y-10 lg:col-span-5">
            {author && (
              <section className="rounded-[2rem] border border-[#dedbd2] bg-[#eceae3] p-7 text-[#141413]">
                <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#62605a]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#d93829]" />
                  About the Author
                </p>
                <div className="mt-4 flex items-center gap-4">
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-2xl font-serif text-xl font-bold shadow-sm"
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
                    <h3 className="font-serif text-2xl font-semibold text-[#141413]">{author.name}</h3>
                    <p className="text-xs text-[#62605a]">{author.roleTitle}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-[#62605a]">
                  {author.longBio}
                </p>
                <Link
                  href={`/authors/${author.slug}`}
                  className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#141413] hover:text-[#d93829]"
                >
                  Author Profile &amp; Works <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </section>
            )}

            {/* Customer Reviews */}
            <section className="rounded-[2rem] border border-[#dedbd2] bg-white p-7">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-3xl font-semibold text-[#141413]">
                  Reader Reviews
                </h2>
                <span className="inline-flex items-center gap-1 text-sm font-bold text-[#141413]">
                  <Star className="h-4 w-4 fill-[#d93829] text-[#d93829]" />
                  {book.rating}
                </span>
              </div>

              <div className="mt-5 space-y-4">
                {reviews.length === 0 ? (
                  <p className="text-sm text-[#62605a]">
                    Be the first reader to share a reflection on this edition.
                  </p>
                ) : (
                  reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="rounded-2xl border border-[#dedbd2] bg-[#f6f5f0] p-4"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-sm text-[#141413]">
                          {rev.reviewerName}
                        </span>
                        <span className="inline-flex items-center gap-0.5 text-[#d93829]">
                          {Array.from({ length: rev.rating }).map((_, i) => (
                            <Star key={i} className="h-3.5 w-3.5 fill-current" />
                          ))}
                        </span>
                      </div>
                      <p className="mt-1 font-serif text-base font-semibold text-[#141413]">
                        {rev.title}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-[#62605a]">
                        {rev.comment}
                      </p>
                      {rev.verifiedPurchase && (
                        <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#141413]">
                          <BookOpen className="h-3 w-3 text-[#d93829]" /> Verified Reader
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Write a Review Form */}
              <form
                onSubmit={handleReviewSubmit}
                className="mt-6 space-y-3 border-t border-[#dedbd2] pt-5"
              >
                <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-[#62605a]">
                  Add Your Review
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    type="text"
                    required
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    placeholder="Your name"
                    className="rounded-xl border border-[#dedbd2] bg-[#f6f5f0] px-3.5 py-2 text-xs text-[#141413] focus:border-[#141413] focus:outline-none"
                  />
                  <select
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    aria-label="Rating"
                    className="rounded-xl border border-[#dedbd2] bg-[#f6f5f0] px-3.5 py-2 text-xs text-[#141413] focus:border-[#141413] focus:outline-none"
                  >
                    <option value={5}>5 Stars — Extraordinary</option>
                    <option value={4}>4 Stars — Recommended</option>
                    <option value={3}>3 Stars — Good</option>
                    <option value={2}>2 Stars — Fair</option>
                    <option value={1}>1 Star — Needs work</option>
                  </select>
                </div>
                <input
                  type="text"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  placeholder="Headline (optional)"
                  className="w-full rounded-xl border border-[#dedbd2] bg-[#f6f5f0] px-3.5 py-2 text-xs text-[#141413] focus:border-[#141413] focus:outline-none"
                />
                <textarea
                  required
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share your thoughts on this book..."
                  className="w-full rounded-xl border border-[#dedbd2] bg-[#f6f5f0] px-3.5 py-2 text-xs text-[#141413] focus:border-[#141413] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="rounded-full bg-[#141413] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#d93829] disabled:opacity-60"
                >
                  {submittingReview ? "Publishing..." : "Submit Review"}
                </button>
              </form>
            </section>
          </div>
        </div>

        {/* Related Books */}
        {relatedBooks.length > 0 && (
          <section className="mt-20">
            <div className="flex items-end justify-between">
              <div>
                <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#62605a]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#d93829]" />
                  Companion Volumes
                </p>
                <h2 className="mt-1 font-serif text-3xl font-semibold text-[#141413]">
                  Related in {book.category}
                </h2>
              </div>
              <Link
                href={`/books?category=${encodeURIComponent(book.category)}`}
                className="text-xs font-semibold uppercase tracking-[0.16em] text-[#141413] hover:text-[#d93829]"
              >
                Browse All
              </Link>
            </div>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {relatedBooks.map((rel) => (
                <BookCard3D key={rel.id} book={rel} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

