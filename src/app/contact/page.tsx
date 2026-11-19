"use client";

import React, { useState } from "react";
import { useStore } from "@/components/providers/StoreProvider";
import { Check, Mail, MapPin, Phone, Send, BookOpen, Clock } from "lucide-react";

const INQUIRY_TOPICS = [
  "পাঠক সেবা ও অর্ডার সহায়তা",
  "পাণ্ডুলিপি জমা ও সম্পাদনা",
  "গ্রন্থাগার ও পাইকারি সংগ্রহ",
  "অনুবাদ ও প্রকাশনা স্বত্ব",
  "সাধারণ জিজ্ঞাসা",
];

export default function ContactPage() {
  const { notify } = useStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([
    "পাঠক সেবা ও অর্ডার সহায়তা",
  ]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          subject: `${selectedTopics.join(", ") || "পাঠক অনুসন্ধান"}${phone ? ` [ফোন: ${phone}]` : ""}`,
          message,
        }),
      });
      if (res.ok) {
        notify("আপনার বার্তাটি সফলভাবে গৃহীত হয়েছে। আমাদের সম্পাদকীয় বিভাগ দ্রুত আপনার সাথে যোগাযোগ করবে।", "success");
        setName("");
        setEmail("");
        setPhone("");
        setMessage("");
      } else {
        notify("দয়া করে প্রয়োজনীয় তথ্যগুলো সঠিকভাবে পূরণ করুন।", "error");
      }
    } catch {
      notify("বার্তা পাঠাতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।", "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="paper-grain min-h-screen bg-[#f6f5f0] pb-24 pt-28 text-[#141413]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <header className="max-w-2xl">
          <p className="inline-flex items-center gap-2 text-xs font-bold tracking-wider uppercase text-[#62605a]">
            <span className="h-2 w-2 rounded-full bg-[#d93829]" />
            যোগাযোগ ও পাঠক সেবা
          </p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-[#141413] sm:text-5xl">
            উত্তরণ প্রকাশনী
          </h1>
          <p className="mt-3 text-base text-[#62605a]">
            বই সংগ্রহ, নতুন পাণ্ডুলিপি পর্যালোচনা বা যেকোনো প্রয়োজনে আমাদের সাথে সরাসরি যোগাযোগ করতে পারেন।
          </p>
        </header>

        <div className="mt-10 grid gap-8 lg:grid-cols-12">
          {/* Left info panel */}
          <div className="space-y-6 rounded-3xl border border-[#dedbd2] bg-white p-7 sm:p-8 lg:col-span-5 shadow-xs">
            <div className="flex items-center gap-3 border-b border-[#dedbd2] pb-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f6f5f0] text-[#d93829]">
                <BookOpen className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-serif text-xl font-bold text-[#141413]">প্রধান কার্যালয় ও বিক্রয়কেন্দ্র</h2>
                <p className="text-xs text-[#62605a]">উত্তরণ সাহিত্য প্রকাশনালয়</p>
              </div>
            </div>

            <p className="text-sm leading-relaxed text-[#62605a]">
              আমাদের সংগ্রহশালার যেকোনো বই সরাসরি দেখতে, বাঁধাই ও মুদ্রণশৈলী উপভোগ করতে অথবা প্রি-অর্ডারকৃত বই সংগ্রহ করতে আমাদের প্রদর্শনী কেন্দ্রে আপনাকে স্বাগতম।
            </p>

            <div className="space-y-4 pt-2 text-sm text-[#141413]">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#d93829]" />
                <div>
                  <p className="font-semibold text-xs text-[#62605a]">ঠিকানা</p>
                  <p className="mt-0.5">৩৮/২ ক বাংলাবাজার ও বাড়ি ১২, রোড ৭, ধানমন্ডি, ঢাকা ১২০৫</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#d93829]" />
                <div>
                  <p className="font-semibold text-xs text-[#62605a]">কার্যসময়</p>
                  <p className="mt-0.5">শনিবার – বৃহস্পতিবার (সকাল ১০:০০টা – রাত ৮:০০টা)</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[#d93829]" />
                <div>
                  <p className="font-semibold text-xs text-[#62605a]">পাঠক সেবা হটলাইন</p>
                  <p className="mt-0.5 font-medium">+৮৮০ ১৭১১-০০০৯৪২</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#d93829]" />
                <div>
                  <p className="font-semibold text-xs text-[#62605a]">সম্পাদকীয় ইমেইল</p>
                  <p className="mt-0.5 font-medium">info@uttoronprokasoni.com</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right form panel */}
          <form
            onSubmit={handleSubmit}
            className="space-y-5 rounded-3xl border border-[#dedbd2] bg-white p-7 sm:p-8 lg:col-span-7 shadow-xs"
          >
            {/* Topic Selector */}
            <div>
              <span className="block text-xs font-bold text-[#141413]">
                আপনার আগ্রহের বিষয় নির্বাচন করুন
              </span>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {INQUIRY_TOPICS.map((topic) => {
                  const checked = selectedTopics.includes(topic);
                  return (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => toggleTopic(topic)}
                      className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                        checked
                          ? "border-[#141413] bg-[#141413] text-white"
                          : "border-[#dedbd2] bg-[#f6f5f0] text-[#141413] hover:border-[#141413]"
                      }`}
                    >
                      <span
                        className={`flex h-3.5 w-3.5 items-center justify-center rounded-full ${
                          checked ? "bg-[#d93829] text-white" : "border border-[#b5b2a8]"
                        }`}
                      >
                        {checked && <Check className="h-2.5 w-2.5" />}
                      </span>
                      {topic}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-[#141413]">
                  আপনার পূর্ণ নাম *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="যেমন: রফিক উদ্দিন"
                  className="mt-1.5 w-full rounded-xl border border-[#dedbd2] bg-[#f6f5f0] px-4 py-2.5 text-sm focus:border-[#141413] focus:bg-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#141413]">
                  ইমেইল ঠিকানা *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="reader@example.com"
                  className="mt-1.5 w-full rounded-xl border border-[#dedbd2] bg-[#f6f5f0] px-4 py-2.5 text-sm focus:border-[#141413] focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#141413]">
                মোবাইল নম্বর (ঐচ্ছিক)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="০১৭xxxxxxxx"
                className="mt-1.5 w-full rounded-xl border border-[#dedbd2] bg-[#f6f5f0] px-4 py-2.5 text-sm focus:border-[#141413] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#141413]">
                আপনার বার্তা বা পাণ্ডুলিপির বিবরণ *
              </label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="এখানে বিস্তারিত লিখুন..."
                className="mt-1.5 w-full rounded-xl border border-[#dedbd2] bg-[#f6f5f0] px-4 py-2.5 text-sm focus:border-[#141413] focus:bg-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#141413] px-7 py-3 text-xs font-bold text-white transition hover:bg-[#d93829] disabled:opacity-60"
            >
              <Send className="h-3.5 w-3.5" />
              {sending ? "পাঠানো হচ্ছে..." : "বার্তা পাঠান"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
