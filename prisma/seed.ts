import { PrismaClient } from "@prisma/client";
import { SEED_STORE } from "../src/data/seed";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting PostgreSQL database seed for Uttoron Prokasoni...");

  // 1. Seed Authors
  for (const author of SEED_STORE.authors) {
    await prisma.author.upsert({
      where: { slug: author.slug },
      update: {
        name: author.name,
        roleTitle: author.roleTitle,
        nationality: author.nationality,
        portraitColors: [...author.portraitColors],
        bio: author.bio,
        longBio: author.longBio,
        quote: author.quote,
        awards: [...author.awards],
        featured: author.featured,
      },
      create: {
        id: author.id,
        slug: author.slug,
        name: author.name,
        roleTitle: author.roleTitle,
        nationality: author.nationality,
        portraitColors: [...author.portraitColors],
        bio: author.bio,
        longBio: author.longBio,
        quote: author.quote,
        awards: [...author.awards],
        featured: author.featured,
      },
    });
  }
  console.log(`✓ Seeded ${SEED_STORE.authors.length} authors.`);

  // 2. Seed Books
  for (const book of SEED_STORE.books) {
    await prisma.book.upsert({
      where: { slug: book.slug },
      update: {
        title: book.title,
        subtitle: book.subtitle || null,
        authorId: book.authorId,
        authorName: book.authorName,
        publisherId: book.publisherId,
        publisherName: book.publisherName,
        isbn: book.isbn,
        category: book.category,
        tags: [...book.tags],
        description: book.description,
        longDescription: book.longDescription,
        price: book.price,
        originalPrice: book.originalPrice,
        stock: book.stock,
        soldCount: book.soldCount,
        rating: book.rating,
        reviewCount: book.reviewCount,
        pages: book.pages,
        language: book.language,
        binding: book.binding,
        dimensions: book.dimensions,
        publicationDate: book.publicationDate,
        edition: book.edition,
        spineColor: book.spineColor,
        coverPalette: book.coverPalette as object,
        isNewArrival: book.isNewArrival,
        isBestSeller: book.isBestSeller,
        isEditorialPick: book.isEditorialPick,
      },
      create: {
        id: book.id,
        slug: book.slug,
        title: book.title,
        subtitle: book.subtitle || null,
        authorId: book.authorId,
        authorName: book.authorName,
        publisherId: book.publisherId,
        publisherName: book.publisherName,
        isbn: book.isbn,
        category: book.category,
        tags: [...book.tags],
        description: book.description,
        longDescription: book.longDescription,
        price: book.price,
        originalPrice: book.originalPrice,
        stock: book.stock,
        soldCount: book.soldCount,
        rating: book.rating,
        reviewCount: book.reviewCount,
        pages: book.pages,
        language: book.language,
        binding: book.binding,
        dimensions: book.dimensions,
        publicationDate: book.publicationDate,
        edition: book.edition,
        spineColor: book.spineColor,
        coverPalette: book.coverPalette as object,
        isNewArrival: book.isNewArrival,
        isBestSeller: book.isBestSeller,
        isEditorialPick: book.isEditorialPick,
      },
    });
  }
  console.log(`✓ Seeded ${SEED_STORE.books.length} books.`);

  // 3. Seed Coupons
  for (const coupon of SEED_STORE.coupons) {
    await prisma.coupon.upsert({
      where: { code: coupon.code },
      update: {
        type: coupon.type,
        value: coupon.value,
        minOrderAmount: coupon.minOrderAmount,
        maxDiscount: coupon.maxDiscount || null,
        description: coupon.description,
        expiresAt: coupon.expiresAt,
        active: coupon.active,
      },
      create: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        minOrderAmount: coupon.minOrderAmount,
        maxDiscount: coupon.maxDiscount || null,
        description: coupon.description,
        expiresAt: coupon.expiresAt,
        active: coupon.active,
      },
    });
  }
  console.log(`✓ Seeded ${SEED_STORE.coupons.length} coupons.`);

  // 4. Seed Reviews
  for (const review of SEED_STORE.reviews) {
    const existing = await prisma.review.findFirst({
      where: { id: review.id },
    });
    if (!existing) {
      await prisma.review.create({
        data: {
          id: review.id,
          bookId: review.bookId,
          reviewerName: review.reviewerName,
          rating: review.rating,
          title: review.title,
          comment: review.comment,
          verifiedPurchase: review.verifiedPurchase,
          createdAt: new Date(review.createdAt),
        },
      });
    }
  }
  console.log(`✓ Seeded ${SEED_STORE.reviews.length} reviews.`);

  console.log("✨ PostgreSQL database seeded successfully for Uttoron Prokasoni!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
