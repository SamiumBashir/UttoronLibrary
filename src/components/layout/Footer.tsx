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
    <footer className="border-t border-[#DDD9D1] bg-[#E9E6DF] text-[#252525]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:gap-12 lg:grid-cols-12">
          {/* Brand + Newsletter */}
          <div className="lg:col-span-4">
            <Link href="/" className="inline-flex items-center gap-2.5 sm:gap-3">
              <span className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg border border-[#DDD9D1] bg-white text-[#252525]">
                <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />
              </span>
              <div>
                <span className="flex items-center gap-1.5 font-serif text-xl sm:text-2xl font-bold text-[#252525]">
                  Uttoron Prokasoni
                  <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-[#722F37]" />
                </span>
                <span className="block font-mono text-[8px] sm:text-[9px] uppercase tracking-[0.24em] text-[#77736D]">
                  Publishing House &amp; Bindery
                </span>
              </div>
            </Link>

            <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#77736D]">
              Independent publishing house dedicated to enduring literature, cultural archives,
              and thoughtful scientific monographs bound with care.
            </p>

            <form onSubmit={handleNewsletter} className="mt-6">
              <label
                htmlFor="footer-newsletter"
                className="block font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[#252525]"
              >
                Publishing Dispatch
              </label>
              <div className="mt-2 flex overflow-hidden rounded-full border border-[#DDD9D1] bg-white p-1">
                <input
                  id="footer-newsletter"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address..."
                  className="flex-1 bg-transparent px-4 py-2 text-xs text-[#252525] placeholder:text-[#77736D]/70 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1 rounded-full bg-[#252525] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#722F37] disabled:opacity-60"
                >
                  Join <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </form>
          </div>

          {/* Quick Navigation */}
          <div className="lg:col-span-2">
            <h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-[#77736D]">
              Navigation
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-[#252525]/85">
              <li><Link href="/" className="transition hover:text-[#722F37]">Home Gallery</Link></li>
              <li><Link href="/books" className="transition hover:text-[#722F37]">Explore Books</Link></li>
              <li><Link href="/categories" className="transition hover:text-[#722F37]">Categories</Link></li>
              <li><Link href="/authors" className="transition hover:text-[#722F37]">Authors</Link></li>
              <li><Link href="/about" className="transition hover:text-[#722F37]">About Us</Link></li>
              <li><Link href="/account" className="transition hover:text-[#722F37]">Reader Portal</Link></li>
            </ul>
          </div>

          {/* Book Categories */}
          <div className="lg:col-span-3">
            <h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-[#77736D]">
              Book Categories
            </h3>
            <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm text-[#252525]/85">
              {BOOK_CATEGORIES.map((cat) => (
                <li key={cat}>
                  <Link
                    href={`/books?category=${encodeURIComponent(cat)}`}
                    className="transition hover:text-[#722F37]"
                  >
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Support & Contact */}
          <div className="lg:col-span-3">
            <h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-[#77736D]">
              Reader Support &amp; Desk
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-[#252525]/85">
              <li><Link href="/track" className="transition hover:text-[#722F37]">Track Your Order</Link></li>
              <li><Link href="/account?tab=wishlist" className="transition hover:text-[#722F37]">Reader Wishlist</Link></li>
              <li><Link href="/contact" className="transition hover:text-[#722F37]">Contact &amp; Submissions</Link></li>
            </ul>

            <div className="mt-5 space-y-2 text-xs text-[#77736D]">
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#722F37]" />
                <span>House 42, Road 11, Dhanmondi, Dhaka 1209, Bangladesh</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 shrink-0 text-[#722F37]" />
                <span>+880 1711-000942</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 shrink-0 text-[#722F37]" />
                <span>editorial@uttoronprokasoni.com</span>
              </p>
            </div>

            <div className="mt-5 flex gap-2.5 text-xs">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-[#DDD9D1] bg-white px-3 py-1 text-[#252525] transition hover:border-[#252525]"
              >
                Instagram
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-[#DDD9D1] bg-white px-3 py-1 text-[#252525] transition hover:border-[#252525]"
              >
                Facebook
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-[#DDD9D1] bg-white px-3 py-1 text-[#252525] transition hover:border-[#252525]"
              >
                YouTube
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Legal Bar */}
        <div className="mt-8 sm:mt-12 flex flex-col items-center justify-between gap-4 border-t border-[#DDD9D1] pt-6 sm:pt-8 text-center sm:text-left font-mono text-[10px] sm:text-[11px] text-[#77736D] sm:flex-row">
          <p>© {new Date().getFullYear()} UTTORON PROKASONI. ALL RIGHTS RESERVED.</p>
          <div className="flex flex-wrap justify-center sm:justify-end gap-4 sm:gap-6">
            <Link href="/privacy" className="transition hover:text-[#252525]">Privacy Policy</Link>
            <Link href="/terms" className="transition hover:text-[#252525]">Terms &amp; Conditions</Link>
            <Link href="/returns" className="transition hover:text-[#252525]">Refund &amp; Return Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
