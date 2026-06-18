"use client";

import { useState } from "react";
import { Star, ChevronDown, Trash2 } from "lucide-react";
import { ratingStyle } from "@/lib/review-style";

const LONG_THRESHOLD = 160;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Card recensione per le pagine di dettaglio (ricetta e menù).
 * Colorata per voto, riflesso dorato a 5★, commenti lunghi espandibili.
 */
export function DetailReviewCard({
  nickname,
  rating,
  comment,
  createdAt,
  index = 0,
  isAdmin = false,
  onDelete,
}: {
  nickname: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  index?: number;
  isAdmin?: boolean;
  onDelete?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const s = ratingStyle(rating);
  const text = comment?.trim() ?? "";
  const isLong = text.length > LONG_THRESHOLD;

  return (
    <div
      className={`fade-up group relative flex gap-4 overflow-hidden rounded-xl border p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${s.card} ${
        s.shine ? "shine-gold" : ""
      }`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/70 text-sm font-bold text-gray-600 ring-1 ring-black/5">
        {nickname[0]?.toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span className="text-sm font-semibold text-sky-950">{nickname}</span>
            <span className="ml-2 text-xs text-sky-600">{formatDate(createdAt)}</span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className={`flex gap-0.5 ${s.star}`}>
              {Array.from({ length: rating }).map((_, i) => (
                <Star key={i} size={13} fill="currentColor" />
              ))}
            </span>
            {isAdmin && onDelete && (
              <button
                onClick={onDelete}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-sky-400 transition-colors hover:bg-red-50 hover:text-red-500"
                aria-label="Elimina recensione"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>
        {text && (
          <div className="mt-1">
            <p
              className={`whitespace-pre-wrap text-sm leading-relaxed text-sky-800 ${
                !expanded && isLong ? "line-clamp-3" : ""
              }`}
            >
              {text}
            </p>
            {isLong && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-orange-600 transition-colors hover:text-orange-700"
              >
                {expanded ? "Mostra meno" : "Leggi tutto"}
                <ChevronDown
                  size={13}
                  className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
                />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
