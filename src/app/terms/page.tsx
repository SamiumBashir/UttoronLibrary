export const metadata = {
  title: "Terms & Conditions",
};

export default function TermsPage() {
  return (
    <div className="paper-grain min-h-screen bg-[#f6f5f0] pb-24 pt-28 text-[#141413]">
      <article className="mx-auto max-w-3xl space-y-6 px-4 sm:px-6">
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#62605a]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#d93829]" />
          Legal &amp; Publishing Terms
        </p>
        <h1 className="font-serif text-4xl font-semibold text-[#141413] sm:text-5xl">
          Terms &amp; Conditions
        </h1>
        <p className="text-sm leading-relaxed text-[#62605a]">
          By browsing Uttoron Prokasoni&apos;s digital library and placing orders, you agree
          to the following publishing and commerce terms.
        </p>
        <h2 className="font-serif text-2xl font-semibold text-[#141413]">
          1. Pricing &amp; Inventory
        </h2>
        <p className="text-sm leading-relaxed text-[#62605a]">
          All prices are listed in Bangladeshi Taka (৳ / BDT) and verified server-side at
          checkout. Archival print runs may be limited in stock; orders cannot exceed
          live bindery inventory.
        </p>
        <h2 className="font-serif text-2xl font-semibold text-[#141413]">
          2. Literary Copyright
        </h2>
        <p className="text-sm leading-relaxed text-[#62605a]">
          All book texts, cover architecture, translations, and 3D editorial presentations
          remain the intellectual property of Uttoron Prokasoni and its respective authors.
        </p>
      </article>
    </div>
  );
}

