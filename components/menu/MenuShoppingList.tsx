"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { clsx } from "clsx";
import { Panel } from "@/components/ds/Panel";
import { SearchField, TextInput } from "@/components/ds/Field";
import { Button, IconButton } from "@/components/ds/Button";
import { Checkbox } from "@/components/ds/Controls";
import { ProgressBar } from "@/components/ds/Progress";
import { Tag } from "@/components/ds/Tag";
import { GroceryBagIcon } from "@/components/icons";
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
  const keys = new Set([...items.map((i) => i.key), ...extra.map((e) => `extra:${e.id}`)]);
  const doneCount = [...checked].filter((k) => keys.has(k)).length;

  const qtyLabel = (qty: number | null, unit: string | null) =>
    qty != null ? `${formatQty(qty)}${unit ? ` ${unit}` : ""}` : (unit ?? "q.b.");

  /** 8.8 · riga della lista spesa: spunta, nome (ricette sotto), quantità a destra in arancio */
  const row = (key: string, name: string, qty: string, opts: { optional?: boolean; recipes?: string[]; onRemove?: () => void }) => {
    const isChecked = checked.has(key);
    return (
      <li key={key} className="flex min-w-0 items-center gap-1 border-b border-blu-100 last:border-b-0">
        <Checkbox
          checked={isChecked}
          onChange={() => toggle(key)}
          className="min-h-11 min-w-0 flex-1 py-1 select-none [-webkit-tap-highlight-color:transparent]"
          label={
            <span className="flex min-w-0 flex-col">
              <span className={clsx("flex min-w-0 flex-wrap items-center gap-x-1.5", isChecked && "text-grigio-chiaro line-through")}>
                {name}
                {opts.optional && <Tag tone="optional">opzionale</Tag>}
              </span>
              {opts.recipes && opts.recipes.length > 0 && (
                <span className="truncate text-xs text-grigio">{opts.recipes.join(", ")}</span>
              )}
            </span>
          }
        />
        <span className={clsx("tabular shrink-0 text-right text-[0.875rem] font-semibold whitespace-nowrap", isChecked ? "text-grigio-chiaro" : "text-arancio-scuro")}>
          {qty}
        </span>
        {opts.onRemove && (
          <IconButton size="row" tone="danger" label={`Togli ${name}`} onClick={opts.onRemove} disabled={savingExtra} className="ml-1">
            <Trash2 />
          </IconButton>
        )}
      </li>
    );
  };

  return (
    <Panel
      id="spesa"
      icon={<GroceryBagIcon />}
      title="Lista della spesa"
      meta={`${doneCount} di ${totalCount} presi`}
    >
      <ProgressBar value={doneCount} max={totalCount} label="Spesa fatta" />
      <SearchField value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cerca un ingrediente…" aria-label="Cerca nella lista" />

      <div className="@container">
        {filtered.length === 0 && filteredExtra.length === 0 ? (
          <p className="text-[0.875rem] text-grigio">Nessun ingrediente {query.trim() ? "trovato" : "nel menù"}.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-x-6 @min-[34rem]:grid-cols-2">
            {visible.map((item) => row(item.key, item.name, qtyLabel(item.qty, item.unit), { optional: item.optional, recipes: item.recipeNames }))}
          </ul>
        )}
      </div>

      {showToggle && (
        <Button
          variant="ghost"
          size="sm"
          className="self-start"
          icon={expanded ? <ChevronUp /> : <ChevronDown />}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Mostra meno" : `Vedi tutta la lista (altri ${hiddenCount})`}
        </Button>
      )}

      {/* Ingredienti aggiunti a mano (extra), non presenti nelle ricette */}
      <div className="flex flex-col gap-2 border-t border-blu-150 pt-3">
        <h3 className="text-xs font-bold tracking-[0.08em] text-grigio uppercase">Aggiunti a mano</h3>
        {filteredExtra.length > 0 && (
          <ul className="@container grid grid-cols-1 gap-x-6">
            {filteredExtra.map((item) =>
              row(`extra:${item.id}`, item.name, qtyLabel(item.qty, item.unit), { onRemove: () => void removeExtra(item.id) })
            )}
          </ul>
        )}
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="min-w-32 flex-1">
            <TextInput
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addExtra()}
              placeholder="Ingrediente…"
              aria-label="Ingrediente da aggiungere"
            />
          </div>
          <div className="w-18 shrink-0">
            <TextInput
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={newQty}
              onChange={(e) => setNewQty(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addExtra()}
              placeholder="qtà"
              aria-label="Quantità"
              className="text-right"
            />
          </div>
          <div className="w-20 shrink-0">
            <TextInput
              value={newUnit}
              onChange={(e) => setNewUnit(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addExtra()}
              placeholder="unità"
              aria-label="Unità"
            />
          </div>
          <Button variant="tonal" icon={<Plus />} onClick={() => void addExtra()} disabled={savingExtra || !newName.trim()}>
            Aggiungi
          </Button>
        </div>
      </div>

      {/* Totale speso: confluisce nella sezione Costi (voce «Ingredienti») */}
      <div className="flex flex-col gap-2 border-t border-blu-150 pt-3">
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="grocery-spent" className="text-[0.875rem] font-semibold">
            Totale speso
          </label>
          {groceryCost != null && <Tag tone="prep">registrato: {eur.format(groceryCost)}</Tag>}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-32">
            <TextInput
              id="grocery-spent"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={spent}
              onChange={(e) => setSpent(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveSpent()}
              placeholder="0,00"
              className="pr-7 text-right"
            />
            <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-[0.875rem] text-grigio">€</span>
          </div>
          <Button variant="secondary" onClick={() => void saveSpent()} loading={savingSpent} disabled={!spent.trim()}>
            Salva
          </Button>
        </div>
        <p className="text-xs text-grigio">
          {groceryCost != null ? "Salvando sostituisci il valore registrato." : "Finisce nei «Costi» del menù."}
        </p>
      </div>
    </Panel>
  );
}
