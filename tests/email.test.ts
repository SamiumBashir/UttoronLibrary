import assert from "node:assert/strict";
import {
  generateWelcomeEmailHtml,
  generateWelcomeEmailText,
  sendWelcomeEmail,
  generateOrderConfirmationEmailHtml,
  generateOrderConfirmationEmailText,
  sendOrderConfirmationEmail,
} from "../src/lib/email";
import type { Order } from "../src/lib/types";

export async function runEmailTests() {
  console.log(" Running Email Service Tests...");

  const testUser = {
    name: "সাদমান সাকিব",
    email: "sadman@example.com",
    siteUrl: "https://uttoron-publication.vercel.app",
  };

  // 1. Welcome HTML Email Template Generation
  const welcomeHtml = generateWelcomeEmailHtml(testUser.name, testUser.siteUrl);
  assert.ok(typeof welcomeHtml === "string" && welcomeHtml.length > 500, "HTML template must be non-empty string");
  assert.ok(welcomeHtml.includes(testUser.name), "HTML template must contain recipient's name");
  assert.ok(welcomeHtml.includes("উত্তরণ প্রকাশনী"), "HTML template must contain brand name");
  assert.ok(welcomeHtml.includes("WELCOME10"), "HTML template must feature WELCOME10 coupon");
  assert.ok(welcomeHtml.includes("https://uttoron-publication.vercel.app/books"), "HTML must contain link to books catalog");

  // 2. Welcome Plain Text Email Generation
  const welcomeText = generateWelcomeEmailText(testUser.name, testUser.siteUrl);
  assert.ok(typeof welcomeText === "string" && welcomeText.length > 100, "Text template must be non-empty string");
  assert.ok(welcomeText.includes(testUser.name), "Text template must contain recipient's name");
  assert.ok(welcomeText.includes("WELCOME10"), "Text template must feature WELCOME10 coupon");

  // 3. Fallback / Mock Mode Welcome Dispatch
  const welcomeResult = await sendWelcomeEmail({
    email: testUser.email,
    name: testUser.name,
    siteUrl: testUser.siteUrl,
  });

  assert.equal(welcomeResult.success, true, "Welcome email in mock mode must succeed");
  assert.ok(welcomeResult.mocked || welcomeResult.provider === "smtp" || welcomeResult.provider === "resend");

  // 4. Order Confirmation Email Testing
  const sampleOrder: Order = {
    id: "ord-9876",
    orderNumber: "UP-20261119-9988",
    customer: {
      fullName: "মাহমুদ হাসান",
      email: "mahmud.hasan@example.com",
      phone: "01812345678",
      address: "ফ্ল্যাট ৪বি, বাড়ি ২০, রোড ৭, ধানমন্ডি",
      city: "ঢাকা",
      postalCode: "1209",
    },
    items: [
      {
        bookId: "bk-1",
        slug: "the-silent-manifesto",
        title: "নিঃশব্দ ইশতেহার",
        authorName: "আহমদ রফিক",
        isbn: "978-984-00-1122-1",
        unitPrice: 480,
        quantity: 2,
        lineTotal: 960,
        coverPalette: {
          primary: "#141413",
          secondary: "#2a2a28",
          accent: "#d93829",
          text: "#f6f5f0",
          pattern: "arch",
        },
      },
    ],
    subtotal: 960,
    deliveryCharge: 60,
    discount: 50,
    couponCode: "WELCOME10",
    total: 970,
    paymentMethod: "COD",
    paymentStatus: "PENDING_COD",
    orderStatus: "CONFIRMED",
    timeline: [],
    estimatedDelivery: new Date(Date.now() + 86400000 * 3).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const orderHtml = generateOrderConfirmationEmailHtml(sampleOrder, testUser.siteUrl);
  assert.ok(orderHtml.includes("UP-20261119-9988"), "Order HTML must contain order number");
  assert.ok(orderHtml.includes("মাহমুদ হাসান"), "Order HTML must contain customer name");
  assert.ok(orderHtml.includes("নিঃশব্দ ইশতেহার"), "Order HTML must include item title");
  assert.ok(orderHtml.includes("৳970"), "Order HTML must include formatted total price");
  assert.ok(orderHtml.includes("/track?order=UP-20261119-9988"), "Order HTML must link to order tracking");

  const orderText = generateOrderConfirmationEmailText(sampleOrder, testUser.siteUrl);
  assert.ok(orderText.includes("UP-20261119-9988"), "Order text must contain order number");
  assert.ok(orderText.includes("মাহমুদ হাসান"), "Order text must contain customer name");
  assert.ok(orderText.includes("৳970"), "Order text must include total price");

  const orderResult = await sendOrderConfirmationEmail({
    order: sampleOrder,
    siteUrl: testUser.siteUrl,
  });

  assert.equal(orderResult.success, true, "Order confirmation email dispatch must succeed");

  console.log("  Email Service Tests Passed (Welcome & Order Confirmation HTML/Text, tables, formatting, mock mode)");
}

if (require.main === module || process.argv[1]?.endsWith("email.test.ts")) {
  runEmailTests().catch((err) => {
    console.error("Email test failed:", err);
    process.exit(1);
  });
}
