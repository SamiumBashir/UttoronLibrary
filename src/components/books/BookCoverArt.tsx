"use client";

import React from "react";
import type { CoverPalette } from "@/lib/types";

interface BookCoverArtProps {
  title: string;
  authorName: string;
  category: string;
  palette: CoverPalette;
  compact?: boolean;
  className?: string;
}

export default function BookCoverArt({
  title,
  authorName,
  category,
  palette,
  compact = false,
  className = "",
}: BookCoverArtProps) {
  return (
    <div
      className={`relative flex h-full w-full flex-col justify-between overflow-hidden select-none ${
        compact ? "p-2.5" : "p-4 sm:p-5"
      } ${className}`}
      style={{
        background: `linear-gradient(145deg, ${palette.primary} 0%, ${palette.secondary} 100%)`,
        color: palette.text,
      }}
    >
      {/* Subtle spine crease shadow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/35 to-transparent"
      />

      {/* Gold Foil Architectural Inner Border */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-2 rounded-[2px] border opacity-75"
        style={{ borderColor: palette.accent }}
      />

      {/* Top Category Eyebrow */}
      <div className="relative z-10 text-center">
        <span
          className={`inline-block font-sans uppercase tracking-[0.22em] ${
            compact ? "text-[7px]" : "text-[9px]"
          }`}
          style={{ color: palette.accent }}
        >
          {category}
        </span>
      </div>

      {/* Center Title & Geometric Motif */}
      <div className="relative z-10 my-auto flex flex-col items-center text-center">
        <h4
          className={`font-serif font-semibold leading-[1.12] tracking-tight ${
            compact ? "text-[11px] line-clamp-3" : "text-base sm:text-lg line-clamp-3"
          }`}
        >
          {title}
        </h4>

        {!compact && (
          <svg
            viewBox="0 0 120 72"
            className="mt-3 h-14 w-24 opacity-80"
            fill="none"
            aria-hidden="true"
          >
            {palette.pattern === "arch" && (
              <>
                <path
                  d="M24 68 V36 A36 36 0 0 1 96 36 V68"
                  stroke={palette.accent}
                  strokeWidth="1.2"
                />
                <path
                  d="M36 68 V38 A24 24 0 0 1 84 38 V68"
                  stroke={palette.accent}
                  strokeWidth="1"
                  opacity="0.7"
                />
                <circle cx="60" cy="24" r="4" fill={palette.accent} />
              </>
            )}
            {palette.pattern === "orbital" && (
              <>
                <ellipse
                  cx="60"
                  cy="36"
                  rx="42"
                  ry="16"
                  transform="rotate(-18 60 36)"
                  stroke={palette.accent}
                  strokeWidth="1.2"
                />
                <ellipse
                  cx="60"
                  cy="36"
                  rx="42"
                  ry="16"
                  transform="rotate(24 60 36)"
                  stroke={palette.accent}
                  strokeWidth="1"
                  opacity="0.65"
                />
                <circle cx="60" cy="36" r="4.5" fill={palette.accent} />
              </>
            )}
            {palette.pattern === "botanical" && (
              <>
                <line x1="60" y1="8" x2="60" y2="66" stroke={palette.accent} strokeWidth="1.2" />
                <ellipse
                  cx="46"
                  cy="26"
                  rx="11"
                  ry="5"
                  transform="rotate(-28 46 26)"
                  stroke={palette.accent}
                  strokeWidth="1.1"
                />
                <ellipse
                  cx="74"
                  cy="26"
                  rx="11"
                  ry="5"
                  transform="rotate(28 74 26)"
                  stroke={palette.accent}
                  strokeWidth="1.1"
                />
                <ellipse
                  cx="45"
                  cy="44"
                  rx="12"
                  ry="5"
                  transform="rotate(-24 45 44)"
                  stroke={palette.accent}
                  strokeWidth="1.1"
                />
                <ellipse
                  cx="75"
                  cy="44"
                  rx="12"
                  ry="5"
                  transform="rotate(24 75 44)"
                  stroke={palette.accent}
                  strokeWidth="1.1"
                />
              </>
            )}
            {palette.pattern === "monolith" && (
              <>
                <rect x="30" y="10" width="60" height="52" stroke={palette.accent} strokeWidth="1.2" />
                <rect
                  x="40"
                  y="18"
                  width="40"
                  height="36"
                  stroke={palette.accent}
                  strokeWidth="1"
                  opacity="0.7"
                />
                <rect x="52" y="28" width="16" height="16" fill={palette.accent} opacity="0.85" />
              </>
            )}
            {palette.pattern === "horizon" && (
              <>
                <path d="M16 24 Q60 14 104 24" stroke={palette.accent} strokeWidth="1.2" />
                <path d="M16 36 Q60 46 104 36" stroke={palette.accent} strokeWidth="1.2" opacity="0.75" />
                <path d="M16 48 Q60 38 104 48" stroke={palette.accent} strokeWidth="1.2" opacity="0.55" />
              </>
            )}
            {palette.pattern === "lattice" && (
              <>
                <rect x="28" y="12" width="64" height="48" stroke={palette.accent} strokeWidth="1.2" />
                <line x1="60" y1="12" x2="60" y2="60" stroke={palette.accent} strokeWidth="1" opacity="0.65" />
                <line x1="28" y1="36" x2="92" y2="36" stroke={palette.accent} strokeWidth="1" opacity="0.65" />
                <circle cx="60" cy="36" r="6" stroke={palette.accent} strokeWidth="1.2" />
              </>
            )}
          </svg>
        )}
      </div>

      {/* Author & Colophon */}
      <div className="relative z-10 text-center">
        <p
          className={`truncate font-serif opacity-90 ${
            compact ? "text-[8px]" : "text-xs"
          }`}
        >
          {authorName}
        </p>
        {!compact && (
          <p
            className="mt-1 font-sans text-[8px] font-semibold uppercase tracking-[0.26em] opacity-80"
            style={{ color: palette.accent }}
          >
            Uttoron Prokasoni
          </p>
        )}
      </div>
    </div>
  );
}

