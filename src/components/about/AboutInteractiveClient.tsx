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
    <div className="paper-grain min-h-screen bg-[#f6f5f0] pb-24 pt-28 text-[#141413]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Hanging Words on Architectural Wires (Minimaze signature!) */}
        <div className="mb-12 flex flex-wrap justify-center gap-6 sm:gap-10">
          {["FICTION", "SCIENCE", "POETRY", "ARCHIVE"].map((word, idx) => (
            <div key={word} className="flex flex-col items-center">
              <div className="h-10 w-[1px] bg-[#b5b2a8]" />
              <div
                className="rounded-lg border border-[#dedbd2] bg-white px-4 py-1.5 font-mono text-[11px] font-bold tracking-[0.26em] text-[#141413] shadow-sm"
                style={{ transform: `rotate(${idx % 2 === 0 ? -1.5 : 1.5}deg)` }}
              >
                {word}
              </div>
            </div>
          ))}
        </div>

        <header className="max-w-3xl">
          <p className="inline-flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.26em] text-[#62605a]">
            <span className="h-2 w-2 rounded-full bg-[#d93829]" />
            Our Heritage &amp; Philosophy
          </p>
          <h1 className="mt-3 font-serif text-5xl font-semibold leading-tight text-[#141413] sm:text-6xl">
            Publishing as Architecture for the Mind.
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-[#62605a]">
            Since 1998, Uttoron Prokasoni has championed enduring prose, scientific clarity,
            and heirloom bookcraft—combining sunlit gallery curation with physical
            clothbound permanence.
          </p>
        </header>

        {/* Minimaze-Inspired Interactive 3D Rotating Craft Drum */}
        <section className="mt-16 rounded-3xl border border-[#dedbd2] bg-white p-8 sm:p-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#d93829]">
                Interactive Drum • Spin Our Craft
              </p>
              <h2 className="mt-1 font-serif text-3xl font-semibold text-[#141413]">
                Six Pillars of the House
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Rotate drum up"
                onClick={() => rotateDrum(-1)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#dedbd2] bg-[#f6f5f0] hover:border-[#141413]"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Rotate drum down"
                onClick={() => rotateDrum(1)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#dedbd2] bg-[#f6f5f0] hover:border-[#141413]"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="perspective-1200 relative mt-8 flex h-48 items-center justify-center overflow-hidden rounded-2xl border border-[#dedbd2] bg-[#f6f5f0]">
            <div
              className="preserve-3d relative h-20 w-full max-w-xl transition-transform duration-500 ease-out"
              style={{ transform: `rotateX(${drumIndex * 60}deg)` }}
            >
              {CRAFT_DISCIPLINES.map((item, i) => (
                <div
                  key={item}
                  onClick={() => setDrumIndex(i)}
                  className="absolute inset-0 flex cursor-pointer items-center justify-between rounded-xl border border-[#dedbd2] bg-white px-6 shadow-xs"
                  style={{
                    backfaceVisibility: "hidden",
                    transform: `rotateX(${-i * 60}deg) translateZ(92px)`,
                  }}
                >
                  <span className="font-mono text-xs font-bold text-[#d93829]">
                    0{i + 1}
                  </span>
                  <span className="font-serif text-xl font-semibold text-[#141413] sm:text-2xl">
                    {item}
                  </span>
                  <Sparkles className="h-4 w-4 text-[#62605a]" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Editorial Team Portraits Under Lit Gallery Lamps */}
        <section className="mt-16">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#62605a]">
            Point to Illuminate Gallery Lamp
          </p>
          <h2 className="mt-2 font-serif text-3xl font-semibold text-[#141413]">
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
                  className="relative overflow-hidden rounded-3xl border border-[#dedbd2] bg-white p-7 pt-10 transition hover:border-[#141413]"
                >
                  <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col items-center">
                    <div className="h-1.5 w-16 rounded-b-full bg-[#141413]" />
                    <div
                      className="h-28 w-48 transition-opacity duration-300"
                      style={{
                        opacity: lit ? 0.65 : 0.14,
                        background:
                          "radial-gradient(ellipse at top, rgba(255, 218, 130, 0.78), transparent 72%)",
                      }}
                    />
                  </div>
                  <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#dedbd2] bg-[#f6f5f0] font-serif text-2xl font-bold text-[#141413]">
                    {member.initials}
                  </div>
                  <h3 className="relative z-10 mt-5 font-serif text-2xl font-semibold">
                    {member.name}
                  </h3>
                  <p className="relative z-10 font-mono text-[11px] uppercase tracking-[0.14em] text-[#d93829]">
                    {member.role}
                  </p>
                  <p className="relative z-10 mt-3 text-sm text-[#62605a]">
                    {member.note}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Imprints Sitting on a Virtual Architectural Shelf */}
        <section className="mt-16 rounded-3xl border border-[#dedbd2] bg-white p-8 sm:p-10">
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[#62605a]">
            Imprints on the Shelf
          </p>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {publishers.map((pub) => (
              <div
                key={pub.id}
                className="rounded-2xl border border-[#dedbd2] bg-[#f6f5f0] p-6"
              >
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#d93829]">
                  Founded {pub.foundedYear} • {pub.location}
                </span>
                <h3 className="mt-2 font-serif text-2xl font-semibold text-[#141413]">
                  {pub.name}
                </h3>
                <p className="mt-1 text-xs font-medium text-[#62605a]">{pub.imprint}</p>
                <p className="mt-3 text-sm leading-relaxed text-[#141413]/80">
                  {pub.description}
                </p>
              </div>
            ))}
          </div>
          {/* Architectural shelf plinth bar */}
          <div className="mt-4 h-3 w-full rounded-full bg-[#dedbd2] shadow-inner" />

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/books"
              className="inline-flex items-center gap-2 rounded-full bg-[#141413] px-7 py-3 text-xs font-bold uppercase tracking-[0.18em] text-white hover:bg-[#d93829]"
            >
              Browse Our Catalog <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-full border border-[#dedbd2] bg-[#f6f5f0] px-7 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#141413] hover:border-[#141413]"
            >
              Submit a Manuscript
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

