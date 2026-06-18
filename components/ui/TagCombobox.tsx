"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Check, X } from "lucide-react";
import type { Tag } from "@/lib/types";

interface Props {
  tags: Tag[];
  selectedIds: number[];
  onToggle: (id: number) => void;
  /** Chiamato dopo la creazione: aggiunge il tag alla lista e lo seleziona. */
  onCreated: (tag: Tag) => void;
  className?: string;
}

export function TagCombobox({
  tags,
  selectedIds,
  onToggle,
  onCreated,
  className = "",
}: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const q = query.trim().toLowerCase();
  const filtered = q ? tags.filter((t) => t.name.toLowerCase().includes(q)) : tags;
  const exactMatch = tags.some((t) => t.name.toLowerCase() === q);
  const showCreate = !!q && !exactMatch;

  const selected = tags.filter((t) => selectedIds.includes(t.id));

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
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Errore nella creazione");
        return;
      }
      onCreated({ id: json.id, name: json.name });
      setQuery("");
      setOpen(false);
    } catch {
      setError("Errore di rete");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Chip selezionati */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onToggle(t.id)}
              className="inline-flex items-center gap-1.5 rounded-full border border-orange-300 bg-orange-100/70 px-3 py-1.5 text-xs font-medium text-orange-700 transition-transform hover:scale-105"
              title="Rimuovi"
            >
              #{t.name}
              <X size={12} className="opacity-70" />
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
          placeholder="Cerca o crea un tag…"
          className={className}
          autoComplete="off"
        />

        {open && (filtered.length > 0 || showCreate) && (
          <div className="absolute left-0 right-0 top-full z-50 mt-0.5 max-h-56 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
            {filtered.slice(0, 30).map((t) => {
              const isSel = selectedIds.includes(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); onToggle(t.id); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-sky-50 transition-colors"
                >
                  <span className="flex-1 truncate">#{t.name}</span>
                  {isSel && <Check size={14} className="shrink-0 text-emerald-500" />}
                </button>
              );
            })}

            {showCreate && (
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); void handleCreate(); }}
                disabled={creating}
                className="flex w-full items-center gap-2 border-t border-gray-100 px-3 py-2 text-left text-sm font-medium text-orange-600 hover:bg-orange-50 transition-colors disabled:opacity-50"
              >
                <Plus size={14} className="shrink-0" />
                {creating ? "Creazione…" : <>Crea <span className="font-semibold">«{query.trim()}»</span></>}
              </button>
            )}
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
      {selectedIds.length > 0 && (
        <p className="text-xs text-sky-600">
          {selectedIds.length} tag selezionat{selectedIds.length === 1 ? "o" : "i"}
        </p>
      )}
    </div>
  );
}
