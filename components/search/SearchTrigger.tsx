"use client";

import { Search } from "lucide-react";
import { clsx } from "clsx";
import { openSearch } from "@/lib/search";

/**
 * Finto campo «Cerca» che apre l'overlay della ricerca globale (vetrina). È un bottone, non un
 * input: su iPhone il focus su un input vero aprirebbe la tastiera sotto l'overlay.
 */
export function SearchTrigger({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => openSearch()}
      className={clsx(
        "ds flex h-(--h-btn-lg) w-full items-center gap-2.5 rounded-full border border-blu-150 bg-white px-4 text-left text-grigio shadow-[0_6px_18px_oklch(25%_0.038_228/.18)] transition-colors hover:bg-blu-50",
        className
      )}
    >
      <Search className="size-5 shrink-0 text-blu-600" aria-hidden />
      <span className="min-w-0 flex-1 truncate">Cerca ricette, menù, ingredienti…</span>
      <kbd className="hidden rounded-md border border-blu-150 px-1.5 py-0.5 font-sans text-xs text-grigio [@media(hover:hover)]:inline">⌘K</kbd>
    </button>
  );
}
