"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { clsx } from "clsx";
import { ChevronDown, Check, X, Search } from "lucide-react";
import { normalizeSearchText } from "@/lib/search";

export interface SelectOption {
  value: string;
  label: string;
  /** Conteggio mostrato a destra dell'opzione (es. numero di recensioni). */
  count?: number;
}

/**
 * Filtro a scelta singola con ricerca interna (12.7, filtri recensioni). Aspetto di chip 4.11:
 * vuoto = «Ricetta ▾», scelto = chip scuro «Ricetta: Focaccia ×». Valore controllato
 * (`null` = nessuna scelta), chiusura al tocco fuori.
 */
export function SearchableSelect({
  options,
  value,
  onChange,
  label,
  placeholder,
  searchPlaceholder = "Filtra…",
  icon,
  className = "",
}: {
  options: SelectOption[];
  value: string | null;
  onChange: (value: string | null) => void;
  /** Nome del filtro (es. «Ricetta») */
  label: string;
  /** Testo dell'opzione «tutti» nella tendina (es. «Tutte le ricette») */
  placeholder: string;
  searchPlaceholder?: string;
  icon?: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const q = normalizeSearchText(query);
  const filtered = q ? options.filter((o) => normalizeSearchText(o.label).includes(q)) : options;
  const selected = options.find((o) => o.value === value) ?? null;

  const choose = (v: string | null) => {
    onChange(v);
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={ref} className={clsx("relative min-w-0", className)}>
      <div
        className={clsx(
          "inline-flex h-(--h-sm) max-w-full items-center rounded-full border text-[0.875rem] font-semibold transition-colors [&_svg]:size-[1.05em] [&_svg]:shrink-0",
          selected ? "border-blu-800 bg-blu-800 text-white" : "border-blu-200 bg-white text-blu-950 hover:bg-blu-100"
        )}
      >
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex h-full min-w-0 items-center gap-[0.4em] pl-[0.85em] pr-[0.6em]"
        >
          {icon}
          <span className="truncate">{selected ? `${label}: ${selected.label}` : label}</span>
          {!selected && <ChevronDown aria-hidden />}
        </button>
        {selected && (
          <button type="button" onClick={() => choose(null)} aria-label={`Togli il filtro ${label}`} className="mr-[0.35em] rounded-full p-[0.2em] hover:bg-white/15">
            <X />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute top-full left-0 z-50 mt-1 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-ctl border border-blu-150 bg-white shadow-[0_10px_30px_oklch(25%_0.038_228/.18)]">
          <div className="flex items-center gap-2 border-b border-blu-150 px-3">
            <Search className="size-4 shrink-0 text-grigio" aria-hidden />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-(--h-field) w-full bg-transparent text-blu-950 placeholder:text-grigio-chiaro focus:outline-none"
            />
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            <button type="button" onClick={() => choose(null)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-grigio hover:bg-blu-50">
              <span className="flex-1">{placeholder}</span>
              {value === null && <Check className="size-4 shrink-0 text-verde" />}
            </button>
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-grigio">Nessun risultato</p>
            ) : (
              filtered.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => choose(o.value)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-blu-50"
                >
                  <span className="min-w-0 flex-1 truncate">{o.label}</span>
                  {o.count !== undefined && <span className="tabular shrink-0 text-(length:--fs-meta) text-grigio">{o.count}</span>}
                  {o.value === value && <Check className="size-4 shrink-0 text-verde" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
