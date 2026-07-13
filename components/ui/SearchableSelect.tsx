"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown, Check, X, Search } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  /** Conteggio mostrato a destra dell'opzione (es. numero di recensioni). */
  count?: number;
}

/**
 * Select a singola scelta con ricerca interna (combobox). Valore controllato:
 * `null` = nessuna selezione. Chiusura al click fuori. Riusa il pattern di
 * TagCombobox ma per una scelta sola con opzione "azzera".
 */
export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder = "Filtra…",
  icon,
  className = "",
}: {
  options: SelectOption[];
  value: string | null;
  onChange: (value: string | null) => void;
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

  const q = query.trim().toLowerCase();
  const filtered = q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
  const selected = options.find((o) => o.value === value) ?? null;

  const choose = (v: string | null) => {
    onChange(v);
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm shadow-sm transition-colors ${
          selected ? "border-orange-300 text-gray-800" : "border-gray-200 text-gray-500"
        } hover:border-orange-300`}
      >
        {icon && <span className="shrink-0 text-gray-400">{icon}</span>}
        <span className="flex-1 truncate text-left">{selected ? selected.label : placeholder}</span>
        {selected ? (
          <span
            role="button"
            tabIndex={0}
            aria-label="Azzera filtro"
            onClick={(e) => { e.stopPropagation(); choose(null); }}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); choose(null); } }}
            className="shrink-0 rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={14} />
          </span>
        ) : (
          <ChevronDown size={15} className="shrink-0 text-gray-400" />
        )}
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
          <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2">
            <Search size={14} className="shrink-0 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              autoFocus
              className="w-full bg-transparent text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none"
            />
          </div>
          <div className="max-h-60 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-sm text-gray-400">Nessun risultato</p>
            ) : (
              filtered.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => choose(o.value)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-orange-50"
                >
                  <span className="min-w-0 flex-1 truncate">{o.label}</span>
                  {o.count != null && (
                    <span className="shrink-0 rounded-full bg-gray-100 px-1.5 py-0.5 text-[11px] font-semibold text-gray-500">
                      {o.count}
                    </span>
                  )}
                  {o.value === value && <Check size={14} className="shrink-0 text-emerald-500" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
