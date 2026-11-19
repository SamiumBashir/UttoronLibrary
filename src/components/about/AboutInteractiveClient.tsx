"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { Publisher } from "@/lib/types";
import { ArrowRight, ChevronDown, ChevronUp, Sparkles } from "lucide-react";

const CRAFT_DISCIPLINES = [
  "Editorial Acquisition & Literary Curation",
  "Bespoke Serif & Bangla Variable Typography",
  "Acid-Free 90gsm Archival Paper Architecture",
  "Smyth-Sewn Clothbound Bookmaking",
  "Interactive 3D Digital Exhibition Rooms",
  "Bilingual Translation & Cultural Archives",
];

const EDITORIAL_BOARD = [
  {
    id: "ed-1",
    name: "Farhana Rahman",
    role: "Editor-in-Chief",
    note: "22 years directing literary fiction and South Asian translations.",
    initials: "FR",
  },
  {
    id: "ed-2",
    name: "Tariqul Islam",
    role: "Director of Book Architecture",
    note: "Type designer overseeing proportion, cloth grain, and foil plates.",
    initials: "TI",
  },
  {
    id: "ed-3",
    name: "Nusrat Jahan",
    role: "Head of Science & Meridian Press",
    note: "Curates astrophysics, delta hydrology, and systems monographs.",
    initials: "NJ",
  },
];

