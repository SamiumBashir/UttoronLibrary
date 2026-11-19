"use client";

import React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useStore } from "@/components/providers/StoreProvider";
import { formatPrice } from "@/lib/format";
import BookCoverArt from "@/components/books/BookCoverArt";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";

export default function CartDrawer() {
  const {
    cart,
    cartCount,
    cartSubtotal,
    isCartOpen,
    setCartOpen,
    updateQuantity,
    removeFromCart,
  } = useStore();

  const freeShippingRemaining = Math.max(0, 2000 - cartSubtotal);

  return (
    <AnimatePresence>
      {isCartOpen && (
        <div className="fixed inset-0 z-[75] flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCartOpen(false)}
            className="fixed inset-0 bg-[#252525]/60 backdrop-blur-xs"
          />

          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            aria-label="Shopping Bag"
            className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-[#DDD9D1] bg-[#F8F7F3] shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#DDD9D1] bg-white px-6 py-5 text-[#252525]">
              <div className="flex items-center gap-3">
                <ShoppingBag className="h-5 w-5 text-[#722F37]" />
                <div>
                  <h2 className="font-serif text-xl font-semibold">Reading Bag</h2>
                  <p className="font-mono text-[11px] text-[#77736D]">
                    {cartCount} {cartCount === 1 ? "volume" : "volumes"} selected
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Close shopping bag"
                onClick={() => setCartOpen(false)}
                className="rounded-full p-2 text-[#77736D] transition hover:bg-[#F8F7F3] hover:text-[#252525]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Free Courier Progress */}
            {cart.length > 0 && (
              <div className="border-b border-[#DDD9D1] bg-[#E9E6DF] px-6 py-3 text-xs text-[#252525]">
                {freeShippingRemaining > 0 ? (
                  <span>
                    Add <strong>{formatPrice(freeShippingRemaining)}</strong> more for
                    complimentary archival courier delivery.
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 font-semibold text-[#252525]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#722F37]" />
                    Complimentary archival courier delivery unlocked.
                  </span>
                )}
              </div>
            )}

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {cart.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#E9E6DF] text-[#722F37]">
                    <ShoppingBag className="h-7 w-7" />
                  </div>
                  <h3 className="font-serif text-2xl font-semibold text-[#252525]">
                    Your reading bag is empty
                  </h3>
                  <p className="mt-2 max-w-xs text-sm text-[#77736D]">
                    Explore our collection to collect archival editions.
                  </p>
                  <Link
                    href="/books"
                    onClick={() => setCartOpen(false)}
                    className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#252525] px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#722F37]"
                  >
                    Explore Books <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div
                      key={item.bookId}
                      className="flex gap-4 rounded-xl border border-[#DDD9D1] bg-white p-3.5"
                    >
                      <Link
                        href={`/books/${item.slug}`}
                        onClick={() => setCartOpen(false)}
                        className="h-24 w-16 shrink-0 overflow-hidden rounded-r shadow-md"
                      >
                        <BookCoverArt
                          title={item.title}
                          authorName={item.authorName}
                          category=""
                          palette={item.coverPalette}
                          compact
                        />
                      </Link>

                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            href={`/books/${item.slug}`}
                            onClick={() => setCartOpen(false)}
                            className="font-serif text-base font-semibold leading-snug text-[#252525] hover:text-[#722F37] line-clamp-2"
                          >
                            {item.title}
                          </Link>
                          <button
                            type="button"
                            aria-label={`Remove ${item.title}`}
                            onClick={() => removeFromCart(item.bookId)}
                            className="text-[#77736D] transition hover:text-[#722F37]"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="text-xs text-[#77736D]">{item.authorName}</p>

                        <div className="mt-auto flex items-center justify-between pt-3">
                          <div className="inline-flex items-center rounded-full border border-[#DDD9D1] bg-[#F8F7F3]">
                            <button
                              type="button"
                              aria-label="Decrease quantity"
                              onClick={() =>
                                updateQuantity(item.bookId, item.quantity - 1)
                              }
                              className="p-1.5 text-[#252525] hover:text-[#722F37]"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="min-w-7 text-center text-xs font-semibold text-[#252525]">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              aria-label="Increase quantity"
                              onClick={() =>
                                updateQuantity(item.bookId, item.quantity + 1)
                              }
                              className="p-1.5 text-[#252525] hover:text-[#722F37]"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <span className="font-mono text-base font-bold text-[#252525]">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="border-t border-[#DDD9D1] bg-white p-6">
                <div className="mb-4 flex items-baseline justify-between">
                  <span className="text-sm font-medium text-[#77736D]">Subtotal</span>
                  <span className="font-mono text-2xl font-bold text-[#252525]">
                    {formatPrice(cartSubtotal)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    href="/cart"
                    onClick={() => setCartOpen(false)}
                    className="inline-flex items-center justify-center rounded-full border border-[#DDD9D1] bg-[#F8F7F3] px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#252525] transition hover:border-[#252525]"
                  >
                    View Bag
                  </Link>
                  <Link
                    href="/checkout"
                    onClick={() => setCartOpen(false)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#252525] px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-[#722F37]"
                  >
                    Checkout <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

