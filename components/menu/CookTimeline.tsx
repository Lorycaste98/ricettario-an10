"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useMotionValue } from "motion/react";
import { ZoomIn, ZoomOut, RotateCcw, AlarmClock, X, Timer, ArrowRight } from "lucide-react";
import {
  formatClock,
  formatDayShort,
  snapMinutes,
  type RecipeSchedule,
  type TimelineRecipe,
  type TimelineSegment,
} from "@/lib/cook-timeline";
import { formatMinutes, STEP_KIND_LABEL, type StepKind } from "@/lib/types";
import { PALETTE } from "@/components/ui/ColorPicker";
import { QuickTag } from "@/components/ui/QuickTag";
import { StartTimeEditor } from "@/components/menu/StartTimeEditor";

// Timeline "Gantt" della modalità cucina: una corsia per ricetta, barra
// suddivisa negli step (larghezza ∝ minuti), trascinabile in orizzontale per
// cambiare l'ora di inizio (snap 5 min). Linea verticale = ora di servizio.

const ZOOM_PRESETS = [2, 1, 0.5, 0.25] as const; // px per minuto
const GRID_STEPS = [15, 30, 60, 120, 240, 480, 1440] as const; // minuti
const MIN_LABEL_PX = 64;
const SLIVER_PX = 7; // step senza durata
const MIN_SEG_PX = 14; // larghezza minima cliccabile per step con durata
const MAX_INITIAL_WIDTH = 3200; // tetto di sicurezza quando non si conosce la larghezza reale
const ZOOM_TRANSITION_MS = 300; // deve combaciare con la classe duration-300 sotto

const SEGMENT_COLOR: Record<StepKind, string> = {
  PREP: "bg-sky-400/80",
  COOK: "bg-red-400/85",
  WAIT: "bg-amber-300/85",
};

/**
 * Zoom iniziale: il più grande che fa stare TUTTA la finestra nello schermo.
 * Prima il tetto era fisso (3200px): su telefono significava un canvas 10 volte
 * più largo del viewport, con le ricette fuori campo e in vista solo una fascia
 * di ore lontana da esse (sembrava che gli orari fossero sbagliati).
 * `CookTimeline` è renderizzata solo client-side (gate `hydrated` in CookPlanner),
 * quindi `window` c'è; il guard serve solo per sicurezza.
 */
function fitZoom(spanMins: number): number {
  const available =
    typeof window === "undefined"
      ? MAX_INITIAL_WIDTH
      : Math.max(260, Math.min(window.innerWidth, 1080) - 80);
  for (const z of ZOOM_PRESETS) {
    if (spanMins * z <= available) return z;
  }
  return ZOOM_PRESETS[ZOOM_PRESETS.length - 1];
}

interface Selected {
  recipeId: number;
  recipeName: string;
  segment: TimelineSegment;
}

