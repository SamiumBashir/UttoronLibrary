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
            className="fixed inset-0 bg-[#06110c]/70 backdrop-blur-sm"
          />

          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            aria-label="Shopping Bag"
            className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-[#dedbd2] bg-[#f6f5f0] shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#dedbd2] bg-white px-6 py-5 text-[#141413]">
              <div className="flex items-center gap-3">
                <ShoppingBag className="h-5 w-5 text-[#d93829]" />
                <div>
                  <h2 className="font-serif text-xl font-bold">শপিং ব্যাগ</h2>
                  <p className="text-xs text-[#62605a]">
                    {cartCount}টি বই যুক্ত আছে
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="শপিং ব্যাগ বন্ধ করুন"
                onClick={() => setCartOpen(false)}
                className="cursor-pointer rounded-full p-2 text-[#62605a] transition hover:bg-[#f6f5f0] hover:text-[#141413]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Free Courier Progress */}
            {cart.length > 0 && (
              <div className="border-b border-[#dedbd2] bg-[#eceae3] px-6 py-3 text-xs text-[#141413]">
                {freeShippingRemaining > 0 ? (
                  <span>
                    আর মাত্র <strong>{formatPrice(freeShippingRemaining)}</strong> টাকার বই কিনলে <strong>ফ্রি ডেলিভারি</strong>!
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 font-semibold text-[#141413]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#d93829]" />
                    অভিনন্দন! আপনার অর্ডারে ফ্রি ডেলিভারি প্রযোজ্য।
                  </span>
                )}
              </div>
            )}

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {cart.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#eceae3] text-[#d93829]">
                    <ShoppingBag className="h-7 w-7" />
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-[#141413]">
                    আপনার ব্যাগে কোনো বই নেই
                  </h3>
                  <p className="mt-2 max-w-xs text-xs text-[#62605a]">
                    আমাদের সংগ্রহশালা থেকে পছন্দের কালজয়ী বইগুলো খুঁজে নিন।
                  </p>
                  <Link
                    href="/books"
                    onClick={() => setCartOpen(false)}
                    className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#141413] px-6 py-3 text-xs font-bold text-white transition hover:bg-[#d93829]"
                  >
                    বই দেখুন <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div
                      key={item.bookId}
                      className="flex gap-4 rounded-2xl border border-[#dedbd2] bg-white p-3.5 shadow-xs"
                    >
                      <Link
                        href={`/books/${item.slug}`}
                        onClick={() => setCartOpen(false)}
                        className="cursor-pointer h-24 w-16 shrink-0 overflow-hidden rounded-r shadow-md"
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
                            className="cursor-pointer font-serif text-base font-bold leading-snug text-[#141413] hover:text-[#d93829] line-clamp-2"
                          >
                            {item.title}
                          </Link>
                          <button
                            type="button"
                            aria-label={`${item.title} মুছে ফেলুন`}
                            onClick={() => removeFromCart(item.bookId)}
                            className="cursor-pointer text-[#62605a] transition hover:text-[#d93829]"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="text-xs text-[#62605a] mt-0.5">{item.authorName}</p>

                        <div className="mt-auto flex items-center justify-between pt-3">
                          <div className="inline-flex items-center rounded-full border border-[#dedbd2] bg-[#f6f5f0]">
                            <button
                              type="button"
                              aria-label="পরিমাণ কমান"
                              onClick={() =>
                                updateQuantity(item.bookId, item.quantity - 1)
                              }
                              className="cursor-pointer p-1.5 text-[#141413] hover:text-[#d93829]"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="min-w-7 text-center text-xs font-bold text-[#141413]">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              aria-label="পরিমাণ বাড়ান"
                              onClick={() =>
                                updateQuantity(item.bookId, item.quantity + 1)
                              }
                              className="cursor-pointer p-1.5 text-[#141413] hover:text-[#d93829]"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <span className="font-serif text-base font-bold text-[#141413]">
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
              <div className="border-t border-[#dedbd2] bg-white p-6 shadow-xs">
                <div className="mb-4 flex items-baseline justify-between">
                  <span className="text-sm font-semibold text-[#62605a]">মোট মূল্য</span>
                  <span className="font-serif text-2xl font-bold text-[#141413]">
                    {formatPrice(cartSubtotal)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    href="/cart"
                    onClick={() => setCartOpen(false)}
                    className="inline-flex cursor-pointer items-center justify-center rounded-full border border-[#dedbd2] bg-[#f6f5f0] px-4 py-3 text-xs font-bold text-[#141413] transition hover:border-[#141413]"
                  >
                    ব্যাগ দেখুন
                  </Link>
                  <Link
                    href="/checkout"
                    onClick={() => setCartOpen(false)}
                    className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full bg-[#141413] px-4 py-3 text-xs font-bold text-white transition hover:bg-[#d93829]"
                  >
                    চেকআউট <ArrowRight className="h-3.5 w-3.5" />
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

