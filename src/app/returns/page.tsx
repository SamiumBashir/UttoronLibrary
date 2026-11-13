export const metadata = {
  title: "Refund and Return Policy",
};

export default function ReturnsPage() {
  return (
    <div className="paper-grain min-h-screen bg-[#f6f5f0] pb-24 pt-28 text-[#141413]">
      <article className="mx-auto max-w-3xl space-y-6 px-4 sm:px-6">
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#62605a]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#d93829]" />
          Collector Guarantee
        </p>
        <h1 className="font-serif text-4xl font-semibold text-[#141413] sm:text-5xl">
          Refund &amp; Return Policy
        </h1>
        <p className="text-sm leading-relaxed text-[#62605a]">
          Every Uttoron Prokasoni volume is inspected before dispatch. If a book arrives
          with transit damage, misprinted signatures, or an incorrect title, we provide a
          complimentary replacement or full refund within 7 days of delivery.
        </p>
        <h2 className="font-serif text-2xl font-semibold text-[#141413]">
          How to Request a Return
        </h2>
        <p className="text-sm leading-relaxed text-[#62605a]">
          Write to <strong>editorial@uttoronprokasoni.com</strong> with your Order ID and
          a photograph of the issue. Courier pickup within Dhaka is arranged at zero cost.
        </p>
      </article>
    </div>
  );
}

