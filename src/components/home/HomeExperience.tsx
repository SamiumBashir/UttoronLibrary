"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform } from "framer-motion";
import type { Author, Book, Testimonial } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import BookCard3D from "@/components/books/BookCard3D";
import BookCatalogClient from "@/components/books/BookCatalogClient";
import BookCoverArt from "@/components/books/BookCoverArt";
import { useStore } from "@/components/providers/StoreProvider";
import {
  ArrowDown,
  ArrowRight,
  Award,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Compass,
  Feather,
  Layers,
  Quote,
  ShoppingBag,
  Sparkles,
  X,
} from "lucide-react";

const MinimazeGalleryCanvas = dynamic(
  () => import("@/components/three/MinimazeGalleryCanvas"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-[#f5f4ef]">
        <div className="text-center">
          <div className="mx-auto h-3 w-3 animate-ping rounded-full bg-[#d93829]" />
          <p className="mt-4 font-mono text-xs uppercase tracking-[0.24em] text-[#62605a]">
            Entering 3D Exhibition Hall...
          </p>
        </div>
      </div>
    ),
  }
);

interface HomeExperienceProps {
  books: Book[];
  authors: Author[];
  testimonials: Testimonial[];
}

const GALLERY_WINGS = [
  {
    id: 0,
    code: "HALL 01",
    label: "Entrance Foyer",
    targetProgress: 0.02,
    subtitle: "Hanging Manifesto & Literary Threshold",
  },
  {
    id: 1,
    code: "HALL 02",
    label: "Lit Niches I",
    targetProgress: 0.28,
    subtitle: "Fiction, Cosmos & Delta Archives",
  },
  {
    id: 2,
    code: "CORNER",
    label: "The 90° Turn",
    targetProgress: 0.56,
    subtitle: "Turning Into the Contemporary Wing",
  },
  {
    id: 3,
    code: "WING 02",
    label: "Collector Alcoves",
    targetProgress: 0.86,
    subtitle: "Poetry, Systems & Archival Editions",
  },
];

const JOURNEY_STEPS = [
  {
    step: "01",
    title: "Manuscript Acquisition & Curatorial Reading",
    desc: "Every season, our editors read hundreds of submissions across fiction, science, and regional archives to discover singular, enduring voices.",
    icon: Feather,
  },
  {
    step: "02",
    title: "Structural & Line Craft",
    desc: "Authors collaborate closely with senior editors across three meticulous revision cycles, honoring rhythm, factual rigor, and voice.",
    icon: BookOpen,
  },
  {
    step: "03",
    title: "Typographic & Cover Architecture",
    desc: "Each edition receives custom page proportions, legible serif typesetting, and tactile geometric motifs stamped onto cloth boards.",
    icon: Compass,
  },
  {
    step: "04",
    title: "Archival Paper & Smyth-Sewn Binding",
    desc: "Printed on warm, acid-free 90gsm ivory stock with stitched signatures that open flat and endure for decades on your shelves.",
    icon: Layers,
  },
  {
    step: "05",
    title: "From Our Bindery to Your Library",
    desc: "Hand-wrapped in protective kraft sleeves and dispatched across Dhaka and nationwide with live parcel tracking.",
    icon: Sparkles,
  },
];

const GALLERY_SCROLL_KEY = "uttoron_gallery_scroll_y";

