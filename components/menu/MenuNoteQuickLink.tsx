"use client";
import { StickyNote, ArrowDown } from "lucide-react";

/**
 * Accesso rapido alla nota del menù: mostrato in alto (solo se c'è una nota),
 * al click scrolla in modo animato fino alla sezione note (`targetId`).
 */
export function MenuNoteQuickLink({ note, targetId }: { note: string; targetId: string }) {
  const scrollToNote = () => {
    document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  // Anteprima: prima riga non vuota della nota
  const preview = note.split("\n").find((l) => l.trim()) ?? note;

  return (
    <button
      type="button"
      onClick={scrollToNote}
      className="group flex w-full items-center gap-2.5 rounded-xl border border-amber-300/50 bg-gradient-to-br from-amber-50/80 to-orange-50/60 px-3.5 py-2.5 text-left shadow-sm backdrop-blur-sm transition-colors hover:from-amber-100/80 hover:to-orange-100/70"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-sm shadow-amber-500/30">
        <StickyNote size={16} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-semibold uppercase tracking-wide text-amber-700/80">Nota del menù</span>
        <span className="block truncate text-sm text-sky-900">{preview}</span>
      </span>
      <ArrowDown size={16} className="shrink-0 text-amber-600 transition-transform duration-200 group-hover:translate-y-0.5" />
    </button>
  );
}
