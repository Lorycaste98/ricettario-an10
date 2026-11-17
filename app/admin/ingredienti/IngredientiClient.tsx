"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDownAZ, ArrowDownWideNarrow, Merge, Pencil } from "lucide-react";
import { Button, IconButton } from "@/components/ds/Button";
import { Checkbox, Segmented, Switch } from "@/components/ds/Controls";
import { Field, SearchField, Select, TextInput } from "@/components/ds/Field";
import { Modal } from "@/components/ui/Modal";
import { AdminEmptyRow, AdminRow, AdminTable, DeleteRowButton } from "@/components/admin/AdminTable";
import { normalizeSearchText } from "@/lib/search";

/**
 * Catalogo ingredienti (12.2, schermata `docs/design/schermate/5-ingredienti`): selezione con le
 * spunte, interruttore «nelle statistiche» (4.13: è un'impostazione), rinomina in una finestra,
 * barra scura «Unifica» sulla selezione (12.3) e finestra di unione. Righe mostrate a pagine di 100.
 */
interface IngredientItem {
  id: number;
  name: string;
  excludedFromStats: boolean;
  usageCount: number;
  recipes: { id: number; name: string }[];
}

type Sort = "az" | "used";
const PAGE = 100;

export default function IngredientiClient({ initialIngredients }: { initialIngredients: IngredientItem[] }) {
  const router = useRouter();
  const [ingredients, setIngredients] = useState<IngredientItem[]>(initialIngredients);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("az");
  const [limit, setLimit] = useState(PAGE);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [rename, setRename] = useState<{ id: number; name: string } | null>(null);
  const [usesOf, setUsesOf] = useState<IngredientItem | null>(null);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [canonical, setCanonical] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const filtered = useMemo(() => {
    const q = normalizeSearchText(query);
    const list = q ? ingredients.filter((i) => normalizeSearchText(i.name).includes(q)) : ingredients;
    return sort === "used" ? [...list].sort((a, b) => b.usageCount - a.usageCount || a.name.localeCompare(b.name, "it")) : list;
  }, [ingredients, query, sort]);
  const shown = filtered.slice(0, limit);

  const toggleSelect = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const byName = (a: IngredientItem, b: IngredientItem) => a.name.localeCompare(b.name, "it");

  // ── Rinomina ────────────────────────────────────────────────────────────────
  const saveRename = async () => {
    if (!rename) return;
    const name = rename.name.trim();
    if (!name) return setError("Il nome non può essere vuoto.");
    setBusy(true);
    setError("");
    const res = await fetch(`/api/admin/ingredients/${rename.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    }).catch(() => null);
    setBusy(false);
    if (!res?.ok) {
      const d = (await res?.json().catch(() => null)) as { error?: string } | null;
      return setError(d?.error ?? "Non è stato possibile rinominare.");
    }
    const updated = (await res.json()) as IngredientItem;
    setIngredients((prev) => prev.map((i) => (i.id === rename.id ? { ...i, name: updated.name } : i)).sort(byName));
    setRename(null);
    router.refresh();
  };

  // ── Nelle statistiche ──────────────────────────────────────────────────────
  const toggleExclude = async (item: IngredientItem) => {
    const res = await fetch(`/api/admin/ingredients/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ excludedFromStats: !item.excludedFromStats }),
    }).catch(() => null);
    if (!res?.ok) return;
    const updated = (await res.json()) as IngredientItem;
    setIngredients((prev) => prev.map((i) => (i.id === item.id ? { ...i, excludedFromStats: updated.excludedFromStats } : i)));
    router.refresh();
  };

  // ── Unifica ────────────────────────────────────────────────────────────────
  const selectedItems = ingredients.filter((i) => selected.has(i.id));

  const openMerge = () => {
    // Proposta: il nome più usato fra quelli scelti
    const best = [...selectedItems].sort((a, b) => b.usageCount - a.usageCount)[0];
    setCanonical(best?.name ?? "");
    setError("");
    setMergeOpen(true);
  };

  const handleMerge = async () => {
    const name = canonical.trim();
    if (!name) return setError("Scegli il nome da tenere.");
    setBusy(true);
    setError("");
    const res = await fetch("/api/admin/ingredients/merge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ canonical: name, toMerge: [...selected] }),
    }).catch(() => null);
    setBusy(false);
    if (!res?.ok) {
      const d = (await res?.json().catch(() => null)) as { error?: string } | null;
      return setError(d?.error ?? "Non è stato possibile unificare.");
    }
    const mergedIds = new Set(selected);
    setIngredients((prev) => {
      const merged = prev.filter((i) => mergedIds.has(i.id));
      const keep = merged.find((i) => i.name === name);
      const rest = prev.filter((i) => !mergedIds.has(i.id));
      if (!keep) return rest;
      const recipes = merged.flatMap((i) => i.recipes);
      return [...rest, { ...keep, usageCount: recipes.length, recipes }].sort(byName);
    });
    setSelected(new Set());
    setMergeOpen(false);
    router.refresh();
  };

  const allShownPicked = shown.length > 0 && shown.every((i) => selected.has(i.id));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <SearchField
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setLimit(PAGE);
          }}
          placeholder="Cerca ingrediente"
          aria-label="Cerca ingrediente"
          className="min-w-[12rem] flex-[2]"
        />
        <Segmented<Sort>
          label="Ordina"
          value={sort}
          onChange={setSort}
          className="flex-1"
          options={[
            { value: "az", label: "A-Z", icon: <ArrowDownAZ aria-hidden /> },
            { value: "used", label: "Più usati", icon: <ArrowDownWideNarrow aria-hidden /> },
          ]}
        />
      </div>

      <AdminTable
        head={
          <>
            <Checkbox
              checked={allShownPicked}
              onChange={(on) => setSelected(on ? new Set([...selected, ...shown.map((i) => i.id)]) : new Set())}
              label="Seleziona tutti quelli mostrati"
              hideLabel
            />
            <span className="flex-1">Nome</span>
            <span className="w-20 text-right">Utilizzi</span>
            <span className="w-[3.25rem]">Stats</span>
            <span className="w-[4.25rem]" />
          </>
        }
      >
        {shown.map((item) => {
          const picked = selected.has(item.id);
          return (
            <AdminRow key={item.id} picked={picked}>
              <Checkbox checked={picked} onChange={() => toggleSelect(item.id)} label={`Seleziona ${item.name}`} hideLabel />
              <span className={`min-w-0 flex-1 font-semibold break-words ${item.excludedFromStats ? "text-grigio" : ""}`}>{item.name}</span>
              <button
                type="button"
                disabled={item.usageCount === 0}
                onClick={() => setUsesOf(item)}
                title={item.usageCount ? "Vedi le ricette" : undefined}
                className="tabular w-8 shrink-0 rounded-[0.5rem] py-1 text-right @min-[600px]/t:w-20 font-semibold enabled:text-blu-600 enabled:hover:underline disabled:text-grigio"
              >
                {item.usageCount}
              </button>
              <span className="shrink-0 @min-[600px]/t:w-[3.25rem]">
                <Switch
                  checked={!item.excludedFromStats}
                  onChange={() => void toggleExclude(item)}
                  label={item.excludedFromStats ? `${item.name}: fuori dalle statistiche` : `${item.name}: nelle statistiche`}
                  hideLabel
                />
              </span>
              <div className="flex shrink-0 items-center gap-1 @min-[600px]/t:gap-1.5">
                <IconButton
                  label={`Rinomina ${item.name}`}
                  size="row"
                  onClick={() => {
                    setError("");
                    setRename({ id: item.id, name: item.name });
                  }}
                >
                  <Pencil />
                </IconButton>
                <DeleteRowButton
                  url={`/api/admin/ingredients/${item.id}`}
                  label={`Togli ${item.name} dal catalogo`}
                  title={`Togliere «${item.name}» dal catalogo?`}
                  message="Resta nelle ricette che lo usano: sparisce solo dai suggerimenti e da questa lista."
                  onDeleted={() => {
                    setIngredients((prev) => prev.filter((i) => i.id !== item.id));
                    setSelected((prev) => {
                      const n = new Set(prev);
                      n.delete(item.id);
                      return n;
                    });
                  }}
                />
              </div>
            </AdminRow>
          );
        })}
        {filtered.length === 0 && <AdminEmptyRow>Nessun ingrediente trovato.</AdminEmptyRow>}
      </AdminTable>

      {filtered.length > limit && (
        <Button variant="secondary" className="self-center" onClick={() => setLimit((n) => n + PAGE)}>
          Mostra altri ({filtered.length - limit})
        </Button>
      )}

      {/* 12.3 · barra azioni sulla selezione: resta in fondo allo schermo, sopra la barra in basso */}
      {selected.size > 0 && (
        <div className="sticky bottom-[calc(var(--bottom-space)-0.25rem)] z-30 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-card bg-blu-950 py-2 pr-2 pl-4 text-white shadow-[0_8px_24px_oklch(25%_0.038_228/.3)] min-[700px]:bottom-4">
          <span className="min-w-0 flex-1 truncate font-semibold">
            {selected.size} selezionat{selected.size === 1 ? "o" : "i"}
            {selected.size === 1 && ` · «${selectedItems[0]?.name}»`}
          </span>
          <button type="button" onClick={() => setSelected(new Set())} className="rounded-[0.5rem] px-2 py-1 text-[0.875rem] text-nav-ink hover:text-white">
            Annulla
          </button>
          <Button size="sm" icon={<Merge />} disabled={selected.size < 2} onClick={openMerge} title={selected.size < 2 ? "Seleziona almeno 2 ingredienti" : undefined}>
            Unifica
          </Button>
        </div>
      )}

      {/* Rinomina */}
      <Modal open={!!rename} onClose={() => setRename(null)} title="Rinomina ingrediente" size="sm">
        {rename && (
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              void saveRename();
            }}
          >
            <Field label="Nome" error={error || undefined}>
              {(p) => <TextInput {...p} autoFocus value={rename.name} onChange={(e) => setRename({ ...rename, name: e.target.value })} />}
            </Field>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setRename(null)}>
                Annulla
              </Button>
              <Button type="submit" loading={busy}>
                Salva
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Ricette che usano l'ingrediente */}
      <Modal open={!!usesOf} onClose={() => setUsesOf(null)} title={usesOf ? `«${usesOf.name}» in ${usesOf.usageCount} ricette` : ""} size="sm">
        <ul className="-my-1 divide-y divide-blu-150">
          {usesOf?.recipes.map((r, i) => (
            <li key={`${r.id}-${i}`}>
              <Link href={`/ricette/${r.id}`} className="block py-2.5 font-semibold hover:underline">
                {r.name}
              </Link>
            </li>
          ))}
        </ul>
      </Modal>

      {/* Unifica */}
      <Modal open={mergeOpen} onClose={() => setMergeOpen(false)} title={`Unifica ${selected.size} ingredienti`}>
        <div className="flex flex-col gap-4">
          <ul className="divide-y divide-blu-150 rounded-ctl border border-blu-150 bg-blu-50 px-3">
            {selectedItems.map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-3 py-2">
                <span className="font-semibold">{i.name}</span>
                <span className="tabular shrink-0 text-(length:--fs-meta) text-grigio">{i.usageCount} utilizzi</span>
              </li>
            ))}
          </ul>
          <Field label="Nome da tenere" hint={`Tutte le ricette useranno «${canonical}».`} error={error || undefined}>
            {(p) => (
              <Select {...p} value={canonical} onChange={(e) => setCanonical(e.target.value)}>
                {selectedItems.map((i) => (
                  <option key={i.id} value={i.name}>
                    {i.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setMergeOpen(false)}>
              Annulla
            </Button>
            <Button icon={<Merge />} loading={busy} onClick={() => void handleMerge()}>
              Unifica
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
