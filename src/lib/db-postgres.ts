import { prisma, isDatabaseConnected } from "@/lib/prisma";
import {
  normalizeCoverPalette,
  type Book,
  type Author,
  type Review,
  type Order,
  type CoverPalette,
  type BookCategory,
  type OrderStatus,
  type PaymentMethod,
  type PaymentStatus,
  type OrderTimelineEvent,
} from "@/lib/types";

export { isDatabaseConnected };

function mapPrismaOrderToOrder(o: any): Order {
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    userId: o.userId ?? undefined,
    customer: {
      fullName: o.customerName,
      phone: o.customerPhone,
      email: o.customerEmail,
      address: o.shippingAddress,
      city: o.city,
      postalCode: o.postalCode,
      instructions: o.instructions ?? "",
    },
    items: (o.items || []).map((it: any) => ({
      bookId: it.bookId,
      slug: it.slug,
      title: it.title,
      authorName: it.book?.authorName || "Uttoron Author",
      isbn: it.book?.isbn || "",
      unitPrice: it.unitPrice,
      quantity: it.quantity,
      lineTotal: it.lineTotal,
      coverPalette: normalizeCoverPalette(it.book?.coverPalette),
    })),
    subtotal: o.subtotal,
    deliveryCharge: o.deliveryCharge,
    discount: o.discount,
    couponCode: o.couponCode ?? undefined,
    total: o.total,
    paymentMethod: o.paymentMethod as PaymentMethod,
    paymentStatus: o.paymentStatus as PaymentStatus,
    orderStatus: o.orderStatus as OrderStatus,
    timeline: (Array.isArray(o.timeline) ? o.timeline : []) as OrderTimelineEvent[],
    estimatedDelivery: o.estimatedDelivery,
    createdAt: typeof o.createdAt === "object" ? o.createdAt.toISOString() : String(o.createdAt),
    updatedAt: typeof o.updatedAt === "object" ? o.updatedAt.toISOString() : String(o.updatedAt),
  };
}

export async function getBooksFromDb(): Promise<Book[] | null> {
  if (!isDatabaseConnected()) return null;
  try {
    const records = await prisma.book.findMany({
      orderBy: { createdAt: "desc" },
    });
    return records.map((b) => ({
      id: b.id,
      slug: b.slug,
      title: b.title,
      subtitle: b.subtitle ?? undefined,
      isbn: b.isbn,
      authorId: b.authorId,
      authorName: b.authorName,
      publisherId: b.publisherId,
      publisherName: b.publisherName,
      category: b.category as BookCategory,
      tags: b.tags,
      description: b.description,
      longDescription: b.longDescription,
      publicationDate: b.publicationDate,
      pages: b.pages,
      language: b.language,
      edition: b.edition,
      binding: b.binding,
      dimensions: b.dimensions,
      originalPrice: b.originalPrice,
      price: b.price,
      stock: b.stock,
      soldCount: b.soldCount,
      rating: b.rating,
      reviewCount: b.reviewCount,
      isNewArrival: b.isNewArrival,
      isBestSeller: b.isBestSeller,
      isEditorialPick: b.isEditorialPick,
      coverPalette: normalizeCoverPalette(b.coverPalette),
      spineColor: b.spineColor,
      createdAt: b.createdAt.toISOString(),
    }));
  } catch (error) {
    console.warn("[PostgreSQL] Error fetching books, falling back to local store:", error);
    return null;
  }
}

export async function getBookBySlugFromDb(slug: string): Promise<Book | null> {
  if (!isDatabaseConnected()) return null;
  try {
    const b = await prisma.book.findUnique({
      where: { slug },
      include: { reviews: true },
    });
    if (!b) return null;
    return {
      id: b.id,
      slug: b.slug,
      title: b.title,
      subtitle: b.subtitle ?? undefined,
      isbn: b.isbn,
      authorId: b.authorId,
      authorName: b.authorName,
      publisherId: b.publisherId,
      publisherName: b.publisherName,
      category: b.category as BookCategory,
      tags: b.tags,
      description: b.description,
      longDescription: b.longDescription,
      publicationDate: b.publicationDate,
      pages: b.pages,
      language: b.language,
      edition: b.edition,
      binding: b.binding,
      dimensions: b.dimensions,
      originalPrice: b.originalPrice,
      price: b.price,
      stock: b.stock,
      soldCount: b.soldCount,
      rating: b.rating,
      reviewCount: b.reviewCount,
      isNewArrival: b.isNewArrival,
      isBestSeller: b.isBestSeller,
      isEditorialPick: b.isEditorialPick,
      coverPalette: normalizeCoverPalette(b.coverPalette),
      spineColor: b.spineColor,
      createdAt: b.createdAt.toISOString(),
    };
  } catch {
    return null;
  }
}

