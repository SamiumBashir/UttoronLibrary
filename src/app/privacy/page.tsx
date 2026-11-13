export const metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <div className="paper-grain min-h-screen bg-[#f6f5f0] pb-24 pt-28 text-[#141413]">
      <article className="mx-auto max-w-3xl space-y-6 px-4 sm:px-6">
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#62605a]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#d93829]" />
          Legal &amp; Reader Trust
        </p>
        <h1 className="font-serif text-4xl font-semibold text-[#141413] sm:text-5xl">
          Privacy Policy
        </h1>
        <p className="text-sm leading-relaxed text-[#62605a]">
          Uttoron Prokasoni respects your intellectual and personal privacy. We collect
          only the contact, delivery, and order details necessary to fulfill book orders,
          maintain reader wishlists, and issue seasonal literary dispatches when you opt in.
        </p>
        <h2 className="font-serif text-2xl font-semibold text-[#141413]">
          1. Information We Collect
        </h2>
        <p className="text-sm leading-relaxed text-[#62605a]">
          When you place an order or create an account, we store your name, email address,
          phone number, and shipping address securely on our server. Passwords are
          cryptographically hashed with per-user salts and never stored in plain text.
        </p>
        <h2 className="font-serif text-2xl font-semibold text-[#141413]">
          2. Payment Security
        </h2>
        <p className="text-sm leading-relaxed text-[#62605a]">
          Online payments are processed strictly through official merchant gateways
          (bKash, Nagad, SSLCommerz, or Stripe). We never store raw card numbers or mobile
          wallet PINs on Uttoron Prokasoni servers.
        </p>
      </article>
    </div>
  );
}

