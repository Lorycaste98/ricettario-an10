"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, ChevronDown, MessageSquareText, Trash2 } from "lucide-react";
import { IconButton } from "@/components/ds/Button";
import { ClocheIcon } from "@/components/icons";

export interface AdminReview {
  id: number;
  nickname: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  recipe: { id: number; name: string; quick: boolean };
  /** Menù d'origine; null = nota personale admin (storico). */
  menu: { id: number; name: string } | null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" });
}

const chipCls = "inline-flex h-[1.75em] min-w-0 max-w-full items-center gap-[0.35em] rounded-full bg-blu-100 px-[0.65em] text-[0.75rem] font-bold text-blu-800 [&_svg]:size-[1.1em] [&_svg]:shrink-0";

/**
 * Card recensione compatta (admin, restyle fase 5). A colpo d'occhio: voto (pallino oro, come in
 * dashboard), autore, data, ricetta e menù (nascondibili se la lista è già raggruppata per quella
 * dimensione). Il commento si apre al tocco, solo se c'è.
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
  const comment = review.comment?.trim() ?? "";

  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-ctl border border-blu-150 bg-white p-3">
      <div className="flex items-center gap-2.5">
        <span className="tabular flex size-9 shrink-0 items-center justify-center rounded-full bg-oro-50 font-bold text-giallo-ink" aria-label={`Voto ${review.rating} su 10`}>
          {review.rating}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold">{review.nickname}</p>
          <p className="text-(length:--fs-meta) text-grigio">{formatDate(review.createdAt)}</p>
        </div>
        {onDelete && (
          <IconButton label="Elimina recensione" tone="danger" size="row" onClick={onDelete}>
            <Trash2 />
          </IconButton>
        )}
      </div>

      {(showRecipe || (showMenu && review.menu)) && (
        <div className="flex min-w-0 flex-wrap gap-1.5">
          {showRecipe &&
            (review.recipe.quick ? (
              <span className={chipCls}>
                <BookOpen aria-hidden />
                <span className="truncate">{review.recipe.name}</span>
              </span>
            ) : (
              <Link href={`/ricette/${review.recipe.id}`} className={`${chipCls} hover:bg-blu-150`}>
                <BookOpen aria-hidden />
                <span className="truncate">{review.recipe.name}</span>
              </Link>
            ))}
          {showMenu && review.menu && (
            <Link href={`/menu/${review.menu.id}`} className={`${chipCls} bg-area-menu-50 text-area-menu hover:brightness-95`}>
              <ClocheIcon aria-hidden />
              <span className="truncate">{review.menu.name}</span>
            </Link>
          )}
        </div>
      )}

      {comment && (
        <div>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="inline-flex items-center gap-1 text-[0.8125rem] font-semibold text-blu-600 hover:underline"
          >
            <MessageSquareText className="size-4" aria-hidden />
            {open ? "Nascondi commento" : "Commento"}
            <ChevronDown className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
          </button>
          {open && <p className="mt-1.5 rounded-[0.625rem] bg-blu-50 p-2.5 text-[0.875rem] leading-relaxed whitespace-pre-wrap">{comment}</p>}
        </div>
      )}
    </div>
  );
}
