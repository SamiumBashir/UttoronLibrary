import fs from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";
import type {
  Author,
  Book,
  ContactMessage,
  Coupon,
  NewsletterSubscriber,
  Order,
  Review,
  StoreData,
  UserRecord,
} from "@/lib/types";
import { SEED_STORE } from "@/data/seed";

const PRIMARY_DATA_DIR = path.join(process.cwd(), "data");
const FALLBACK_DATA_DIR = path.join(os.tmpdir(), "uttoron_prokasoni_data");

function resolveStorePath(): string {
  const dirs = [PRIMARY_DATA_DIR, FALLBACK_DATA_DIR];
  for (const dir of dirs) {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.accessSync(dir, fs.constants.W_OK);
      return path.join(dir, "store.json");
    } catch {
      continue;
    }
  }
  return path.join(FALLBACK_DATA_DIR, "store.json");
}

function deepCloneSeed(): StoreData {
  return JSON.parse(JSON.stringify(SEED_STORE)) as StoreData;
}

export function readStore(): StoreData {
  const filePath = resolveStorePath();
  if (!fs.existsSync(filePath)) {
    const seeded = deepCloneSeed();
    writeStore(seeded);
    return seeded;
  }
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw) as Partial<StoreData>;
    const seed = deepCloneSeed();
    return {
      books: parsed.books ?? seed.books,
      authors: parsed.authors ?? seed.authors,
      categories: parsed.categories ?? seed.categories,
      publishers: parsed.publishers ?? seed.publishers,
      coupons: parsed.coupons ?? seed.coupons,
      reviews: parsed.reviews ?? seed.reviews,
      users: parsed.users ?? seed.users,
      orders: parsed.orders ?? seed.orders,
      testimonials: parsed.testimonials ?? seed.testimonials,
      newsletter: parsed.newsletter ?? seed.newsletter,
      contacts: parsed.contacts ?? seed.contacts,
    };
  } catch {
    const seeded = deepCloneSeed();
    writeStore(seeded);
    return seeded;
  }
}

export function writeStore(data: StoreData): void {
  const filePath = resolveStorePath();
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const tempPath = `${filePath}.${crypto.randomBytes(4).toString("hex")}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), "utf8");
  fs.renameSync(tempPath, filePath);
}

export function updateStore<T>(mutator: (store: StoreData) => T): T {
  const store = readStore();
  const result = mutator(store);
  writeStore(store);
  return result;
}

export function calculateDeliveryCharge(subtotal: number, city: string): number {
  const safeSubtotal = Number.isFinite(subtotal) ? Math.max(0, subtotal) : 0;
  if (safeSubtotal <= 0) return 0;
  if (safeSubtotal >= 2000) return 0; // Free archival courier delivery above ৳2,000
  const normalized = (city || "").trim().toLowerCase();
  if (normalized === "dhaka" || normalized.includes("dhaka")) {
    return 60;
  }
  return 120;
}

export function validateCouponOnSubtotal(
  coupon: Coupon | undefined,
  subtotal: number
): { valid: boolean; discount: number; reason?: string } {
  const safeSubtotal = Number.isFinite(subtotal) ? Math.max(0, subtotal) : 0;
  if (!coupon || !coupon.active) {
    return { valid: false, discount: 0, reason: "Invalid or inactive coupon code." };
  }
  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now()) {
    return { valid: false, discount: 0, reason: "This coupon has expired." };
  }
  if (safeSubtotal < (coupon.minOrderAmount || 0)) {
    return {
      valid: false,
      discount: 0,
      reason: `Minimum order of ৳${coupon.minOrderAmount} required for ${coupon.code}.`,
    };
  }
  let discount =
    coupon.type === "percentage"
      ? Math.round((safeSubtotal * Math.max(0, coupon.value || 0)) / 100)
      : Math.max(0, coupon.value || 0);
  if (coupon.maxDiscount && discount > coupon.maxDiscount) {
    discount = coupon.maxDiscount;
  }
  discount = Math.min(discount, safeSubtotal);
  return { valid: true, discount: Math.max(0, discount) };
}

export function findBookBySlugOrId(store: StoreData, key: string): Book | undefined {
  return store.books.find((b) => b.slug === key || b.id === key);
}

export function findAuthorBySlugOrId(store: StoreData, key: string): Author | undefined {
  return store.authors.find((a) => a.slug === key || a.id === key);
}

export function addReviewToStore(
  slugOrId: string,
  input: { reviewerName: string; rating: number; title: string; comment: string; verifiedPurchase?: boolean }
): Review | null {
  return updateStore((store) => {
    const book = findBookBySlugOrId(store, slugOrId);
    if (!book) return null;
    const review: Review = {
      id: `rev-${crypto.randomUUID().slice(0, 8)}`,
      bookId: book.id,
      reviewerName: input.reviewerName,
      rating: Math.min(5, Math.max(1, Math.round(input.rating))),
      title: input.title,
      comment: input.comment,
      verifiedPurchase: Boolean(input.verifiedPurchase),
      createdAt: new Date().toISOString(),
    };
    store.reviews.unshift(review);
    const bookReviews = store.reviews.filter((r) => r.bookId === book.id);
    const sum = bookReviews.reduce((acc, r) => acc + r.rating, 0);
    book.reviewCount = bookReviews.length;
    book.rating = Number((sum / bookReviews.length).toFixed(1));
    return review;
  });
}

export function createOrderRecord(order: Order): Order {
  return updateStore((store) => {
    store.orders.unshift(order);
    return order;
  });
}

export function saveUserRecord(user: UserRecord): UserRecord {
  return updateStore((store) => {
    const idx = store.users.findIndex((u) => u.id === user.id);
    if (idx >= 0) {
      store.users[idx] = user;
    } else {
      store.users.push(user);
    }
    return user;
  });
}

export function addNewsletterSubscriber(email: string): {
  subscriber: NewsletterSubscriber;
  alreadySubscribed: boolean;
} {
  return updateStore((store) => {
    const normalized = email.trim().toLowerCase();
    const existing = store.newsletter.find((n) => n.email === normalized);
    if (existing) {
      return { subscriber: existing, alreadySubscribed: true };
    }
    const subscriber: NewsletterSubscriber = {
      id: `sub-${crypto.randomUUID().slice(0, 8)}`,
      email: normalized,
      subscribedAt: new Date().toISOString(),
    };
    store.newsletter.unshift(subscriber);
    return { subscriber, alreadySubscribed: false };
  });
}

export function addContactMessage(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): ContactMessage {
  return updateStore((store) => {
    const msg: ContactMessage = {
      id: `msg-${crypto.randomUUID().slice(0, 8)}`,
      ...input,
      createdAt: new Date().toISOString(),
    };
    store.contacts.unshift(msg);
    return msg;
  });
}

