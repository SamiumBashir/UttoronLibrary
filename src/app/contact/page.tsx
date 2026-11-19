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
    <div className="paper-grain min-h-screen bg-[#F8F7F3] pb-24 pt-28 text-[#252525]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.26em] text-[#77736D]">
              <span className="h-2 w-2 rounded-full bg-[#722F37]" />
              Editorial Salon &amp; Support
            </p>
            <h1 className="mt-2 font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#252525]">
              Contact Uttoron Publication
            </h1>
            <p className="mt-3 text-sm sm:text-base text-[#77736D]">
              Select your inquiry parameters below to reach our Dhaka publishing house.
            </p>
          </div>

          {/* Local Time Display */}
          <div className="rounded-2xl border border-[#DDD9D1] bg-white px-5 py-3 font-mono text-xs shadow-xs">
            <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-[#77736D]">
              <Clock className="h-3.5 w-3.5 text-[#722F37]" />
              Dhaka Office Local Time
            </span>
            <span className="mt-0.5 block text-lg font-bold text-[#252525]">
              {dhakaTime || "--:--:--"} BST
            </span>
          </div>
        </header>

        <div className="mt-12 grid gap-10 lg:grid-cols-12">
          <div className="space-y-6 rounded-2xl border border-[#DDD9D1] bg-white p-8 shadow-xs lg:col-span-5">
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#252525]">Dhaka Reading Salon</h2>
            <p className="text-sm leading-relaxed text-[#77736D]">
              Visit our showroom to inspect physical editions in person or collect pre-ordered volumes.
            </p>
            <div className="space-y-4 pt-2 text-sm text-[#252525]">
              <p className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#722F37]" />
                <span>House 42, Road 11, Dhanmondi Literary Quarter, Dhaka 1209</span>
              </p>
              <p className="flex items-center gap-3">
                <Phone className="h-4 w-4 shrink-0 text-[#722F37]" />
                <span>+880 1711-000942 (10 AM – 8 PM BST)</span>
              </p>
              <p className="flex items-center gap-3">
                <Mail className="h-4 w-4 shrink-0 text-[#722F37]" />
                <span>uttoronprokasoni@gmail.com</span>
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5 rounded-2xl border border-[#DDD9D1] bg-white p-8 shadow-xs lg:col-span-7"
          >
            {/* Inquiry Parameter Selector */}
            <div>
              <span className="block font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[#77736D]">
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
                      className={`cursor-pointer inline-flex items-center gap-2 rounded-full border px-4 py-2 font-mono text-xs font-semibold transition ${checked
                        ? "border-[#252525] bg-[#252525] text-white"
                        : "border-[#DDD9D1] bg-[#F8F7F3] text-[#252525] hover:border-[#252525]"
                        }`}
                    >
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded-full ${checked ? "bg-[#722F37] text-white" : "border border-[#A69B89]"
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
                <label className="block text-xs font-semibold text-[#252525]">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#DDD9D1] bg-[#F8F7F3] px-4 py-3 text-sm text-[#252525] focus:border-[#252525] focus:bg-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#252525]">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#DDD9D1] bg-[#F8F7F3] px-4 py-3 text-sm text-[#252525] focus:border-[#252525] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#252525]">
                Message *
              </label>
              <textarea
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your note here..."
                className="mt-1.5 w-full rounded-xl border border-[#DDD9D1] bg-[#F8F7F3] px-4 py-3 text-sm text-[#252525] focus:border-[#252525] focus:bg-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="cursor-pointer inline-flex items-center gap-2 rounded-full bg-[#252525] px-8 py-3.5 font-mono text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:bg-[#722F37] disabled:cursor-not-allowed disabled:opacity-50"
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
