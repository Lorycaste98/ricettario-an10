"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calculator, Plus, Trash2, ShoppingCart, Clock, Tag, Percent, Users, TrendingUp, RotateCcw } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/Modal";
import { useLocalStore } from "@/lib/local-store";
import type { MenuCostLine } from "@/lib/types";

// Etichette suggerite per le voci "altri costi" (chip quick-add)
const QUICK_LABELS = ["Gas/energia", "Trasporto", "Confezionamento", "Attrezzatura", "Bevande"];

// Output selezionabili inline (preferenza in localStorage, condivisa tra i menù)
type OutputKey = "markup" | "perPerson" | "margin";
const OUTPUT_KEY = "ricettario:menu-costs-outputs";
const DEFAULT_OUTPUTS: OutputKey[] = ["markup", "perPerson", "margin"];

function parseOutputs(raw: string): OutputKey[] {
  try {
    const p: unknown = JSON.parse(raw);
    if (!Array.isArray(p)) return DEFAULT_OUTPUTS;
    return p.filter((x): x is OutputKey => x === "markup" || x === "perPerson" || x === "margin");
  } catch {
    return DEFAULT_OUTPUTS;
  }
}

const eur = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });
function fmt(n: number): string {
  return eur.format(Number.isFinite(n) ? n : 0);
}

