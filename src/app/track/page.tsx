"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Order } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { ArrowRight, Clock, PackageSearch } from "lucide-react";

function TrackContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("id") || searchParams.get("order") || "";
  const [orderNumber, setOrderNumber] = useState(initialQuery);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchTrack = async (targetId: string) => {
    const trimmed = targetId.trim().toUpperCase();
    if (!trimmed) return;
    setLoading(true);
    setError("");
    setOrder(null);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(trimmed)}`);
      const data = (await res.json()) as { order?: Order; error?: string };
      if (!res.ok || !data.order) {
        setError(data.error || "Order number not found in current records.");
      } else {
        setOrder(data.order);
      }
    } catch {
      setError("Failed to locate order. Please check network connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      setOrderNumber(initialQuery);
      void fetchTrack(initialQuery);
    }
  }, [initialQuery]);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    void fetchTrack(orderNumber);
  };

  return (
    <div className="paper-grain min-h-screen bg-[#f6f5f0] pb-24 pt-28 text-[#141413]">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <PackageSearch className="mx-auto h-10 w-10 text-[#d93829]" />
          <h1 className="mt-3 font-serif text-4xl font-semibold text-[#141413] sm:text-5xl">
            Track Your Order
          </h1>
          <p className="mt-2 text-sm text-[#62605a]">
            Enter your Uttoron Prokasoni order ID (e.g. UP-20261114-98BD) to inspect live
            bindery and courier milestones.
          </p>
        </div>

        <form
          onSubmit={handleTrack}
          className="mt-8 flex flex-col gap-3 rounded-[2rem] border border-[#dedbd2] bg-white p-4 sm:flex-row"
        >
          <input
            type="text"
            required
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="Enter Order ID (e.g. UP-20261114-...)"
            className="flex-1 rounded-2xl border border-[#dedbd2] bg-[#f6f5f0] px-4 py-3 text-sm uppercase text-[#141413] focus:border-[#141413] focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-2xl bg-[#141413] px-7 py-3 text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:bg-[#d93829]"
          >
            {loading ? "Locating..." : "Track Order"}
          </button>
        </form>

        {error && (
          <p className="mt-5 rounded-2xl border border-red-300 bg-red-50 p-4 text-center text-sm text-[#d93829]">
            {error}
          </p>
        )}

        {order && (
          <div className="mt-8 rounded-[2rem] border border-[#dedbd2] bg-white p-7 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#dedbd2] pb-5">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[#d93829]">
                  {order.orderNumber}
                </p>
                <h2 className="mt-1 font-serif text-2xl font-semibold text-[#141413]">
                  Status: {order.orderStatus}
                </h2>
                <p className="text-xs text-[#62605a]">
                  Estimated Delivery: {order.estimatedDelivery}
                </p>
              </div>
              <div className="text-right">
                <p className="font-serif text-2xl font-bold text-[#141413]">
                  {formatPrice(order.total)}
                </p>
                <Link
                  href={`/orders/${order.orderNumber}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#141413] hover:text-[#d93829]"
                >
                  Full Receipt <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {order.timeline.map((ev, idx) => (
                <div key={idx} className="flex gap-3">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#d93829]" />
                  <div>
                    <p className="text-sm font-semibold text-[#141413]">{ev.label}</p>
                    <p className="text-xs text-[#62605a]">{ev.note}</p>
                    <p className="text-[11px] text-[#62605a]/75">
                      {new Date(ev.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f6f5f0] pt-28 text-center text-sm text-[#62605a]">
          Loading tracker...
        </div>
      }
    >
      <TrackContent />
    </Suspense>
  );
}
