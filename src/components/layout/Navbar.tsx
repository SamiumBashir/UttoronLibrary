"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/components/providers/StoreProvider";
import {
  BookOpen,
  Heart,
  Search,
  ShoppingBag,
  User,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const NAV_LINKS = [
  { href: "/", label: "Home", code: "01", note: "3D Gallery Walkthrough" },
  { href: "/books", label: "Books", code: "02", note: "Interactive Collection & Index" },
  { href: "/categories", label: "Categories", code: "03", note: "Nine Literary Wings" },
  { href: "/authors", label: "Authors", code: "04", note: "Fellows & Biographies" },
  { href: "/about", label: "About Us", code: "05", note: "House Manifesto & Craft" },
  { href: "/contact", label: "Contact", code: "06", note: "Salon & Submissions" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { cartCount, wishlist, user, setCartOpen, setSearchOpen } = useStore();
  const [scrolled, setScrolled] = useState(false);
  const [blindOpen, setBlindOpen] = useState(false);

  // Minimaze signature cursor-tracking red dot inside the Paper Blind Menu
  const blindRef = useRef<HTMLDivElement | null>(null);
  const [dotPos, setDotPos] = useState({ x: 40, y: 120, visible: false });

  const isHome = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 36);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setBlindOpen(false);
  }, [pathname]);

  const handleBlindPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = blindRef.current?.getBoundingClientRect();
    if (!rect) return;
    setDotPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      visible: true,
    });
  };

  const solidHeader = !isHome || scrolled || blindOpen;

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-400 ${
          solidHeader
            ? "border-b border-[#dedbd2] bg-[#f6f5f0]/95 py-3 shadow-[0_8px_30px_rgba(20,20,19,0.06)] backdrop-blur-xl"
            : "bg-gradient-to-b from-[#f6f5f0]/90 via-[#f6f5f0]/55 to-transparent py-4"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand Logo */}
          <Link href="/" className="group flex items-center gap-3 focus:outline-none">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#141413]/15 bg-white text-[#141413] shadow-xs transition group-hover:border-[#d93829]">
              <BookOpen className="h-4 w-4" />
            </span>
            <div>
              <span className="flex items-center gap-1.5 font-serif text-xl font-bold tracking-tight text-[#141413]">
                Uttoron Prokasoni
                <span className="h-1.5 w-1.5 rounded-full bg-[#d93829]" />
              </span>
              <span className="block font-mono text-[9px] uppercase tracking-[0.24em] text-[#62605a]">
                3D Gallery &amp; Press
              </span>
            </div>
          </Link>

          {/* Desktop Inline Navigation */}
          <nav aria-label="Primary Navigation" className="hidden items-center gap-6 lg:flex">
            {NAV_LINKS.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative text-xs font-semibold uppercase tracking-[0.14em] transition ${
                    active ? "text-[#141413]" : "text-[#62605a] hover:text-[#141413]"
                  }`}
                >
                  {item.label}
                  {active && (
                    <span className="absolute -bottom-1.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-[#d93829]" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions + Minimaze Paper Blind Menu Trigger */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Search books"
              onClick={() => setSearchOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#dedbd2] bg-white/85 text-[#141413] transition hover:border-[#141413]"
            >
              <Search className="h-4 w-4" />
            </button>

            <Link
              href="/account?tab=wishlist"
              aria-label={`Wishlist (${wishlist.length} items)`}
              className="relative flex h-9 w-9 items-center justify-center rounded-full border border-[#dedbd2] bg-white/85 text-[#141413] transition hover:border-[#141413]"
            >
              <Heart className="h-4 w-4" />
              {wishlist.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#d93829] px-1 text-[10px] font-bold text-white">
                  {wishlist.length}
                </span>
              )}
            </Link>

            <button
              type="button"
              aria-label={`Shopping cart (${cartCount} items)`}
              onClick={() => setCartOpen(true)}
              className="relative flex h-9 items-center gap-2 rounded-full border border-[#141413] bg-[#141413] px-3.5 text-xs font-semibold text-[#f6f5f0] transition hover:bg-[#2a2a28]"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Bag</span>
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#d93829] px-1.5 text-[10px] font-bold text-white">
                {cartCount}
              </span>
            </button>

            <Link
              href="/account"
              aria-label="Account or Login"
              className="hidden h-9 items-center gap-1.5 rounded-full border border-[#dedbd2] bg-white/85 px-3 text-xs font-semibold text-[#141413] transition hover:border-[#141413] sm:inline-flex"
            >
              <User className="h-3.5 w-3.5" />
              <span>{user ? user.name.split(" ")[0] : "Account"}</span>
            </Link>

            {/* Signature Minimaze Paper-Blind Toggle */}
            <button
              type="button"
              aria-label={blindOpen ? "Close Paper Blind Menu" : "Open Paper Blind Menu"}
              onClick={() => setBlindOpen((v) => !v)}
              className="inline-flex h-9 items-center gap-2 rounded-full border border-[#dedbd2] bg-white px-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-[#141413] transition hover:border-[#141413]"
            >
              {blindOpen ? (
                <>
                  <X className="h-3.5 w-3.5" /> Close
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-[#d93829]" />
                  Menu
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* MINIMAZE SIGNATURE PULL-DOWN PAPER BLIND MENU WITH CURSOR-TRACKING RED DOT */}
      <AnimatePresence>
        {blindOpen && (
          <motion.div
            ref={blindRef}
            onPointerMove={handleBlindPointerMove}
            onPointerLeave={() => setDotPos((p) => ({ ...p, visible: false }))}
            initial={{ y: "-100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-100%" }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-0 top-[61px] z-40 overflow-hidden border-b border-[#dedbd2] bg-[#f6f5f0] shadow-[0_32px_64px_rgba(20,20,19,0.16)]"
          >
            {/* Paper blind horizontal slat lines */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-35"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(180deg, transparent 0px, transparent 55px, #dedbd2 55px, #dedbd2 56px)",
              }}
            />

            {/* Cursor-tracking gallery red dot */}
            {dotPos.visible && (
              <motion.div
                aria-hidden="true"
                animate={{ x: dotPos.x - 7, y: dotPos.y - 7 }}
                transition={{ type: "spring", stiffness: 450, damping: 28 }}
                className="pointer-events-none absolute z-20 hidden h-3.5 w-3.5 rounded-full bg-[#d93829] md:block"
              />
            )}

            <div className="relative z-10 mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {NAV_LINKS.map((item) => {
                  const active =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="group flex items-baseline justify-between rounded-2xl border border-[#dedbd2]/80 bg-white/85 px-6 py-5 transition hover:border-[#141413] hover:bg-white"
                    >
                      <div>
                        <span className="font-mono text-[11px] font-semibold text-[#d93829]">
                          {item.code}
                        </span>
                        <h3 className="mt-1 font-serif text-3xl font-semibold text-[#141413] transition group-hover:translate-x-1">
                          {item.label}
                        </h3>
                        <p className="mt-0.5 text-xs text-[#62605a]">{item.note}</p>
                      </div>
                      <span
                        className={`h-2.5 w-2.5 rounded-full transition ${
                          active
                            ? "bg-[#d93829]"
                            : "bg-[#dedbd2] group-hover:bg-[#d93829]"
                        }`}
                      />
                    </Link>
                  );
                })}
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[#dedbd2] pt-5 font-mono text-xs text-[#62605a]">
                <div className="flex flex-wrap gap-5">
                  <Link href="/track" className="hover:text-[#141413]">
                    Track Order
                  </Link>
                  <Link href="/cart" className="hover:text-[#141413]">
                    Shopping Bag ({cartCount})
                  </Link>
                  <Link href="/account" className="hover:text-[#141413]">
                    {user ? `Signed in: ${user.name}` : "Reader Login"}
                  </Link>
                  <Link href="/admin" className="hover:text-[#141413]">
                    CMS Console
                  </Link>
                </div>
                <span>GALLERY OPEN • DHAKA &amp; ONLINE</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
