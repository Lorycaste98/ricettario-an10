"use client";
import { useMemo, useState } from "react";
import { AlarmClock, ArrowRight, ChevronLeft, ChevronRight, Pencil, RotateCcw } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button, IconButton } from "@/components/ds/Button";
import { Field } from "@/components/ds/Field";
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
          className={`tabular inline-flex items-center gap-1 rounded-md px-1 text-xs text-grigio transition-colors hover:bg-blu-100 hover:text-blu-950 ${className}`}
        >
          {formatClock(start)} <ArrowRight className="size-3" aria-hidden /> {formatClock(end)}
          <Pencil className="size-3" aria-hidden />
        </button>
      ) : (
        // Chip «inizia alle»: giallo = tempo; bordo arancio se l'orario è stato messo a mano
        <button
          type="button"
          onClick={openDialog}
          title="Imposta a mano l'ora di inizio"
          className={`tabular inline-flex h-7 items-center gap-1 rounded-full border bg-giallo-100 px-2.5 text-xs font-bold text-giallo-ink transition-[filter] hover:brightness-95 ${
            isCustom ? "border-arancio" : "border-transparent"
          } ${className}`}
        >
          <AlarmClock className="size-3.5 shrink-0" aria-hidden /> inizia alle {formatClock(start)}
          <Pencil className="size-3 shrink-0" aria-hidden />
        </button>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Ora di inizio" size="sm">
        <div className="flex flex-col gap-3">
          <p className="truncate font-bold">{recipeName}</p>

          {/* Giorno: le ricette lunghe possono iniziare il giorno prima del servizio */}
          <div className="flex items-center justify-between gap-2 rounded-ctl bg-blu-100 p-1">
            <IconButton label="Giorno precedente" onClick={() => setDay((d) => addDays(d, -1))}>
              <ChevronLeft />
            </IconButton>
            <span className="min-w-0 flex-1 truncate text-center font-semibold">
              {day.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}
            </span>
            <IconButton label="Giorno successivo" onClick={() => setDay((d) => addDays(d, 1))}>
              <ChevronRight />
            </IconButton>
          </div>

          {/* Ora: input nativo (tastierino orario su mobile) */}
          <Field label="Inizia alle">
            {(p) => (
              <input
                {...p}
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="tabular h-(--h-btn-lg) w-full rounded-ctl border border-blu-200 bg-white px-3 text-center text-2xl font-bold focus:border-blu-600 focus:ring-[3px] focus:ring-blu-600/18 focus:outline-none"
              />
            )}
          </Field>

          {/* Esito: fine prevista + eventuale sforamento del servizio */}
          {draft && draftEnd && (
            <p className="flex flex-wrap items-center gap-1.5 text-[0.875rem] text-grigio">
              <AlarmClock className="size-4 shrink-0" aria-hidden />
              Finisce alle <b className="tabular text-blu-950">{formatClock(draftEnd)}</b>
              {draftEnd.getDate() !== draft.getDate() && <span>({formatDayShort(draftEnd)})</span>}
              {leadMins > 0 && <span>· {formatMinutes(leadMins)} in tutto</span>}
            </p>
          )}
          {overshoot && serveAt && (
            <p className="rounded-ctl border border-rosa-200 bg-rosa-50 px-3 py-2 text-[0.875rem] font-semibold text-rosa">
              Finisce dopo il servizio delle {formatClock(serveAt)}.
            </p>
          )}

          {/* Su schermo stretto «Ora automatica» scende sotto invece di far traboccare il dialog */}
          <div className="mt-1 flex flex-col-reverse gap-2 min-[480px]:flex-row min-[480px]:items-center min-[480px]:justify-end">
            {isCustom && (
              <Button variant="ghost" icon={<RotateCcw />} onClick={reset} className="min-[480px]:mr-auto">
                Ora automatica
              </Button>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Annulla
              </Button>
              <Button onClick={save} disabled={!draft}>
                Salva
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
