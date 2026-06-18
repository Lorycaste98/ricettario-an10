"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Check, X } from "lucide-react";
import { clsx } from "clsx";
import { ColorPicker, nextPaletteColor } from "@/components/ui/ColorPicker";
import type { Category } from "@/lib/types";

interface Props {
  categories: Category[];
  selectedIds: number[];
  onToggle: (id: number) => void;
  /** Chiamato dopo la creazione: aggiunge la categoria alla lista e la seleziona. */
  onCreated: (category: Category) => void;
  className?: string;
}

export function CategoryCombobox({
  categories,
  selectedIds,
  onToggle,
  onCreated,
  className = "",
}: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [color, setColor] = useState(() => nextPaletteColor(categories.map((c) => c.color)));
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const q = query.trim().toLowerCase();
  const filtered = q ? categories.filter((c) => c.name.toLowerCase().includes(q)) : categories;
  const exactMatch = categories.some((c) => c.name.toLowerCase() === q);
  const showCreate = !!q && !exactMatch;

  const selected = categories.filter((c) => selectedIds.includes(c.id));

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleCreate = async () => {
    const name = query.trim();
    if (!name || creating) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Errore nella creazione");
        return;
      }
      onCreated({ id: json.id, name: json.name, color: json.color });
      setQuery("");
      setColor(nextPaletteColor([...categories.map((c) => c.color), json.color]));
      setOpen(false);
    } catch {
      setError("Errore di rete");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Chip selezionate */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onToggle(c.id)}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-transform hover:scale-105"
              style={{ backgroundColor: c.color }}
              title="Rimuovi"
            >
              {c.name}
              <X size={12} className="opacity-80" />
            </button>
          ))}
        </div>
      )}

      {/* Ricerca / creazione */}
      <div ref={containerRef} className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); setError(null); }}
          onFocus={() => setOpen(true)}
          placeholder="Cerca o crea una categoria…"
          className={className}
          autoComplete="off"
        />

        {open && (filtered.length > 0 || showCreate) && (
          <div className="absolute left-0 right-0 top-full z-50 mt-0.5 max-h-56 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
            {filtered.slice(0, 25).map((c) => {
              const isSel = selectedIds.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); onToggle(c.id); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-sky-50 transition-colors"
                >
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="flex-1 truncate">{c.name}</span>
                  {isSel && <Check size={14} className="shrink-0 text-emerald-500" />}
                </button>
              );
            })}

            {showCreate && (
              <div className="flex items-center gap-2 border-t border-gray-100 px-3 py-2">
                <ColorPicker value={color} onChange={setColor} compact />
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); void handleCreate(); }}
                  disabled={creating}
                  className={clsx(
                    "flex flex-1 items-center gap-2 text-left text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors disabled:opacity-50"
                  )}
                >
                  <Plus size={14} className="shrink-0" />
                  {creating ? "Creazione…" : <>Crea <span className="font-semibold">«{query.trim()}»</span></>}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
      {selectedIds.length > 0 && (
        <p className="text-xs text-sky-600">
          {selectedIds.length} categori{selectedIds.length === 1 ? "a" : "e"} selezionat{selectedIds.length === 1 ? "a" : "e"}
        </p>
      )}
    </div>
  );
}
