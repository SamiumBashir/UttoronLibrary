"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import type { Book } from "@/lib/types";
import { formatPrice, getDiscountPercent, getStockBadge } from "@/lib/format";
import { useStore } from "@/components/providers/StoreProvider";
import BookCoverArt from "@/components/books/BookCoverArt";
import { Eye, Heart, ShoppingBag } from "lucide-react";

interface BookCard3DProps {
  book: Book;
}

export default function BookCard3D({ book }: BookCard3DProps) {
  const { addToCart, toggleWishlist, isInWishlist } = useStore();
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: -10 });
  const [hovered, setHovered] = useState(false);

  const wishlisted = isInWishlist(book.id);
  const discount = getDiscountPercent(book.originalPrice, book.price);
  const stockBadge = getStockBadge(book.stock);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({
      rx: Number((-py * 14).toFixed(2)),
      ry: Number((-22 + px * 26).toFixed(2)),
    });
  };

  const handleMouseEnter = () => {
    setHovered(true);
    setTilt({ rx: 3, ry: -22 });
  };

  const handleMouseLeave = () => {
    setHovered(false);
    setTilt({ rx: 0, ry: -10 });
  };

  return (
    <article
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group relative flex flex-col rounded-2xl border border-[#dedbd2] bg-white p-4 transition-all duration-300 hover:-translate-y-1.5 hover:border-[#141413] hover:shadow-[0_24px_48px_-16px_rgba(20,20,19,0.14)]"
    >
      {/* Top plaque metadata & Wishlist */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[10px] font-medium uppercase ${
            stockBadge.tone === "out"
              ? "bg-red-50 text-red-700"
              : stockBadge.tone === "low"
              ? "bg-amber-50 text-amber-800"
              : "bg-[#eceae3] text-[#141413]"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              stockBadge.tone === "out"
                ? "bg-red-600"
                : stockBadge.tone === "low"
                ? "bg-amber-600"
                : "bg-[#1b6b46]"
            }`}
          />
          {stockBadge.label}
        </span>

        <div className="flex items-center gap-1.5">
          {discount > 0 && (
            <span className="rounded-full bg-[#d93829]/10 px-2 py-0.5 font-mono text-[10px] font-bold text-[#d93829]">
              -{discount}%
            </span>
          )}
          <button
            type="button"
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            onClick={() => void toggleWishlist(book.id, book.title)}
            className={`flex h-8 w-8 items-center justify-center rounded-full border transition ${
              wishlisted
                ? "border-[#d93829] bg-[#d93829] text-white"
                : "border-[#dedbd2] bg-[#f6f5f0] text-[#62605a] hover:border-[#141413] hover:text-[#141413]"
            }`}
          >
            <Heart className={`h-3.5 w-3.5 ${wishlisted ? "fill-current" : ""}`} />
          </button>
        </div>
      </div>

      {/* Sunlit Museum Alcove 3D Book Mockup Stage */}
      <Link
        href={`/books/${book.slug}`}
        className="perspective-1200 relative mx-auto my-1 flex h-64 w-full items-center justify-center rounded-xl bg-[#f6f5f0]"
      >
        {/* Floor Cast Shadow */}
        <div
          aria-hidden="true"
          className="absolute bottom-3 h-5 w-36 rounded-full bg-black/20 blur-md transition-all duration-500"
          style={{
            transform: hovered ? "scale(1.1) translateX(6px)" : "scale(0.95)",
            opacity: hovered ? 0.3 : 0.16,
          }}
        />

        {/* Physical 3D Book Box */}
        <div
          className="preserve-3d relative h-52 w-36 transition-transform duration-300 ease-out will-change-transform"
          style={{
            transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) translateZ(${
              hovered ? 12 : 0
            }px)`,
          }}
        >
          {/* Front Cover */}
          <div
            className="absolute inset-0 overflow-hidden rounded-r-[4px] shadow-xl"
            style={{ transform: "translateZ(13px)" }}
          >
            <BookCoverArt
              title={book.title}
              authorName={book.authorName}
              category={book.category}
              palette={book.coverPalette}
            />
          </div>

          {/* 3D Left Spine */}
          <div
            aria-hidden="true"
            className="absolute inset-y-0 left-0 flex w-[26px] items-center justify-center overflow-hidden rounded-l-[2px]"
            style={{
              backgroundColor: book.spineColor || book.coverPalette.primary,
              transform: "rotateY(-90deg) translateZ(13px)",
              borderRight: `1px solid ${book.coverPalette.accent}44`,
            }}
          >
            <span
              className="whitespace-nowrap font-serif text-[8px] tracking-[0.16em] uppercase"
              style={{
                color: book.coverPalette.text,
                writingMode: "vertical-rl",
                transform: "rotate(180deg)",
              }}
            >
              {book.title.slice(0, 26)}
            </span>
          </div>

          {/* 3D Right Page Block Thickness */}
          <div
            aria-hidden="true"
            className="absolute inset-y-[3px] right-[2px] w-[22px]"
            style={{
              background:
                "repeating-linear-gradient(90deg, #f4ecdc 0px, #f4ecdc 2px, #dfd2bc 2px, #dfd2bc 3px)",
              transform: "rotateY(90deg) translateZ(60px)",
            }}
          />

          {/* Back Cover */}
          <div
            aria-hidden="true"
            className="absolute inset-0 rounded-l-[4px]"
            style={{
              backgroundColor: book.coverPalette.secondary,
              transform: "rotateY(180deg) translateZ(13px)",
            }}
          />
        </div>
      </Link>

      {/* Book Plaque Metadata */}
      <div className="mt-4 flex flex-1 flex-col">
        <div className="flex items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#62605a]">
          <span>{book.category}</span>
          <span>{book.pages} PP</span>
        </div>

        <Link href={`/books/${book.slug}`} className="mt-1.5 block">
          <h3 className="font-serif text-xl font-semibold leading-snug text-[#141413] transition group-hover:text-[#d93829] line-clamp-2">
            {book.title}
          </h3>
        </Link>
        <p className="mt-0.5 text-xs font-medium text-[#62605a]">{book.authorName}</p>

        {/* Price & Actions */}
        <div className="mt-auto pt-4">
          <div className="mb-3 flex items-baseline gap-2">
            <span className="font-mono text-lg font-bold text-[#141413]">
              {formatPrice(book.price)}
            </span>
            {book.originalPrice > book.price && (
              <span className="font-mono text-xs text-[#62605a]/65 line-through">
                {formatPrice(book.originalPrice)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={book.stock <= 0}
              onClick={() => addToCart(book, 1)}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#141413] px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-[#d93829] disabled:cursor-not-allowed disabled:opacity-45"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              {book.stock > 0 ? "Add to Bag" : "Sold Out"}
            </button>
            <Link
              href={`/books/${book.slug}`}
              aria-label={`View details for ${book.title}`}
              className="inline-flex items-center justify-center gap-1 rounded-full border border-[#dedbd2] bg-[#f6f5f0] px-3.5 py-2.5 text-xs font-semibold text-[#141413] transition hover:border-[#141413] hover:bg-white"
            >
              <Eye className="h-3.5 w-3.5" />
              3D
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
