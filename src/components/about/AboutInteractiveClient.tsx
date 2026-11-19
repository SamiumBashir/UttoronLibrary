"use client";

import React from "react";
import Link from "next/link";
import type { Publisher } from "@/lib/types";
import { ArrowRight, BookOpen, Feather, Library, ShieldCheck, HeartHandshake, Sparkles } from "lucide-react";

const CRAFT_PILLARS = [
  {
    icon: Feather,
    title: "পাণ্ডুলিপি নির্বাচন ও সম্পাদনা",
    desc: "প্রতিটি পাণ্ডুলিপি অভিজ্ঞ সাহিত্যিক ও গবেষকদের সমন্বয়ে গঠিত সম্পাদকীয় পর্ষদ দ্বারা নিবিড়ভাবে যাচাই ও পরিমার্জন করা হয়।",
  },
  {
    icon: BookOpen,
    title: "নান্দনিক বাংলা টাইপোগ্রাফি",
    desc: "বইয়ের বিষয়বস্তুর সাথে মানানসই হরফ নির্বাচন, অক্ষরের সুষম বিন্যাস ও দৃষ্টিনন্দন প্রচ্ছদ আমাদের প্রকাশনার প্রধান বৈশিষ্ট্য।",
  },
  {
    icon: ShieldCheck,
    title: "অ্যাসিড-মুক্ত দীর্ঘস্থায়ী কাগজ",
    desc: "পাঠকের চোখের আরামের জন্য আন্তর্জাতিক মানের ৮০-১০০ জিএসএম ক্রিম/উডফ্রি কাগজ ব্যবহার করা হয়, যা বছরের পর বছর অবিকৃত থাকে।",
  },
  {
    icon: Library,
    title: "টেকসই বাঁধাই ও ফয়েল প্রিন্ট",
    desc: "প্রতিটি হার্ডবাউন্ড বই সুতা দিয়ে মজবুতভাবে সেলাই (Smyth-sewn) করা হয়, যাতে পাতা খসে পড়ার কোনো ভয় না থাকে।",
  },
  {
    icon: HeartHandshake,
    title: "লেখক ও পাঠকের সেতুবন্ধন",
    desc: "লেখকের মেধা ও সৃজনশীলতার সর্বোচ্চ মূল্যায়ন এবং পাঠকের কাছে সুলভ মূল্যে কালজয়ী সাহিত্য পৌঁছে দেওয়াই আমাদের ব্রত।",
  },
  {
    icon: Sparkles,
    title: "অনুবাদ ও বিশ্বসাহিত্য",
    desc: "বিশ্বের সেরা সাহিত্য, দর্শন ও বিজ্ঞান গ্রন্থগুলোকে প্রাঞ্জল বাংলা অনুবাদে দেশের পাঠকসমাজের কাছে পরিচিত করা।",
  },
];

const EDITORIAL_BOARD = [
  {
    id: "ed-1",
    name: "ফারহানা রহমান",
    role: "প্রধান সম্পাদক",
    note: "বাংলা একাডেমি ফেলো এবং বিশ বছরের অধিক সময় ধরে সাহিত্য ও অনুবাদ বিভাগ পরিচালনা করছেন।",
    initials: "ফা",
  },
  {
    id: "ed-2",
    name: "তারিকুল ইসলাম",
    role: "শিল্প ও প্রকাশনা নির্দেশক",
    note: "বিশিষ্ট টাইপোগ্রাফার ও গ্রন্থশিল্পী; প্রচ্ছদ, বাঁধাই ও মুদ্রণ নান্দনিকতার তত্ত্বাবধায়ক।",
    initials: "তা",
  },
  {
    id: "ed-3",
    name: "ড. নুসরাত জাহান",
    role: "বিজ্ঞান ও গবেষণা সম্পাদক",
    note: "জ্যোতির্বিজ্ঞান ও পরিবেশবিদ্যা গবেষক; বিজ্ঞান বিষয়ক জটিল তত্ত্বকে পাঠকের কাছে প্রাঞ্জল ভাষায় উপস্থাপন করেন।",
    initials: "নু",
  },
];

