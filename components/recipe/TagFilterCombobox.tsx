"use client";

import { useMemo, useState } from "react";
import { clsx } from "clsx";
import { Check } from "lucide-react";
import { SearchField } from "@/components/ds/Field";
import type { Tag } from "@/lib/types";

interface Props {
  tags: Tag[];
  selectedIds: number[];
  onToggle: (id: number) => void;
  autoFocus?: boolean;
}

/**
 * Filtro tag della libreria (finestra «Filtra per tag» di `RecipeGrid`, restyle fase 8): ricerca 4.5
 * + lista a scelta multipla, selezione immediata, niente «#». Scelto = quadratino `blu-800`, come i
 * chip filtro attivi (4.11): il verde resta per «fatto».
 */
export function TagFilterCombobox({ tags, selectedIds, onToggle, autoFocus }: Props) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const filtered = useMemo(() => (q ? tags.filter((t) => t.name.toLowerCase().includes(q)) : tags), [tags, q]);

  return (
    <div className="flex flex-col gap-2">
      <SearchField
        autoFocus={autoFocus}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Cerca un tag…"
        aria-label="Cerca un tag"
        autoComplete="off"
      />

      <div className="max-h-64 divide-y divide-blu-150 overflow-y-auto rounded-ctl border border-blu-150">
        {filtered.length === 0 ? (
          <p className="px-3 py-4 text-center text-[0.875rem] text-grigio">Nessun tag trovato</p>
        ) : (
          filtered.map((t) => {
            const sel = selectedIds.includes(t.id);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onToggle(t.id)}
                aria-pressed={sel}
                className={clsx(
                  "flex min-h-11 w-full items-center gap-2.5 px-3 text-left transition-colors",
                  sel ? "bg-blu-100 font-semibold" : "hover:bg-blu-50"
                )}
              >
                <span
                  aria-hidden
                  className={clsx(
                    "flex size-5 shrink-0 items-center justify-center rounded-[0.375rem] border-2",
                    sel ? "border-blu-800 bg-blu-800 text-white" : "border-blu-250 bg-white"
                  )}
                >
                  {sel && <Check className="size-3.5" strokeWidth={3} />}
                </span>
                <span className="flex-1 truncate">{t.name}</span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