export default function HomeExperience({
  books,
  authors,
  testimonials,
}: HomeExperienceProps) {
  const { addToCart, notify } = useStore();
  const [zoomedBook, setZoomedBook] = useState<Book | null>(null);
  const [litAuthorId, setLitAuthorId] = useState<string | null>(null);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterLoading, setNewsletterLoading] = useState(false);

  // Minimaze-style 3D Corridor Walkthrough Scroll Track
  const galleryTrackRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress: galleryScrollProgress } = useScroll({
    target: galleryTrackRef,
    offset: ["start start", "end end"],
  });
  const [walkProgress, setWalkProgress] = useState(0);
  useMotionValueEvent(galleryScrollProgress, "change", (v) => {
    setWalkProgress(v);
  });

  // "Back on the Same Spot" state memory
  useEffect(() => {
    try {
      const savedY = sessionStorage.getItem(GALLERY_SCROLL_KEY);
      if (savedY) {
        const y = Number(savedY);
        if (!Number.isNaN(y) && y > 0) {
          requestAnimationFrame(() => window.scrollTo({ top: y, behavior: "auto" }));
        }
        sessionStorage.removeItem(GALLERY_SCROLL_KEY);
      }
    } catch {
      // ignore
    }
  }, []);

  const rememberSpotAndNavigate = () => {
    try {
      sessionStorage.setItem(GALLERY_SCROLL_KEY, String(window.scrollY));
    } catch {
      // ignore
    }
  };

  const jumpToGalleryWing = (targetP: number) => {
    const el = galleryTrackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const docTop = rect.top + window.scrollY;
    const maxScroll = Math.max(0, el.offsetHeight - window.innerHeight);
    window.scrollTo({
      top: docTop + maxScroll * targetP,
      behavior: "smooth",
    });
  };

  const activeWing =
    walkProgress < 0.18
      ? GALLERY_WINGS[0]
      : walkProgress < 0.45
      ? GALLERY_WINGS[1]
      : walkProgress < 0.72
      ? GALLERY_WINGS[2]
      : GALLERY_WINGS[3];

  // Publishing Journey vertical progress line
  const journeyRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress: journeyProgress } = useScroll({
    target: journeyRef,
    offset: ["start 0.8", "end 0.5"],
  });
  const journeyScaleY = useTransform(journeyProgress, [0, 1], [0, 1]);

  // Horizontal New Arrivals slider
  const arrivalsTrackRef = useRef<HTMLDivElement | null>(null);
  const scrollArrivals = (dir: -1 | 1) => {
    arrivalsTrackRef.current?.scrollBy({
      left: dir * 340,
      behavior: "smooth",
    });
  };

  const newArrivals = books.filter((b) => b.isNewArrival);
  const bestSellers = books.filter((b) => b.isBestSeller).slice(0, 4);
  const editorialPicks = books.filter((b) => b.isEditorialPick).slice(0, 4);

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setNewsletterLoading(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newsletterEmail }),
      });
      const data = (await res.json()) as { message?: string; error?: string };
      if (!res.ok) {
        notify(data.error || "Subscription failed.", "error");
      } else {
        notify(data.message || "Subscribed!", "success");
        setNewsletterEmail("");
      }
    } finally {
      setNewsletterLoading(false);
    }
  };

  return (
    <div className="bg-[#f6f5f0] text-[#141413] overflow-x-clip">
      {/* 1. MINIMAZE-LIGHT 3D VIRTUAL GALLERY CORRIDOR WALKTHROUGH */}
      <section ref={galleryTrackRef} className="relative h-[320vh] w-full">
        <div className="sticky top-0 h-screen w-full overflow-hidden bg-[#f5f4ef]">
          {/* Full-screen 3D Light Gallery Canvas */}
          <div className="absolute inset-0 z-0">
            <MinimazeGalleryCanvas
              books={books}
              progress={walkProgress}
              onInspectBook={(b) => setZoomedBook(b)}
            />
          </div>

          {/* Entrance Editorial Headline (fades gently as you walk deeper into the hall) */}
          <div
            className="pointer-events-none absolute inset-x-0 top-20 z-10 mx-auto max-w-7xl px-4 transition-all duration-500 sm:px-6 lg:px-8"
            style={{
              opacity: Math.max(0, 1 - walkProgress * 3.8),
              transform: `translateY(${-walkProgress * 80}px)`,
            }}
          >
            <div className="max-w-xl rounded-3xl border border-[#dedbd2]/90 bg-white/82 p-6 shadow-[0_24px_60px_rgba(20,20,19,0.08)] backdrop-blur-md sm:p-8">
              <div className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-[#62605a]">
                <span className="h-2 w-2 rounded-full bg-[#d93829]" />
                <span>Room 01 • Sunlit Architectural Gallery</span>
              </div>
              <h1 className="mt-3 font-serif text-4xl font-semibold leading-[1.03] tracking-tight text-[#141413] sm:text-5xl lg:text-6xl">
                Stories That Shape Worlds.
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-[#62605a] sm:text-base">
                Discover extraordinary stories, explore new perspectives, and experience
                the magic of reading with Uttoron Prokasoni.
              </p>

              <div className="pointer-events-auto mt-6 flex flex-wrap items-center gap-3">
                <Link
                  href="/books"
                  onClick={rememberSpotAndNavigate}
                  className="inline-flex items-center gap-2 rounded-full bg-[#141413] px-6 py-3 text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:bg-[#d93829]"
                >
                  Explore Books <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <a
                  href="#publications-archive"
                  className="inline-flex items-center gap-2 rounded-full border border-[#dedbd2] bg-white px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#141413] transition hover:border-[#141413]"
                >
                  Discover Our Publications
                </a>
              </div>
            </div>
          </div>

          {/* Minimaze Signature Edge-Floating Spatial HUD (Bottom Left) */}
          <div className="absolute bottom-5 left-4 right-4 z-20 mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-4 sm:px-4">
            <div className="rounded-2xl border border-[#dedbd2] bg-white/90 px-4 py-3 shadow-lg backdrop-blur-md">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#62605a]">
                <span className="h-2 w-2 rounded-full bg-[#d93829]" />
                <span>{activeWing.code}</span>
                <span>•</span>
                <span>{Math.round(walkProgress * 100)}% WALKED</span>
              </div>
              <p className="mt-0.5 font-serif text-lg font-semibold text-[#141413]">
                {activeWing.label} —{" "}
                <span className="font-sans text-xs font-normal text-[#62605a]">
                  {activeWing.subtitle}
                </span>
              </p>

              {/* Quick Corner & Wing Jump Pills */}
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {GALLERY_WINGS.map((wing) => {
                  const isCurrent = wing.id === activeWing.id;
                  return (
                    <button
                      key={wing.id}
                      type="button"
                      onClick={() => jumpToGalleryWing(wing.targetProgress)}
                      className={`rounded-full px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] transition ${
                        isCurrent
                          ? "bg-[#141413] text-white"
                          : "border border-[#dedbd2] bg-[#f6f5f0] text-[#62605a] hover:border-[#141413] hover:text-[#141413]"
                      }`}
                    >
                      {wing.label}
                    </button>
                  );
                })}
                <a
                  href="#publications-archive"
                  className="inline-flex items-center gap-1 rounded-full border border-[#d93829]/40 bg-[#d93829]/10 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[#d93829] hover:bg-[#d93829] hover:text-white"
                >
                  Skip to Grid <ArrowDown className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ZOOM-IN GALLERY EXHIBIT MODAL (Minimaze "Zoom-in Project View" + E-Commerce) */}
      <AnimatePresence>
        {zoomedBook && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoomedBook(null)}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-[#141413]/55 p-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 12 }}
              onClick={(e) => e.stopPropagation()}
              className="relative grid w-full max-w-3xl overflow-hidden rounded-3xl border border-[#dedbd2] bg-[#f6f5f0] shadow-2xl md:grid-cols-12"
            >
              <button
                type="button"
                aria-label="Close exhibition preview"
                onClick={() => setZoomedBook(null)}
                className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-[#dedbd2] bg-white text-[#141413] hover:border-[#141413]"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center justify-center bg-white p-8 md:col-span-5">
                <div className="perspective-1200">
                  <div
                    className="h-64 w-44 overflow-hidden rounded-r shadow-2xl"
                    style={{ transform: "rotateY(-16deg) rotateX(4deg)" }}
                  >
                    <BookCoverArt
                      title={zoomedBook.title}
                      authorName={zoomedBook.authorName}
                      category={zoomedBook.category}
                      palette={zoomedBook.coverPalette}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-between p-7 md:col-span-7">
                <div>
                  <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#62605a]">
                    <span className="h-2 w-2 rounded-full bg-[#d93829]" />
                    <span>{zoomedBook.category}</span>
                    <span>•</span>
                    <span>ISBN {zoomedBook.isbn}</span>
                  </div>
                  <h2 className="mt-2 font-serif text-3xl font-semibold text-[#141413]">
                    {zoomedBook.title}
                  </h2>
                  <p className="mt-1 text-sm font-medium text-[#62605a]">
                    {zoomedBook.authorName}
                  </p>
                  <p className="mt-4 text-sm leading-relaxed text-[#141413]/80">
                    {zoomedBook.description}
                  </p>
                </div>

                <div className="mt-6 border-t border-[#dedbd2] pt-5">
                  <div className="mb-4 flex items-baseline justify-between">
                    <span className="font-mono text-2xl font-bold text-[#141413]">
                      {formatPrice(zoomedBook.price)}
                    </span>
                    <span className="font-mono text-xs text-[#62605a]">
                      {zoomedBook.stock > 0
                        ? `${zoomedBook.stock} copies in bindery`
                        : "Out of stock"}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    <button
                      type="button"
                      disabled={zoomedBook.stock <= 0}
                      onClick={() => {
                        addToCart(zoomedBook, 1);
                        setZoomedBook(null);
                      }}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#141413] px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-[#d93829] disabled:opacity-40"
                    >
                      <ShoppingBag className="h-3.5 w-3.5" /> Add to Bag
                    </button>
                    <Link
                      href={`/books/${zoomedBook.slug}`}
                      onClick={rememberSpotAndNavigate}
                      className="inline-flex items-center justify-center gap-1.5 rounded-full border border-[#dedbd2] bg-white px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#141413] hover:border-[#141413]"
                    >
                      Full 3D View <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. ABOUT THE PUBLISHING HOUSE (SUNLIT ARCHITECTURAL MANIFESTO) */}
      <section className="paper-grain border-y border-[#dedbd2] bg-white py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-6"
            >
              <p className="inline-flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-[#62605a]">
                <span className="h-2 w-2 rounded-full bg-[#d93829]" />
                The Publishing House • Est. 1998
              </p>
              <h2 className="mt-3 font-serif text-4xl font-semibold leading-tight text-[#141413] sm:text-5xl">
                Where sunlit architecture meets enduring literature.
              </h2>
              <p className="mt-6 text-base leading-relaxed text-[#62605a]">
                Founded in Dhaka in 1998, Uttoron Prokasoni exists on a simple conviction:
                a book is not disposable content—it is a permanent room built of paper,
                ink, and memory.
              </p>
              <p className="mt-4 text-base leading-relaxed text-[#62605a]">
                From luminous literary fiction and monsoon poetry to rigorous treatises on
                delta hydrology and humane computing, every volume is edited with patience
                and bound for collectors.
              </p>
              <Link
                href="/about"
                className="mt-8 inline-flex items-center gap-2 border-b border-[#141413] pb-1 font-mono text-xs font-bold uppercase tracking-[0.18em] text-[#141413] transition hover:border-[#d93829] hover:text-[#d93829]"
              >
                Explore Our Interactive Studio <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: 0.08 }}
              className="grid gap-4 sm:grid-cols-3 lg:col-span-6"
            >
              {[
                {
                  metric: "28 Yrs",
                  label: "Literary Heritage",
                  note: "Independent publishing across South Asia",
                },
                {
                  metric: "420+",
                  label: "Archival Titles",
                  note: "Smyth-sewn cloth & acid-free editions",
                },
                {
                  metric: "94",
                  label: "Authors & Fellows",
                  note: "Novelists, scientists, poets & archivists",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-3xl border border-[#dedbd2] bg-[#f6f5f0] p-6"
                >
                  <p className="font-serif text-4xl font-bold text-[#141413]">
                    {stat.metric}
                  </p>
                  <p className="mt-2 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#d93829]">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-[#62605a]">
                    {stat.note}
                  </p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* 3. NEW ARRIVALS — HORIZONTAL INTERACTIVE 3D SHOWCASE */}
      <section id="publications-archive" className="border-b border-[#dedbd2] bg-[#eceae3]/55 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-[#62605a]">
                Fresh From the Bindery
              </p>
              <h2 className="mt-2 font-serif text-4xl font-semibold text-[#141413]">
                New Arrivals
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Scroll new arrivals left"
                onClick={() => scrollArrivals(-1)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#dedbd2] bg-white text-[#141413] transition hover:border-[#141413]"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                aria-label="Scroll new arrivals right"
                onClick={() => scrollArrivals(1)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#dedbd2] bg-white text-[#141413] transition hover:border-[#141413]"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div
            ref={arrivalsTrackRef}
            className="mt-8 flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4"
          >
            {newArrivals.map((book) => (
              <div
                key={book.id}
                className="w-[290px] shrink-0 snap-start sm:w-[305px]"
              >
                <BookCard3D book={book} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. INTERACTIVE BOOK COLLECTION (3D GRID + MINIMAZE HOVER-COVER INDEX) */}
      <section className="paper-grain bg-[#f6f5f0] py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-[#62605a]">
                Interactive Collection &amp; Work Index
              </p>
              <h2 className="mt-2 font-serif text-4xl font-semibold text-[#141413] sm:text-5xl">
                Explore the Archive
              </h2>
            </div>
            <Link
              href="/books"
              className="inline-flex items-center gap-2 rounded-full border border-[#dedbd2] bg-white px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-[#141413] transition hover:border-[#141413]"
            >
              Full Catalog <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <BookCatalogClient books={books} compactLimit={8} />
        </div>
      </section>

      {/* 5. BEST SELLERS & EDITORIAL PICKS */}
      <section className="border-y border-[#dedbd2] bg-white py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-14 lg:grid-cols-2">
            {/* Best Sellers */}
            <div>
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-[#d93829]">
                Reader Favorites
              </p>
              <h2 className="mt-2 font-serif text-4xl font-semibold text-[#141413]">
                Best Sellers
              </h2>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {bestSellers.map((book) => (
                  <Link
                    key={book.id}
                    href={`/books/${book.slug}`}
                    className="group flex flex-col justify-between rounded-2xl border border-[#dedbd2] bg-[#f6f5f0] p-5 transition hover:-translate-y-0.5 hover:border-[#141413] hover:bg-white"
                  >
                    <div>
                      <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#62605a]">
                        {book.category} • {book.soldCount} sold
                      </span>
                      <h3 className="mt-2 font-serif text-2xl font-semibold leading-snug text-[#141413] group-hover:text-[#d93829]">
                        {book.title}
                      </h3>
                      <p className="mt-1 text-xs text-[#62605a]">{book.authorName}</p>
                    </div>
                    <div className="mt-5 flex items-center justify-between border-t border-[#dedbd2] pt-3">
                      <span className="font-mono text-base font-bold text-[#141413]">
                        {formatPrice(book.price)}
                      </span>
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] text-[#62605a] group-hover:text-[#141413]">
                        Inspect 3D <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Editorial Picks */}
            <div>
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-[#62605a]">
                Curated by Our Editors
              </p>
              <h2 className="mt-2 font-serif text-4xl font-semibold text-[#141413]">
                Editorial Picks
              </h2>
              <div className="mt-8 space-y-4">
                {editorialPicks.map((book) => (
                  <Link
                    key={book.id}
                    href={`/books/${book.slug}`}
                    className="group flex items-center justify-between gap-4 rounded-2xl border border-[#dedbd2] bg-[#f6f5f0] p-5 transition hover:border-[#141413] hover:bg-white"
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#62605a]">
                        {book.publisherName} • {book.edition}
                      </p>
                      <h3 className="mt-1 truncate font-serif text-2xl font-semibold text-[#141413] group-hover:text-[#d93829]">
                        {book.title}
                      </h3>
                      <p className="mt-1 line-clamp-1 text-xs text-[#62605a]">
                        {book.description}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="block font-mono text-base font-bold text-[#141413]">
                        {formatPrice(book.price)}
                      </span>
                      <span className="mt-1 inline-flex items-center gap-1 font-mono text-[10px] text-[#d93829]">
                        Open <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FEATURED AUTHORS — PORTRAIT FRAMES UNDER INTERACTIVE GALLERY LAMPS */}
      <section className="bg-[#f6f5f0] py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-[#62605a]">
                Hover a Portrait Frame to Illuminate
              </p>
              <h2 className="mt-2 font-serif text-4xl font-semibold text-[#141413] sm:text-5xl">
                Featured Authors
              </h2>
            </div>
            <Link
              href="/authors"
              className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.16em] text-[#141413] hover:text-[#d93829]"
            >
              All Authors <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {authors.slice(0, 6).map((author) => {
              const isLit = litAuthorId === author.id;
              return (
                <Link
                  key={author.id}
                  href={`/authors/${author.slug}`}
                  onMouseEnter={() => setLitAuthorId(author.id)}
                  onMouseLeave={() => setLitAuthorId(null)}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-[#dedbd2] bg-white p-6 pt-8 transition hover:-translate-y-1 hover:border-[#141413] hover:shadow-xl"
                >
                  {/* Overhead Gallery Lamp Fixture + Warm Cone */}
                  <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col items-center">
                    <div className="h-1.5 w-14 rounded-b-full bg-[#141413]" />
                    <div
                      className="h-24 w-44 transition-opacity duration-300"
                      style={{
                        opacity: isLit ? 0.55 : 0.14,
                        background:
                          "radial-gradient(ellipse at top, rgba(255, 224, 150, 0.7), transparent 72%)",
                      }}
                    />
                  </div>

                  <div className="relative z-10">
                    <div className="flex items-center gap-4">
                      <div
                        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-[#dedbd2] font-serif text-2xl font-bold shadow-inner"
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
                        <h3 className="font-serif text-2xl font-semibold text-[#141413] group-hover:text-[#d93829]">
                          {author.name}
                        </h3>
                        <p className="font-mono text-[11px] font-medium text-[#62605a]">
                          {author.roleTitle}
                        </p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-relaxed text-[#62605a]">
                      {author.bio}
                    </p>
                  </div>

                  <div className="relative z-10 mt-5 border-t border-[#eceae3] pt-4">
                    {author.awards[0] && (
                      <p className="flex items-center gap-1.5 font-mono text-[11px] text-[#62605a]">
                        <Award className="h-3.5 w-3.5 text-[#d93829]" />
                        {author.awards[0]}
                      </p>
                    )}
                    <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#141413] group-hover:text-[#d93829]">
                      Author Biography <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. PUBLISHING JOURNEY — SCROLL TIMELINE */}
      <section ref={journeyRef} className="border-t border-[#dedbd2] bg-[#eceae3]/55 py-20 lg:py-28">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.26em] text-[#62605a]">
              From Manuscript to Heirloom
            </p>
            <h2 className="mt-2 font-serif text-4xl font-semibold text-[#141413] sm:text-5xl">
              The Publishing Journey
            </h2>
          </div>

          <div className="relative mt-14 pl-8 sm:pl-12">
            <div className="absolute bottom-4 left-3 top-4 w-[2px] bg-[#dedbd2] sm:left-5" />
            <motion.div
              style={{ scaleY: journeyScaleY, transformOrigin: "top" }}
              className="absolute bottom-4 left-3 top-4 w-[2px] bg-[#d93829] sm:left-5"
            />

            <div className="space-y-8">
              {JOURNEY_STEPS.map((item) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.step}
                    initial={{ opacity: 0, x: -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ duration: 0.5 }}
                    className="relative rounded-3xl border border-[#dedbd2] bg-white p-6 shadow-xs sm:p-8"
                  >
                    <span className="absolute -left-[33px] top-7 flex h-7 w-7 items-center justify-center rounded-full border border-[#141413] bg-[#141413] font-mono text-[10px] font-bold text-white sm:-left-[41px]">
                      {item.step}
                    </span>
                    <div className="flex items-start gap-4">
                      <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#dedbd2] bg-[#f6f5f0] text-[#141413] sm:flex">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-serif text-2xl font-semibold text-[#141413]">
                          {item.title}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-[#62605a]">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 8. TESTIMONIALS */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-[#62605a]">
              Critical &amp; Reader Praise
            </p>
            <h2 className="mt-2 font-serif text-4xl font-semibold text-[#141413]">
              Words From Our Readers
            </h2>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <blockquote
                key={t.id}
                className="flex flex-col justify-between rounded-3xl border border-[#dedbd2] bg-[#f6f5f0] p-7"
              >
                <div>
                  <Quote className="h-6 w-6 text-[#d93829]" />
                  <p className="mt-4 font-serif text-xl italic leading-relaxed text-[#141413]">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                </div>
                <footer className="mt-6 border-t border-[#dedbd2] pt-4">
                  <p className="font-semibold text-[#141413]">{t.name}</p>
                  <p className="text-xs text-[#62605a]">{t.role}</p>
                  <p className="mt-1 font-mono text-[10px] font-medium uppercase text-[#d93829]">
                    On {t.bookTitle}
                  </p>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* 9. NEWSLETTER INVITATION */}
      <section className="border-t border-[#dedbd2] bg-[#141413] py-20 text-[#f6f5f0]">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-[#d93829]">
            Seasonal Literary Letter
          </p>
          <h2 className="mt-3 font-serif text-4xl font-semibold sm:text-5xl">
            Receive First Editions &amp; Gallery Salons.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-[#f6f5f0]/70">
            Join readers receiving quiet dispatches on forthcoming clothbound editions,
            signed collector prints, and evening book launches in Dhaka.
          </p>

          <form
            onSubmit={handleNewsletter}
            className="mx-auto mt-8 flex max-w-lg flex-col gap-3 sm:flex-row"
          >
            <input
              type="email"
              required
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              placeholder="Your email address"
              aria-label="Email address for newsletter"
              className="flex-1 rounded-full border border-white/20 bg-white/10 px-6 py-3.5 text-sm text-white placeholder:text-white/50 focus:border-[#d93829] focus:outline-none"
            />
            <button
              type="submit"
              disabled={newsletterLoading}
              className="rounded-full bg-[#d93829] px-8 py-3.5 text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:bg-[#b72d20] disabled:opacity-60"
            >
              {newsletterLoading ? "Joining..." : "Subscribe"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
