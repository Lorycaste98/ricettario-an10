"use client";
import { Eye, EyeOff } from "lucide-react";
import { clsx } from "clsx";

/**
 * Toggle compatto "pronta / non pronta" (Recipe.published).
 * Presentazionale: il chiamante gestisce lo stato e l'eventuale fetch.
 * Usato nella top bar del RecipeForm (stato locale, salvato al submit) e nel
 * dettaglio ricetta (RecipeActions, PATCH immediato). Il testo si nasconde su
 * mobile lasciando solo l'icona (poco invasivo); il title spiega comunque.
 */
export function PublishSwitch({
  published,
  onToggle,
  disabled = false,
  className,
}: {
  published: boolean;
  onToggle: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={published}
      disabled={disabled}
      onClick={onToggle}
      title={
        published
          ? "Pronta — visibile ai visitatori. Tocca per nasconderla."
          : "Non pronta — nascosta ai visitatori. Tocca per pubblicarla."
      }
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50",
        published
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          : "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100",
        className
      )}
    >
      {published ? <Eye size={14} /> : <EyeOff size={14} />}
      <span className="hidden sm:inline">{published ? "Pronta" : "Non pronta"}</span>
    </button>
  );
}
