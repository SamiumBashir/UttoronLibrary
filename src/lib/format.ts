export function formatPrice(amount: number): string {
  return `৳${Math.round(amount).toLocaleString("en-US")}`;
}

export function getDiscountPercent(originalPrice: number, price: number): number {
  if (originalPrice <= price || originalPrice <= 0) return 0;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}

export function getStockBadge(stock: number): {
  label: string;
  tone: "in" | "low" | "out";
} {
  if (stock <= 0) {
    return { label: "Out of Stock", tone: "out" };
  }
  if (stock <= 8) {
    return { label: `Only ${stock} Left`, tone: "low" };
  }
  return { label: "In Stock", tone: "in" };
}

