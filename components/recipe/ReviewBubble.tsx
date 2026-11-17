"use client";

import { useState } from "react";
import Link from "next/link";
import { Trash2, MessageSquareText } from "lucide-react";
import { IconButton } from "@/components/ds/Button";
import { ClocheIcon } from "@/components/icons";
import { Modal } from "@/components/ui/Modal";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" });
}

/** Voto ospite: pallino oro (6.2), come nelle recensioni di Gestione (`ReviewMiniCard`) */
function RatingDot({ rating, size = "md" }: { rating: number; size?: "md" | "lg" }) {
  return (
    <span
      className={`tabular flex shrink-0 items-center justify-center rounded-full bg-oro-50 font-bold text-giallo-ink ${size === "lg" ? "size-11 text-[1.125rem]" : "size-9"}`}
      aria-label={`Voto ${rating} su 10`}
    >
      {rating}
    </span>
  );
}

const chipCls =
  "inline-flex h-[1.75em] w-fit min-w-0 max-w-full items-center gap-[0.35em] rounded-full bg-area-menu-50 px-[0.65em] text-[0.75rem] font-bold text-area-menu hover:brightness-95 [&_svg]:size-[1.1em] [&_svg]:shrink-0";

/**
 * Card recensione pubblica compatta (dettaglio ricetta e menù, restyle fase 8): voto nel pallino
 * oro, autore, data e menù d'origine (facoltativi). Il commento è nascosto: se c'è, «Leggi il
 * commento» lo apre in una finestra (comoda dentro il carosello); se non c'è, niente.
 */
export function ReviewBubble({
  nickname,
  rating,
  comment,
  createdAt,
  chip,
  showDate = true,
  isAdmin = false,
  onDelete,
}: {
  nickname: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  /** Chip di contesto opzionale (es. menù d'origine). */
  chip?: { href: string; label: string } | null;
  showDate?: boolean;
  isAdmin?: boolean;
  onDelete?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const text = comment?.trim() ?? "";
  const hasComment = text.length > 0;

  return (
    <>
      <div className="flex h-full min-w-0 flex-col gap-2 rounded-ctl border border-blu-150 bg-white p-3">
        <div className="flex items-center gap-2.5">
          <RatingDot rating={rating} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold">{nickname}</p>
            {showDate && <p className="text-(length:--fs-meta) text-grigio">{formatDate(createdAt)}</p>}
          </div>
          {isAdmin && onDelete && (
            <IconButton label="Elimina recensione" tone="danger" size="row" onClick={onDelete}>
              <Trash2 />
            </IconButton>
          )}
        </div>

        {chip && (
          <Link href={chip.href} className={chipCls}>
            <ClocheIcon aria-hidden />
            <span className="truncate">{chip.label}</span>
          </Link>
        )}

        {hasComment && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="hit-44 mt-auto inline-flex min-h-6 w-fit items-center gap-1 text-[0.8125rem] font-semibold text-blu-700 hover:underline"
          >
            <MessageSquareText className="size-4" aria-hidden /> Leggi il commento
          </button>
        )}
      </div>

      {hasComment && (
        <Modal open={open} onClose={() => setOpen(false)} title="Recensione" size="sm" bodyClassName="min-h-[30dvh] sm:min-h-0">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <RatingDot rating={rating} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{nickname}</p>
                <p className="text-(length:--fs-meta) text-grigio">{formatDate(createdAt)}</p>
              </div>
            </div>
            {chip && (
              <Link href={chip.href} className={chipCls}>
                <ClocheIcon aria-hidden />
                <span className="truncate">{chip.label}</span>
              </Link>
            )}
            <p className="rounded-[0.625rem] bg-blu-50 p-3 leading-relaxed whitespace-pre-wrap">{text}</p>
          </div>
        </Modal>
      )}
    </>
  );
}
