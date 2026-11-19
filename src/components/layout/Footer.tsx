"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BOOK_CATEGORIES } from "@/lib/types";
import { useStore } from "@/components/providers/StoreProvider";
import { ArrowRight, BookOpen, Mail, MapPin, Phone } from "lucide-react";

export default function Footer() {
  const { notify } = useStore();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { message?: string; error?: string };
      if (!res.ok) {
        notify(data.error || "Could not subscribe.", "error");
      } else {
        notify(data.message || "Subscribed to Uttoron Prokasoni.", "success");
        setEmail("");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="border-t border-[#dedbd2] bg-[#eceae3] text-[#141413]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:gap-12 lg:grid-cols-12">
          {/* Brand + Newsletter */}
          <div className="lg:col-span-4">
            <Link href="/" className="inline-flex cursor-pointer items-center gap-2.5 sm:gap-3">
              <span className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-[#141413]/20 bg-white text-[#141413]">
                <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />
              </span>
              <div>
                <span className="flex items-center gap-1.5 font-serif text-xl sm:text-2xl font-bold text-[#141413]">
                  উত্তরণ প্রকাশনী
                  <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-[#d93829]" />
                </span>
                <span className="block text-xs font-medium text-[#62605a]">
                  প্রতিষ্ঠিত ১৯৯৮ • ঢাকা, বাংলাদেশ
                </span>
              </div>
            </Link>

            <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#62605a]">
              উত্তরণ প্রকাশনী ১৯৯৮ সাল থেকে মননশীল সাহিত্য, ধ্রুপদী অনুবাদ, বিজ্ঞান ও গবেষণাধর্মী গ্রন্থ প্রকাশ করে আসছে। বাংলাবাজারের ঐতিহ্য ও আধুনিক প্রকাশনা শিল্পের মেলবন্ধনে আমরা প্রতিটি বই নির্মাণে গভীর যত্নশীল।
            </p>

            <form onSubmit={handleNewsletter} className="mt-6">
              <label
                htmlFor="footer-newsletter"
                className="block text-xs font-bold text-[#141413]"
              >
                উত্তরণ সাহিত্য বার্তা
              </label>
              <div className="mt-2 flex overflow-hidden rounded-full border border-[#dedbd2] bg-white p-1">
                <input
                  id="footer-newsletter"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="আপনার ইমেইল লিখুন..."
                  className="flex-1 bg-transparent px-4 py-2 text-xs text-[#141413] placeholder:text-[#62605a]/60 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-[#141413] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#d93829] disabled:opacity-60"
                >
                  যুক্ত হোন <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </form>
          </div>

          {/* Quick Navigation */}
          <div className="lg:col-span-2">
            <h3 className="text-xs font-bold tracking-wider text-[#62605a] uppercase">
              গুরুত্বপূর্ণ লিংক
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-[#141413]/85 font-medium">
              <li><Link href="/" className="cursor-pointer hover:text-[#d93829]">প্রচ্ছদ</Link></li>
              <li><Link href="/books" className="cursor-pointer hover:text-[#d93829]">বইসমগ্র</Link></li>
              <li><Link href="/categories" className="cursor-pointer hover:text-[#d93829]">বিষয়শ্রেণী</Link></li>
              <li><Link href="/authors" className="cursor-pointer hover:text-[#d93829]">লেখকবৃন্দ</Link></li>
              <li><Link href="/about" className="cursor-pointer hover:text-[#d93829]">আমাদের কথা</Link></li>
              <li><Link href="/account" className="cursor-pointer hover:text-[#d93829]">পাঠক প্রোফাইল</Link></li>
            </ul>
          </div>

          {/* Book Categories */}
          <div className="lg:col-span-3">
            <h3 className="text-xs font-bold tracking-wider text-[#62605a] uppercase">
              বিষয়শ্রেণী
            </h3>
            <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm text-[#141413]/85 font-medium">
              {BOOK_CATEGORIES.map((cat) => (
                <li key={cat}>
                  <Link
                    href={`/books?category=${encodeURIComponent(cat)}`}
                    className="cursor-pointer hover:text-[#d93829]"
                  >
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Support & Contact */}
          <div className="lg:col-span-3">
            <h3 className="text-xs font-bold tracking-wider text-[#62605a] uppercase">
              পাঠক সেবা ও যোগাযোগ
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-[#141413]/85 font-medium">
              <li><Link href="/track" className="cursor-pointer hover:text-[#d93829]">অর্ডার ট্র্যাক করুন</Link></li>
              <li><Link href="/account?tab=wishlist" className="cursor-pointer hover:text-[#d93829]">পছন্দের তালিকা ও অ্যাকাউন্ট</Link></li>
              <li><Link href="/contact" className="cursor-pointer hover:text-[#d93829]">যোগাযোগ ও পাণ্ডুলিপি জমা</Link></li>
              <li><Link href="/returns" className="cursor-pointer hover:text-[#d93829]">রিফান্ড ও রিটার্ন নীতি</Link></li>
            </ul>

            <div className="mt-5 space-y-2 text-xs text-[#62605a]">
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#d93829]" />
                <span>৩৮/২ ক বাংলাবাজার ও বাড়ি ১২, রোড ৭, ধানমন্ডি, ঢাকা ১২০৫</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 shrink-0 text-[#d93829]" />
                <span>+৮৮০ ১৭১১-০০০৯৪২</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 shrink-0 text-[#d93829]" />
                <span>info@uttoronprokasoni.com</span>
              </p>
            </div>

            <div className="mt-5 flex gap-2.5 text-xs font-medium">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="cursor-pointer rounded-full border border-[#dedbd2] bg-white px-3.5 py-1 text-[#141413] transition hover:border-[#141413] hover:bg-[#141413] hover:text-white"
              >
                ফেসবুক
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="cursor-pointer rounded-full border border-[#dedbd2] bg-white px-3.5 py-1 text-[#141413] transition hover:border-[#141413] hover:bg-[#141413] hover:text-white"
              >
                ইনস্টাগ্রাম
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                className="cursor-pointer rounded-full border border-[#dedbd2] bg-white px-3.5 py-1 text-[#141413] transition hover:border-[#141413] hover:bg-[#141413] hover:text-white"
              >
                ইউটিউব
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Legal Bar */}
        <div className="mt-8 sm:mt-12 flex flex-col items-center justify-between gap-4 border-t border-[#dedbd2] pt-6 sm:pt-8 text-center sm:text-left text-xs text-[#62605a] sm:flex-row">
          <p>© {new Date().getFullYear()} উত্তরণ প্রকাশনী (Uttoron Prokasoni)। সর্বস্বত্ব সংরক্ষিত।</p>
          <div className="flex flex-wrap justify-center sm:justify-end gap-4 sm:gap-6 font-medium">
            <Link href="/privacy" className="cursor-pointer hover:text-[#141413]">গোপনীয়তা নীতি</Link>
            <Link href="/terms" className="cursor-pointer hover:text-[#141413]">শর্তাবলী</Link>
            <Link href="/returns" className="cursor-pointer hover:text-[#141413]">রিটার্ন পলিসি</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