export async function getAuthorsFromDb(): Promise<Author[] | null> {
  if (!isDatabaseConnected()) return null;
  try {
    const authors = await prisma.author.findMany();
    return authors.map((a) => ({
      id: a.id,
      slug: a.slug,
      name: a.name,
      roleTitle: a.roleTitle,
      nationality: a.nationality,
      bio: a.bio,
      longBio: a.longBio,
      awards: a.awards,
      quote: a.quote,
      portraitColors: a.portraitColors as [string, string, string],
      featured: a.featured,
    }));
  } catch {
    return null;
  }
}

export async function createOrderInDb(order: Order): Promise<boolean> {
  if (!isDatabaseConnected()) return false;
  try {
    await prisma.$transaction(async (tx) => {
      await tx.order.create({
        data: {
          id: order.id,
          orderNumber: order.orderNumber,
          userId: order.userId ?? null,
          customerName: order.customer.fullName,
          customerPhone: order.customer.phone,
          customerEmail: order.customer.email,
          shippingAddress: order.customer.address,
          city: order.customer.city,
          postalCode: order.customer.postalCode,
          instructions: order.customer.instructions ?? null,
          subtotal: order.subtotal,
          deliveryCharge: order.deliveryCharge,
          discount: order.discount,
          couponCode: order.couponCode ?? null,
          total: order.total,
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
          orderStatus: order.orderStatus,
          estimatedDelivery: order.estimatedDelivery,
          timeline: order.timeline as object,
          items: {
            create: order.items.map((item) => ({
              id: `item-${item.bookId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              bookId: item.bookId,
              title: item.title,
              slug: item.slug,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              lineTotal: item.lineTotal,
            })),
          },
        },
      });

      // Atomically decrement stock in PostgreSQL
      for (const item of order.items) {
        await tx.book.updateMany({
          where: { id: item.bookId },
          data: {
            stock: { decrement: item.quantity },
            soldCount: { increment: item.quantity },
          },
        });
      }
    });
    return true;
  } catch (err) {
    console.error("[PostgreSQL] Failed to insert order:", err);
    return false;
  }
}

export async function getOrderFromDb(orderNumber: string): Promise<Order | null> {
  if (!isDatabaseConnected()) return null;
  try {
    const trimmed = orderNumber.trim();
    const o = await prisma.order.findFirst({
      where: {
        orderNumber: {
          equals: trimmed,
          mode: "insensitive",
        },
      },
      include: {
        items: {
          include: { book: true },
        },
      },
    });
    if (!o) return null;
    return mapPrismaOrderToOrder(o);
  } catch (err) {
    console.error("[PostgreSQL] Failed to fetch order:", err);
    return null;
  }
}

export async function getOrdersFromDb(filter?: {
  userId?: string;
  email?: string;
  isAdmin?: boolean;
}): Promise<Order[] | null> {
  if (!isDatabaseConnected()) return null;
  try {
    const where: any = {};
    if (!filter?.isAdmin) {
      const conditions: any[] = [];
      if (filter?.userId) conditions.push({ userId: filter.userId });
      if (filter?.email) conditions.push({ customerEmail: { equals: filter.email, mode: "insensitive" } });
      if (conditions.length > 0) {
        where.OR = conditions;
      }
    }
    const list = await prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: { book: true },
        },
      },
    });
    return list.map(mapPrismaOrderToOrder);
  } catch (err) {
    console.error("[PostgreSQL] Failed to list orders:", err);
    return null;
  }
}

export async function updateOrderStatusInDb(
  orderNumber: string,
  orderStatus: OrderStatus,
  note?: string
): Promise<boolean> {
  if (!isDatabaseConnected()) return false;
  try {
    const order = await prisma.order.findFirst({
      where: { orderNumber: { equals: orderNumber.trim(), mode: "insensitive" } },
    });
    if (!order) return false;

    const timeline = (Array.isArray(order.timeline) ? order.timeline : []) as any[];
    const nowIso = new Date().toISOString();
    timeline.unshift({
      status: orderStatus,
      label: `Order ${orderStatus}`,
      note: note || `Status updated to ${orderStatus} by curator.`,
      timestamp: nowIso,
    });

    await prisma.order.update({
      where: { id: order.id },
      data: {
        orderStatus,
        updatedAt: new Date(),
        timeline,
      },
    });
    return true;
  } catch (err) {
    console.error("[PostgreSQL] Failed to update order status:", err);
    return false;
  }
}

export async function updateOrderPaymentInDb(
  orderNumber: string,
  paymentStatus: PaymentStatus,
  orderStatus: OrderStatus,
  paymentRef?: string,
  note?: string
): Promise<boolean> {
  if (!isDatabaseConnected()) return false;
  try {
    const order = await prisma.order.findFirst({
      where: { orderNumber: { equals: orderNumber.trim(), mode: "insensitive" } },
    });
    if (!order) return false;

    const timeline = (Array.isArray(order.timeline) ? order.timeline : []) as any[];
    const nowIso = new Date().toISOString();
    timeline.unshift({
      status: orderStatus,
      label: `Payment ${paymentStatus} & Order ${orderStatus}`,
      note: note || `Payment verified. Ref: ${paymentRef || "N/A"}`,
      timestamp: nowIso,
    });

    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus,
        orderStatus,
        updatedAt: new Date(),
        timeline,
      },
    });
    return true;
  } catch (err) {
    console.error("[PostgreSQL] Failed to update order payment in DB:", err);
    return false;
  }
}

export async function addReviewInDb(
  slugOrId: string,
  input: { reviewerName: string; rating: number; title: string; comment: string; verifiedPurchase?: boolean }
): Promise<Review | null> {
  if (!isDatabaseConnected()) return null;
  try {
    const book = await prisma.book.findFirst({
      where: { OR: [{ slug: slugOrId }, { id: slugOrId }] },
    });
    if (!book) return null;

    const created = await prisma.review.create({
      data: {
        bookId: book.id,
        reviewerName: input.reviewerName,
        rating: Math.min(5, Math.max(1, Math.round(input.rating))),
        title: input.title,
        comment: input.comment,
        verifiedPurchase: Boolean(input.verifiedPurchase),
      },
    });

    const aggregates = await prisma.review.aggregate({
      where: { bookId: book.id },
      _avg: { rating: true },
      _count: { id: true },
    });

    if (aggregates._avg.rating) {
      await prisma.book.update({
        where: { id: book.id },
        data: {
          rating: Number(aggregates._avg.rating.toFixed(1)),
          reviewCount: aggregates._count.id,
        },
      });
    }

    return {
      id: created.id,
      bookId: created.bookId,
      reviewerName: created.reviewerName,
      rating: created.rating,
      title: created.title,
      comment: created.comment,
      verifiedPurchase: created.verifiedPurchase,
      createdAt: created.createdAt.toISOString(),
    };
  } catch {
    return null;
  }
}

export async function syncFirebaseUserInDb(params: {
  firebaseUid: string;
  email: string;
  name: string;
  phone?: string;
}) {
  if (!isDatabaseConnected()) return null;
  try {
    return await prisma.user.upsert({
      where: { firebaseUid: params.firebaseUid },
      update: {
        email: params.email,
        name: params.name,
        phone: params.phone,
      },
      create: {
        firebaseUid: params.firebaseUid,
        email: params.email,
        name: params.name,
        phone: params.phone,
      },
    });
  } catch (err) {
    console.warn("[PostgreSQL] User sync error:", err);
    return null;
  }
}
