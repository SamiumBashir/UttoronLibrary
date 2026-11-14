import React from "react";
import { readStore } from "@/lib/db";
import { getOrderFromDb } from "@/lib/db-postgres";
import type { Order } from "@/lib/types";
import OrderConfirmationClient from "./OrderConfirmationClient";

export const dynamic = "force-dynamic";

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const normalizedNumber = (orderNumber || "").trim();

  // 1. Try PostgreSQL database first
  let initialOrder: Order | null = null;
  try {
    initialOrder = await getOrderFromDb(normalizedNumber);
  } catch (err) {
    console.warn("[Orders] Database lookup error:", err);
  }

  // 2. Fallback to file/memory store if not found in PostgreSQL
  if (!initialOrder) {
    try {
      const store = readStore();
      const matched = store.orders.find(
        (o) => o.orderNumber.toUpperCase() === normalizedNumber.toUpperCase()
      );
      if (matched) {
        initialOrder = matched;
      }
    } catch (err) {
      console.warn("[Orders] Local store lookup error:", err);
    }
  }

  // Never call notFound(); instead render the resilient client component with welcome note and browsing options
  return (
    <OrderConfirmationClient
      orderNumber={normalizedNumber}
      initialOrder={initialOrder}
    />
  );
}
