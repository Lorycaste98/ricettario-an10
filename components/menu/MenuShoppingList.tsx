"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ShoppingCart, ChevronDown, ChevronUp, Check, Plus, Trash2 } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { PriceTag } from "@/components/ui/PriceTag";
import type { ShoppingListItem } from "@/lib/shopping-list";
import type { MenuExtraItem } from "@/lib/types";
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

const eur = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });

// Converte l'input testuale (virgola o punto) in numero ≥ 0, null se vuoto/non valido
function numOrNull(v: string): number | null {
  const n = Number(v.replace(",", ".").trim());
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
}

export function MenuShoppingList({
  menuId,
  items,
  extraItems,
  groceryCost,
}: {
  menuId: number;
  items: ShoppingListItem[];
  extraItems: MenuExtraItem[];
  groceryCost: number | null;
}) {
  const router = useRouter();
  const [checked, setChecked] = useLocalStore<ReadonlySet<string>>(
    storageKey(menuId),
    EMPTY_CHECKED,
    parseChecked,
    serializeChecked
  );
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);

  // Ingredienti extra (persistiti lato server via replace-all): copia locale editabile
  const [extra, setExtra] = useState<MenuExtraItem[]>(extraItems);
  const [newName, setNewName] = useState("");
  const [newQty, setNewQty] = useState("");
  const [newUnit, setNewUnit] = useState("");
  const [savingExtra, setSavingExtra] = useState(false);

  // Totale speso: campo di inserimento che si svuota dopo il salvataggio; il valore
  // registrato vive nella voce "Ingredienti" della sezione Costi (Menu.groceryCost).
  const [spent, setSpent] = useState("");
  const [savingSpent, setSavingSpent] = useState(false);

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

  const filteredExtra = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return extra;
    return extra.filter((it) => it.name.toLowerCase().includes(q));
  }, [extra, query]);

  const persistExtra = async (next: MenuExtraItem[]) => {
    setSavingExtra(true);
    const res = await fetch(`/api/menus/${menuId}/extra-items`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: next.map((it) => ({ name: it.name, qty: it.qty, unit: it.unit })),
      }),
    });
    setSavingExtra(false);
    if (res.ok) {
      const data = (await res.json()) as { items: MenuExtraItem[] };
      setExtra(data.items);
    }
  };

  const addExtra = async () => {
    const name = newName.trim();
    if (!name) return;
    const next: MenuExtraItem[] = [
      ...extra,
      { id: -Date.now(), name, qty: numOrNull(newQty), unit: newUnit.trim() || null },
    ];
    setNewName("");
    setNewQty("");
    setNewUnit("");
    await persistExtra(next);
  };

  const removeExtra = async (id: number) => {
    await persistExtra(extra.filter((it) => it.id !== id));
  };

  const saveSpent = async () => {
    const value = numOrNull(spent);
    if (value == null) return; // niente da salvare (per azzerare si usa "Azzera" nei Costi)
    setSavingSpent(true);
    const res = await fetch(`/api/menus/${menuId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groceryCost: value }),
    });
    setSavingSpent(false);
    if (res.ok) {
      setSpent(""); // l'input si svuota: il valore ora vive nella voce di costo "Ingredienti"
      router.refresh(); // aggiorna la voce "Ingredienti" nella sezione Costi
    }
  };

  const totalCount = items.length + extra.length;

  const inputCls =
    "rounded-lg border border-white/40 bg-white/60 px-2.5 py-1.5 text-sm text-sky-950 placeholder:text-sky-700/40 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-300/30";

  return (
    <section className="rounded-2xl border border-white/25 bg-white/30 backdrop-blur-sm p-5 sm:p-6">
      <SectionHeader
        title="Lista della spesa"
        icon={<ShoppingCart size={20} />}
        tone="emerald"
        size="lg"
        titleClassName="text-sky-50"
        hint={`${checked.size}/${totalCount} spuntati`}
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

      {filtered.length === 0 && filteredExtra.length === 0 ? (
        <p className="text-sm text-sky-700/60">Nessun ingrediente {query.trim() ? "trovato" : "nel menù"}.</p>
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
                    {isChecked ? <Check size={11} /> : ""}
                  </span>
                  <span className="shrink-0 text-xs font-semibold text-orange-600 tabular-nums whitespace-nowrap">
                    {label}
                  </span>
                  <span className={`min-w-0 flex-1 text-sm ${isChecked ? "line-through text-sky-500/60" : "text-sky-900"}`}>
                    {item.name}
                    {item.optional && <PriceTag className="ml-1.5" />}
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

      {/* Ingredienti aggiunti a mano (extra), non presenti nelle ricette */}
      <div className="mt-5 border-t border-white/40 pt-4">
        <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-sky-700/70">
          Aggiunti a mano
        </h3>
        {filteredExtra.length > 0 && (
          <ul className="mb-3 grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
            {filteredExtra.map((item) => {
              const key = `extra:${item.id}`;
              const isChecked = checked.has(key);
              const label =
                item.qty != null ? `${formatQty(item.qty)}${item.unit ? ` ${item.unit}` : ""}` : (item.unit ?? "q.b.");
              return (
                <li key={key} className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => toggle(key)}
                    className="flex min-w-0 flex-1 items-baseline gap-2 rounded-lg px-1.5 py-1.5 text-left hover:bg-white/30 transition-colors"
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] mt-0.5 transition-colors ${
                        isChecked ? "border-green-500 bg-green-500 text-white" : "border-sky-400/50 bg-white/60"
                      }`}
                    >
                      {isChecked ? <Check size={11} /> : ""}
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-orange-600 tabular-nums whitespace-nowrap">{label}</span>
                    <span className={`min-w-0 flex-1 text-sm ${isChecked ? "line-through text-sky-500/60" : "text-sky-900"}`}>
                      {item.name}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => removeExtra(item.id)}
                    disabled={savingExtra}
                    className="shrink-0 rounded-lg p-1.5 text-rose-500 transition-colors hover:bg-rose-50 disabled:opacity-50"
                    aria-label={`Rimuovi ${item.name}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <div className="flex flex-wrap items-center gap-1.5">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addExtra()}
            placeholder="Ingrediente…"
            className={`${inputCls} min-w-32 flex-1`}
          />
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={newQty}
            onChange={(e) => setNewQty(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addExtra()}
            placeholder="qtà"
            className={`${inputCls} w-16 text-right`}
            aria-label="Quantità"
          />
          <input
            type="text"
            value={newUnit}
            onChange={(e) => setNewUnit(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addExtra()}
            placeholder="unità"
            className={`${inputCls} w-20`}
            aria-label="Unità"
          />
          <button
            type="button"
            onClick={addExtra}
            disabled={savingExtra || !newName.trim()}
            className="inline-flex items-center gap-1 rounded-lg border border-orange-300/60 bg-white/60 px-2.5 py-1.5 text-sm font-medium text-orange-700 transition-colors hover:bg-white/90 disabled:opacity-50"
          >
            <Plus size={15} /> Aggiungi
          </button>
        </div>
      </div>

      {/* Totale speso — confluisce nella sezione Costi (voce "Ingredienti") */}
      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-white/40 pt-4">
        <label htmlFor="grocery-spent" className="text-sm font-medium text-sky-900">
          Totale speso
        </label>
        {groceryCost != null && (
          <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-700">
            registrato: {eur.format(groceryCost)}
          </span>
        )}
        <div className="relative w-28">
          <input
            id="grocery-spent"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={spent}
            onChange={(e) => setSpent(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && saveSpent()}
            placeholder="0,00"
            className={`${inputCls} w-full pr-6 text-right`}
          />
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-sky-500">€</span>
        </div>
        <button
          type="button"
          onClick={saveSpent}
          disabled={savingSpent || !spent.trim()}
          className="rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
        >
          Salva
        </button>
        <span className="text-[11px] text-sky-600/70">
          {groceryCost != null ? "Salvando sostituisci il valore registrato." : "Finisce nei “Costi” del menù."}
        </span>
      </div>
    </section>
  );
}