// Converte l'input testuale (con virgola o punto) in numero, 0 se vuoto/non valido
function num(v: string): number {
  const n = Number(v.replace(",", ".").trim());
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

interface Line {
  uid: string;
  label: string;
  amount: string;
}

export function MenuCosts({
  menuId,
  people,
  groceryCost,
  laborHours,
  laborRate,
  markupPercent,
  costs,
}: {
  menuId: number;
  people: number | null;
  groceryCost: number | null;
  laborHours: number | null;
  laborRate: number | null;
  markupPercent: number | null;
  costs: MenuCostLine[];
}) {
  const router = useRouter();
  const [hours, setHours] = useState(laborHours != null ? String(laborHours) : "");
  const [rate, setRate] = useState(laborRate != null ? String(laborRate) : "");
  const [markup, setMarkup] = useState(markupPercent != null ? String(markupPercent) : "");
  const [lines, setLines] = useState<Line[]>(
    costs.map((c) => ({ uid: crypto.randomUUID(), label: c.label, amount: String(c.amount) }))
  );
  const [busy, setBusy] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const [outputs, setOutputs] = useLocalStore<OutputKey[]>(OUTPUT_KEY, DEFAULT_OUTPUTS, parseOutputs);

  const toggleOutput = (k: OutputKey) => {
    setOutputs(outputs.includes(k) ? outputs.filter((o) => o !== k) : [...outputs, k]);
  };

  // Calcoli live
  const ingredientsCost = groceryCost ?? 0;
  const laborCost = num(hours) * num(rate);
  const otherCost = lines.reduce((s, l) => s + num(l.amount), 0);
  const totalCost = ingredientsCost + laborCost + otherCost;
  const markupPct = num(markup);
  const sellingPrice = totalCost * (1 + markupPct / 100);
  const profit = sellingPrice - totalCost;
  const marginPct = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;

  const addLine = (label = "") =>
    setLines((p) => [...p, { uid: crypto.randomUUID(), label, amount: "" }]);
  const removeLine = (uid: string) => setLines((p) => p.filter((l) => l.uid !== uid));
  const updateLine = (uid: string, patch: Partial<Line>) =>
    setLines((p) => p.map((l) => (l.uid === uid ? { ...l, ...patch } : l)));

  const usedQuick = new Set(lines.map((l) => l.label.trim().toLowerCase()));

  const save = async () => {
    setBusy(true);
    const res = await fetch(`/api/menus/${menuId}/costs`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        laborHours: hours.trim() ? num(hours) : null,
        laborRate: rate.trim() ? num(rate) : null,
        markupPercent: markup.trim() ? num(markup) : null,
        lines: lines
          .filter((l) => l.label.trim())
          .map((l) => ({ label: l.label.trim(), amount: num(l.amount) })),
      }),
    });
    setBusy(false);
    if (res.ok) {
      setSavedAt(Date.now());
      router.refresh();
    }
  };

  // Azzera tutti i costi del menù (spesa alimentari inclusa) in caso di errore
  const reset = async () => {
    setBusy(true);
    const res = await fetch(`/api/menus/${menuId}/costs`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        laborHours: null,
        laborRate: null,
        markupPercent: null,
        groceryCost: null,
        lines: [],
      }),
    });
    setBusy(false);
    setConfirmReset(false);
    if (res.ok) {
      setHours("");
      setRate("");
      setMarkup("");
      setLines([]);
      setSavedAt(null);
      router.refresh();
    }
  };

  const hasAnyCost =
    ingredientsCost > 0 || hours.trim() !== "" || rate.trim() !== "" || markup.trim() !== "" || lines.length > 0;

  const rowCls = "flex items-center justify-between gap-3 rounded-xl border border-white/40 bg-white/40 px-4 py-3";
  const inputCls =
    "w-full rounded-lg border border-white/40 bg-white/60 px-2.5 py-1.5 text-sm text-sky-950 tabular-nums placeholder:text-sky-700/40 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-300/30";

  return (
    // Sfondo "carta" come la lista della spesa: il gradiente di pagina è fisso, su
    // una card molto trasparente i numeri scuri sparivano nella fascia bassa del
    // viewport (vedi MenuShoppingList).
    <section className="rounded-2xl border border-white/60 bg-white/75 backdrop-blur-md p-5 sm:p-6 shadow-sm">
      <SectionHeader
        title="Costi e prezzo"
        icon={<Calculator size={20} />}
        tone="violet"
        size="lg"
        titleClassName="text-sky-950"
        hint="Somma i costi del menù e calcola il prezzo di vendita"
        className="mb-4"
      />

      <div className="space-y-2.5">
        {/* Ingredienti — dalla lista spesa (sola lettura qui) */}
        <div className={rowCls}>
          <span className="flex items-center gap-2 text-sm font-medium text-sky-900">
            <ShoppingCart size={15} className="text-emerald-600" /> Ingredienti
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-sky-950 tabular-nums">{fmt(ingredientsCost)}</span>
          </div>
        </div>
        <p className="-mt-1 px-1 text-[11px] text-sky-700">
          Dal “totale speso” nella lista della spesa qui sopra.
        </p>

        {/* Manodopera — ore × €/h */}
        <div className={rowCls}>
          <span className="flex items-center gap-2 text-sm font-medium text-sky-900">
            <Clock size={15} className="text-sky-600" /> Manodopera
          </span>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.5"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="h"
              className={`${inputCls} w-16 text-right`}
              aria-label="Ore di lavoro"
            />
            <span className="text-xs text-sky-600">×</span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.5"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              placeholder="€/h"
              className={`${inputCls} w-20 text-right`}
              aria-label="Prezzo orario"
            />
            <span className="ml-1 w-20 text-right text-sm font-semibold text-sky-950 tabular-nums">{fmt(laborCost)}</span>
          </div>
        </div>

        {/* Altri costi — voci generiche */}
        <div className="rounded-xl border border-white/40 bg-white/40 px-4 py-3">
          <span className="flex items-center gap-2 text-sm font-medium text-sky-900">
            <Tag size={15} className="text-orange-600" /> Altri costi
          </span>
          {lines.length > 0 && (
            <div className="mt-2.5 space-y-2">
              {lines.map((l) => (
                <div key={l.uid} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={l.label}
                    onChange={(e) => updateLine(l.uid, { label: e.target.value })}
                    placeholder="Voce di costo"
                    className={`${inputCls} flex-1`}
                  />
                  <div className="relative w-24 shrink-0">
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      value={l.amount}
                      onChange={(e) => updateLine(l.uid, { amount: e.target.value })}
                      placeholder="0,00"
                      className={`${inputCls} pr-6 text-right`}
                      aria-label={`Importo ${l.label || "voce"}`}
                    />
                    <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-sky-500">€</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLine(l.uid)}
                    className="shrink-0 rounded-lg p-1.5 text-rose-500 transition-colors hover:bg-rose-50"
                    aria-label="Rimuovi voce"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => addLine()}
              className="inline-flex items-center gap-1 rounded-lg border border-orange-300/60 bg-white/60 px-2.5 py-1 text-xs font-medium text-orange-700 transition-colors hover:bg-white/90"
            >
              <Plus size={13} /> Aggiungi voce
            </button>
            {QUICK_LABELS.filter((q) => !usedQuick.has(q.toLowerCase())).map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => addLine(q)}
                className="rounded-full border border-white/50 bg-white/40 px-2.5 py-1 text-xs text-sky-700 transition-colors hover:bg-white/70"
              >
                + {q}
              </button>
            ))}
          </div>
        </div>

        {/* Totale costi */}
        <div className="flex items-center justify-between gap-3 rounded-xl border border-sky-300/50 bg-sky-500/10 px-4 py-3">
          <span className="text-sm font-semibold text-sky-900">Totale costi</span>
          <span className="text-lg font-extrabold text-sky-950 tabular-nums">{fmt(totalCost)}</span>
        </div>
      </div>

      {/* Ricarico + risultati */}
      <div className="mt-4 space-y-3 rounded-xl border border-violet-300/40 bg-gradient-to-br from-violet-50/60 to-indigo-50/40 p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-sm font-medium text-sky-900">
            <Percent size={15} className="text-violet-600" /> Ricarico
          </span>
          <div className="relative w-24">
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="5"
              value={markup}
              onChange={(e) => setMarkup(e.target.value)}
              placeholder="0"
              className={`${inputCls} pr-6 text-right`}
              aria-label="Ricarico percentuale"
            />
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-sky-500">%</span>
          </div>
        </div>

        {/* Selezione inline di cosa mostrare */}
        <div className="flex flex-wrap gap-1.5">
          {([
            ["markup", "Prezzo con ricarico"],
            ["perPerson", "A persona"],
            ["margin", "Margine"],
          ] as [OutputKey, string][]).map(([k, label]) => {
            const on = outputs.includes(k);
            return (
              <button
                key={k}
                type="button"
                onClick={() => toggleOutput(k)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  on
                    ? "bg-violet-500 text-white shadow-sm"
                    : "border border-violet-300/50 bg-white/50 text-violet-700 hover:bg-white/80"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="space-y-2.5">
          {/* Prezzo di vendita: risultato principale, in risalto */}
          {outputs.includes("markup") && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-violet-400/50 bg-gradient-to-br from-violet-500/15 to-indigo-500/10 px-4 py-3.5">
              <span className="flex items-center gap-2 text-sm font-semibold text-sky-900">
                <Tag size={16} className="text-violet-600" /> Prezzo di vendita
              </span>
              <span className="text-2xl font-extrabold text-violet-700 tabular-nums">{fmt(sellingPrice)}</span>
            </div>
          )}

          {/* A persona + Margine: due card gemelle affiancate */}
          {(outputs.includes("perPerson") || outputs.includes("margin")) && (
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {outputs.includes("perPerson") && (
                <div className="flex flex-col justify-between rounded-xl border border-violet-300/40 bg-white/60 px-4 py-3">
                  <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-sky-800">
                    <Users size={13} className="text-violet-600" /> A persona{people ? ` · ${people}` : ""}
                  </span>
                  {people ? (
                    <>
                      <span className="mt-1.5 text-xl font-extrabold text-violet-700 tabular-nums">
                        {fmt(sellingPrice / people)}
                      </span>
                      <span className="text-[11px] text-sky-600">costo {fmt(totalCost / people)}</span>
                    </>
                  ) : (
                    <span className="mt-1.5 text-xs text-sky-700">Imposta le persone del menù.</span>
                  )}
                </div>
              )}
              {outputs.includes("margin") && (
                <div className="flex flex-col justify-between rounded-xl border border-violet-300/40 bg-white/60 px-4 py-3">
                  <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-sky-800">
                    <TrendingUp size={13} className="text-emerald-600" /> Margine
                  </span>
                  <span className="mt-1.5 text-xl font-extrabold text-emerald-700 tabular-nums">
                    {marginPct.toFixed(1)}%
                  </span>
                  <span className="text-[11px] text-sky-600">guadagno {fmt(profit)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button onClick={save} loading={busy}>
          Salva costi
        </Button>
        <button
          type="button"
          onClick={() => setConfirmReset(true)}
          disabled={busy || !hasAnyCost}
          className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white/60 px-3 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-50"
        >
          <RotateCcw size={15} /> Azzera
        </button>
        {savedAt && !busy && <span className="text-xs text-emerald-600">Salvato ✓</span>}
      </div>

      <ConfirmModal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={reset}
        title="Azzera i costi"
        message="Vuoi azzerare tutti i costi di questo menù (spesa alimentari, manodopera, ricarico e altre voci)? L'operazione non è reversibile."
        loading={busy}
      />
    </section>
  );
}
