"use client";
import { useMemo, useState } from "react";
import { AlarmClock, ArrowRight, ChevronLeft, ChevronRight, Pencil, RotateCcw } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { formatClock, formatDayShort } from "@/lib/cook-timeline";
import { formatMinutes } from "@/lib/types";

// Editor "a mano" dell'ora di inizio di una ricetta in modalità cucina:
// alternativa al drag della barra sulla timeline (che resta per la messa a punto
// fine). Stesso componente in due vesti — `lane` (etichetta della corsia della
// timeline) e `card` (header della card nello stepper) — così l'orario si cambia
// da dove si sta guardando, anche da telefono.
// Il dialog usa <input type="time"> (tastierino nativo su mobile) più un
// selettore di giorno, indispensabile per le ricette che iniziano il giorno prima.

const pad = (n: number) => String(n).padStart(2, "0");
const toTimeValue = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

export function StartTimeEditor({
  recipeName,
  start,
  isCustom,
  leadMins = 0,
  serveAt,
  onChange,
  onReset,
  variant = "lane",
  className = "",
}: {
  recipeName: string;
  start: Date;
  /** true se l'orario è stato impostato a mano (dialog o drag), false = automatico */
  isCustom: boolean;
  /** Durata totale della ricetta: serve a mostrare la fine prevista */
  leadMins?: number;
  /** Ora di servizio del menù: mostra l'avviso "finisce dopo il servizio" */
  serveAt?: Date;
  onChange: (start: Date) => void;
  onReset: () => void;
  variant?: "lane" | "card";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [time, setTime] = useState(() => toTimeValue(start));
  const [day, setDay] = useState<Date>(() => startOfDay(start));

  const openDialog = () => {
    setTime(toTimeValue(start));
    setDay(startOfDay(start));
    setOpen(true);
  };

  // Bozza corrente (giorno scelto + ora digitata); null se l'ora non è valida
  const draft = useMemo(() => {
    const [h, m] = time.split(":").map(Number);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
    const d = new Date(day);
    d.setHours(h, m, 0, 0);
    return d;
  }, [time, day]);

  const draftEnd = draft ? new Date(draft.getTime() + leadMins * 60_000) : null;
  const overshoot = !!(draftEnd && serveAt && draftEnd.getTime() > serveAt.getTime());
  const end = new Date(start.getTime() + leadMins * 60_000);

  const save = () => {
    if (draft) onChange(draft);
    setOpen(false);
  };

  const reset = () => {
    onReset();
    setOpen(false);
  };

  return (
    <>
      {variant === "lane" ? (
        <button
          type="button"
          onClick={openDialog}
          title="Imposta a mano l'ora di inizio"
          className={`inline-flex items-center gap-1 rounded px-1 text-[10px] tabular-nums text-sky-700 transition-colors hover:bg-white/70 hover:text-sky-900 ${className}`}
        >
          {formatClock(start)} <ArrowRight size={10} /> {formatClock(end)}
          <Pencil size={9} className="opacity-60" />
        </button>
      ) : (
        <button
          type="button"
          onClick={openDialog}
          title="Imposta a mano l'ora di inizio"
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold tabular-nums transition-colors ${
            isCustom
              ? "border-orange-300/70 bg-orange-100/80 text-orange-800 hover:bg-orange-200/70"
              : "border-white/50 bg-white/60 text-sky-800 hover:bg-white/90"
          } ${className}`}
        >
          <AlarmClock size={11} className="shrink-0" /> inizia alle {formatClock(start)}
          <Pencil size={9} className="opacity-60" />
        </button>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Ora di inizio" size="sm">
        <p className="truncate text-sm font-semibold text-sky-950">{recipeName}</p>

        {/* Giorno: le ricette lunghe possono iniziare il giorno prima del servizio */}
        <div className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-white/50 bg-white/60 px-2 py-1.5">
          <button
            type="button"
            onClick={() => setDay((d) => addDays(d, -1))}
            title="Giorno precedente"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sky-700 transition-colors hover:bg-white/80"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="min-w-0 flex-1 truncate text-center text-sm font-medium text-sky-900">
            {day.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}
          </span>
          <button
            type="button"
            onClick={() => setDay((d) => addDays(d, 1))}
            title="Giorno successivo"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sky-700 transition-colors hover:bg-white/80"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Ora: input nativo (tastierino orario su mobile) */}
        <label className="mt-3 block">
          <span className="text-xs font-medium text-sky-700">Inizia alle</span>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/40 bg-white/70 px-3 py-3 text-center text-2xl font-semibold tabular-nums text-sky-950 backdrop-blur-sm transition focus:border-sky-300/60 focus:outline-none focus:ring-2 focus:ring-sky-400/50"
          />
        </label>

        {/* Esito: fine prevista + eventuale sforamento del servizio */}
        {draft && draftEnd && (
          <p className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-sky-700">
            <AlarmClock size={13} className="shrink-0" />
            Finisce alle <strong className="tabular-nums text-sky-900">{formatClock(draftEnd)}</strong>
            {draftEnd.getDate() !== draft.getDate() && (
              <span className="text-sky-600">({formatDayShort(draftEnd)})</span>
            )}
            {leadMins > 0 && <span className="text-sky-600">· {formatMinutes(leadMins)} in tutto</span>}
          </p>
        )}
        {overshoot && serveAt && (
          <p className="mt-2 rounded-lg bg-red-100/80 px-2.5 py-1.5 text-xs font-medium text-red-700">
            Attenzione: finisce dopo il servizio delle {formatClock(serveAt)}.
          </p>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
          {isCustom && (
            <Button variant="ghost" size="sm" onClick={reset} className="mr-auto">
              <span className="inline-flex items-center gap-1.5">
                <RotateCcw size={14} /> Ora automatica
              </span>
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>
            Annulla
          </Button>
          <Button size="sm" onClick={save} disabled={!draft}>
            Salva
          </Button>
        </div>
      </Modal>
    </>
  );
}
