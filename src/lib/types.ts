export type BookCategory =
  | "Fiction"
  | "Non-Fiction"
  | "Science"
  | "Technology"
  | "History"
  | "Literature"
  | "Children"
  | "Academic"
  | "Poetry";

export const BOOK_CATEGORIES: BookCategory[] = [
  "Fiction",
  "Non-Fiction",
  "Science",
  "Technology",
  "History",
  "Literature",
  "Children",
  "Academic",
  "Poetry",
];

export interface CoverPalette {
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  pattern: "arch" | "orbital" | "botanical" | "monolith" | "horizon" | "lattice";
}

export const DEFAULT_COVER_PALETTE: CoverPalette = {
  primary: "#141413",
  secondary: "#2a2a28",
  accent: "#d93829",
  text: "#f6f5f0",
  pattern: "arch",
};

export function normalizeCoverPalette(raw?: unknown): CoverPalette {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_COVER_PALETTE };
  }
  const p = raw as Record<string, unknown>;
  const validPatterns: CoverPalette["pattern"][] = [
    "arch",
    "orbital",
    "botanical",
    "monolith",
    "horizon",
    "lattice",
  ];
  const pattern = (
    typeof p.pattern === "string" && validPatterns.includes(p.pattern as CoverPalette["pattern"])
      ? p.pattern
      : "arch"
  ) as CoverPalette["pattern"];

  return {
    primary:
      typeof p.primary === "string" && p.primary
        ? p.primary
        : typeof p.base === "string" && p.base
        ? p.base
        : DEFAULT_COVER_PALETTE.primary,
    secondary:
      typeof p.secondary === "string" && p.secondary
        ? p.secondary
        : typeof p.spine === "string" && p.spine
        ? p.spine
        : DEFAULT_COVER_PALETTE.secondary,
    accent: typeof p.accent === "string" && p.accent ? p.accent : DEFAULT_COVER_PALETTE.accent,
    text: typeof p.text === "string" && p.text ? p.text : DEFAULT_COVER_PALETTE.text,
    pattern,
  };
}

export interface Book {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  isbn: string;
  authorId: string;
  authorName: string;
  publisherId: string;
  publisherName: string;
  category: BookCategory;
  tags: string[];
  description: string;
  longDescription: string;
  publicationDate: string;
  pages: number;
  language: string;
  edition: string;
  binding: string;
  dimensions: string;
  originalPrice: number;
  price: number;
  stock: number;
  soldCount: number;
  rating: number;
  reviewCount: number;
  isNewArrival: boolean;
  isBestSeller: boolean;
  isEditorialPick: boolean;
  coverPalette: CoverPalette;
  spineColor: string;
  createdAt: string;
}

export interface Author {
  id: string;
  slug: string;
  name: string;
  roleTitle: string;
  nationality: string;
  bio: string;
  longBio: string;
  awards: string[];
  quote: string;
  portraitColors: [string, string, string];
  featured: boolean;
}

export interface CategoryMeta {
  id: string;
  slug: string;
  name: BookCategory;
  description: string;
  editorialNote: string;
  accentColor: string;
}

export interface Publisher {
  id: string;
  name: string;
  imprint: string;
  location: string;
  foundedYear: number;
  description: string;
}

export interface Review {
  id: string;
  bookId: string;
  reviewerName: string;
  rating: number;
  title: string;
  comment: string;
  verifiedPurchase: boolean;
  createdAt: string;
}

export interface Coupon {
  code: string;
  type: "percentage" | "fixed";
  value: number;
  minOrderAmount: number;
  maxDiscount?: number;
  active: boolean;
  expiresAt: string;
  description: string;
}

export interface Address {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  addressLine: string;
  city: string;
  postalCode: string;
  isDefault: boolean;
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: "customer" | "admin";
  wishlist: string[];
  addresses: Address[];
  resetTokenHash?: string;
  resetTokenExpiresAt?: string;
  createdAt: string;
}

export type PublicUser = Omit<
  UserRecord,
  "passwordHash" | "resetTokenHash" | "resetTokenExpiresAt"
>;

export type PaymentMethod = "COD" | "BKASH" | "NAGAD" | "CARD";

export type PaymentStatus =
  | "PENDING_COD"
  | "AWAITING_GATEWAY"
  | "PAID"
  | "FAILED";

export type OrderStatus =
  | "CONFIRMED"
  | "PROCESSING"
  | "PACKED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export interface OrderItem {
  bookId: string;
  slug: string;
  title: string;
  authorName: string;
  isbn: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  coverPalette: CoverPalette;
}

export interface OrderTimelineEvent {
  status: string;
  label: string;
  note: string;
  timestamp: string;
}

export interface OrderCustomerInfo {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  instructions?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  customer: OrderCustomerInfo;
  items: OrderItem[];
  subtotal: number;
  deliveryCharge: number;
  discount: number;
  couponCode?: string;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentRef?: string;
  orderStatus: OrderStatus;
  timeline: OrderTimelineEvent[];
  estimatedDelivery: string;
  createdAt: string;
  updatedAt: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  quote: string;
  bookTitle: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  subscribedAt: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
}

export interface StoreData {
  books: Book[];
  authors: Author[];
  categories: CategoryMeta[];
  publishers: Publisher[];
  coupons: Coupon[];
  reviews: Review[];
  users: UserRecord[];
  orders: Order[];
  testimonials: Testimonial[];
  newsletter: NewsletterSubscriber[];
  contacts: ContactMessage[];
}

export interface CartItem {
  bookId: string;
  slug: string;
  title: string;
  authorName: string;
  price: number;
  originalPrice: number;
  stock: number;
  quantity: number;
  coverPalette: CoverPalette;
  spineColor: string;
  isbn: string;
}

export interface PaymentGatewayAvailability {
  method: PaymentMethod;
  label: string;
  subtitle: string;
  enabled: boolean;
  configured: boolean;
  requiresRedirect: boolean;
  missingEnvVars?: string[];
}

