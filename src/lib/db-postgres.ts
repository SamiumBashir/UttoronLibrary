import { prisma, isDatabaseConnected } from "@/lib/prisma";
import type { Book, Author, Review, Order, CoverPalette, BookCategory } from "@/lib/types";

export { isDatabaseConnected };

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
      coverPalette: b.coverPalette as unknown as CoverPalette,
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
      coverPalette: b.coverPalette as unknown as CoverPalette,
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
