"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/components/providers/StoreProvider";
import { formatPrice } from "@/lib/format";
import type { PaymentGatewayAvailability, PaymentMethod } from "@/lib/types";
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  Lock,
  ShieldCheck,
  Truck,
} from "lucide-react";

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { cart, cartSubtotal, user, clearCart, notify } = useStore();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Dhaka");
  const [postalCode, setPostalCode] = useState("");
  const [instructions, setInstructions] = useState("");

  const [couponCode, setCouponCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [appliedCode, setAppliedCode] = useState("");

  const [paymentMethods, setPaymentMethods] = useState<PaymentGatewayAvailability[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>("COD");
  const [submitting, setSubmitting] = useState(false);

  const paymentErrorParam = searchParams.get("paymentError");

  useEffect(() => {
    if (paymentErrorParam) {
      notify(paymentErrorParam, "error");
    }
  }, [paymentErrorParam, notify]);

  useEffect(() => {
    if (user) {
      setFullName((v) => v || user.name);
      setEmail((v) => v || user.email);
      setPhone((v) => v || user.phone);
      const def = user.addresses?.find((a) => a.isDefault) || user.addresses?.[0];
      if (def) {
        setAddress((v) => v || def.addressLine);
        setCity(def.city || "Dhaka");
        setPostalCode((v) => v || def.postalCode);
      }
    }
  }, [user]);

  useEffect(() => {
    try {
      const savedCity = sessionStorage.getItem("uttoron_checkout_city");
      if (savedCity) setCity(savedCity);
      const savedCoupon = sessionStorage.getItem("uttoron_checkout_coupon");
      if (savedCoupon) {
        const parsed = JSON.parse(savedCoupon) as { code: string; discount: number };
        setCouponCode(parsed.code);
        setAppliedCode(parsed.code);
        setAppliedDiscount(parsed.discount);
      }
    } catch {
      // ignore
    }

    fetch("/api/config/payments")
      .then((r) => r.json())
      .then((d: { methods: PaymentGatewayAvailability[] }) => {
        setPaymentMethods(d.methods || []);
      })
      .catch(() => {});
  }, []);

  const deliveryCharge =
    cartSubtotal <= 0
      ? 0
      : cartSubtotal >= 2000
      ? 0
      : city.toLowerCase().includes("dhaka")
      ? 60
      : 120;

  const discount = Math.min(appliedDiscount, cartSubtotal);
  const totalPayable = Math.max(0, cartSubtotal - discount + deliveryCharge);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    const res = await fetch("/api/coupons/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: couponCode.trim(), subtotal: cartSubtotal }),
    });
    const data = (await res.json()) as {
      valid?: boolean;
      code?: string;
      discount?: number;
      error?: string;
    };
    if (!res.ok || !data.valid) {
      setAppliedDiscount(0);
      setAppliedCode("");
      notify(data.error || "Invalid coupon code.", "error");
    } else {
      setAppliedCode(data.code!);
      setAppliedDiscount(data.discount!);
      notify(`Applied ${data.code} (-${formatPrice(data.discount!)})`, "success");
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      notify("Your cart is empty.", "error");
      return;
    }

    const activeGateway = paymentMethods.find((m) => m.method === selectedPayment);
    if (selectedPayment !== "COD" && activeGateway && !activeGateway.configured) {
      notify(
        `${activeGateway.label} is not configured with live merchant API credentials on the server. Please select Cash on Delivery.`,
        "error"
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            fullName,
            phone,
            email,
            address,
            city,
            postalCode,
            instructions,
          },
          items: cart.map((c) => ({ bookId: c.bookId, quantity: c.quantity })),
          couponCode: appliedCode || undefined,
          paymentMethod: selectedPayment,
        }),
      });

      const data = (await res.json()) as {
        order?: { orderNumber: string };
        redirectUrl?: string;
        error?: string;
      };

      if (!res.ok || !data.order) {
        notify(data.error || "Could not place order.", "error");
        return;
      }

      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }

      clearCart();
      sessionStorage.removeItem("uttoron_checkout_coupon");
      notify(`Order ${data.order.orderNumber} confirmed!`, "success");
      router.push(`/orders/${data.order.orderNumber}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="paper-grain min-h-screen bg-[#f6f5f0] pb-24 pt-28 text-[#141413]">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <div className="rounded-[2rem] border border-[#dedbd2] bg-white p-12">
            <h1 className="font-serif text-3xl font-semibold text-[#141413]">
              Your checkout bag is empty
            </h1>
            <p className="mt-2 text-sm text-[#62605a]">
              Add books from our catalog before proceeding to checkout.
            </p>
            <Link
              href="/books"
              className="mt-6 inline-block rounded-full bg-[#141413] px-7 py-3 text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:bg-[#d93829]"
            >
              Browse Books
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="paper-grain min-h-screen bg-[#f6f5f0] pb-24 pt-28 text-[#141413]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.26em] text-[#62605a]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#d93829]" />
              Secure Fulfillment
            </p>
            <h1 className="mt-2 font-serif text-4xl font-semibold text-[#141413] sm:text-5xl">
              Checkout
            </h1>
          </div>
          {!user && (
            <p className="text-xs text-[#62605a]">
              Checking out as Guest •{" "}
              <Link href="/account" className="font-semibold text-[#141413] underline">
                Sign in
              </Link>{" "}
              for saved addresses
            </p>
          )}
        </header>

        <form onSubmit={handlePlaceOrder} className="grid gap-10 lg:grid-cols-12">
          {/* LEFT: Delivery & Payment Details */}
          <div className="space-y-8 lg:col-span-7">
            <section className="rounded-[2rem] border border-[#dedbd2] bg-white p-6 sm:p-8">
              <h2 className="flex items-center gap-2 font-serif text-2xl font-semibold text-[#141413]">
                <Truck className="h-5 w-5 text-[#d93829]" />
                Delivery Information
              </h2>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#141413]">
                    Customer Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Ayesha Rahman"
                    className="mt-1.5 w-full rounded-xl border border-[#dedbd2] bg-[#f6f5f0] px-4 py-3 text-sm text-[#141413] focus:border-[#141413] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#141413]">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+880 17XX-XXXXXX"
                    className="mt-1.5 w-full rounded-xl border border-[#dedbd2] bg-[#f6f5f0] px-4 py-3 text-sm text-[#141413] focus:border-[#141413] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#141413]">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="mt-1.5 w-full rounded-xl border border-[#dedbd2] bg-[#f6f5f0] px-4 py-3 text-sm text-[#141413] focus:border-[#141413] focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#141413]">
                    Delivery Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="House, Road, Apartment / Area"
                    className="mt-1.5 w-full rounded-xl border border-[#dedbd2] bg-[#f6f5f0] px-4 py-3 text-sm text-[#141413] focus:border-[#141413] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#141413]">
                    City / District *
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Dhaka, Chattogram, Sylhet..."
                    className="mt-1.5 w-full rounded-xl border border-[#dedbd2] bg-[#f6f5f0] px-4 py-3 text-sm text-[#141413] focus:border-[#141413] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#141413]">
                    Postal Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="e.g. 1209"
                    className="mt-1.5 w-full rounded-xl border border-[#dedbd2] bg-[#f6f5f0] px-4 py-3 text-sm text-[#141413] focus:border-[#141413] focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#141413]">
                    Additional Delivery Instructions (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="Gift wrapping note, call before arrival, preferred time window..."
                    className="mt-1.5 w-full rounded-xl border border-[#dedbd2] bg-[#f6f5f0] px-4 py-2.5 text-sm text-[#141413] focus:border-[#141413] focus:outline-none"
                  />
                </div>
              </div>
            </section>

            {/* Configurable Payment Options */}
            <section className="rounded-[2rem] border border-[#dedbd2] bg-white p-6 sm:p-8">
              <h2 className="flex items-center gap-2 font-serif text-2xl font-semibold text-[#141413]">
                <CreditCard className="h-5 w-5 text-[#d93829]" />
                Payment Method
              </h2>
              <p className="mt-1 text-xs text-[#62605a]">
                Online gateways verify transactions directly with merchant APIs before confirming orders.
              </p>

              <div className="mt-5 space-y-3">
                {paymentMethods.map((pm) => {
                  if (!pm.enabled) return null;
                  const active = selectedPayment === pm.method;
                  const unconfiguredOnline = pm.method !== "COD" && !pm.configured;
                  return (
                    <label
                      key={pm.method}
                      className={`flex cursor-pointer items-start gap-3.5 rounded-2xl border p-4 transition ${
                        active
                          ? "border-[#141413] bg-[#f6f5f0] shadow-sm"
                          : "border-[#dedbd2] bg-white hover:border-[#141413]/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={pm.method}
                        checked={active}
                        onChange={() => setSelectedPayment(pm.method)}
                        className="mt-1 accent-[#d93829]"
                      />
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-semibold text-sm text-[#141413]">
                            {pm.label}
                          </span>
                          {pm.configured ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#eceae3] px-2.5 py-0.5 text-[10px] font-semibold text-[#141413]">
                              <CheckCircle2 className="h-3 w-3 text-[#d93829]" /> Ready
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-semibold text-amber-900">
                              <AlertTriangle className="h-3 w-3" /> API Keys Required
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-[#62605a]">{pm.subtitle}</p>
                        {unconfiguredOnline && active && pm.missingEnvVars && (
                          <p className="mt-2 rounded-lg bg-amber-50 p-2 text-[11px] text-amber-950">
                            Server requires{" "}
                            <code className="font-mono">{pm.missingEnvVars.join(", ")}</code>{" "}
                            in <code>.env.local</code> to process live {pm.label} payments.
                          </p>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </section>
          </div>

          {/* RIGHT: Order Summary */}
          <aside className="lg:col-span-5">
            <div className="sticky top-28 rounded-[2rem] border border-[#dedbd2] bg-white p-6 shadow-sm sm:p-8">
              <h2 className="font-serif text-2xl font-semibold text-[#141413]">
                Order Summary
              </h2>

              <div className="mt-5 max-h-72 space-y-3 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div
                    key={item.bookId}
                    className="flex items-center justify-between gap-3 border-b border-[#dedbd2] pb-3 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-serif font-semibold text-[#141413]">
                        {item.title}
                      </p>
                      <p className="text-xs text-[#62605a]">
                        Qty {item.quantity} × {formatPrice(item.price)}
                      </p>
                    </div>
                    <span className="shrink-0 font-semibold text-[#141413]">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Coupon */}
              <div className="mt-5 flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Coupon code (e.g. LIBRARY10)"
                  className="flex-1 rounded-xl border border-[#dedbd2] bg-[#f6f5f0] px-3.5 py-2 text-xs uppercase text-[#141413]"
                />
                <button
                  type="button"
                  onClick={applyCoupon}
                  className="rounded-xl border border-[#dedbd2] bg-white px-4 py-2 text-xs font-semibold text-[#141413] hover:bg-[#eceae3]"
                >
                  Apply
                </button>
              </div>

              <dl className="mt-6 space-y-2.5 border-t border-[#dedbd2] pt-5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-[#62605a]">Subtotal</dt>
                  <dd className="font-semibold">{formatPrice(cartSubtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#62605a]">Delivery ({city || "Standard"})</dt>
                  <dd className="font-semibold">
                    {deliveryCharge === 0 ? "Free" : formatPrice(deliveryCharge)}
                  </dd>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-[#d93829]">
                    <dt>Coupon Discount ({appliedCode})</dt>
                    <dd className="font-semibold">-{formatPrice(discount)}</dd>
                  </div>
                )}
                <div className="flex justify-between border-t border-[#dedbd2] pt-3 text-base">
                  <dt className="font-bold text-[#141413]">Total Payable</dt>
                  <dd className="font-serif text-3xl font-bold text-[#141413]">
                    {formatPrice(totalPayable)}
                  </dd>
                </div>
              </dl>

              <button
                type="submit"
                disabled={submitting}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#141413] px-6 py-4 text-xs font-bold uppercase tracking-[0.18em] text-white shadow-xl transition hover:bg-[#d93829] disabled:opacity-60"
              >
                <Lock className="h-4 w-4" />
                {submitting ? "Placing Order..." : "Place Order"}
              </button>

              <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-[#62605a]">
                <ShieldCheck className="h-4 w-4 text-[#d93829]" />
                Server-verified inventory &amp; pricing before order creation
              </p>
            </div>
          </aside>
        </form>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#f6f5f0] pt-32 text-center text-sm text-[#62605a]">
          Loading checkout...
        </div>
      }
    >
      <CheckoutContent />
    </React.Suspense>
  );
}

