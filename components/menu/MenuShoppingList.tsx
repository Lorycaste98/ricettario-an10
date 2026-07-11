"use client";
import { useMemo, useState } from "react";
import { Search, ShoppingCart, ChevronDown, ChevronUp } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { ShoppingListItem } from "@/lib/shopping-list";
import { useLocalStore } from "@/lib/local-store";

const COLLAPSE_AT = 8;
const EMPTY_CHECKED: ReadonlySet<string> = new Set();

function storageKey(menuId: number) {
  return `ricettario:shopping-list:${menuId}`;
}

function parseChecked(raw: string): ReadonlySet<string> {
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) return new Set();
  return new Set(parsed.filter((x): x is string => typeof x === "string"));
}

function serializeChecked(value: ReadonlySet<string>): string {
  return JSON.stringify([...value]);
}

function formatQty(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return String(Math.round(n * 100) / 100);
}

export function MenuShoppingList({ menuId, items }: { menuId: number; items: ShoppingListItem[] }) {
  const [checked, setChecked] = useLocalStore<ReadonlySet<string>>(
    storageKey(menuId),
    EMPTY_CHECKED,
    parseChecked,
    serializeChecked
  );
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);

  const toggle = (key: string) => {
    const next = new Set(checked);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setChecked(next);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => it.name.toLowerCase().includes(q));
  }, [items, query]);

  const isSearching = query.trim().length > 0;
  const visible = isSearching || expanded ? filtered : filtered.slice(0, COLLAPSE_AT);
  const hiddenCount = filtered.length - visible.length;
  const showToggle = !isSearching && filtered.length > COLLAPSE_AT;

  if (items.length === 0) return null;

  return (
    <section className="rounded-2xl border border-white/25 bg-white/30 backdrop-blur-sm p-5 sm:p-6">
      <SectionHeader
        title="Lista della spesa"
        icon={<ShoppingCart size={20} />}
        tone="emerald"
        size="lg"
        titleClassName="text-sky-50"
        hint={`${checked.size}/${items.length} spuntati`}
        className="mb-4"
      />

      <div className="relative mb-4">
        <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sky-500/60" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cerca un ingrediente…"
          className="w-full rounded-xl border border-white/40 bg-white/50 py-2.5 pl-10 pr-3 text-sm text-sky-950 placeholder:text-sky-700/40 backdrop-blur-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-300/30"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-sky-700/60">Nessun ingrediente trovato.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
          {visible.map((item) => {
            const isChecked = checked.has(item.key);
            const label = item.qty != null ? `${formatQty(item.qty)}${item.unit ? ` ${item.unit}` : ""}` : (item.unit ?? "q.b.");
            return (
              <li key={item.key}>
                <button
                  type="button"
                  onClick={() => toggle(item.key)}
                  className="flex w-full items-baseline gap-2 rounded-lg px-1.5 py-1.5 text-left hover:bg-white/30 transition-colors"
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] mt-0.5 transition-colors ${
                      isChecked ? "border-green-500 bg-green-500 text-white" : "border-sky-400/50 bg-white/60"
                    }`}
                  >
                    {isChecked ? "✓" : ""}
                  </span>
                  <span className="shrink-0 text-xs font-semibold text-orange-600 tabular-nums whitespace-nowrap">
                    {label}
                  </span>
                  <span className={`min-w-0 flex-1 text-sm ${isChecked ? "line-through text-sky-500/60" : "text-sky-900"}`}>
                    {item.name}
                    {item.recipeNames.length > 0 && (
                      <span className="ml-1.5 text-[11px] font-normal text-sky-600/60">
                        ({item.recipeNames.join(", ")})
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {showToggle && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 flex items-center gap-1.5 text-xs font-medium text-orange-600 hover:text-orange-700 transition-colors"
        >
          {expanded ? (
            <>
              <ChevronUp size={14} /> Mostra meno
            </>
          ) : (
            <>
              <ChevronDown size={14} /> Vedi tutta la lista ({hiddenCount} altri)
            </>
          )}
        </button>
      )}
    </section>
  );
}
