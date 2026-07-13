"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Maximize2, BookOpen, UtensilsCrossed, Trash2 } from "lucide-react";
import { ratingStyle } from "@/lib/review-style";
import { RatingBadge } from "@/components/ui/Rating";
import { Modal } from "@/components/ui/Modal";

export interface ReviewItem {
  id: number;
  nickname: string;
  rating: number;
  comment: string | null;
  createdAt: string | Date;
  recipe: { id: number; name: string; quick?: boolean };
  /** Menù da cui è arrivata la recensione (assente = nota personale admin). */
  menu?: { id: number; name: string } | null;
}

const LONG_THRESHOLD = 160;

/**
 * @param expand "inline" (default) → «Leggi tutto» espande nella card.
 *               "dialog" → i commenti lunghi si aprono in un Modal.
 */
export function ReviewCard({
  review,
  index = 0,
  expand = "inline",
  compact = false,
  hideMeta = false,
  isAdmin = false,
  onDelete,
}: {
  review: ReviewItem;
  index?: number;
  expand?: "inline" | "dialog";
  /** Versione condensata (dashboard): testo più piccolo, card più quadrate. */
  compact?: boolean;
  /** Nasconde la riga ricetta/menù — utile quando la card è già raggruppata per ricetta/menù altrove. */
  hideMeta?: boolean;
  isAdmin?: boolean;
  onDelete?: () => void;
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
        } ${s.card} ${s.top ? "rating-top" : ""}`}
        style={{ animationDelay: `${index * 60}ms` }}
      >
        {/* Riga 1: voto + data (+ elimina, se admin) */}
        <div className="flex items-center justify-between gap-2">
          <RatingBadge rating={review.rating} size={compact ? "sm" : "md"} />
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="text-[11px] text-gray-400">
              {new Date(review.createdAt).toLocaleDateString("it-IT")}
            </span>
            {isAdmin && onDelete && (
              <button
                type="button"
                onClick={onDelete}
                aria-label="Elimina recensione"
                className="flex h-6 w-6 items-center justify-center rounded-lg text-gray-400 transition-colors active:bg-red-50 active:text-red-500 sm:hover:bg-red-50 sm:hover:text-red-500"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Riga 2: ricetta + tag menù */}
        {!hideMeta && (
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            {review.recipe.quick ? (
              // Ricetta "veloce": nessuna pagina di dettaglio, niente link
              <span className="group/src flex min-w-0 items-center gap-1.5">
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold text-orange-600">
                  <BookOpen size={11} />
                  Ricetta
                </span>
                <span className={`truncate font-bold text-gray-700 ${compact ? "text-xs" : "text-sm"}`}>
                  {review.recipe.name}
                </span>
              </span>
            ) : (
              <Link href={`/ricette/${review.recipe.id}`} className="group/src flex min-w-0 items-center gap-1.5">
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold text-orange-600">
                  <BookOpen size={11} />
                  Ricetta
                </span>
                <span className={`truncate font-bold text-gray-700 transition-colors group-hover/src:text-orange-500 ${compact ? "text-xs" : "text-sm"}`}>
                  {review.recipe.name}
                </span>
              </Link>
            )}
            {review.menu && (
              <Link
                href={`/menu/${review.menu.id}`}
                className="flex shrink-0 items-center gap-1 rounded-full bg-sky-100 px-1.5 py-0.5 text-[10px] font-bold text-sky-600 transition-colors hover:bg-sky-200"
              >
                <UtensilsCrossed size={10} />
                {review.menu.name}
              </Link>
            )}
          </div>
        )}

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
            <div className="flex flex-wrap items-center gap-1.5">
              {review.recipe.quick ? (
                <span className="flex items-center gap-1.5 text-sm font-bold text-gray-700">
                  <BookOpen size={13} /> {review.recipe.name}
                </span>
              ) : (
                <Link href={`/ricette/${review.recipe.id}`} className="flex items-center gap-1.5 text-sm font-bold text-gray-700 hover:text-orange-500">
                  <BookOpen size={13} /> {review.recipe.name}
                </Link>
              )}
              {review.menu && (
                <Link href={`/menu/${review.menu.id}`} className="flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-bold text-sky-600">
                  <UtensilsCrossed size={11} /> {review.menu.name}
                </Link>
              )}
            </div>
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
              <RatingBadge rating={review.rating} />
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{comment}</p>
          </div>
        </Modal>
      )}
    </>
  );
}
