"use client";
import { StickyNote, ChevronDown } from "lucide-react";

/**
 * 13.7 · accesso rapido alla nota del menù (solo admin, solo se c'è una nota): striscia gialla con
 * la prima riga; toccandola si scorre fino alla sezione note (`targetId`).
 */
export function MenuNoteQuickLink({ note, targetId }: { note: string; targetId: string }) {
  const preview = note.split("\n").find((l) => l.trim()) ?? note;
  return (
    <button
      type="button"
      onClick={() => document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" })}
      className="flex min-h-(--h-btn) w-full items-center gap-2.5 rounded-ctl bg-giallo-100 px-3 py-2 text-left text-[0.875rem] text-giallo-ink hover:brightness-[0.98]"
    >
      <StickyNote className="size-4 shrink-0" aria-hidden />
      <span className="min-w-0 flex-1 truncate">
        <span className="sr-only">Nota del menù: </span>
        {preview}
      </span>
      <ChevronDown className="size-4 shrink-0" aria-hidden />
    </button>
  );
}
