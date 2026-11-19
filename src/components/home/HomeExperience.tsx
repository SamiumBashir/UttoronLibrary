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

const JOURNEY_STEPS = [
  {
    step: "০১",
    title: "পাণ্ডুলিপি নির্বাচন ও মূল্যায়ন",
    desc: "প্রতি মৌসুমে সাহিত্য, বিজ্ঞান, ইতিহাস ও দর্শনের শত শত পাণ্ডুলিপি থেকে আমরা মৌলিক ও কালজয়ী রচনাগুলো যত্নসহকারে নির্বাচন করি।",
    icon: Feather,
  },
  {
    step: "০২",
    title: "নিবিড় সম্পাদনা ও প্রুফরিডিং",
    desc: "লেখক ও অভিজ্ঞ সম্পাদকমণ্ডলীর যৌথ নিবিড় প্রচেষ্টায় প্রতিটি বাক্য, বানান ও তথ্যের নিখুঁত মান নিশ্চিত করা হয়।",
    icon: BookOpen,
  },
  {
    step: "০৩",
    title: "নান্দনিক প্রচ্ছদ ও মুদ্রণ পরিকল্পনা",
    desc: "বইয়ের ভেতরের ভাবনার সাথে সঙ্গতি রেখে তৈরি হয় বিশিষ্ট শিল্পীদের আঁকা প্রচ্ছদ ও বাংলা হরফের সুবিন্যস্ত সজ্জা।",
    icon: Compass,
  },
  {
    step: "০৪",
    title: "উন্নত কাগজ ও টেকসই বাঁধাই",
    desc: "দীর্ঘকাল পাঠ ও স্থায়ী সংরক্ষণের জন্য উচ্চমানের অ্যাসিড-মুক্ত কাগজ এবং মজবুত সুতা বাঁধাই ব্যবহার করা হয়।",
    icon: Layers,
  },
  {
    step: "০৫",
    title: "দেশব্যাপী সুরক্ষিত ও দ্রুত ডেলিভারি",
    desc: "প্যাকেজিংয়ের সর্বোচ্চ নিরাপত্তা বজায় রেখে ঢাকা ও সারা বাংলাদেশের যেকোনো প্রান্তে পৌঁছে দেওয়া হয় কাঙ্ক্ষিত বই।",
    icon: ShoppingBag,
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

  // Stepping inside publishing house transition progress
  const exitProgress = Math.max(0, Math.min(1, (walkProgress - 0.78) / 0.22));

  return (
    <div className="bg-[#f6f5f0] text-[#141413] overflow-x-clip">
      {/* 1. 3D VIRTUAL GALLERY CORRIDOR WALKTHROUGH */}
      <section ref={galleryTrackRef} className="relative h-[135vh] md:h-[160vh] w-full">
        <div className="sticky top-0 h-[100dvh] w-full overflow-hidden bg-[#f5f4ef]">
          {/* Full-screen 3D Light Gallery Canvas with smooth forward zoom upon entering */}
          <div
            className="absolute inset-0 z-0 origin-center transition-transform duration-150 ease-out"
            style={{
              transform: `scale(${1 + exitProgress * 0.08})`,
            }}
          >
            <MinimazeGalleryCanvas
              books={books}
              progress={walkProgress}
              onInspectBook={(b) => setZoomedBook(b)}
            />
          </div>

          {/* Welcoming Literary Hero Overlay */}
          <div
            className="pointer-events-none absolute inset-x-0 top-20 sm:top-24 z-20 flex flex-col items-center px-4 text-center transition-all duration-300"
            style={{
              opacity: Math.max(0, 1 - walkProgress * 3.2),
              transform: `translateY(-${walkProgress * 30}px)`,
            }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-[#dedbd2] bg-white/95 px-3.5 py-1 text-xs font-semibold text-[#62605a] shadow-xs backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-[#d93829]" />
              <span>উত্তরণ প্রকাশনী • প্রতিষ্ঠিত ১৯৯৮ • ঢাকা</span>
            </div>
            <h1 className="mt-3 font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#141413]">
              মননশীল সাহিত্যের চিরন্তন প্রকাশনা
            </h1>
            <p className="mt-2 max-w-xl text-xs sm:text-sm text-[#62605a]">
              ধ্রুপদী সাহিত্য, চিন্তাশীল প্রবন্ধ, ইতিহাস ও সমকালীন সৃষ্টির ভার্চুয়াল প্রদর্শনী ও বইসমগ্র
            </p>
            <div className="pointer-events-auto mt-4 sm:mt-5 flex flex-wrap items-center justify-center gap-3">
              <a
                href="#publications-archive"
                className="inline-flex items-center gap-2 rounded-full bg-[#141413] px-5 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-white shadow-lg transition hover:bg-[#d93829]"
              >
                <BookOpen className="h-4 w-4" />
                সরাসরি বই দেখুন ↓
              </a>
              <Link
                href="/books"
                className="inline-flex items-center gap-1.5 rounded-full border border-[#dedbd2] bg-white/90 px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-[#141413] shadow-xs transition hover:border-[#141413]"
              >
                বই ক্যাটালগ <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Architectural doorway passage framing effect */}
          {walkProgress >= 0.74 && (
            <div
              className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center transition-all duration-200"
              style={{
                opacity: Math.sin(exitProgress * Math.PI) * 0.75,
                transform: `scale(${1 + exitProgress * 0.35})`,
              }}
              aria-hidden="true"
            >
              <div className="h-[92%] w-[88%] rounded-t-[140px] border-[14px] sm:border-[26px] border-[#eceae3]/65 shadow-[inset_0_0_80px_rgba(20,20,19,0.06)]" />
            </div>
          )}

          {/* Warm sunlit interior portal bloom as user passes through the archway */}
          <div
            className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-200"
            style={{
              opacity: walkProgress >= 0.82 ? Math.min(1, (walkProgress - 0.82) / 0.17) : 0,
              background: `radial-gradient(circle at 50% 50%, rgba(255, 248, 235, 0.45) 0%, rgba(246, 245, 240, 0.88) 65%, rgba(246, 245, 240, 1) 100%)`,
            }}
            aria-hidden="true"
          />

          {/* Minimal Scroll Instruction Badge (smoothly fades on scroll) */}
          <div
            className="pointer-events-none absolute bottom-5 inset-x-0 z-10 flex justify-center transition-all duration-300 px-4"
            style={{
              opacity: Math.max(0, 1 - walkProgress * 4.5),
              transform: `translateY(${walkProgress * 20}px)`,
            }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-[#dedbd2] bg-white/95 px-4 py-2 text-xs font-semibold text-[#141413] shadow-lg backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-[#d93829]" />
              স্ক্রোল করে গ্যালারি ঘুরে দেখুন ↓
            </div>
          </div>

          {/* "Stepping Inside The Publishing House" Transition HUD Badge */}
          <div
            className="pointer-events-none absolute bottom-5 inset-x-0 z-20 flex justify-center px-4 transition-all duration-300"
            style={{
              opacity: walkProgress >= 0.76 ? Math.min(1, (walkProgress - 0.76) * 5) : 0,
              transform: `translateY(${Math.max(0, (1 - walkProgress) * 20)}px)`,
            }}
          >
            <div className="inline-flex items-center gap-2.5 rounded-full border border-[#dedbd2] bg-white/95 px-4 sm:px-5 py-2 sm:py-2.5 text-xs font-semibold text-[#141413] shadow-2xl backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-[#d93829]" />
              <span>
                {walkProgress >= 0.90
                  ? "উত্তরণ প্রকাশালয়ে আপনাকে স্বাগতম"
                  : "প্রকাশনা হলের দিকে অগ্রসর..."}
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-[#d93829]" />
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
              className="relative grid w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-[#dedbd2] bg-[#f6f5f0] shadow-2xl md:grid-cols-12"
            >
              <button
                type="button"
                aria-label="Close exhibition preview"
                onClick={() => setZoomedBook(null)}
                className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-[#dedbd2] bg-white text-[#141413] hover:border-[#141413]"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center justify-center bg-white p-6 sm:p-8 md:col-span-5">
                <div className="perspective-1200">
                  <div
                    className="h-52 w-36 sm:h-64 sm:w-44 overflow-hidden rounded-r shadow-2xl"
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

              <div className="flex flex-col justify-between p-5 sm:p-7 md:col-span-7">
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
                    <span className="text-2xl font-bold text-[#141413]">
                      {formatPrice(zoomedBook.price)}
                    </span>
                    <span className="text-xs font-medium text-[#62605a]">
                      {zoomedBook.stock > 0
                        ? `${zoomedBook.stock} কপি স্টকে আছে`
                        : "স্টক শেষ"}
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
                      <ShoppingBag className="h-3.5 w-3.5" /> ব্যাগে যোগ করুন
                    </button>
                    <Link
                      href={`/books/${zoomedBook.slug}`}
                      onClick={rememberSpotAndNavigate}
                      className="inline-flex items-center justify-center gap-1.5 rounded-full border border-[#dedbd2] bg-white px-5 py-3 text-xs font-semibold text-[#141413] hover:border-[#141413]"
                    >
                      বইটির বিস্তারিত <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. ABOUT THE PUBLISHING HOUSE (HERITAGE & MANIFESTO) */}
      <section className="paper-grain border-y border-[#dedbd2] bg-white py-14 sm:py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-8 sm:gap-12 lg:grid-cols-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-6"
            >
              <p className="inline-flex items-center gap-2 text-xs font-semibold text-[#62605a]">
                <span className="h-2 w-2 rounded-full bg-[#d93829]" />
                উত্তরণ প্রকাশনী • প্রতিষ্ঠিত ১৯৯৮
              </p>
              <h2 className="mt-3 font-serif text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight text-[#141413]">
                মননশীল চিন্তার বিকাশ ও সমৃদ্ধ সাহিত্যের প্রকাশনা।
              </h2>
              <p className="mt-4 sm:mt-6 text-sm sm:text-base leading-relaxed text-[#62605a]">
                ১৯৯৮ সালে ঢাকার বাংলাবাজারে আমাদের পথচলা শুরু। অমর একুশে বইমেলা ও বাংলাদেশের মননশীল পাঠকদের জন্য আমরা প্রকাশ করে আসছি ধ্রুপদী সাহিত্য, চিন্তাশীল প্রবন্ধ, সমকালীন উপন্যাস, বিজ্ঞান ও দর্শন।
              </p>
              <p className="mt-3 sm:mt-4 text-sm sm:text-base leading-relaxed text-[#62605a]">
                আমাদের লক্ষ্য কেবল বই ছাপা নয়—প্রতিটি গ্রন্থ যেন পাঠকের বুকশেলফে চিরস্থায়ী এক শিল্পকর্ম হয়ে থাকে। উন্নত কাগজ, সুবিন্যস্ত টাইপোগ্রাফি ও স্থায়ী বাঁধাইয়ের মাধ্যমে আমরা বইয়ের নান্দনিক ঐতিহ্যকে ধরে রাখি।
              </p>
              <Link
                href="/about"
                className="mt-6 sm:mt-8 inline-flex items-center gap-2 border-b border-[#141413] pb-1 text-xs font-bold uppercase tracking-[0.18em] text-[#141413] transition hover:border-[#d93829] hover:text-[#d93829]"
              >
                আমাদের প্রকাশনার ইতিহাস জানুন <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: 0.08 }}
              className="grid gap-3 sm:gap-4 sm:grid-cols-3 lg:col-span-6"
            >
              {[
                {
                  metric: "২৮ বছর",
                  label: "প্রকাশনা ঐতিহ্য",
                  note: "স্বাধীন ও মননশীল সাহিত্য প্রকাশনা",
                },
                {
                  metric: "৪২০+ বই",
                  label: "প্রকাশিত গ্রন্থমালা",
                  note: "উপন্যাস, কবিতা, প্রবন্ধ ও গবেষণাধর্মী কাজ",
                },
                {
                  metric: "৯৫+",
                  label: "লেখক ও গবেষক",
                  note: "প্রখ্যাত সাহিত্যিক ও চিন্তাশীল গবেষকবৃন্দ",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl sm:rounded-3xl border border-[#dedbd2] bg-[#f6f5f0] p-4 sm:p-6"
                >
                  <p className="font-serif text-3xl sm:text-4xl font-bold text-[#141413]">
                    {stat.metric}
                  </p>
                  <p className="mt-1.5 sm:mt-2 text-xs font-semibold text-[#d93829]">
                    {stat.label}
                  </p>
                  <p className="mt-1.5 sm:mt-2 text-xs leading-relaxed text-[#62605a]">
                    {stat.note}
                  </p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* 3. NEW ARRIVALS — HORIZONTAL INTERACTIVE SHOWCASE */}
      <section id="publications-archive" className="border-b border-[#dedbd2] bg-[#eceae3]/55 py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-[#62605a]">
                সদ্য প্রকাশিত বই • New Arrivals
              </p>
              <h2 className="mt-1.5 sm:mt-2 font-serif text-2xl sm:text-4xl font-semibold text-[#141413]">
                নতুন প্রকাশনা
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Scroll new arrivals left"
                onClick={() => scrollArrivals(-1)}
                className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-[#dedbd2] bg-white text-[#141413] transition hover:border-[#141413]"
              >
                <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <button
                type="button"
                aria-label="Scroll new arrivals right"
                onClick={() => scrollArrivals(1)}
                className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-[#dedbd2] bg-white text-[#141413] transition hover:border-[#141413]"
              >
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
          </div>

          <div
            ref={arrivalsTrackRef}
            className="mt-6 sm:mt-8 flex items-stretch snap-x snap-mandatory gap-3 sm:gap-6 overflow-x-auto pb-4 scrollbar-none"
          >
            {newArrivals.map((book) => (
              <div
                key={book.id}
                className="w-[230px] sm:w-[270px] md:w-[285px] shrink-0 snap-start flex flex-col"
              >
                <BookCard3D book={book} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. INTERACTIVE BOOK COLLECTION */}
      <section className="paper-grain bg-[#f6f5f0] py-14 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 sm:mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-[#62605a]">
                বইসমগ্র ও সংগ্রহশালা • Explore the Archive
              </p>
              <h2 className="mt-1.5 sm:mt-2 font-serif text-2xl sm:text-4xl lg:text-5xl font-semibold text-[#141413]">
                সকল বই খুঁজুন
              </h2>
            </div>
            <Link
              href="/books"
              className="inline-flex items-center gap-2 rounded-full border border-[#dedbd2] bg-white px-4 sm:px-5 py-2 sm:py-2.5 text-xs font-semibold text-[#141413] transition hover:border-[#141413]"
            >
              সম্পূর্ণ ক্যাটালগ <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <BookCatalogClient books={books} compactLimit={8} />
        </div>
      </section>

      {/* 5. BEST SELLERS & EDITORIAL PICKS */}
      <section className="border-y border-[#dedbd2] bg-white py-14 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:gap-14 lg:grid-cols-2">
            {/* Best Sellers */}
            <div>
              <p className="text-xs font-semibold text-[#d93829]">
                পাঠকপ্রিয় বই • Reader Favorites
              </p>
              <h2 className="mt-1.5 sm:mt-2 font-serif text-2xl sm:text-4xl font-semibold text-[#141413]">
                জনপ্রিয় ও সর্বাধিক বিক্রিত
              </h2>
              <div className="mt-6 sm:mt-8 grid gap-3 sm:gap-4 grid-cols-1 xs:grid-cols-2">
                {bestSellers.map((book) => (
                  <Link
                    key={book.id}
                    href={`/books/${book.slug}`}
                    className="group flex flex-col justify-between rounded-2xl border border-[#dedbd2] bg-[#f6f5f0] p-4 sm:p-5 transition hover:-translate-y-0.5 hover:border-[#141413] hover:bg-white"
                  >
                    <div>
                      <span className="text-[11px] font-semibold text-[#62605a]">
                        {book.category} • {book.soldCount} কপি বিক্রি
                      </span>
                      <h3 className="mt-1.5 sm:mt-2 font-serif text-base sm:text-xl font-semibold leading-snug text-[#141413] group-hover:text-[#d93829] line-clamp-2">
                        {book.title}
                      </h3>
                      <p className="mt-1 text-xs text-[#62605a] truncate">{book.authorName}</p>
                    </div>
                    <div className="mt-4 sm:mt-5 flex items-center justify-between border-t border-[#dedbd2] pt-2.5 sm:pt-3">
                      <span className="text-sm sm:text-base font-bold text-[#141413]">
                        {formatPrice(book.price)}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#62605a] group-hover:text-[#141413]">
                        বিস্তারিত <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Editorial Picks */}
            <div>
              <p className="text-xs font-semibold text-[#62605a]">
                সম্পাদকের বাছাই • Curated by Our Editors
              </p>
              <h2 className="mt-1.5 sm:mt-2 font-serif text-2xl sm:text-4xl font-semibold text-[#141413]">
                নির্বাচিত বই
              </h2>
              <div className="mt-6 sm:mt-8 space-y-3 sm:space-y-4">
                {editorialPicks.map((book) => (
                  <Link
                    key={book.id}
                    href={`/books/${book.slug}`}
                    className="group flex items-center justify-between gap-3 sm:gap-4 rounded-2xl border border-[#dedbd2] bg-[#f6f5f0] p-4 sm:p-5 transition hover:border-[#141413] hover:bg-white"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-medium text-[#62605a]">
                        {book.publisherName} • {book.edition}
                      </p>
                      <h3 className="mt-1 font-serif text-base sm:text-xl font-semibold text-[#141413] group-hover:text-[#d93829] line-clamp-1">
                        {book.title}
                      </h3>
                      <p className="mt-0.5 line-clamp-1 text-xs text-[#62605a]">
                        {book.description}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="block text-sm sm:text-base font-bold text-[#141413]">
                        {formatPrice(book.price)}
                      </span>
                      <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-[#d93829]">
                        দেখুন <ArrowRight className="h-3 w-3" />
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
      <section className="bg-[#f6f5f0] py-14 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-[#62605a]">
                লেখক পরিচিতি • Featured Authors
              </p>
              <h2 className="mt-1.5 sm:mt-2 font-serif text-2xl sm:text-4xl lg:text-5xl font-semibold text-[#141413]">
                আমাদের বিশিষ্ট লেখকবৃন্দ
              </h2>
            </div>
            <Link
              href="/authors"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#141413] hover:text-[#d93829]"
            >
              সকল লেখক <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-6 sm:mt-10 grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {authors.slice(0, 6).map((author) => {
              const isLit = litAuthorId === author.id;
              return (
                <Link
                  key={author.id}
                  href={`/authors/${author.slug}`}
                  onMouseEnter={() => setLitAuthorId(author.id)}
                  onMouseLeave={() => setLitAuthorId(null)}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl sm:rounded-3xl border border-[#dedbd2] bg-white p-4 sm:p-6 pt-6 sm:pt-8 transition hover:-translate-y-1 hover:border-[#141413] hover:shadow-xl"
                >
                  {/* Overhead Gallery Lamp Fixture + Warm Cone */}
                  <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col items-center">
                    <div className="h-1.5 w-14 rounded-b-full bg-[#141413]" />
                    <div
                      className="h-20 sm:h-24 w-36 sm:w-44 transition-opacity duration-300"
                      style={{
                        opacity: isLit ? 0.55 : 0.14,
                        background:
                          "radial-gradient(ellipse at top, rgba(255, 224, 150, 0.7), transparent 72%)",
                      }}
                    />
                  </div>

                  <div className="relative z-10">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div
                        className="flex h-12 w-12 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl border border-[#dedbd2] font-serif text-lg sm:text-2xl font-bold shadow-inner"
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
                        <h3 className="font-serif text-lg sm:text-2xl font-semibold text-[#141413] group-hover:text-[#d93829]">
                          {author.name}
                        </h3>
                        <p className="text-xs font-medium text-[#62605a]">
                          {author.roleTitle}
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 sm:mt-4 text-xs sm:text-sm leading-relaxed text-[#62605a] line-clamp-3 sm:line-clamp-none">
                      {author.bio}
                    </p>
                  </div>

                  <div className="relative z-10 mt-4 sm:mt-5 border-t border-[#eceae3] pt-3 sm:pt-4">
                    {author.awards[0] && (
                      <p className="flex items-center gap-1.5 text-xs text-[#62605a] truncate">
                        <Award className="h-3.5 w-3.5 shrink-0 text-[#d93829]" />
                        <span className="truncate">{author.awards[0]}</span>
                      </p>
                    )}
                    <span className="mt-1.5 sm:mt-2 inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-[#141413] group-hover:text-[#d93829]">
                      লেখকের পরিচিতি <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. PUBLISHING JOURNEY — SCROLL TIMELINE */}
      <section ref={journeyRef} className="border-t border-[#dedbd2] bg-[#eceae3]/55 py-14 sm:py-20 lg:py-28">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#62605a]">
              পাণ্ডুলিপি থেকে পাঠকের বুকশেলফ
            </p>
            <h2 className="mt-1.5 sm:mt-2 font-serif text-2xl sm:text-4xl lg:text-5xl font-semibold text-[#141413]">
              আমাদের প্রকাশনা প্রক্রিয়া
            </h2>
          </div>

          <div className="relative mt-10 sm:mt-14 pl-7 sm:pl-12">
            <div className="absolute bottom-4 left-2.5 top-4 w-[2px] bg-[#dedbd2] sm:left-5" />
            <motion.div
              style={{ scaleY: journeyScaleY, transformOrigin: "top" }}
              className="absolute bottom-4 left-2.5 top-4 w-[2px] bg-[#d93829] sm:left-5"
            />

            <div className="space-y-4 sm:space-y-8">
              {JOURNEY_STEPS.map((item) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.step}
                    initial={{ opacity: 0, x: -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ duration: 0.5 }}
                    className="relative rounded-2xl sm:rounded-3xl border border-[#dedbd2] bg-white p-4 sm:p-8 shadow-xs"
                  >
                    <span className="absolute -left-[29px] top-5 sm:top-7 flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full border border-[#141413] bg-[#141413] font-serif text-xs font-bold text-white sm:-left-[41px]">
                      {item.step}
                    </span>
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#dedbd2] bg-[#f6f5f0] text-[#141413] sm:flex">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-serif text-lg sm:text-2xl font-semibold text-[#141413]">
                          {item.title}
                        </h3>
                        <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm leading-relaxed text-[#62605a]">
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
      <section className="bg-white py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#62605a]">
              পাঠক ও বিদগ্ধ মহলের মূল্যায়ন
            </p>
            <h2 className="mt-1.5 sm:mt-2 font-serif text-2xl sm:text-4xl font-semibold text-[#141413]">
              পাঠকদের ভালোবাসা ও অভিমত
            </h2>
          </div>

          <div className="mt-6 sm:mt-10 grid gap-4 sm:gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <blockquote
                key={t.id}
                className="flex flex-col justify-between rounded-2xl sm:rounded-3xl border border-[#dedbd2] bg-[#f6f5f0] p-5 sm:p-7"
              >
                <div>
                  <Quote className="h-5 w-5 sm:h-6 sm:w-6 text-[#d93829]" />
                  <p className="mt-3 sm:mt-4 font-serif text-base sm:text-xl italic leading-relaxed text-[#141413]">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                </div>
                <footer className="mt-5 sm:mt-6 border-t border-[#dedbd2] pt-3 sm:pt-4">
                  <p className="text-sm sm:text-base font-semibold text-[#141413]">{t.name}</p>
                  <p className="text-xs text-[#62605a]">{t.role}</p>
                  <p className="mt-1 text-xs font-semibold text-[#d93829]">
                    {t.bookTitle} প্রসঙ্গে
                  </p>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* 9. NEWSLETTER INVITATION */}
      <section className="border-t border-[#dedbd2] bg-[#141413] py-14 sm:py-20 text-[#f6f5f0]">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#d93829]">
            উত্তরণ সাহিত্য বার্তা • Newsletter
          </p>
          <h2 className="mt-2 sm:mt-3 font-serif text-2xl sm:text-4xl lg:text-5xl font-semibold">
            নতুন বই প্রকাশ ও সাহিত্য সংবাদের সাথে যুক্ত থাকুন
          </h2>
          <p className="mx-auto mt-3 sm:mt-4 max-w-2xl text-xs sm:text-base leading-relaxed text-[#dedbd2]">
            উত্তরণ প্রকাশনীর নতুন বই, বিশেষ ছাড় ও সাহিত্যিক আড্ডার তথ্য নিয়মিত পেতে আমাদের সাহিত্য বার্তায় সাবস্ক্রাইব করুন।
          </p>

          <form onSubmit={handleNewsletter} className="mx-auto mt-6 sm:mt-8 max-w-md">
            <div className="flex flex-col sm:flex-row overflow-hidden rounded-2xl sm:rounded-full border border-[#62605a] bg-white/10 p-1.5 backdrop-blur-md gap-2 sm:gap-0">
              <input
                type="email"
                required
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="আপনার ইমেইল ঠিকানা লিখুন..."
                className="flex-1 bg-transparent px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm text-white placeholder:text-[#eceae3]/50 focus:outline-none text-center sm:text-left"
              />
              <button
                type="submit"
                disabled={newsletterLoading}
                className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl sm:rounded-full bg-[#d93829] px-5 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-[#b82d20] disabled:opacity-50"
              >
                {newsletterLoading ? "যুক্ত হচ্ছে..." : "সাবস্ক্রাইব করুন"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
