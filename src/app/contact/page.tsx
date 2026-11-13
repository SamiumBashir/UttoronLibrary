"use client";

import React, { useEffect, useState } from "react";
import { useStore } from "@/components/providers/StoreProvider";
import { Check, Clock, Mail, MapPin, Phone, Send } from "lucide-react";

const INQUIRY_PARAMETERS = [
  "Reader & Order Support",
  "Manuscript Submission",
  "Library / Bulk Acquisition",
  "Translation & Rights",
];

export default function ContactPage() {
  const { notify } = useStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([
    "Reader & Order Support",
  ]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [dhakaTime, setDhakaTime] = useState("");

  useEffect(() => {
    const updateClock = () => {
      setDhakaTime(
        new Date().toLocaleTimeString("en-US", {
          timeZone: "Asia/Dhaka",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

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
          subject: selectedTopics.join(", ") || "Reader Inquiry",
          message,
        }),
      });
      if (res.ok) {
        notify("Message received! Our editorial desk will respond within 24 hours.", "success");
        setName("");
        setEmail("");
        setMessage("");
      } else {
        notify("Please complete all required fields.", "error");
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="paper-grain min-h-screen bg-[#f6f5f0] pb-24 pt-28 text-[#141413]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.26em] text-[#62605a]">
              <span className="h-2 w-2 rounded-full bg-[#d93829]" />
              Editorial Salon &amp; Support
            </p>
            <h1 className="mt-2 font-serif text-4xl font-semibold text-[#141413] sm:text-5xl">
              Contact Uttoron Prokasoni
            </h1>
            <p className="mt-3 text-base text-[#62605a]">
              Select your inquiry parameters below to reach our Dhaka publishing house.
            </p>
          </div>

          {/* Minimaze Signature Local Time Display */}
          <div className="rounded-2xl border border-[#dedbd2] bg-white px-5 py-3 font-mono text-xs">
            <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-[#62605a]">
              <Clock className="h-3.5 w-3.5 text-[#d93829]" />
              Dhaka Salon Local Time
            </span>
            <span className="mt-0.5 block text-lg font-bold text-[#141413]">
              {dhakaTime || "--:--:--"} BST
            </span>
          </div>
        </header>

        <div className="mt-12 grid gap-10 lg:grid-cols-12">
          <div className="space-y-6 rounded-3xl border border-[#dedbd2] bg-white p-8 lg:col-span-5">
            <h2 className="font-serif text-3xl font-semibold">Dhaka Reading Salon</h2>
            <p className="text-sm leading-relaxed text-[#62605a]">
              Visit our sunlit gallery showroom in Dhanmondi to inspect clothbound
              editions in person or collect pre-ordered volumes.
            </p>
            <div className="space-y-4 pt-2 text-sm text-[#141413]">
              <p className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#d93829]" />
                <span>House 42, Road 11, Dhanmondi Literary Quarter, Dhaka 1209</span>
              </p>
              <p className="flex items-center gap-3">
                <Phone className="h-4 w-4 shrink-0 text-[#d93829]" />
                <span>+880 1711-000942 (10 AM – 8 PM BST)</span>
              </p>
              <p className="flex items-center gap-3">
                <Mail className="h-4 w-4 shrink-0 text-[#d93829]" />
                <span>editorial@uttoronprokasoni.com</span>
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5 rounded-3xl border border-[#dedbd2] bg-white p-8 lg:col-span-7"
          >
            {/* Minimaze Tick-Box Parameter Selector */}
            <div>
              <span className="block font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[#62605a]">
                Inquiry Parameters
              </span>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {INQUIRY_PARAMETERS.map((topic) => {
                  const checked = selectedTopics.includes(topic);
                  return (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => toggleTopic(topic)}
                      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition ${
                        checked
                          ? "border-[#141413] bg-[#141413] text-white"
                          : "border-[#dedbd2] bg-[#f6f5f0] text-[#141413] hover:border-[#141413]"
                      }`}
                    >
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded-full ${
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
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#dedbd2] bg-[#f6f5f0] px-4 py-3 text-sm focus:border-[#141413] focus:bg-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#141413]">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#dedbd2] bg-[#f6f5f0] px-4 py-3 text-sm focus:border-[#141413] focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#141413]">
                Message *
              </label>
              <textarea
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your note here..."
                className="mt-1.5 w-full rounded-xl border border-[#dedbd2] bg-[#f6f5f0] px-4 py-3 text-sm focus:border-[#141413] focus:bg-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="inline-flex items-center gap-2 rounded-full bg-[#141413] px-8 py-3.5 text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:bg-[#d93829]"
            >
              <Send className="h-4 w-4" />
              {sending ? "Sending..." : "Send Message"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
