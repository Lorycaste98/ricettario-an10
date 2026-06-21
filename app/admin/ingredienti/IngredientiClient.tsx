"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Merge, Pencil, Check, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useConfirm } from "@/components/ui/ConfirmDialog";

interface IngredientItem {
  id: number;
  name: string;
  excludedFromStats: boolean;
  usageCount: number;
  recipes: { id: number; name: string }[];
}

interface Props {
  initialIngredients: IngredientItem[];
}

export default function IngredientiClient({ initialIngredients }: Props) {
  const router = useRouter();
  const confirm = useConfirm();
  const [ingredients, setIngredients] = useState<IngredientItem[]>(initialIngredients);

  useEffect(() => {
    setIngredients(initialIngredients);
  }, [initialIngredients]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [mergeOpen, setMergeOpen] = useState(false);
  const [canonical, setCanonical] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const filtered = query.trim()
    ? ingredients.filter((i) => i.name.toLowerCase().includes(query.toLowerCase()))
    : ingredients;

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((i) => i.id)));
    }
  };

  // ── Rinomina ────────────────────────────────────────────────────────────────
  const startEdit = (item: IngredientItem) => {
    setEditId(item.id);
    setEditName(item.name);
    setError("");
  };

  const saveEdit = async (id: number) => {
    if (!editName.trim()) { setError("Il nome non può essere vuoto."); return; }
    setBusy(true);
    setError("");
    const res = await fetch(`/api/admin/ingredients/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim() }),
    });
    setBusy(false);
    if (!res.ok) { const d = await res.json(); setError(d.error ?? "Errore"); return; }
    const updated = await res.json() as IngredientItem;
    setIngredients((prev) =>
      prev.map((i) => (i.id === id ? { ...i, name: updated.name } : i))
        .sort((a, b) => a.name.localeCompare(b.name, "it"))
    );
    setEditId(null);
    router.refresh();
  };

  // ── Toggle escluso ─────────────────────────────────────────────────────────
  const toggleExclude = async (item: IngredientItem) => {
    const res = await fetch(`/api/admin/ingredients/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ excludedFromStats: !item.excludedFromStats }),
    });
    if (!res.ok) return;
    const updated = await res.json() as IngredientItem;
    setIngredients((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, excludedFromStats: updated.excludedFromStats } : i))
    );
    router.refresh();
  };

  // ── Elimina dal catalogo ───────────────────────────────────────────────────
  const handleDelete = async (item: IngredientItem) => {
    const ok = await confirm({
      title: `Rimuovere "${item.name}" dal catalogo?`,
      message: "L'ingrediente resterà nelle ricette esistenti.",
      confirmLabel: "Rimuovi",
      variant: "danger",
    });
    if (!ok) return;
    const res = await fetch(`/api/admin/ingredients/${item.id}`, { method: "DELETE" });
    if (!res.ok) return;
    setIngredients((prev) => prev.filter((i) => i.id !== item.id));
    setSelected((prev) => { const n = new Set(prev); n.delete(item.id); return n; });
  };

  // ── Unifica ────────────────────────────────────────────────────────────────
  const openMerge = () => {
    const first = ingredients.find((i) => selected.has(i.id));
    setCanonical(first?.name ?? "");
    setError("");
    setMergeOpen(true);
  };

  const handleMerge = async () => {
    if (!canonical.trim()) { setError("Scegli il nome canonico."); return; }
    setBusy(true);
    setError("");
    const res = await fetch("/api/admin/ingredients/merge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ canonical: canonical.trim(), toMerge: [...selected] }),
    });
    setBusy(false);
    if (!res.ok) { const d = await res.json(); setError(d.error ?? "Errore"); return; }
    // Rimuove le voci unificate, aggiorna/aggiunge il canonico
    const mergedIds = new Set(selected);
    setIngredients((prev) => {
      const existing = prev.find((i) => i.name === canonical.trim() && !mergedIds.has(i.id));
      const mergedCount = prev
        .filter((i) => mergedIds.has(i.id))
        .reduce((sum, i) => sum + i.usageCount, 0);
      const filtered2 = prev.filter((i) => !mergedIds.has(i.id));
      if (existing) {
        return filtered2
          .map((i) => i.id === existing.id ? { ...i, usageCount: mergedCount } : i)
          .sort((a, b) => a.name.localeCompare(b.name, "it"));
      }
      return filtered2.sort((a, b) => a.name.localeCompare(b.name, "it"));
    });
    setSelected(new Set());
    setMergeOpen(false);
    router.refresh();
  };

  const selectedItems = ingredients.filter((i) => selected.has(i.id));

  return (
    <div className={`space-y-4 ${selected.size > 0 ? "pb-20" : ""}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cerca ingrediente…"
            className="w-full rounded-lg border border-gray-200 bg-white pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
          />
        </div>
      </div>

      {/* Tabella */}
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-x-auto">
        <table className="min-w-[600px] w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="w-10 px-3 py-3">
                <input
                  type="checkbox"
                  checked={selected.size === filtered.length && filtered.length > 0}
                  onChange={toggleAll}
                  className="rounded"
                />
              </th>
              <th className="px-3 py-3 text-left font-medium text-gray-600">Nome</th>
              <th className="px-3 py-3 text-center font-medium text-gray-600 w-36">Utilizzi</th>
              <th className="px-3 py-3 text-center font-medium text-gray-600 w-28">Nelle stats</th>
              <th className="px-3 py-3 w-24" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((item) =>
              editId === item.id ? (
                <tr key={item.id} className="bg-orange-50/30">
                  <td className="px-3 py-2" />
                  <td className="px-3 py-2" colSpan={2}>
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void saveEdit(item.id);
                        if (e.key === "Escape") setEditId(null);
                      }}
                      autoFocus
                      className="w-full rounded-lg border border-orange-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    />
                    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
                  </td>
                  <td className="px-3 py-2 text-center" colSpan={2}>
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => void saveEdit(item.id)}
                        disabled={busy}
                        className="rounded-lg bg-green-500 px-2.5 py-1.5 text-xs text-white hover:bg-green-600 disabled:opacity-50 transition-colors"
                      >
                        <Check size={12} />
                      </button>
                      <button
                        onClick={() => setEditId(null)}
                        className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-500 hover:bg-gray-50 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={item.id} className="hover:bg-gray-50 group">
                  <td className="px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={selected.has(item.id)}
                      onChange={() => toggleSelect(item.id)}
                      className="rounded"
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={item.excludedFromStats ? "text-gray-400 line-through" : "text-gray-800"}>
                      {item.name}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {item.usageCount === 0 ? (
                      <span className="text-gray-400">0</span>
                    ) : (
                      <select
                        value=""
                        onChange={(e) => router.push(`/ricette/${e.target.value}`)}
                        className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-sky-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-sky-300 w-full max-w-[120px]"
                      >
                        <option value="" disabled>
                          {item.usageCount} ricett{item.usageCount === 1 ? "a" : "e"}
                        </option>
                        {item.recipes.map((r) => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <button
                      role="switch"
                      aria-checked={!item.excludedFromStats}
                      onClick={() => void toggleExclude(item)}
                      title={item.excludedFromStats ? "Includi nelle statistiche" : "Escludi dalle statistiche"}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-1 ${
                        item.excludedFromStats ? "bg-gray-200" : "bg-green-500"
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-md transition-transform duration-200 ${
                        item.excludedFromStats ? "translate-x-0" : "translate-x-4"
                      }`} />
                    </button>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center justify-end gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                      <button
                        onClick={() => startEdit(item)}
                        className="rounded p-1 text-gray-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                        title="Rinomina"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => void handleDelete(item)}
                        className="rounded p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Rimuovi dal catalogo"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            )}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="py-10 text-center text-sm text-gray-400">
                  Nessun ingrediente trovato.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Sticky bottom bar — selezione attiva */}
      {selected.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-between gap-3 border-t border-gray-200 bg-white/95 backdrop-blur-sm px-4 py-3 shadow-lg sm:px-6">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-700">
              {selected.size} selezionat{selected.size === 1 ? "o" : "i"}
            </span>
            <button
              onClick={() => setSelected(new Set())}
              className="text-xs text-gray-400 hover:text-gray-700 underline underline-offset-2 transition-colors"
            >
              Deseleziona tutti
            </button>
          </div>
          {selected.size >= 2 ? (
            <Button size="sm" onClick={openMerge} className="flex items-center gap-1.5">
              <Merge size={14} />
              Unifica ({selected.size})
            </Button>
          ) : (
            <span className="text-xs text-gray-400">Seleziona almeno 2 per unificare</span>
          )}
        </div>
      )}

      {/* Modal unifica */}
      {mergeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <h2 className="text-base font-semibold text-gray-900">
              Unifica {selected.size} ingredienti
            </h2>

            <div className="rounded-lg bg-gray-50 p-3 space-y-1">
              <p className="text-xs font-medium text-gray-500 mb-2">Ingredienti da unificare:</p>
              {selectedItems.map((i) => (
                <div key={i.id} className="flex items-center justify-between text-sm text-gray-700">
                  <span>{i.name}</span>
                  <span className="text-xs text-gray-400">{i.usageCount} utilizzi</span>
                </div>
              ))}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">Nome canonico (risultato finale)</label>
              <select
                value={canonical}
                onChange={(e) => setCanonical(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              >
                {selectedItems.map((i) => (
                  <option key={i.id} value={i.name}>{i.name}</option>
                ))}
              </select>
              <p className="text-xs text-gray-400">
                Tutti gli ingredienti selezionati verranno rinominati in "{canonical}" in tutte le ricette.
              </p>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setMergeOpen(false)}>
                Annulla
              </Button>
              <Button size="sm" loading={busy} onClick={() => void handleMerge()}>
                Conferma unificazione
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
