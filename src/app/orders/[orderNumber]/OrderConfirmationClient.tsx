"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import type { Order } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Compass,
  Copy,
  Check,
  Package,
  PackageSearch,
  Sparkles,
  Truck,
  Users,
  Home,
} from "lucide-react";

interface Props {
  orderNumber: string;
  initialOrder: Order | null;
}

export default function OrderConfirmationClient({
  orderNumber,
  initialOrder,
}: Props) {
  const [order, setOrder] = useState<Order | null>(initialOrder);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(!initialOrder);

  useEffect(() => {
    if (order) return;

    // 1. Try reading client-side checkout session storage backup
    try {
      const saved =
        sessionStorage.getItem(`uttoron_order_${orderNumber.toUpperCase()}`) ||
        sessionStorage.getItem("uttoron_last_order");
      if (saved) {
        const parsed = JSON.parse(saved) as Order;
        if (
          !parsed.orderNumber ||
          parsed.orderNumber.toUpperCase() === orderNumber.toUpperCase()
        ) {
          setOrder(parsed);
          setLoading(false);
        }
      }
    } catch {}

    // 2. Fetch live from API in case of slight replication delay
    let isMounted = true;
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${encodeURIComponent(orderNumber.trim())}`);
        if (res.ok) {
          const data = (await res.json()) as { order?: Order };
          if (data.order && isMounted) {
            setOrder(data.order);
          }
        }
      } catch {
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void fetchOrder();

    return () => {
      isMounted = false;
    };
  }, [order, orderNumber]);

  const handleCopyOrderNumber = () => {
    navigator.clipboard.writeText(orderNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusLabel = order?.orderStatus || "CONFIRMED";
  const paymentLabel = order
    ? `${order.paymentMethod} (${order.paymentStatus || "CONFIRMED"})`
    : "Cash on Delivery (Pending)";
  const deliveryEta =
    order?.estimatedDelivery ||
    (order?.customer?.city?.toLowerCase().includes("dhaka")
      ? "2-3 Business Days"
      : "3-5 Business Days");

  return (
    <div className="paper-grain min-h-screen bg-[#f6f5f0] pb-24 pt-28 text-[#141413]">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Welcome Note & Confirmation Header */}
        <div className="overflow-hidden rounded-[2rem] border border-[#dedbd2] bg-white p-6 sm:p-10 shadow-sm">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#d93829]/10 text-[#d93829]">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-[#d93829]/10 px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-[#d93829]">
                  <Sparkles className="h-3 w-3" /> অর্ডার নিশ্চিত হয়েছে • Order Confirmed
                </div>
                <h1 className="mt-2 font-serif text-2xl font-bold tracking-tight text-[#141413] sm:text-4xl">
                  ধন্যবাদ, আপনার অর্ডার গৃহীত হয়েছে!
                </h1>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#62605a]">
                  উত্তরন প্রকাশনীতে আপনাকে স্বাগতম। আপনার অর্ডার রিকুয়েস্টটি সফলভাবে
                  সংরক্ষণ করা হয়েছে। আমাদের ঢাকা বাইন্ডারি থেকে বইগুলো যাচাই করে দ্রুত
                  আপনার ঠিকানায় পাঠানোর ব্যবস্থা গ্রহণ করা হচ্ছে।
                </p>
              </div>
            </div>

            {/* Order Reference Pill & Copy */}
            <div className="flex flex-col items-start rounded-2xl border border-[#dedbd2] bg-[#f6f5f0] p-4 sm:items-end">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#62605a]">
                Order Reference
              </span>
              <div className="mt-1 flex items-center gap-2">
                <span className="font-mono text-base font-bold text-[#141413]">
                  {orderNumber}
                </span>
                <button
                  type="button"
                  onClick={handleCopyOrderNumber}
                  aria-label="Copy order reference"
                  className="rounded-md p-1.5 text-[#62605a] hover:bg-white hover:text-[#141413] transition"
                  title="Copy Order ID"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
              <span className="mt-2 inline-block rounded-full bg-[#141413] px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-white">
                {statusLabel}
              </span>
              <Link
                href="/account?tab=orders"
                className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[#62605a] hover:text-[#d93829] transition"
              >
                অর্ডার হিস্টোরি দেখুন →
              </Link>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-8 grid gap-4 border-t border-[#dedbd2] pt-6 text-sm sm:grid-cols-3">
            <div>
              <span className="block font-mono text-[11px] uppercase tracking-wider text-[#62605a]">
                Estimated Delivery
              </span>
              <span className="mt-1 block font-semibold text-[#d93829]">
                {deliveryEta}
              </span>
            </div>
            <div>
              <span className="block font-mono text-[11px] uppercase tracking-wider text-[#62605a]">
                Recipient
              </span>
              <span className="mt-1 block font-semibold text-[#141413]">
                {order?.customer?.fullName || "Valued Reader"}
              </span>
            </div>
            <div>
              <span className="block font-mono text-[11px] uppercase tracking-wider text-[#62605a]">
                Destination
              </span>
              <span className="mt-1 block font-semibold text-[#141413]">
                {order?.customer?.city
                  ? `${order.customer.city}${order.customer.postalCode ? `, ${order.customer.postalCode}` : ""}`
                  : "Address Saved on File"}
              </span>
            </div>
          </div>
        </div>

        {/* Browsing More Options Section (Featured Prominently) */}
        <div className="mt-8 rounded-[2rem] border border-[#dedbd2] bg-gradient-to-br from-white via-white to-[#f6f5f0] p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-[#d93829]">
                Explore Our Collection • আরও বই দেখুন
              </span>
              <h2 className="mt-1 font-serif text-2xl font-bold text-[#141413] sm:text-3xl">
                Looking for More Stories to Read?
              </h2>
              <p className="mt-1 text-sm text-[#62605a]">
                Explore our nine literary wings, discover celebrated authors, or wander through our 3D book gallery.
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
            <Link
              href="/books"
              className="group flex flex-col items-start justify-between rounded-2xl border border-[#dedbd2] bg-white p-5 transition hover:border-[#141413] hover:shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#141413] text-white transition group-hover:scale-105">
                <BookOpen className="h-5 w-5" />
              </div>
              <div className="mt-4">
                <h3 className="font-serif text-lg font-semibold text-[#141413] transition group-hover:text-[#d93829]">
                  All Books
                </h3>
                <p className="mt-0.5 text-xs text-[#62605a]">Complete archival press collection</p>
              </div>
              <span className="mt-3 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#d93829]">
                Browse Books →
              </span>
            </Link>

            <Link
              href="/categories"
              className="group flex flex-col items-start justify-between rounded-2xl border border-[#dedbd2] bg-white p-5 transition hover:border-[#141413] hover:shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d93829] text-white transition group-hover:scale-105">
                <Compass className="h-5 w-5" />
              </div>
              <div className="mt-4">
                <h3 className="font-serif text-lg font-semibold text-[#141413] transition group-hover:text-[#d93829]">
                  Categories
                </h3>
                <p className="mt-0.5 text-xs text-[#62605a]">Nine curated wings of literature</p>
              </div>
              <span className="mt-3 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#d93829]">
                Explore Wings →
              </span>
            </Link>

            <Link
              href="/authors"
              className="group flex flex-col items-start justify-between rounded-2xl border border-[#dedbd2] bg-white p-5 transition hover:border-[#141413] hover:shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600 text-white transition group-hover:scale-105">
                <Users className="h-5 w-5" />
              </div>
              <div className="mt-4">
                <h3 className="font-serif text-lg font-semibold text-[#141413] transition group-hover:text-[#d93829]">
                  Authors
                </h3>
                <p className="mt-0.5 text-xs text-[#62605a]">Biographies and monographs</p>
              </div>
              <span className="mt-3 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#d93829]">
                Meet Fellows →
              </span>
            </Link>

            <Link
              href={`/track`}
              className="group flex flex-col items-start justify-between rounded-2xl border border-[#dedbd2] bg-white p-5 transition hover:border-[#141413] hover:shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#62605a] text-white transition group-hover:scale-105">
                <PackageSearch className="h-5 w-5" />
              </div>
              <div className="mt-4">
                <h3 className="font-serif text-lg font-semibold text-[#141413] transition group-hover:text-[#d93829]">
                  Live Tracking
                </h3>
                <p className="mt-0.5 text-xs text-[#62605a]">Inspect delivery milestones</p>
              </div>
              <span className="mt-3 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#d93829]">
                Track Order →
              </span>
            </Link>
          </div>
        </div>

        {/* Order Details & Timeline Section */}
        <div className="mt-8 grid gap-8 md:grid-cols-12">
          {/* Items & Pricing Breakdown */}
          <div className="rounded-[2rem] border border-[#dedbd2] bg-white p-6 sm:p-8 md:col-span-7 shadow-sm">
            <h2 className="flex items-center gap-2 font-serif text-2xl font-semibold text-[#141413]">
              <Package className="h-5 w-5 text-[#d93829]" /> Volumes Ordered
            </h2>

            {order?.items && order.items.length > 0 ? (
              <div className="mt-5 space-y-3">
                {order.items.map((item, idx) => (
                  <div
                    key={`${item.bookId}-${idx}`}
                    className="flex items-center justify-between border-b border-[#dedbd2] pb-3 text-sm"
                  >
                    <div>
                      <Link
                        href={`/books/${item.slug}`}
                        className="font-serif text-base sm:text-lg font-semibold text-[#141413] hover:text-[#d93829]"
                      >
                        {item.title}
                      </Link>
                      <p className="text-xs text-[#62605a]">
                        {item.quantity} × {formatPrice(item.unitPrice)}
                      </p>
                    </div>
                    <span className="font-semibold text-[#141413]">
                      {formatPrice(item.lineTotal)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-xl border border-dashed border-[#dedbd2] bg-[#f6f5f0] p-4 text-center">
                <p className="text-xs text-[#62605a]">
                  {loading
                    ? "Loading order volume specifics..."
                    : `Order items registered under reference ${orderNumber}. You will receive full receipt via email/SMS.`}
                </p>
              </div>
            )}

            <dl className="mt-6 space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-[#62605a]">Subtotal</dt>
                <dd className="font-medium">
                  {order ? formatPrice(order.subtotal) : "—"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#62605a]">Delivery Charge</dt>
                <dd className="font-medium">
                  {order
                    ? order.deliveryCharge === 0
                      ? "Free"
                      : formatPrice(order.deliveryCharge)
                    : "Standard Free Delivery"}
                </dd>
              </div>
              {order && order.discount > 0 && (
                <div className="flex justify-between text-[#d93829]">
                  <dt>Discount {order.couponCode ? `(${order.couponCode})` : ""}</dt>
                  <dd className="font-medium">-{formatPrice(order.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-[#dedbd2] pt-4 text-base font-bold text-[#141413]">
                <dt>Total Payable</dt>
                <dd className="font-serif text-2xl text-[#d93829]">
                  {order ? formatPrice(order.total) : "—"}
                </dd>
              </div>
            </dl>
          </div>

          {/* Fulfillment Timeline & Delivery Details */}
          <div className="rounded-[2rem] border border-[#dedbd2] bg-white p-6 sm:p-8 md:col-span-5 shadow-sm">
            <h2 className="flex items-center gap-2 font-serif text-2xl font-semibold text-[#141413]">
              <Truck className="h-5 w-5 text-[#d93829]" /> Fulfillment Status
            </h2>
            <div className="mt-5 space-y-4">
              {order?.timeline && order.timeline.length > 0 ? (
                order.timeline.map((ev, idx) => (
                  <div key={idx} className="flex gap-3">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#d93829]" />
                    <div>
                      <p className="text-sm font-semibold text-[#141413]">{ev.label}</p>
                      <p className="text-xs text-[#62605a]">{ev.note}</p>
                      <p className="mt-0.5 text-[11px] text-[#62605a]/70">
                        {new Date(ev.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <div>
                      <p className="text-sm font-semibold text-[#141413]">Order Received</p>
                      <p className="text-xs text-[#62605a]">Your order is recorded in the Dhaka catalog.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#d93829]" />
                    <div>
                      <p className="text-sm font-semibold text-[#141413]">Bindery Preparation</p>
                      <p className="text-xs text-[#62605a]">Volumes are being packaged for dispatch.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 flex flex-col gap-2.5">
              <Link
                href="/books"
                className="rounded-full bg-[#141413] px-5 py-3 text-center text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:bg-[#d93829]"
              >
                Continue Browsing Books
              </Link>
              <Link
                href="/"
                className="flex items-center justify-center gap-2 rounded-full border border-[#dedbd2] px-5 py-3 text-center text-xs font-semibold text-[#141413] transition hover:border-[#141413]"
              >
                <Home className="h-3.5 w-3.5" /> Return to 3D Exhibition
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
