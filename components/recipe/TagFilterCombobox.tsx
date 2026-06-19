"use client";

import { useMemo, useState } from "react";
import { clsx } from "clsx";
import { Check, Search } from "lucide-react";
import type { Tag } from "@/lib/types";

interface Props {
  tags: Tag[];
  selectedIds: number[];
  onToggle: (id: number) => void;
  autoFocus?: boolean;
}

/** Combobox di filtro tag: ricerca + lista multi-selezione (selezione immediata, niente «#»). */
export function TagFilterCombobox({ tags, selectedIds, onToggle, autoFocus }: Props) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const filtered = useMemo(
    () => (q ? tags.filter((t) => t.name.toLowerCase().includes(q)) : tags),
    [tags, q]
  );

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-violet-500" />
        <input
          type="text"
          autoFocus={autoFocus}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cerca un tag…"
          autoComplete="off"
          className="h-9 w-full rounded-lg border border-violet-200 bg-white pl-8 pr-3 text-sm text-violet-950 placeholder:text-violet-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-300/30"
        />
      </div>

      <div className="max-h-52 divide-y divide-violet-50 overflow-y-auto rounded-lg border border-violet-100">
        {filtered.length === 0 ? (
          <p className="px-3 py-4 text-center text-xs text-gray-400">Nessun tag trovato</p>
        ) : (
          filtered.map((t) => {
            const sel = selectedIds.includes(t.id);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onToggle(t.id)}
                className={clsx(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
                  sel ? "bg-violet-50 font-medium text-violet-800" : "text-gray-700 hover:bg-violet-50/60"
                )}
              >
                <span
                  className={clsx(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                    sel ? "border-violet-500 bg-violet-500 text-white" : "border-gray-300"
                  )}
                >
                  {sel && <Check size={11} />}
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
