"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calculator, Plus, Trash2, RotateCcw, Check } from "lucide-react";
import { ConfirmModal } from "@/components/ui/Modal";
import { Panel } from "@/components/ds/Panel";
import { Button, IconButton } from "@/components/ds/Button";
import { TextInput } from "@/components/ds/Field";
import { Chip } from "@/components/ds/Controls";
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

/**
 * 13.4 · costi e prezzo del menù (solo admin). Righe etichetta/valore separate da filetti, totale
 * in grassetto, prezzo con ricarico nel riquadro blu-800, sotto «a persona» e «margine» affiancati.
 * Logica invariata (calcoli live, PATCH /api/menus/[id]/costs, «Azzera» con conferma).
 */
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

  /** campo numerico con unità a destra (€, %, h) */
  const numField = (value: string, set: (v: string) => void, label: string, unit: string, cls: string, step = "0.01") => (
    <div className={`relative shrink-0 ${cls}`}>
      <TextInput
        type="number"
        inputMode="decimal"
        min="0"
        step={step}
        value={value}
        onChange={(e) => set(e.target.value)}
        placeholder="0"
        aria-label={label}
        className="tabular pr-[1.9em] text-right"
      />
      <span className="pointer-events-none absolute top-1/2 right-[0.6em] -translate-y-1/2 text-[0.8125rem] text-grigio">{unit}</span>
    </div>
  );
  const row = "flex min-h-11 flex-wrap items-center justify-between gap-x-3 gap-y-1.5 border-b border-blu-150 py-1.5";

  return (
    <Panel icon={<Calculator />} title="Costi e prezzo" meta="Somma i costi del menù e calcola il prezzo di vendita">
      <div className="flex flex-col text-[0.9375rem]">
        <div className={row}>
          <span>
            Ingredienti <span className="text-xs text-grigio">· dalla lista spesa</span>
          </span>
          <b className="tabular">{fmt(ingredientsCost)}</b>
        </div>

        <div className={row}>
          <span>Manodopera</span>
          <span className="flex items-center gap-1.5">
            {numField(hours, setHours, "Ore di lavoro", "h", "w-20", "0.5")}
            <span className="text-grigio">×</span>
            {numField(rate, setRate, "Prezzo orario", "€/h", "w-24", "0.5")}
            <b className="tabular w-22 text-right">{fmt(laborCost)}</b>
          </span>
        </div>

        <div className="flex flex-col gap-2 border-b border-blu-150 py-2">
          <div className="flex items-center justify-between gap-3">
            <span>Altri costi</span>
            <b className="tabular">{fmt(otherCost)}</b>
          </div>
          {lines.map((l) => (
            <div key={l.uid} className="flex items-center gap-1.5">
              <TextInput
                value={l.label}
                onChange={(e) => updateLine(l.uid, { label: e.target.value })}
                placeholder="Voce di costo"
                aria-label="Voce di costo"
                className="flex-1"
              />
              {numField(l.amount, (v) => updateLine(l.uid, { amount: v }), `Importo ${l.label || "voce"}`, "€", "w-26")}
              <IconButton size="row" tone="danger" label="Togli la voce" onClick={() => removeLine(l.uid)}>
                <Trash2 />
              </IconButton>
            </div>
          ))}
          <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none]">
            <Chip icon={<Plus aria-hidden />} onClick={() => addLine()}>
              Voce
            </Chip>
            {QUICK_LABELS.filter((q) => !usedQuick.has(q.toLowerCase())).map((q) => (
              <Chip key={q} onClick={() => addLine(q)}>
                {q}
              </Chip>
            ))}
          </div>
        </div>

        <div className={`${row} font-bold`}>
          <span>Totale costi</span>
          <span className="tabular text-[1.0625rem]">{fmt(totalCost)}</span>
        </div>

        <div className="flex min-h-11 items-center justify-between gap-3 py-1.5">
          <span>Ricarico</span>
          {numField(markup, setMarkup, "Ricarico percentuale", "%", "w-24", "5")}
        </div>
      </div>

      {/* Cosa mostrare: preferenza del dispositivo */}
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Risultati da mostrare">
        {(
          [
            ["markup", "Prezzo"],
            ["perPerson", "A persona"],
            ["margin", "Margine"],
          ] as [OutputKey, string][]
        ).map(([k, label]) => (
          <Chip key={k} active={outputs.includes(k)} onClick={() => toggleOutput(k)}>
            {label}
          </Chip>
        ))}
      </div>

      {outputs.includes("markup") && (
        <div className="flex items-center justify-between gap-3 rounded-ctl bg-blu-800 px-[0.85em] py-[0.7em] text-white">
          <span className="text-[0.875rem] text-nav-ink">Prezzo con ricarico {markupPct ? `${markupPct}%` : ""}</span>
          <b className="tabular text-[1.5rem] leading-none">{fmt(sellingPrice)}</b>
        </div>
      )}
      {(outputs.includes("perPerson") || outputs.includes("margin")) && (
        <div className="grid grid-cols-2 gap-2">
          {outputs.includes("perPerson") && (
            <div className="rounded-ctl bg-blu-100 px-[0.75em] py-[0.55em]">
              <small className="block text-xs text-grigio">A persona{people ? ` · ${people}` : ""}</small>
              {people ? (
                <>
                  <b className="tabular block text-[1.125rem]">{fmt(sellingPrice / people)}</b>
                  <span className="tabular text-xs text-grigio">costo {fmt(totalCost / people)}</span>
                </>
              ) : (
                <span className="text-xs text-grigio">Imposta le persone del menù.</span>
              )}
            </div>
          )}
          {outputs.includes("margin") && (
            <div className="rounded-ctl bg-blu-100 px-[0.75em] py-[0.55em]">
              <small className="block text-xs text-grigio">Margine</small>
              <b className="tabular block text-[1.125rem]">
                {fmt(profit)} · {marginPct.toFixed(0)}%
              </b>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => void save()} loading={busy}>
          Salva i costi
        </Button>
        <Button variant="danger" icon={<RotateCcw />} onClick={() => setConfirmReset(true)} disabled={busy || !hasAnyCost}>
          Azzera
        </Button>
        {savedAt && !busy && (
          <span className="inline-flex items-center gap-1 text-[0.875rem] font-semibold text-verde">
            <Check className="size-4" aria-hidden /> Salvato
          </span>
        )}
      </div>

      <ConfirmModal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={reset}
        title="Azzerare i costi?"
        message="Cancella spesa registrata, manodopera, ricarico e altre voci di questo menù. Non si può annullare."
        confirmLabel="Azzera"
        loading={busy}
      />
    </Panel>
  );
}
