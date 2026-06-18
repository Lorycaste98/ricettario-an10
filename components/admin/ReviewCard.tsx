"use client";

import { useState } from "react";
import Link from "next/link";
import { Star, ChevronDown, Maximize2, BookOpen, UtensilsCrossed } from "lucide-react";
import { ratingStyle } from "@/lib/review-style";
import { Modal } from "@/components/ui/Modal";

export type ReviewSource = { type: "recipe" | "menu"; id: number; name: string };

export interface ReviewItem {
  id: number;
  nickname: string;
  rating: number;
  comment: string | null;
  createdAt: string | Date;
  /** Entità recensita: mostrata con badge distintivo (ricetta/menù). */
  source?: ReviewSource | null;
}

const LONG_THRESHOLD = 160;

const SOURCE_STYLE = {
  recipe: { icon: <BookOpen size={11} />, chip: "bg-orange-100 text-orange-600", label: "Ricetta" },
  menu: { icon: <UtensilsCrossed size={11} />, chip: "bg-sky-100 text-sky-600", label: "Menù" },
} as const;

function sourceHref(s: ReviewSource): string {
  return s.type === "recipe" ? `/ricette/${s.id}` : `/menu/${s.id}`;
}

function Stars({ rating, className }: { rating: number; className?: string }) {
  return (
    <span className={`flex shrink-0 gap-0.5 ${className ?? ""}`}>
      {Array.from({ length: rating }).map((_, i) => (
        <Star key={i} size={13} fill="currentColor" />
      ))}
    </span>
  );
}

function SourceLink({ source, compact = false }: { source: ReviewSource; compact?: boolean }) {
  const st = SOURCE_STYLE[source.type];
  return (
    <Link href={sourceHref(source)} className="group/src flex min-w-0 items-center gap-1.5">
      <span className={`flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${st.chip}`}>
        {st.icon}
        {st.label}
      </span>
      <span className={`truncate font-bold text-gray-700 transition-colors group-hover/src:text-orange-500 ${compact ? "text-xs" : "text-sm"}`}>
        {source.name}
      </span>
    </Link>
  );
}

/**
 * @param expand "inline" (default) → «Leggi tutto» espande nella card.
 *               "dialog" → i commenti lunghi si aprono in un Modal.
 */
export function ReviewCard({
  review,
  index = 0,
  expand = "inline",
  compact = false,
}: {
  review: ReviewItem;
  index?: number;
  expand?: "inline" | "dialog";
  /** Versione condensata (dashboard): testo più piccolo, card più quadrate. */
  compact?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const s = ratingStyle(review.rating);
  const comment = review.comment?.trim() ?? "";
  const isLong = comment.length > LONG_THRESHOLD;
  const clamp = !expanded && isLong; // in modalità dialog `expanded` resta false → sempre clampato

  return (
    <>
      <div
        className={`fade-up group relative flex h-full flex-col overflow-hidden rounded-xl border shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${
          compact ? "gap-1.5 p-3" : "gap-2 p-4"
        } ${s.card} ${s.shine ? "shine-gold" : ""}`}
        style={{ animationDelay: `${index * 60}ms` }}
      >
        {/* Riga 1: stelle + data */}
        <div className="flex items-center justify-between gap-2">
          <Stars rating={review.rating} className={s.star} />
          <span className="shrink-0 text-[11px] text-gray-400">
            {new Date(review.createdAt).toLocaleDateString("it-IT")}
          </span>
        </div>

        {/* Riga 2: ricetta / menù */}
        {review.source && <SourceLink source={review.source} compact={compact} />}

        {/* Riga 3: icona + nome */}
        <div className="flex items-center gap-2">
          <span className={`flex shrink-0 items-center justify-center rounded-full bg-white/70 font-bold text-gray-600 ring-1 ring-black/5 ${compact ? "h-6 w-6 text-[10px]" : "h-7 w-7 text-[11px]"}`}>
            {review.nickname[0]?.toUpperCase()}
          </span>
          <span className={`truncate font-semibold text-gray-700 ${compact ? "text-xs" : "text-sm"}`}>{review.nickname}</span>
        </div>

        {comment && (
          <div className="relative">
            <p className={`whitespace-pre-wrap leading-relaxed text-gray-600 ${compact ? "text-xs" : "text-sm"} ${clamp ? (compact ? "line-clamp-3" : "line-clamp-3") : ""}`}>
              {comment}
            </p>
            {isLong &&
              (expand === "dialog" ? (
                <button
                  type="button"
                  onClick={() => setDialogOpen(true)}
                  className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-orange-600 transition-colors hover:text-orange-700"
                >
                  Leggi tutto
                  <Maximize2 size={12} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-orange-600 transition-colors hover:text-orange-700"
                >
                  {expanded ? "Mostra meno" : "Leggi tutto"}
                  <ChevronDown size={13} className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
                </button>
              ))}
          </div>
        )}
      </div>

      {expand === "dialog" && (
        <Modal open={dialogOpen} onClose={() => setDialogOpen(false)} title="Recensione">
          <div className="space-y-3">
            {review.source && <SourceLink source={review.source} />}
            <div className="flex items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-sm">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-700">
                  {review.nickname[0]?.toUpperCase()}
                </span>
                <span className="font-semibold text-gray-800">{review.nickname}</span>
                <span className="text-xs text-gray-400">
                  · {new Date(review.createdAt).toLocaleDateString("it-IT")}
                </span>
              </p>
              <Stars rating={review.rating} className={s.star} />
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{comment}</p>
          </div>
        </Modal>
      )}
    </>
  );
}