export default function AboutInteractiveClient({
  publishers,
}: {
  publishers: Publisher[];
}) {
  const [drumIndex, setDrumIndex] = useState(0);
  const [litMember, setLitMember] = useState<string | null>(null);

  const rotateDrum = (dir: -1 | 1) => {
    setDrumIndex((prev) => (prev + dir + CRAFT_DISCIPLINES.length) % CRAFT_DISCIPLINES.length);
  };

  return (
    <div className="paper-grain min-h-screen bg-[#F8F7F3] pb-24 pt-28 text-[#252525]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Hanging Words on Architectural Wires */}
        <div className="mb-12 flex flex-wrap justify-center gap-6 sm:gap-10">
          {["FICTION", "SCIENCE", "POETRY", "ARCHIVE"].map((word, idx) => (
            <div key={word} className="flex flex-col items-center">
              <div className="h-10 w-[1px] bg-[#DDD9D1]" />
              <div
                className="rounded-lg border border-[#DDD9D1] bg-white px-4 py-1.5 font-mono text-[11px] font-bold tracking-[0.26em] text-[#252525] shadow-xs"
                style={{ transform: `rotate(${idx % 2 === 0 ? -1.5 : 1.5}deg)` }}
              >
                {word}
              </div>
            </div>
          ))}
        </div>

        <header className="max-w-3xl">
          <p className="inline-flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.26em] text-[#77736D]">
            <span className="h-2 w-2 rounded-full bg-[#722F37]" />
            Our Heritage &amp; Philosophy
          </p>
          <h1 className="mt-3 font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold leading-tight text-[#252525]">
            Publishing as Architecture for the Mind.
          </h1>
          <p className="mt-5 text-base sm:text-lg leading-relaxed text-[#77736D]">
            Since its founding, Uttoron Publication has dedicated itself to literary depth, intellectual rigor,
            and archival bookcraft—combining innovative digital exhibitions with physical clothbound permanence.
          </p>
        </header>

        {/* Interactive 3D Rotating Craft Drum */}
        <section className="mt-16 rounded-2xl border border-[#DDD9D1] bg-white p-8 sm:p-10 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#722F37]">
                Pillars of Bookmaking
              </p>
              <h2 className="mt-1 font-serif text-2xl sm:text-3xl font-semibold text-[#252525]">
                Six Disciplines of the House
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Rotate drum up"
                onClick={() => rotateDrum(-1)}
                className="cursor-pointer flex h-10 w-10 items-center justify-center rounded-full border border-[#DDD9D1] bg-[#F8F7F3] text-[#252525] hover:border-[#252525]"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Rotate drum down"
                onClick={() => rotateDrum(1)}
                className="cursor-pointer flex h-10 w-10 items-center justify-center rounded-full border border-[#DDD9D1] bg-[#F8F7F3] text-[#252525] hover:border-[#252525]"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="perspective-1200 relative mt-8 flex h-48 items-center justify-center overflow-hidden rounded-xl border border-[#DDD9D1] bg-[#F8F7F3]">
            <div
              className="preserve-3d relative h-20 w-full max-w-xl transition-transform duration-500 ease-out"
              style={{ transform: `rotateX(${drumIndex * 60}deg)` }}
            >
              {CRAFT_DISCIPLINES.map((item, i) => (
                <div
                  key={item}
                  onClick={() => setDrumIndex(i)}
                  className="absolute inset-0 flex cursor-pointer items-center justify-between rounded-xl border border-[#DDD9D1] bg-white px-6 shadow-xs"
                  style={{
                    backfaceVisibility: "hidden",
                    transform: `rotateX(${-i * 60}deg) translateZ(92px)`,
                  }}
                >
                  <span className="font-mono text-xs font-bold text-[#722F37]">
                    0{i + 1}
                  </span>
                  <span className="font-serif text-lg sm:text-xl font-semibold text-[#252525]">
                    {item}
                  </span>
                  <Sparkles className="h-4 w-4 text-[#77736D]" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Editorial Team */}
        <section className="mt-16">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#77736D]">
            Curation &amp; Direction
          </p>
          <h2 className="mt-2 font-serif text-2xl sm:text-3xl font-semibold text-[#252525]">
            The Editorial Board
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {EDITORIAL_BOARD.map((member) => {
              const lit = litMember === member.id;
              return (
                <div
                  key={member.id}
                  onMouseEnter={() => setLitMember(member.id)}
                  onMouseLeave={() => setLitMember(null)}
                  className="relative overflow-hidden rounded-2xl border border-[#DDD9D1] bg-white p-7 pt-10 transition hover:border-[#252525]"
                >
                  <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col items-center">
                    <div className="h-1.5 w-16 rounded-b-full bg-[#252525]" />
                    <div
                      className="h-28 w-48 transition-opacity duration-300"
                      style={{
                        opacity: lit ? 0.65 : 0.14,
                        background:
                          "radial-gradient(ellipse at top, rgba(255, 218, 130, 0.78), transparent 72%)",
                      }}
                    />
                  </div>
                  <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#DDD9D1] bg-[#F8F7F3] font-serif text-2xl font-bold text-[#252525]">
                    {member.initials}
                  </div>
                  <h3 className="relative z-10 mt-5 font-serif text-xl sm:text-2xl font-semibold text-[#252525]">
                    {member.name}
                  </h3>
                  <p className="relative z-10 font-mono text-[11px] uppercase tracking-[0.14em] text-[#722F37]">
                    {member.role}
                  </p>
                  <p className="relative z-10 mt-3 text-xs sm:text-sm text-[#77736D]">
                    {member.note}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Imprints Sitting on an Architectural Shelf */}
        <section className="mt-16 rounded-2xl border border-[#DDD9D1] bg-white p-8 sm:p-10 shadow-xs">
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[#77736D]">
            Imprints on the Shelf
          </p>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {publishers.map((pub) => (
              <div
                key={pub.id}
                className="rounded-xl border border-[#DDD9D1] bg-[#F8F7F3] p-6"
              >
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#722F37]">
                  Founded {pub.foundedYear} • {pub.location}
                </span>
                <h3 className="mt-2 font-serif text-xl sm:text-2xl font-semibold text-[#252525]">
                  {pub.name}
                </h3>
                <p className="mt-1 font-mono text-[11px] font-medium text-[#77736D]">{pub.imprint}</p>
                <p className="mt-3 text-xs sm:text-sm leading-relaxed text-[#77736D]">
                  {pub.description}
                </p>
              </div>
            ))}
          </div>
          {/* Architectural shelf plinth bar */}
          <div className="mt-4 h-2.5 w-full rounded-full bg-[#DDD9D1]" />

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/books"
              className="cursor-pointer inline-flex items-center gap-2 rounded-full bg-[#252525] px-7 py-3 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#722F37]"
            >
              Browse Our Catalog <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/contact"
              className="cursor-pointer inline-flex items-center gap-2 rounded-full border border-[#DDD9D1] bg-[#F8F7F3] px-7 py-3 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[#252525] transition hover:border-[#252525]"
            >
              Contact Press
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

