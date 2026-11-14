"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useStore } from "@/components/providers/StoreProvider";
import { formatPrice } from "@/lib/format";
import BookCoverArt from "@/components/books/BookCoverArt";
import { ArrowRight, Minus, Plus, ShoppingBag, Tag, Trash2 } from "lucide-react";

export default function CartPage() {
  const {
    cart,
    cartSubtotal,
    updateQuantity,
    removeFromCart,
    notify,
  } = useStore();

  const [city, setCity] = useState("Dhaka");
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
    description: string;
  } | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  useEffect(() => {
    try {
      const savedCoupon = sessionStorage.getItem("uttoron_checkout_coupon");
      if (savedCoupon) {
        const parsed = JSON.parse(savedCoupon) as {
          code: string;
          discount: number;
          description: string;
        };
        setCouponInput(parsed.code);
        setAppliedCoupon(parsed);
      }
      const savedCity = sessionStorage.getItem("uttoron_checkout_city");
      if (savedCity) setCity(savedCity);
    } catch {
      // ignore
    }
  }, []);

  const deliveryCharge =
    cartSubtotal <= 0
      ? 0
      : cartSubtotal >= 2000
      ? 0
      : city.toLowerCase().includes("dhaka")
      ? 60
      : 120;

  const discount = appliedCoupon ? Math.min(appliedCoupon.discount, cartSubtotal) : 0;
  const total = Math.max(0, cartSubtotal - discount + deliveryCharge);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setValidatingCoupon(true);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponInput.trim(), subtotal: cartSubtotal }),
      });
      const data = (await res.json()) as {
        valid?: boolean;
        code?: string;
        discount?: number;
        description?: string;
        error?: string;
      };
      if (!res.ok || !data.valid) {
        setAppliedCoupon(null);
        sessionStorage.removeItem("uttoron_checkout_coupon");
        notify(data.error || "Invalid coupon code.", "error");
      } else {
        const payload = {
          code: data.code!,
          discount: data.discount!,
          description: data.description || "Discount applied",
        };
        setAppliedCoupon(payload);
        sessionStorage.setItem("uttoron_checkout_coupon", JSON.stringify(payload));
        notify(`Coupon ${payload.code} applied (-${formatPrice(payload.discount)}).`, "success");
      }
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleCityChange = (nextCity: string) => {
    setCity(nextCity);
    try {
      sessionStorage.setItem("uttoron_checkout_city", nextCity);
    } catch {
      // ignore
    }
  };

  return (
    <div className="paper-grain min-h-screen bg-[#f6f5f0] pb-24 pt-20 sm:pt-28 text-[#141413]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="mb-6 sm:mb-10">
          <p className="inline-flex items-center gap-2 font-mono text-[10px] sm:text-xs font-semibold uppercase tracking-[0.26em] text-[#62605a]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#d93829]" />
            Your Reading Bag
          </p>
          <h1 className="mt-1.5 sm:mt-2 font-serif text-2xl xs:text-3xl sm:text-5xl font-semibold text-[#141413]">
            Shopping Cart
          </h1>
        </header>

        {cart.length === 0 ? (
          <div className="rounded-2xl sm:rounded-[2rem] border border-[#dedbd2] bg-white px-5 sm:px-6 py-12 sm:py-20 text-center">
            <ShoppingBag className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-[#d93829]" />
            <h2 className="mt-4 font-serif text-2xl sm:text-3xl font-semibold text-[#141413]">
              No volumes in your bag yet
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-[#62605a]">
              Browse our gallery collection to discover clothbound editions and new arrivals.
            </p>
            <Link
              href="/books"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#141413] px-6 sm:px-7 py-3 sm:py-3.5 text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:bg-[#d93829]"
            >
              Continue Shopping <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:gap-10 lg:grid-cols-12">
            {/* Cart Items List */}
            <div className="space-y-3 sm:space-y-4 lg:col-span-8">
              {cart.map((item) => (
                <div
                  key={item.bookId}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 rounded-2xl sm:rounded-[2rem] border border-[#dedbd2] bg-white p-3.5 sm:p-5"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Link
                      href={`/books/${item.slug}`}
                      className="h-20 w-14 sm:h-28 sm:w-20 shrink-0 overflow-hidden rounded-r shadow-md"
                    >
                      <BookCoverArt
                        title={item.title}
                        authorName={item.authorName}
                        category=""
                        palette={item.coverPalette}
                        compact
                      />
                    </Link>

                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/books/${item.slug}`}
                        className="font-serif text-base sm:text-2xl font-semibold text-[#141413] hover:text-[#d93829] line-clamp-2"
                      >
                        {item.title}
                      </Link>
                      <p className="text-[11px] sm:text-xs text-[#62605a] truncate">
                        {item.authorName} • ISBN {item.isbn}
                      </p>
                      <p className="mt-1 sm:mt-2 text-xs sm:text-sm font-semibold text-[#141413]">
                        {formatPrice(item.price)} each
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-[#eceae3] pt-2.5 sm:border-0 sm:pt-0 sm:justify-end gap-4 sm:gap-6">
                    <div className="inline-flex items-center rounded-full border border-[#dedbd2] bg-[#f6f5f0] px-1 sm:px-1.5 py-0.5 sm:py-1">
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        onClick={() => updateQuantity(item.bookId, item.quantity - 1)}
                        className="p-1 sm:p-1.5 text-[#141413] hover:text-[#d93829]"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="min-w-6 sm:min-w-7 text-center text-xs font-bold">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        onClick={() => updateQuantity(item.bookId, item.quantity + 1)}
                        className="p-1 sm:p-1.5 text-[#141413] hover:text-[#d93829]"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="text-right">
                      <p className="font-serif text-base sm:text-xl font-bold text-[#141413]">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.bookId)}
                        className="mt-0.5 inline-flex items-center gap-1 text-[11px] sm:text-xs text-[#d93829]/80 hover:text-[#d93829]"
                      >
                        <Trash2 className="h-3 w-3" /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <div className="pt-2">
                <Link
                  href="/books"
                  className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#141413] hover:text-[#d93829]"
                >
                  ← Continue Shopping
                </Link>
              </div>
            </div>

            {/* Order Summary & Coupon */}
            <aside className="lg:col-span-4">
              <div className="rounded-[2rem] border border-[#dedbd2] bg-white p-7 shadow-sm">
                <h2 className="font-serif text-2xl font-semibold text-[#141413]">
                  Order Summary
                </h2>

                {/* Coupon Form */}
                <form onSubmit={handleApplyCoupon} className="mt-5">
                  <label
                    htmlFor="cart-coupon"
                    className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#62605a]"
                  >
                    <Tag className="h-3.5 w-3.5 text-[#d93829]" /> Discount Coupon
                  </label>
                  <div className="mt-2 flex gap-2">
                    <input
                      id="cart-coupon"
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="e.g. LIBRARY10"
                      className="flex-1 rounded-xl border border-[#dedbd2] bg-[#f6f5f0] px-3.5 py-2.5 text-xs uppercase text-[#141413] focus:border-[#141413] focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={validatingCoupon}
                      className="rounded-xl bg-[#141413] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#d93829]"
                    >
                      Apply
                    </button>
                  </div>
                  <p className="mt-1.5 text-[11px] text-[#62605a]">
                    Try <code className="font-semibold text-[#141413]">LIBRARY10</code> or{" "}
                    <code className="font-semibold text-[#141413]">FIRSTREAD</code>
                  </p>
                </form>

                {/* Delivery Zone Estimator */}
                <div className="mt-5">
                  <label
                    htmlFor="cart-delivery-city"
                    className="block text-xs font-semibold uppercase tracking-[0.16em] text-[#62605a]"
                  >
                    Delivery Zone
                  </label>
                  <select
                    id="cart-delivery-city"
                    value={city}
                    onChange={(e) => handleCityChange(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-[#dedbd2] bg-[#f6f5f0] px-3.5 py-2.5 text-xs font-medium text-[#141413]"
                  >
                    <option value="Dhaka">Dhaka Metro (৳60 • Free above ৳2,000)</option>
                    <option value="Chattogram">Outside Dhaka (৳120 • Free above ৳2,000)</option>
                  </select>
                </div>

                {/* Breakdown */}
                <dl className="mt-6 space-y-3 border-t border-[#dedbd2] pt-5 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-[#62605a]">Subtotal</dt>
                    <dd className="font-semibold text-[#141413]">{formatPrice(cartSubtotal)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[#62605a]">Delivery Charge</dt>
                    <dd className="font-semibold text-[#141413]">
                      {deliveryCharge === 0 ? "Free" : formatPrice(deliveryCharge)}
                    </dd>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-[#d93829]">
                      <dt>Discount ({appliedCoupon?.code})</dt>
                      <dd className="font-semibold">-{formatPrice(discount)}</dd>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-[#dedbd2] pt-3 text-base">
                    <dt className="font-semibold text-[#141413]">Total Payable</dt>
                    <dd className="font-serif text-2xl font-bold text-[#141413]">
                      {formatPrice(total)}
                    </dd>
                  </div>
                </dl>

                <Link
                  href="/checkout"
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#141413] px-6 py-3.5 text-xs font-bold uppercase tracking-[0.18em] text-white shadow-lg transition hover:bg-[#d93829]"
                >
                  Proceed to Checkout <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}