export default function AboutInteractiveClient({
  publishers,
}: {
  publishers: Publisher[];
}) {
  return (
    <div className="paper-grain min-h-screen bg-[#f6f5f0] pb-24 pt-28 text-[#141413]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <header className="max-w-3xl">
          <p className="inline-flex items-center gap-2 text-xs font-bold tracking-wider uppercase text-[#62605a]">
            <span className="h-2 w-2 rounded-full bg-[#d93829]" />
            ঐতিহ্য ও প্রকাশনা দর্শন
          </p>
          <h1 className="mt-3 font-serif text-4xl font-bold leading-tight text-[#141413] sm:text-6xl">
            শব্দের শক্তিতে মননশীল সমাজ বিনির্মাণ।
          </h1>
          <p className="mt-5 text-base sm:text-lg leading-relaxed text-[#62605a]">
            ১৯৯৮ সাল থেকে উত্তরণ প্রকাশনী বাংলা সাহিত্য, ইতিহাস, বিজ্ঞান ও ধ্রুপদী অনুবাদের শ্রেষ্ঠ গ্রন্থগুলো নিষ্ঠার সাথে প্রকাশ করে আসছে। বাংলাবাজারের ঐতিহ্য ও আধুনিক নান্দনিকতার মেলবন্ধনে প্রতিটি বইকে আমরা পাঠকের পারিবারিক সংগ্রহের অংশ হিসেবে গড়ে তুলি।
          </p>
        </header>

        {/* Six Craft Pillars */}
        <section className="mt-14 sm:mt-16">
          <div className="border-b border-[#dedbd2] pb-4">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#141413]">
              আমাদের প্রকাশনা মূল্যবোধ ও গ্রন্থশিল্প
            </h2>
            <p className="mt-1 text-sm text-[#62605a]">
              একটি ভালো বই কেবল পাঠ নয়, তা স্পর্শ ও অনুভবেরও বিষয়
            </p>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {CRAFT_PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.title}
                  className="rounded-3xl border border-[#dedbd2] bg-white p-7 transition hover:border-[#141413] shadow-xs"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f6f5f0] text-[#d93829]">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 font-serif text-xl font-bold text-[#141413]">
                    {pillar.title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-[#62605a]">
                    {pillar.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Editorial Board */}
        <section className="mt-16">
          <div className="border-b border-[#dedbd2] pb-4">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#141413]">
              সম্পাদকীয় পর্ষদ ও উপদেষ্টামণ্ডলী
            </h2>
            <p className="mt-1 text-sm text-[#62605a]">
              অভিজ্ঞ গবেষক ও সাহিত্যিকদের নিষ্ঠাবান পরিচর্যা
            </p>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {EDITORIAL_BOARD.map((member) => (
              <div
                key={member.id}
                className="rounded-3xl border border-[#dedbd2] bg-white p-7 shadow-xs transition hover:border-[#141413]"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#dedbd2] bg-[#f6f5f0] font-serif text-2xl font-bold text-[#141413]">
                  {member.initials}
                </div>
                <h3 className="mt-5 font-serif text-2xl font-bold text-[#141413]">
                  {member.name}
                </h3>
                <p className="mt-1 text-xs font-semibold text-[#d93829]">
                  {member.role}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-[#62605a]">
                  {member.note}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Imprints & Divisions */}
        <section className="mt-16 rounded-3xl border border-[#dedbd2] bg-white p-8 sm:p-10 shadow-xs">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#141413]">
              উত্তরণ প্রকাশনার বিভাগসমূহ
            </h2>
            <p className="mt-1 text-sm text-[#62605a]">
              বয়স ও রুচির ভিন্নতায় সুনির্দিষ্ট বিষয়ভিত্তিক গ্রন্থমালা
            </p>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {publishers.map((pub) => (
              <div
                key={pub.id}
                className="rounded-2xl border border-[#dedbd2] bg-[#f6f5f0] p-6"
              >
                <span className="text-xs font-bold text-[#d93829]">
                  প্রতিষ্ঠিত {pub.foundedYear} • {pub.location}
                </span>
                <h3 className="mt-2 font-serif text-2xl font-bold text-[#141413]">
                  {pub.name}
                </h3>
                <p className="mt-1 text-xs font-semibold text-[#62605a]">{pub.imprint}</p>
                <p className="mt-3 text-sm leading-relaxed text-[#141413]/80">
                  {pub.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-4 pt-4 border-t border-[#dedbd2]">
            <Link
              href="/books"
              className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#141413] px-7 py-3 text-xs font-bold text-white transition hover:bg-[#d93829]"
            >
              বইসমগ্র দেখুন <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#dedbd2] bg-[#f6f5f0] px-7 py-3 text-xs font-semibold text-[#141413] transition hover:border-[#141413]"
            >
              পাণ্ডুলিপি জমা দিন
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
