"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { clsx } from "clsx";
import { Check, Plus } from "lucide-react";
import { Chip } from "@/components/ds/Controls";
import { dropdownCls, dropdownItemCls, dropdownNewCls } from "@/components/admin/FormParts";

/**
 * Elementi 11.6 + 11.7 · scelte a chip con «cerca e crea» (categorie e tag del form ricetta).
 * Rende un frammento: i chip scelti e il chip tratteggiato «+ …» finiscono nella stessa fila
 * del contenitore (così categorie e tag stanno insieme, come nel prototipo). Toccando «+ …» il
 * chip diventa un campo di ricerca con la tendina; se il testo non esiste si può creare.
 */
export interface ChipSearchItem {
  id: number;
  name: string;
  /** colore della categoria (pallino) */
  dot?: string;
}

export function ChipSearch({
  items,
  selectedIds,
  onToggle,
  addLabel,
  placeholder,
  prefix = "",
  onCreate,
  createExtra,
}: {
  items: ChipSearchItem[];
  selectedIds: number[];
  onToggle: (id: number) => void;
  addLabel: string;
  placeholder: string;
  /** prefisso mostrato davanti al nome (es. «#» per i tag) */
  prefix?: string;
  /** crea la voce; restituisce un messaggio d'errore o null */
  onCreate: (name: string) => Promise<string | null>;
  /** controllo sopra «Crea» (es. colore della categoria) */
  createExtra?: ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const q = query.trim().toLowerCase();
  const filtered = q ? items.filter((i) => i.name.toLowerCase().includes(q)) : items;
  const showCreate = !!q && !items.some((i) => i.name.toLowerCase() === q);
  const selected = items.filter((i) => selectedIds.includes(i.id));

  const close = () => {
    setEditing(false);
    setQuery("");
  };

  useEffect(() => {
    if (!editing) return;
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [editing]);

  const create = async () => {
    const name = query.trim();
    if (!name || creating) return;
    setCreating(true);
    setError(null);
    const err = await onCreate(name);
    setCreating(false);
    if (err) setError(err);
    else close();
  };

  return (
    <>
      {selected.map((i) => (
        <Chip key={i.id} dot={i.dot} onRemove={() => onToggle(i.id)} removeLabel={`Togli ${prefix}${i.name}`}>
          {prefix}
          {i.name}
        </Chip>
      ))}
      <div ref={ref} className="relative">
        {editing ? (
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") close();
              if (e.key === "Enter") {
                e.preventDefault();
                if (showCreate) void create();
                else if (filtered[0]) onToggle(filtered[0].id);
              }
            }}
            placeholder={placeholder}
            autoComplete="off"
            className="h-(--h-sm) w-[12rem] rounded-full border border-blu-600 bg-white px-[0.85em] text-blu-950 ring-[3px] ring-blu-600/18 placeholder:text-grigio-chiaro focus:outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex h-(--h-sm) items-center gap-[0.4em] rounded-full border border-dashed border-blu-250 bg-white px-[0.85em] text-[0.875rem] font-semibold whitespace-nowrap text-blu-600 transition-colors hover:bg-blu-100 [&_svg]:size-[1.05em]"
          >
            <Plus aria-hidden />
            {addLabel}
          </button>
        )}
        {editing && (filtered.length > 0 || showCreate) && (
          <div className={dropdownCls}>
            {filtered.slice(0, 30).map((i) => {
              const on = selectedIds.includes(i.id);
              return (
                <button
                  key={i.id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onToggle(i.id);
                  }}
                  className={dropdownItemCls}
                >
                  {i.dot && <span aria-hidden className="size-3 shrink-0 rounded-full" style={{ backgroundColor: i.dot }} />}
                  <span className="min-w-0 flex-1 truncate">
                    {prefix}
                    {i.name}
                  </span>
                  {on && <Check size={16} className="shrink-0 text-verde" aria-label="scelta" />}
                </button>
              );
            })}
            {showCreate && (
              <div className={clsx(filtered.length > 0 && "mt-1 border-t border-blu-150 pt-1")}>
                {createExtra && <div className="px-2.5 pt-1.5 pb-1">{createExtra}</div>}
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    void create();
                  }}
                  disabled={creating}
                  className={clsx(dropdownItemCls, dropdownNewCls)}
                >
                  <Plus aria-hidden />
                  {creating ? "Creazione…" : `Crea «${query.trim()}»`}
                </button>
              </div>
            )}
            {error && <p className="px-2.5 py-1.5 text-[0.8125rem] text-rosa">{error}</p>}
          </div>
        )}
      </div>
    </>
  );
}
