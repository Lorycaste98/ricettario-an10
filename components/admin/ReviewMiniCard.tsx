"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, UtensilsCrossed, MessageSquareText, Trash2, ChevronDown } from "lucide-react";
import { ratingStyle } from "@/lib/review-style";
import { RatingBadge } from "@/components/ui/Rating";

export interface AdminReview {
  id: number;
  nickname: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  recipe: { id: number; name: string; quick: boolean };
  /** Menù d'origine; null = nota personale admin. */
  menu: { id: number; name: string } | null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * Card recensione compatta (admin). A colpo d'occhio: voto, autore, soggetto,
 * data. Il commento è nascosto: se presente, un'icona lo apre inline; se assente
 * non si mostra nulla. I chip soggetto (ricetta/menù) sono nascondibili quando la
 * lista è già raggruppata per quella dimensione.
 */
export function ReviewMiniCard({
  review,
  showRecipe = true,
  showMenu = true,
  onDelete,
}: {
  review: AdminReview;
  showRecipe?: boolean;
  showMenu?: boolean;
  onDelete?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const s = ratingStyle(review.rating);
  const comment = review.comment?.trim() ?? "";
  const hasComment = comment.length > 0;

  return (
    <div className={`relative flex flex-col gap-2 overflow-hidden rounded-xl border p-3 shadow-sm ${s.card} ${s.top ? "rating-top" : ""}`}>
      {/* Riga 1: voto + data + elimina */}
      <div className="flex items-center justify-between gap-2">
        <RatingBadge rating={review.rating} size="sm" />
        <div className="flex shrink-0 items-center gap-1">
          <span className="text-[11px] text-gray-400">{formatDate(review.createdAt)}</span>
          {onDelete && (
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

      {/* Riga 2: autore */}
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/70 text-[10px] font-bold text-gray-600 ring-1 ring-black/5">
          {review.nickname[0]?.toUpperCase()}
        </span>
        <span className="truncate text-xs font-semibold text-gray-700">{review.nickname}</span>
      </div>

      {/* Riga 3: soggetto (ricetta / menù) */}
      {(showRecipe || showMenu) && (
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          {showRecipe &&
            (review.recipe.quick ? (
              <span className="flex min-w-0 items-center gap-1 rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold text-orange-600">
                <BookOpen size={10} className="shrink-0" />
                <span className="truncate">{review.recipe.name}</span>
              </span>
            ) : (
              <Link
                href={`/ricette/${review.recipe.id}`}
                className="flex min-w-0 items-center gap-1 rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold text-orange-600 transition-colors hover:bg-orange-200"
              >
                <BookOpen size={10} className="shrink-0" />
                <span className="truncate">{review.recipe.name}</span>
              </Link>
            ))}
          {showMenu && review.menu && (
            <Link
              href={`/menu/${review.menu.id}`}
              className="flex min-w-0 items-center gap-1 rounded-full bg-sky-100 px-1.5 py-0.5 text-[10px] font-bold text-sky-600 transition-colors hover:bg-sky-200"
            >
              <UtensilsCrossed size={10} className="shrink-0" />
              <span className="truncate">{review.menu.name}</span>
            </Link>
          )}
        </div>
      )}

      {/* Commento: solo se presente, si apre al tap */}
      {hasComment && (
        <div>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 transition-colors hover:text-orange-600"
          >
            <MessageSquareText size={13} />
            {open ? "Nascondi commento" : "Commento"}
            <ChevronDown size={12} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
          </button>
          {open && (
            <p className="mt-1.5 whitespace-pre-wrap rounded-lg bg-white/60 p-2 text-xs leading-relaxed text-gray-700">
              {comment}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
