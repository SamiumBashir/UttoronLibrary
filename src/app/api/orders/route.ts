import { NextResponse, after } from "next/server";
import crypto from "crypto";
import {
  calculateDeliveryCharge,
  readStore,
  updateStore,
  validateCouponOnSubtotal,
} from "@/lib/db";
import { createOrderInDb, getOrdersFromDb } from "@/lib/db-postgres";
import { getAuthenticatedUser } from "@/lib/auth";
import { sendOrderConfirmationEmail } from "@/lib/email";
import {
  getSiteBaseUrl,
  initiateBkashCheckout,
  initiateSSLCommerzCheckout,
  initiateStripeCheckout,
  isPaymentMethodAvailable,
} from "@/lib/payments";
import type {
  Order,
  OrderCustomerInfo,
  OrderItem,
  PaymentMethod,
} from "@/lib/types";

function queueOrderEmail(order: Order, baseUrl: string) {
  const task = async () => {
    try {
      await sendOrderConfirmationEmail({ order, siteUrl: baseUrl });
    } catch (err) {
      console.warn("[Orders API] Background order confirmation email error:", err);
    }
  };

  try {
    after(task);
  } catch {
    // Fallback if after() is called outside an active request context (e.g. tests)
    void task();
  }
}

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const dbOrders = await getOrdersFromDb({
      userId: user.id,
      email: user.email,
      isAdmin: user.role === "admin",
    }).catch(() => null);

    const store = readStore();
    const fileOrders =
      user.role === "admin"
        ? store.orders
        : store.orders.filter(
            (o) =>
              o.userId === user.id ||
              (o.customer?.email &&
                o.customer.email.toLowerCase() === user.email.toLowerCase())
          );

    // Merge unique by orderNumber
    const mergedMap = new Map<string, Order>();
    for (const o of fileOrders) {
      if (o.orderNumber) mergedMap.set(o.orderNumber.toUpperCase(), o);
    }
    if (dbOrders) {
      for (const o of dbOrders) {
        if (o.orderNumber) mergedMap.set(o.orderNumber.toUpperCase(), o);
      }
    }
    const orders = Array.from(mergedMap.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({ orders });
  } catch (err) {
    console.error("[Orders API] GET error:", err);
    return NextResponse.json({ error: "Failed to retrieve orders." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    let body: {
      customer?: Partial<OrderCustomerInfo>;
      items?: Array<{ bookId: string; quantity: number }>;
      couponCode?: string;
      paymentMethod?: PaymentMethod;
    };

    try {
      body = (await request.json()) as typeof body;
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    const customer = body.customer;
    if (
      !customer?.fullName?.trim() ||
      !customer?.phone?.trim() ||
      !customer?.email?.trim() ||
      !customer?.address?.trim() ||
      !customer?.city?.trim() ||
      !customer?.postalCode?.trim()
    ) {
      return NextResponse.json(
        { error: "Please complete all required customer and delivery fields." },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
    }

    const paymentMethod: PaymentMethod = body.paymentMethod || "COD";
    const availability = isPaymentMethodAvailable(paymentMethod);
    if (!availability || !availability.enabled) {
      return NextResponse.json(
        { error: `Payment method ${paymentMethod} is currently disabled.` },
        { status: 400 }
      );
    }

    if (paymentMethod !== "COD" && !availability.configured) {
      return NextResponse.json(
        {
          error: `${availability.label} গেটওয়ে এখনো কনফিগার করা হয়নি। অনুগ্রহ করে ক্যাশ অন ডেলিভারি (Cash on Delivery) বেছে নিন।`,
          code: "GATEWAY_NOT_CONFIGURED",
        },
        { status: 400 }
      );
    }

    const user = await getAuthenticatedUser().catch(() => null);
    const now = new Date();
    const dateTag = now.toISOString().slice(0, 10).replace(/-/g, "");
    const suffix = crypto.randomBytes(2).toString("hex").toUpperCase();
    const orderNumber = `UP-${dateTag}-${suffix}`;

    const deliveryEta = new Date(
      now.getTime() + (customer.city.toLowerCase().includes("dhaka") ? 3 : 5) * 86400000
    );
    const estimatedDelivery = deliveryEta.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const outcome = updateStore<{ error?: string; status?: number; order?: Order }>((store) => {
      const orderItems: OrderItem[] = [];
      let subtotal = 0;

      for (const reqItem of body.items!) {
        const qty = Math.floor(Number(reqItem.quantity));
        if (qty <= 0) {
          return { error: "Invalid item quantity.", status: 400 };
        }
        const book = store.books.find(
          (b) => b.id === reqItem.bookId || b.slug === reqItem.bookId
        );
        if (!book) {
          return { error: `Book ${reqItem.bookId} could not be found.`, status: 404 };
        }
        if (book.stock < qty) {
          return {
            error: `Only ${book.stock} copy(ies) of "${book.title}" remain in stock.`,
            status: 409,
          };
        }
        const lineTotal = book.price * qty;
        subtotal += lineTotal;
        orderItems.push({
          bookId: book.id,
          slug: book.slug,
          title: book.title,
          authorName: book.authorName,
          isbn: book.isbn,
          unitPrice: book.price,
          quantity: qty,
          lineTotal,
          coverPalette: book.coverPalette,
        });
      }

      let discount = 0;
      let appliedCoupon: string | undefined;
      if (body.couponCode?.trim()) {
        const code = body.couponCode.trim().toUpperCase();
        const coupon = store.coupons.find((c) => c.code.toUpperCase() === code);
        const res = validateCouponOnSubtotal(coupon, subtotal);
        if (!res.valid) {
          return { error: res.reason || "Invalid coupon code.", status: 400 };
        }
        discount = res.discount;
        appliedCoupon = coupon!.code;
      }

      const deliveryCharge = calculateDeliveryCharge(subtotal, customer.city!);
      const total = Math.max(0, subtotal - discount + deliveryCharge);

      // Deduct stock atomically
      for (const item of orderItems) {
        const book = store.books.find((b) => b.id === item.bookId)!;
        book.stock -= item.quantity;
        if (paymentMethod === "COD") {
          book.soldCount += item.quantity;
        }
      }

      const isoNow = now.toISOString();
      const order: Order = {
        id: `ord-${crypto.randomUUID().slice(0, 8)}`,
        orderNumber,
        userId: user?.id,
        customer: {
          fullName: customer.fullName!.trim(),
          phone: customer.phone!.trim(),
          email: customer.email!.trim().toLowerCase(),
          address: customer.address!.trim(),
          city: customer.city!.trim(),
          postalCode: customer.postalCode!.trim(),
          instructions: customer.instructions?.trim() || "",
        },
        items: orderItems,
        subtotal,
        deliveryCharge,
        discount,
        couponCode: appliedCoupon,
        total,
        paymentMethod,
        paymentStatus: paymentMethod === "COD" ? "PENDING_COD" : "AWAITING_GATEWAY",
        orderStatus: paymentMethod === "COD" ? "CONFIRMED" : "PROCESSING",
        timeline: [
          {
            status: paymentMethod === "COD" ? "CONFIRMED" : "PROCESSING",
            label:
              paymentMethod === "COD"
                ? "Order Confirmed (Cash on Delivery)"
                : `Awaiting ${availability.label} Verification`,
            note:
              paymentMethod === "COD"
                ? "Your volumes have been reserved in our Dhaka bindery."
                : "Redirecting to verified payment gateway.",
            timestamp: isoNow,
          },
        ],
        estimatedDelivery,
        createdAt: isoNow,
        updatedAt: isoNow,
      };

      store.orders.unshift(order);
      return { order };
    });

    if (outcome.error || !outcome.order) {
      return NextResponse.json(
        { error: outcome.error || "Order validation failed." },
        { status: outcome.status || 400 }
      );
    }

    const order = outcome.order;

    // Persist into PostgreSQL with strict 2500ms timeout so DB latency never causes 502/timeout
    try {
      await Promise.race([
        createOrderInDb(order),
        new Promise<boolean>((resolve) =>
          setTimeout(() => {
            console.warn("[Orders API] Database persistence timed out; stored in local store fallback");
            resolve(false);
          }, 2500)
        ),
      ]);
    } catch (dbErr) {
      console.warn("[Orders API] Non-fatal database persistence warning:", dbErr);
    }

    // Cash on Delivery: Order confirmed immediately, email queued in background via after()
    if (paymentMethod === "COD") {
      const baseUrl = getSiteBaseUrl(request);
      queueOrderEmail(order, baseUrl);
      return NextResponse.json({ order }, { status: 201 });
    }

    // Online payment gateways: Initiate payment session
    const baseUrl = getSiteBaseUrl(request);
    try {
      let redirectUrl = "";
      let ref = "";

      if (paymentMethod === "BKASH") {
        const callbackUrl = `${baseUrl}/api/payments/bkash/callback?orderNumber=${encodeURIComponent(
          order.orderNumber
        )}`;
        const res = await initiateBkashCheckout(order, callbackUrl);
        redirectUrl = res.redirectUrl;
        ref = res.paymentId;
      } else if (paymentMethod === "CARD") {
        if (process.env.CARD_GATEWAY_PROVIDER === "stripe") {
          const res = await initiateStripeCheckout(order, baseUrl);
          redirectUrl = res.redirectUrl;
          ref = res.sessionId;
        } else {
          const res = await initiateSSLCommerzCheckout(order, baseUrl);
          redirectUrl = res.redirectUrl;
          ref = res.sessionKey;
        }
      } else if (paymentMethod === "NAGAD") {
        return NextResponse.json(
          {
            error:
              "নগদ পেমেন্ট গেটওয়ে এই মুহূর্তে সক্রিয় নয়। অনুগ্রহ করে বিকাশ অথবা ক্যাশ অন ডেলিভারি নির্বাচন করুন।",
            code: "GATEWAY_NOT_CONFIGURED",
          },
          { status: 400 }
        );
      }

      updateStore((store) => {
        const target = store.orders.find((o) => o.id === order.id);
        if (target) {
          target.paymentRef = ref;
          target.updatedAt = new Date().toISOString();
        }
      });

      return NextResponse.json({ order, redirectUrl }, { status: 201 });
    } catch (err) {
      // Restore reserved stock because gateway session failed to initialize
      updateStore((store) => {
        const target = store.orders.find((o) => o.id === order.id);
        if (target) {
          target.paymentStatus = "FAILED";
          target.orderStatus = "CANCELLED";
          target.timeline.unshift({
            status: "CANCELLED",
            label: "Payment Gateway Initialization Failed",
            note: err instanceof Error ? err.message : "Gateway error",
            timestamp: new Date().toISOString(),
          });
        }
        for (const item of order.items) {
          const book = store.books.find((b) => b.id === item.bookId);
          if (book) book.stock += item.quantity;
        }
      });

      const message =
        err instanceof Error
          ? err.message
          : "পেমেন্ট গেটওয়েতে সংযোগ স্থাপন করা যায়নি। অনুগ্রহ করে ক্যাশ অন ডেলিভারি বেছে নিন।";

      return NextResponse.json(
        {
          error: message,
          code: "GATEWAY_CONNECTION_FAILED",
        },
        { status: 400 }
      );
    }
  } catch (fatalErr) {
    console.error("[Orders API] Fatal error in order processing:", fatalErr);
    return NextResponse.json(
      {
        error:
          "অর্ডার তৈরিতে একটি অপ্রত্যাশিত ত্রুটি ঘটেছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন অথবা সরাসরি আমাদের সাথে যোগাযোগ করুন।",
        details: fatalErr instanceof Error ? fatalErr.message : String(fatalErr),
      },
      { status: 500 }
    );
  }
}
