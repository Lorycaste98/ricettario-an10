"use client";

import { useState } from "react";
import Link from "next/link";
import { Trash2, MessageSquareText, Tag as TagIcon } from "lucide-react";
import { ratingStyle } from "@/lib/review-style";
import { RatingBadge } from "@/components/ui/Rating";
import { Modal } from "@/components/ui/Modal";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * Card recensione pubblica compatta (pagina ricetta/menù). A colpo d'occhio:
 * voto + autore (+ data/chip opzionali). Il commento è nascosto: se presente,
 * un'icona lo apre in un dialog (comodo dentro un carosello); se assente nulla.
 * Colorata per voto — il 10 eredita alone + sheen da `ratingStyle`.
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
  const s = ratingStyle(rating);
  const text = comment?.trim() ?? "";
  const hasComment = text.length > 0;

  return (
    <>
      <div
        className={`relative flex h-full flex-col gap-2 overflow-hidden rounded-xl border p-3 shadow-sm ${s.card} ${
          s.top ? "rating-top" : ""
        }`}
      >
        {/* Riga 1: voto (+ elimina admin) */}
        <div className="flex items-center justify-between gap-2">
          <RatingBadge rating={rating} size="sm" />
          <div className="flex shrink-0 items-center gap-1">
            {showDate && <span className="text-[11px] text-sky-600/80">{formatDate(createdAt)}</span>}
            {isAdmin && onDelete && (
              <button
                type="button"
                onClick={onDelete}
                aria-label="Elimina recensione"
                className="flex h-6 w-6 items-center justify-center rounded-lg text-sky-400 transition-colors active:bg-red-50 active:text-red-500 sm:hover:bg-red-50 sm:hover:text-red-500"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Riga 2: autore */}
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/70 text-[10px] font-bold text-sky-800 ring-1 ring-black/5">
            {nickname[0]?.toUpperCase()}
          </span>
          <span className="truncate text-xs font-semibold text-sky-950">{nickname}</span>
        </div>

        {/* Chip contesto opzionale */}
        {chip && (
          <Link
            href={chip.href}
            className="inline-flex w-fit items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-600 transition-colors active:bg-sky-200 sm:hover:bg-sky-200"
          >
            <TagIcon size={10} className="shrink-0" /> <span className="truncate">{chip.label}</span>
          </Link>
        )}

        {/* Commento: solo se presente, si apre in dialog */}
        {hasComment && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-auto inline-flex w-fit items-center gap-1 text-[11px] font-semibold text-sky-500 transition-colors hover:text-orange-600"
          >
            <MessageSquareText size={13} /> Leggi commento
          </button>
        )}
      </div>

      {hasComment && (
        <Modal open={open} onClose={() => setOpen(false)} title="Recensione" size="sm">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-sm">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-700">
                  {nickname[0]?.toUpperCase()}
                </span>
                <span className="font-semibold text-sky-950">{nickname}</span>
                <span className="text-xs text-sky-500">· {formatDate(createdAt)}</span>
              </span>
              <RatingBadge rating={rating} />
            </div>
            {chip && (
              <Link
                href={chip.href}
                className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-bold text-sky-600"
              >
                <TagIcon size={11} /> {chip.label}
              </Link>
            )}
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-sky-800">{text}</p>
          </div>
        </Modal>
      )}
    </>
  );
}