export function CookTimeline({
  recipes,
  schedules,
  serveAt,
  onStartChange,
  onReset,
}: {
  recipes: TimelineRecipe[];
  schedules: Map<number, RecipeSchedule>;
  serveAt: Date;
  onStartChange: (recipeId: number, start: Date) => void;
  onReset: (recipeId: number) => void;
}) {
  const [selected, setSelected] = useState<Selected | null>(null);

  // Le ricette veloci non hanno step da pianificare: escluse dal Gantt, elencate a parte
  const timelineRecipes = useMemo(() => recipes.filter((r) => !r.quick), [recipes]);
  const quickRecipes = useMemo(() => recipes.filter((r) => r.quick), [recipes]);

  // Colore stabile per ricetta (identifica la corsia a colpo d'occhio)
  const recipeColor = useMemo(() => {
    const map = new Map<number, string>();
    timelineRecipes.forEach((r, i) => map.set(r.id, PALETTE[i % PALETTE.length]));
    return map;
  }, [timelineRecipes]);

  // Finestra temporale: dal primo inizio all'ultima fine (incluso il servizio), con margini
  const { windowStart, spanMins } = useMemo(() => {
    let min = serveAt.getTime();
    let max = serveAt.getTime();
    for (const r of timelineRecipes) {
      const s = schedules.get(r.id);
      if (!s) continue;
      min = Math.min(min, s.start.getTime());
      max = Math.max(max, s.end.getTime());
    }
    const start = new Date(min - 15 * 60_000);
    start.setMinutes(0, 0, 0);
    const end = new Date(max + 30 * 60_000);
    if (end.getMinutes() > 0 || end.getSeconds() > 0) end.setHours(end.getHours() + 1, 0, 0, 0);
    return { windowStart: start, spanMins: Math.max(60, (end.getTime() - start.getTime()) / 60_000) };
  }, [timelineRecipes, schedules, serveAt]);

  const [pxPerMin, setPxPerMin] = useState<number>(() => fitZoom(spanMins));

  const zoomIdx = ZOOM_PRESETS.indexOf(pxPerMin as (typeof ZOOM_PRESETS)[number]);
  const canZoomIn = zoomIdx > 0;
  const canZoomOut = zoomIdx < ZOOM_PRESETS.length - 1;

  // Transizione CSS attiva solo per lo zoom (bottoni), mai durante il drag di una barra:
  // altrimenti lo scatto della barra a fine trascinamento verrebbe "ammorbidito" col risultato
  // di un salto indietro seguito da uno scivolamento innaturale.
  const [zooming, setZooming] = useState(false);
  const zoomTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (zoomTimeoutRef.current) clearTimeout(zoomTimeoutRef.current); }, []);
  const changeZoom = (next: number) => {
    setPxPerMin(next);
    setZooming(true);
    if (zoomTimeoutRef.current) clearTimeout(zoomTimeoutRef.current);
    zoomTimeoutRef.current = setTimeout(() => setZooming(false), ZOOM_TRANSITION_MS);
  };
  const zoomTransitionCls = zooming ? "transition-[left,width] duration-300 ease-out" : "";

  // Scroll orizzontale: all'apertura inquadra il servizio (se il canvas non ci sta
  // tutto) e dopo un cambio orario riporta in vista la barra spostata — altrimenti
  // si finisce a guardare una fascia di ore dove non c'è nessuna ricetta.
  const scrollRef = useRef<HTMLDivElement>(null);
  const barRefs = useRef(new Map<number, HTMLElement>());
  const registerBar = (recipeId: number, el: HTMLElement | null) => {
    if (el) barRefs.current.set(recipeId, el);
    else barRefs.current.delete(recipeId);
  };

  const revealBar = (recipeId: number) => {
    // 80ms: il tempo che React ricommetta la barra nella nuova posizione
    setTimeout(() => {
      const box = scrollRef.current;
      const bar = barRefs.current.get(recipeId);
      if (!box || !bar) return;
      const c = box.getBoundingClientRect();
      const b = bar.getBoundingClientRect();
      if (b.left >= c.left && b.right <= c.right) return; // già in vista
      box.scrollTo({
        left: box.scrollLeft + (b.left - c.left) - c.width / 2 + b.width / 2,
        behavior: "smooth",
      });
    }, 80);
  };

  const handleStartChange = (recipeId: number, start: Date) => {
    onStartChange(recipeId, start);
    revealBar(recipeId);
  };
  const handleReset = (recipeId: number) => {
    onReset(recipeId);
    revealBar(recipeId);
  };

  const widthPx = spanMins * pxPerMin;
  const minsFrom = (d: Date) => (d.getTime() - windowStart.getTime()) / 60_000;
  const servePx = minsFrom(serveAt) * pxPerMin;

  // All'apertura, se il canvas resta più largo dello schermo, inquadra il servizio
  // (la parte di giornata che interessa davvero) invece dell'inizio della finestra.
  useEffect(() => {
    const box = scrollRef.current;
    if (!box || box.scrollWidth <= box.clientWidth) return;
    box.scrollLeft = Math.max(0, servePx - box.clientWidth * 0.75);
    // solo al montaggio: dopo comanda l'utente (scroll, zoom, drag)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Gridline: il passo più piccolo che lascia almeno MIN_LABEL_PX tra le etichette
  const gridStep = GRID_STEPS.find((s) => s * pxPerMin >= MIN_LABEL_PX) ?? GRID_STEPS[GRID_STEPS.length - 1];
  const ticks = useMemo(() => {
    const out: { px: number; date: Date }[] = [];
    for (let m = 0; m <= spanMins; m += gridStep) {
      out.push({ px: m * pxPerMin, date: new Date(windowStart.getTime() + m * 60_000) });
    }
    return out;
  }, [spanMins, gridStep, pxPerMin, windowStart]);

  return (
    // Stesso "vetro chiaro" leggibile delle card ricetta dello stepper
    <section className="rounded-2xl border border-white/60 bg-white/75 backdrop-blur-md p-4 sm:p-5 shadow-sm space-y-3">
      {/* Header: titolo + legenda + zoom */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h2 className="text-sm font-semibold text-sky-950">Timeline</h2>
        <div className="flex items-center gap-3 text-[10px] text-sky-800">
          {(Object.keys(SEGMENT_COLOR) as StepKind[]).map((k) => (
            <span key={k} className="flex items-center gap-1">
              <span className={`h-2 w-2 rounded-sm ${SEGMENT_COLOR[k]}`} />
              {STEP_KIND_LABEL[k]}
            </span>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => canZoomOut && changeZoom(ZOOM_PRESETS[zoomIdx + 1])}
            disabled={!canZoomOut}
            title="Riduci zoom"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/40 bg-white/50 text-sky-700 hover:bg-white/80 active:scale-90 disabled:opacity-30 disabled:active:scale-100 transition-all duration-150"
          >
            <ZoomOut size={13} />
          </button>
          <button
            type="button"
            onClick={() => canZoomIn && changeZoom(ZOOM_PRESETS[zoomIdx - 1])}
            disabled={!canZoomIn}
            title="Aumenta zoom"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/40 bg-white/50 text-sky-700 hover:bg-white/80 active:scale-90 disabled:opacity-30 disabled:active:scale-100 transition-all duration-150"
          >
            <ZoomIn size={13} />
          </button>
        </div>
      </div>

      <p className="text-[11px] text-sky-700">
        Tocca l&apos;orario di una ricetta per impostare l&apos;inizio a mano, oppure trascina la sua barra
        per aggiustarlo (scatti di 5 minuti).
      </p>

      {/* Canvas scrollabile — scrollbar custom: pollice scuro, nessuno sfondo sul binario */}
      <div
        ref={scrollRef}
        className="overflow-x-auto overscroll-x-contain rounded-xl border border-white/30 bg-white/25 pb-2
          [scrollbar-width:thin] [scrollbar-color:#0c4a6e66_transparent]
          [&::-webkit-scrollbar]:h-2.5 [&::-webkit-scrollbar-track]:bg-transparent
          [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-sky-900/40
          [&::-webkit-scrollbar-thumb]:hover:bg-sky-900/55"
      >
        <div className={`relative ${zoomTransitionCls}`} style={{ width: widthPx }}>
          {/* Asse orario */}
          <div className="sticky top-0 h-7 border-b border-sky-900/10">
            {ticks.map((t) => {
              const isMidnight = t.date.getHours() === 0 && t.date.getMinutes() === 0;
              return (
                <span
                  key={t.px}
                  className="absolute top-1 text-[10px] tabular-nums text-sky-700 whitespace-nowrap"
                  style={{ left: t.px + 3 }}
                >
                  {formatClock(t.date)}
                  {isMidnight && <span className="ml-1 font-semibold text-sky-800">{formatDayShort(t.date)}</span>}
                </span>
              );
            })}
          </div>

          {/* Gridlines */}
          {ticks.map((t) => (
            <span
              key={`g${t.px}`}
              className="pointer-events-none absolute bottom-0 top-7 w-px bg-sky-900/10"
              style={{ left: t.px }}
            />
          ))}

          {/* Linea del servizio */}
          <div
            className={`pointer-events-none absolute bottom-0 top-0 z-10 w-0.5 bg-orange-500/80 ${zoomTransitionCls}`}
            style={{ left: servePx }}
          >
            <span className="absolute left-1 top-0.5 flex items-center gap-1 rounded bg-orange-500 px-1.5 py-0.5 text-[10px] font-semibold text-white whitespace-nowrap">
              <AlarmClock size={10} /> Servizio {formatClock(serveAt)}
            </span>
          </div>

          {/* Corsie */}
          <div className="space-y-1 py-2">
            {timelineRecipes.map((recipe) => {
              const schedule = schedules.get(recipe.id);
              if (!schedule) return null;
              return (
                <TimelineLane
                  key={recipe.id}
                  recipe={recipe}
                  schedule={schedule}
                  color={recipeColor.get(recipe.id) ?? PALETTE[0]}
                  serveAt={serveAt}
                  pxPerMin={pxPerMin}
                  startPx={minsFrom(schedule.start) * pxPerMin}
                  windowWidthPx={widthPx}
                  zooming={zooming}
                  registerBar={registerBar}
                  onStartChange={handleStartChange}
                  onReset={handleReset}
                  onSelect={(segment) => setSelected({ recipeId: recipe.id, recipeName: recipe.name, segment })}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Ricette veloci: nessuno step da pianificare, elencate senza corsia */}
      {quickRecipes.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-sky-800">
          <span className="font-medium">Senza tempistica:</span>
          {quickRecipes.map((r) => (
            <QuickTag key={r.id} label={r.name} />
          ))}
        </div>
      )}

      {/* Dettaglio step selezionato (pannello sotto la timeline: mobile-friendly) */}
      {selected && (
        <div className="flex items-start gap-3 rounded-xl border border-sky-200/60 bg-white/60 p-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-sky-600">
              {selected.recipeName} · passo {selected.segment.stepIdx + 1} · {STEP_KIND_LABEL[selected.segment.kind]}
            </p>
            <p className="mt-0.5 text-sm leading-relaxed text-sky-900">{selected.segment.text}</p>
            <p className="mt-1 flex flex-wrap items-center gap-1 text-xs font-medium text-orange-700">
              <AlarmClock size={12} /> Inizia alle {formatClock(selected.segment.startsAt)}
              {selected.segment.mins > 0 && <span className="inline-flex items-center gap-1 text-sky-600 font-normal"> · <Timer size={12} /> {formatMinutes(selected.segment.mins)}</span>}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="shrink-0 rounded p-1 text-sky-400 hover:text-sky-700 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </section>
  );
}

// ─── Corsia singola ───────────────────────────────────────────────────────────

function TimelineLane({
  recipe,
  schedule,
  color,
  serveAt,
  pxPerMin,
  startPx,
  windowWidthPx,
  zooming,
  registerBar,
  onStartChange,
  onReset,
  onSelect,
}: {
  recipe: TimelineRecipe;
  schedule: RecipeSchedule;
  color: string;
  serveAt: Date;
  pxPerMin: number;
  startPx: number;
  windowWidthPx: number;
  /** true per ~300ms dopo un click sui bottoni zoom: attiva la transizione CSS di posizione/larghezza.
   * Mai durante il drag di una barra, altrimenti lo scatto a fine trascinamento verrebbe "ammorbidito"
   * col risultato di un salto indietro seguito da uno scivolamento innaturale. */
  zooming: boolean;
  /** Registra il nodo della barra: serve al genitore per riportarla in vista */
  registerBar: (recipeId: number, el: HTMLElement | null) => void;
  onStartChange: (recipeId: number, start: Date) => void;
  onReset: (recipeId: number) => void;
  onSelect: (segment: TimelineSegment) => void;
}) {
  const x = useMotionValue(0);
  const [dragMins, setDragMins] = useState<number | null>(null);
  const constraintsRef = useRef(null);
  const zoomTransitionCls = zooming ? "transition-[left,width] duration-300 ease-out" : "";

  // Larghezza barra: somma delle larghezze dei segmenti (sliver per gli step senza durata,
  // minimo MIN_SEG_PX per gli step brevi così restano cliccabili anche a zoom basso)
  const segWidths = schedule.segments.map((s) => (s.mins > 0 ? Math.max(s.mins * pxPerMin, MIN_SEG_PX) : SLIVER_PX));
  const barWidth = Math.max(24, schedule.segments.length > 0 ? segWidths.reduce((a, b) => a + b, 0) : schedule.leadMins * pxPerMin);

  const liveStart = dragMins != null ? new Date(schedule.start.getTime() + dragMins * 60_000) : schedule.start;

  return (
    <div className="px-0.5">
      {/* Etichetta: sticky a sinistra così resta visibile durante lo scroll orizzontale */}
      <div className="sticky left-1 z-[5] flex w-max max-w-[85vw] items-center gap-2 pb-0.5">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-white/60" style={{ backgroundColor: color }} />
        <span className="truncate text-xs font-semibold text-sky-950">{recipe.name}</span>
        {dragMins != null ? (
          // Durante il trascinamento l'orario è "live": niente bottone, solo il testo
          <span className="inline-flex items-center gap-1 text-[10px] font-bold tabular-nums text-orange-700">
            {formatClock(liveStart)} <ArrowRight size={10} /> {formatClock(new Date(liveStart.getTime() + schedule.leadMins * 60_000))}
          </span>
        ) : (
          <StartTimeEditor
            recipeName={recipe.name}
            start={schedule.start}
            isCustom={schedule.isCustom}
            leadMins={schedule.leadMins}
            serveAt={serveAt}
            onChange={(start) => onStartChange(recipe.id, start)}
            onReset={() => onReset(recipe.id)}
            variant="lane"
          />
        )}
        {schedule.isCustom && (
          <button
            type="button"
            onClick={() => onReset(recipe.id)}
            title="Torna all'orario automatico"
            className="flex h-5 w-5 items-center justify-center rounded-full border border-white/50 bg-white/60 text-sky-600 hover:text-sky-900 transition-colors"
          >
            <RotateCcw size={10} />
          </button>
        )}
        {schedule.overshoot && dragMins == null && (
          <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700 whitespace-nowrap">
            finisce dopo il servizio
          </span>
        )}
      </div>

      {/* Corsia con barra trascinabile */}
      <div ref={constraintsRef} className={`relative h-8 ${zoomTransitionCls}`} style={{ width: windowWidthPx }}>
        <motion.div
          ref={(el: HTMLDivElement | null) => registerBar(recipe.id, el)}
          drag="x"
          dragConstraints={constraintsRef}
          dragMomentum={false}
          dragElastic={0}
          style={{ x, left: startPx, width: barWidth, touchAction: "none", borderLeft: `4px solid ${color}` }}
          onDrag={(_, info) => setDragMins(snapMinutes(info.offset.x / pxPerMin))}
          onDragEnd={(_, info) => {
            const deltaMins = snapMinutes(info.offset.x / pxPerMin);
            x.jump(0);
            setDragMins(null);
            if (deltaMins !== 0) {
              onStartChange(recipe.id, new Date(schedule.start.getTime() + deltaMins * 60_000));
            }
          }}
          className={`absolute top-0 flex h-8 cursor-grab items-stretch overflow-hidden rounded-lg shadow-sm active:cursor-grabbing ${zoomTransitionCls} ${
            schedule.overshoot ? "ring-2 ring-red-400" : "ring-1 ring-sky-900/10"
          }`}
        >
          {schedule.segments.length > 0 ? (
            schedule.segments.map((seg, i) => {
              // Step breve "gonfiato" al minimo cliccabile: non più in scala, marcato con un retino
              const compressed = seg.mins > 0 && seg.mins * pxPerMin < MIN_SEG_PX;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => onSelect(seg)}
                  title={`${seg.text} — ${formatClock(seg.startsAt)}${compressed ? ` (${formatMinutes(seg.mins)})` : ""}`}
                  style={{
                    width: segWidths[i],
                    ...(compressed
                      ? {
                          backgroundImage:
                            "repeating-linear-gradient(45deg, rgba(255,255,255,0.35) 0, rgba(255,255,255,0.35) 1px, transparent 1px, transparent 6px)",
                        }
                      : {}),
                  }}
                  className={`relative shrink-0 border-r border-white/50 last:border-r-0 ${SEGMENT_COLOR[seg.kind]} hover:brightness-110 ${
                    zooming ? "transition-[filter,width] duration-300 ease-out" : "transition-[filter]"
                  }`}
                >
                  {!compressed && seg.mins * pxPerMin > 44 && (
                    <span className="pointer-events-none absolute inset-0 flex items-center justify-center px-1 text-[9px] font-semibold text-white/95 tabular-nums truncate">
                      {formatClock(seg.startsAt)}
                    </span>
                  )}
                </button>
              );
            })
          ) : (
            <span className="flex-1 bg-sky-400/70" />
          )}
        </motion.div>
      </div>
    </div>
  );
}
