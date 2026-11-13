import { notFound } from "next/navigation";
import Link from "next/link";
import { readStore } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { CheckCircle2, Clock, Package, Truck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const store = readStore();
  const order = store.orders.find(
    (o) => o.orderNumber.toUpperCase() === orderNumber.toUpperCase()
  );

  if (!order) {
    notFound();
  }

  return (
    <div className="paper-grain min-h-screen bg-[#f6f5f0] pb-24 pt-28 text-[#141413]">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-[#dedbd2] bg-white p-8 text-[#141413] shadow-sm sm:p-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-9 w-9 text-[#d93829]" />
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[#62605a]">
                  Order Record
                </p>
                <h1 className="font-serif text-3xl font-semibold sm:text-4xl">
                  {order.orderNumber}
                </h1>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block rounded-full border border-[#dedbd2] bg-[#eceae3] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#141413]">
                {order.orderStatus}
              </span>
              <p className="mt-1.5 text-xs text-[#62605a]">
                Payment: {order.paymentMethod} ({order.paymentStatus})
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 border-t border-[#dedbd2] pt-6 text-sm sm:grid-cols-3">
            <div>
              <span className="block text-xs text-[#62605a]">Estimated Delivery</span>
              <span className="mt-0.5 block font-semibold text-[#d93829]">
                {order.estimatedDelivery}
              </span>
            </div>
            <div>
              <span className="block text-xs text-[#62605a]">Recipient</span>
              <span className="mt-0.5 block font-semibold">{order.customer.fullName}</span>
            </div>
            <div>
              <span className="block text-xs text-[#62605a]">Destination</span>
              <span className="mt-0.5 block font-semibold">
                {order.customer.city}, {order.customer.postalCode}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-8 md:grid-cols-12">
          {/* Items & Pricing */}
          <div className="rounded-[2rem] border border-[#dedbd2] bg-white p-7 md:col-span-7">
            <h2 className="flex items-center gap-2 font-serif text-2xl font-semibold text-[#141413]">
              <Package className="h-5 w-5 text-[#d93829]" /> Volumes Ordered
            </h2>
            <div className="mt-5 space-y-3">
              {order.items.map((item) => (
                <div
                  key={item.bookId}
                  className="flex items-center justify-between border-b border-[#dedbd2] pb-3 text-sm"
                >
                  <div>
                    <Link
                      href={`/books/${item.slug}`}
                      className="font-serif text-lg font-semibold text-[#141413] hover:text-[#d93829]"
                    >
                      {item.title}
                    </Link>
                    <p className="text-xs text-[#62605a]">
                      {item.quantity} × {formatPrice(item.unitPrice)}
                    </p>
                  </div>
                  <span className="font-semibold text-[#141413]">
                    {formatPrice(item.lineTotal)}
                  </span>
                </div>
              ))}
            </div>

            <dl className="mt-5 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-[#62605a]">Subtotal</dt>
                <dd>{formatPrice(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#62605a]">Delivery Charge</dt>
                <dd>{order.deliveryCharge === 0 ? "Free" : formatPrice(order.deliveryCharge)}</dd>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-[#d93829]">
                  <dt>Discount ({order.couponCode})</dt>
                  <dd>-{formatPrice(order.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-[#dedbd2] pt-3 text-base font-bold text-[#141413]">
                <dt>Total Payable</dt>
                <dd className="font-serif text-2xl">{formatPrice(order.total)}</dd>
              </div>
            </dl>
          </div>

          {/* Fulfillment Timeline */}
          <div className="rounded-[2rem] border border-[#dedbd2] bg-white p-7 md:col-span-5">
            <h2 className="flex items-center gap-2 font-serif text-2xl font-semibold text-[#141413]">
              <Truck className="h-5 w-5 text-[#d93829]" /> Fulfillment Timeline
            </h2>
            <div className="mt-5 space-y-4">
              {order.timeline.map((ev, idx) => (
                <div key={idx} className="flex gap-3">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#d93829]" />
                  <div>
                    <p className="text-sm font-semibold text-[#141413]">{ev.label}</p>
                    <p className="text-xs text-[#62605a]">{ev.note}</p>
                    <p className="mt-0.5 text-[11px] text-[#62605a]/70">
                      {new Date(ev.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-2.5">
              <Link
                href="/books"
                className="rounded-full bg-[#141413] px-5 py-3 text-center text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:bg-[#d93829]"
              >
                Continue Exploring Books
              </Link>
              <Link
                href="/track"
                className="rounded-full border border-[#dedbd2] px-5 py-3 text-center text-xs font-semibold text-[#141413] hover:border-[#141413]"
              >
                Track Another Order
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

