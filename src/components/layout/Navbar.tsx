"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/components/providers/StoreProvider";
import {
  BookOpen,
  Heart,
  Menu,
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

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) {
        setBlindOpen(false);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

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
        className={`fixed inset-x-0 top-0 z-50 h-16 transition-all duration-300 ${
          solidHeader
            ? "border-b border-[#dedbd2] bg-[#f6f5f0]/95 shadow-[0_8px_30px_rgba(20,20,19,0.06)] backdrop-blur-xl"
            : "bg-gradient-to-b from-[#f6f5f0]/95 via-[#f6f5f0]/70 to-transparent"
        }`}
      >
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand Logo */}
          <Link href="/" className="group flex items-center gap-2 sm:gap-3 focus:outline-none">
            <span className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border border-[#141413]/15 bg-white text-[#141413] shadow-xs transition group-hover:border-[#d93829]">
              <BookOpen className="h-4 w-4" />
            </span>
            <div>
              <span className="flex items-center gap-1.5 font-serif text-base sm:text-xl font-bold tracking-tight text-[#141413]">
                Uttoron Prokasoni
                <span className="h-1.5 w-1.5 rounded-full bg-[#d93829]" />
              </span>
              <span className="hidden xs:block font-mono text-[9px] uppercase tracking-[0.24em] text-[#62605a]">
                3D Gallery &amp; Press
              </span>
            </div>
          </Link>

          {/* Desktop Inline Navigation (Visible only on Desktop >= 1024px) */}
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

          {/* Right Action Controls: Desktop shows icons, Mobile/Tablet shows only Hamburger Menu */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Desktop Only: Search Trigger */}
            <button
              type="button"
              aria-label="Search collection"
              onClick={() => {
                setBlindOpen(false);
                setSearchOpen(true);
              }}
              className="hidden lg:flex h-9 w-9 items-center justify-center rounded-full border border-[#dedbd2] bg-white/90 text-[#141413] shadow-xs transition hover:border-[#141413] hover:bg-[#141413] hover:text-[#f6f5f0] focus:outline-none"
              title="Search Books"
            >
              <Search className="h-4 w-4" />
            </button>

            {/* Desktop Only: Wishlist Link */}
            <Link
              href="/account?tab=wishlist"
              aria-label={`Wishlist (${wishlist.length} items)`}
              className="relative hidden lg:flex h-9 w-9 items-center justify-center rounded-full border border-[#dedbd2] bg-white/90 text-[#141413] shadow-xs transition hover:border-[#141413] hover:bg-[#141413] hover:text-[#f6f5f0] focus:outline-none"
              title="Wishlist"
            >
              <Heart className="h-4 w-4" />
              {wishlist.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#d93829] px-1 text-[10px] font-bold text-white shadow-xs">
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* Desktop Only: Shopping Cart Trigger */}
            <button
              type="button"
              aria-label={`Shopping cart (${cartCount} items)`}
              onClick={() => {
                setBlindOpen(false);
                setCartOpen(true);
              }}
              className="relative hidden lg:flex h-9 w-9 items-center justify-center rounded-full border border-[#dedbd2] bg-white/90 text-[#141413] shadow-xs transition hover:border-[#141413] hover:bg-[#141413] hover:text-[#f6f5f0] focus:outline-none"
              title="Shopping Cart"
            >
              <ShoppingBag className="h-4 w-4" />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#d93829] px-1 text-[10px] font-bold text-white shadow-xs">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Desktop Only: Reader Account Link */}
            <Link
              href="/account"
              aria-label={user ? `Account (${user.name})` : "Reader Sign In"}
              className="hidden lg:flex h-9 w-9 items-center justify-center rounded-full border border-[#dedbd2] bg-white/90 text-[#141413] shadow-xs transition hover:border-[#141413] hover:bg-[#141413] hover:text-[#f6f5f0] focus:outline-none"
              title={user ? `Signed in as ${user.name}` : "Reader Sign In / Account"}
            >
              <User className="h-4 w-4" />
            </Link>

            {/* Responsive Mobile & Tablet Menu Toggle (Only visible < 1024px) */}
            <button
              type="button"
              aria-label={blindOpen ? "Close Navigation Menu" : "Open Navigation Menu"}
              onClick={() => setBlindOpen((v) => !v)}
              className="flex lg:hidden h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-[#dedbd2] bg-white text-[#141413] shadow-xs transition hover:border-[#141413] hover:bg-[#141413] hover:text-[#f6f5f0] focus:outline-none"
              title={blindOpen ? "Close Menu" : "Open Menu"}
            >
              {blindOpen ? (
                <X className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
              ) : (
                <Menu className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* MINIMAZE SIGNATURE PULL-DOWN PAPER BLIND MENU (MOBILE & TABLET ONLY < 1024px) */}
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
            className="fixed inset-x-0 top-16 z-40 max-h-[calc(100dvh-64px)] overflow-y-auto overscroll-contain border-b border-[#dedbd2] bg-[#f6f5f0] pb-10 shadow-[0_32px_64px_rgba(20,20,19,0.16)] lg:hidden"
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

            <div className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:py-8 sm:px-6 lg:px-8">
              {/* Menu Header Utility Bar: Reader Login / Account + Search & Bag Triggers */}
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-[#dedbd2] pb-5">
                <Link
                  href="/account"
                  onClick={() => setBlindOpen(false)}
                  className="inline-flex items-center gap-2 rounded-full border border-[#141413] bg-[#141413] px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold text-[#f6f5f0] shadow-xs transition hover:bg-[#2a2a28]"
                >
                  <User className="h-3.5 w-3.5" />
                  <span>{user ? `Signed in as ${user.name}` : "Reader Sign In / Account"}</span>
                </Link>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setBlindOpen(false);
                      setSearchOpen(true);
                    }}
                    className="flex items-center gap-1.5 rounded-full border border-[#dedbd2] bg-white px-3 py-1.5 text-xs font-semibold text-[#141413] transition hover:border-[#141413]"
                  >
                    <Search className="h-3.5 w-3.5 text-[#62605a]" />
                    <span>Search</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setBlindOpen(false);
                      setCartOpen(true);
                    }}
                    className="flex items-center gap-1.5 rounded-full border border-[#dedbd2] bg-white px-3 py-1.5 text-xs font-semibold text-[#141413] transition hover:border-[#141413]"
                  >
                    <ShoppingBag className="h-3.5 w-3.5 text-[#62605a]" />
                    <span>Bag</span>
                    {cartCount > 0 && (
                      <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#d93829] px-1 text-[10px] font-bold text-white">
                        {cartCount}
                      </span>
                    )}
                  </button>

                  <Link
                    href="/account?tab=wishlist"
                    onClick={() => setBlindOpen(false)}
                    className="flex items-center gap-1.5 rounded-full border border-[#dedbd2] bg-white px-3 py-1.5 text-xs font-semibold text-[#141413] transition hover:border-[#141413]"
                  >
                    <Heart className="h-3.5 w-3.5 text-[#62605a]" />
                    <span>Wishlist</span>
                    {wishlist.length > 0 && (
                      <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#d93829] px-1 text-[10px] font-bold text-white">
                        {wishlist.length}
                      </span>
                    )}
                  </Link>
                </div>
              </div>

              {/* Main Navigation Grid */}
              <div className="grid gap-2.5 sm:gap-3 md:grid-cols-2 lg:grid-cols-3">
                {NAV_LINKS.map((item) => {
                  const active =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="group flex items-baseline justify-between rounded-2xl border border-[#dedbd2]/80 bg-white/85 px-4 py-3.5 sm:px-6 sm:py-5 transition hover:border-[#141413] hover:bg-white"
                    >
                      <div>
                        <span className="font-mono text-[10px] sm:text-[11px] font-semibold text-[#d93829]">
                          {item.code}
                        </span>
                        <h3 className="mt-0.5 sm:mt-1 font-serif text-xl sm:text-3xl font-semibold text-[#141413] transition group-hover:translate-x-1">
                          {item.label}
                        </h3>
                        <p className="mt-0.5 text-[11px] sm:text-xs text-[#62605a]">{item.note}</p>
                      </div>
                      <span
                        className={`h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full transition ${
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
                <div className="flex flex-wrap gap-3 sm:gap-5">
                  <Link href="/account?tab=wishlist" className="hover:text-[#141413]">
                    Wishlist ({wishlist.length})
                  </Link>
                  <Link href="/track" className="hover:text-[#141413]">
                    Track Order
                  </Link>
                  <Link href="/cart" className="hover:text-[#141413]">
                    Shopping Bag ({cartCount})
                  </Link>
                  <Link href="/account" className="hover:text-[#141413]">
                    {user ? `User Portal: ${user.name}` : "Reader Login"}
                  </Link>
                  {user?.role === "admin" && (
                    <Link href="/admin" className="hover:text-[#141413] text-[#d93829] font-bold">
                      CMS Console (Admin)
                    </Link>
                  )}
                </div>
                <span className="hidden sm:inline">GALLERY OPEN • DHAKA &amp; ONLINE</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
