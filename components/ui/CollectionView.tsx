"use client";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { clsx } from "clsx";
import { LayoutGrid, List, Minus, Plus } from "lucide-react";
import { LIST_LAYOUT, MAX_COLS, useListView, type ListKind, type ViewMode } from "@/lib/preferences";
import { Segmented } from "@/components/ds/Controls";

/**
 * Vista delle liste (Ricette, Preferiti, Menù): **griglia** o **lista**, e in griglia quante
 * card per riga. Le scelte sono del dispositivo (`useListView` di `lib/preferences.ts`): la barra
 * della lista mostra solo l'interruttore griglia/lista (`controls`), le card per riga si scelgono
 * nella pagina Impostazioni (`colsControl`, con l'anteprima).
 *
 * Il numero di card per riga dipende dallo spazio vero del contenitore (misurato): il massimo è
 * quante card larghe almeno `minCardRem` ci stanno (telefono ~3 ricette, iPad in orizzontale e PC
 * di più), mai oltre `MAX_COLS`. «Auto» (0) = la griglia elastica di sempre, card larghe circa
 * `autoCard` (clamp in rem e % del contenitore, come il vecchio `minmax(clamp(...))`).
 */
export type { ViewMode };

function remPx() {
  return typeof window === "undefined" ? 16 : parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
}

/** quante colonne larghe almeno `min` px stanno in `width` con lo spazio `gap` fra l'una e l'altra */
function fit(width: number, min: number, gap: number) {
  return Math.max(1, Math.floor((width + gap) / (min + gap)));
}

export function useCollectionView(list: ListKind) {
  const { minCardRem, autoCard } = LIST_LAYOUT[list];
  const { view, setView, cols, setCols } = useListView(list);

  // Larghezza e spazio fra le card misurati sul contenitore della griglia. Ref a callback: il
  // contenitore può comparire dopo (preferiti in caricamento) o cambiare (griglia ↔ lista)
  const [el, ref] = useState<HTMLDivElement | null>(null);
  const [box, setBox] = useState<{ width: number; gap: number } | null>(null);
  useEffect(() => {
    if (!el) return;
    const measure = () => {
      const gap = parseFloat(getComputedStyle(el).columnGap) || 12;
      setBox({ width: el.clientWidth, gap });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [el]);

  const rem = remPx();
  const maxCols = box ? Math.min(MAX_COLS, fit(box.width, minCardRem * rem, box.gap)) : MAX_COLS;
  const autoCols = box
    ? fit(box.width, Math.min(autoCard[2] * rem, Math.max(autoCard[0] * rem, box.width * autoCard[1])), box.gap)
    : 0;
  // scelta a mano oltre il massimo di questo schermo (es. 5 scelto sul PC, poi il telefono): si stringe
  const activeCols = cols > 0 ? Math.min(cols, maxCols) : autoCols;

  // Prima della misura (server, primo frame) la griglia resta quella elastica di sempre
  const gridStyle: CSSProperties | undefined =
    box && activeCols > 0 ? { gridTemplateColumns: `repeat(${activeCols}, minmax(0, 1fr))` } : undefined;

  const step = (d: 1 | -1) => {
    const base = activeCols || autoCols || 1;
    setCols(Math.max(1, Math.min(maxCols, base + d)));
  };

  const controls = <ViewSwitch view={view} onView={setView} />;
  const colsControl = (
    <ColsStepper
      cols={activeCols}
      isAuto={cols === 0}
      canLess={activeCols > 1}
      canMore={activeCols < maxCols}
      onLess={() => step(-1)}
      onMore={() => step(1)}
      onAuto={() => setCols(0)}
    />
  );

  return { view, setView, ref, gridStyle, controls, colsControl, cols: activeCols, maxCols, isAuto: cols === 0 };
}

/** Interruttore griglia/lista (4.10 a icone), nella barra delle liste e nelle Impostazioni. */
export function ViewSwitch({ view, onView }: { view: ViewMode; onView: (v: ViewMode) => void }) {
  return (
    <Segmented<ViewMode>
      label="Vista"
      value={view}
      onChange={onView}
      options={[
        { value: "grid", label: <span className="sr-only">Griglia</span>, icon: <LayoutGrid aria-hidden /> },
        { value: "list", label: <span className="sr-only">Lista</span>, icon: <List aria-hidden /> },
      ]}
      className="shrink-0 [&_button]:px-[0.6em]"
    />
  );
}

/** «− N per riga +»; tocco sul numero = torna automatico. */
function ColsStepper({
  cols,
  isAuto,
  canLess,
  canMore,
  onLess,
  onMore,
  onAuto,
}: {
  cols: number;
  isAuto: boolean;
  canLess: boolean;
  canMore: boolean;
  onLess: () => void;
  onMore: () => void;
  onAuto: () => void;
}) {
  const stepBtn =
    "hit-44 flex size-[calc(var(--h-field)-6px)] items-center justify-center rounded-[0.5rem] text-blu-800 hover:bg-white/60 disabled:opacity-35 disabled:hover:bg-transparent [&>svg]:size-4";
  return (
    <div className="flex shrink-0 items-center rounded-[0.6875rem] bg-blu-120 p-[3px]" role="group" aria-label="Card per riga">
      <button type="button" className={stepBtn} onClick={onLess} disabled={!canLess} aria-label="Meno card per riga">
        <Minus />
      </button>
      <button
        type="button"
        onClick={onAuto}
        disabled={isAuto}
        title={isAuto ? "Automatico" : "Torna automatico"}
        className="tabular min-w-[2.25rem] px-1 text-center text-[0.875rem] font-bold text-blu-950 disabled:cursor-default"
        aria-label={isAuto ? `${cols} per riga, automatico` : `${cols} per riga: tocca per tornare automatico`}
      >
        {cols || "–"}
        {isAuto && <span className="ml-0.5 text-[0.6875rem] font-semibold text-grigio">A</span>}
      </button>
      <button type="button" className={stepBtn} onClick={onMore} disabled={!canMore} aria-label="Più card per riga">
        <Plus />
      </button>
    </div>
  );
}

/**
 * Contenitore delle card: griglia (colonne decise da `useCollectionView`) o lista a righe.
 * `list="stack"` = righe a sé sul fondo pagina, separate dallo spazio (ricette, «Carta» 8.10);
 * `list="sheet"` = righe in una scheda bianca con i filetti (menù, finché non hanno la loro gemella).
 */
export function CollectionBody({
  view,
  gridRef,
  gridStyle,
  fallbackCols,
  list = "sheet",
  children,
}: {
  view: ViewMode;
  gridRef: (el: HTMLDivElement | null) => void;
  gridStyle?: CSSProperties;
  /** classe grid-cols elastica usata prima della misura */
  fallbackCols: string;
  list?: "sheet" | "stack";
  children: ReactNode;
}) {
  if (view === "list" && list === "stack") {
    return (
      <div ref={gridRef} className="flex flex-col gap-1.5">
        {children}
      </div>
    );
  }
  if (view === "list") {
    return (
      <div ref={gridRef} className="flex flex-col divide-y divide-blu-150 overflow-hidden rounded-card border border-blu-150 bg-white">
        {children}
      </div>
    );
  }
  return (
    <div ref={gridRef} className={clsx("grid gap-(--gap)", !gridStyle && fallbackCols)} style={gridStyle}>
      {children}
    </div>
  );
}

/**
 * Elementi per pagina **multipli delle card per riga**, così ogni pagina finisce con righe piene
 * (tranne l'ultima): righe intere più vicine a `base` (es. 20 ricette → 3 per riga = 21, 6 = 24).
 * Con una card per riga e nella vista a lista non c'è nulla da riempire: valgono i tetti fissi
 * `single` e `list`. Prima della misura (`cols` 0) vale `base`.
 */
export function pageSizeFor(view: ViewMode, cols: number, { base, single, list }: { base: number; single: number; list: number }) {
  if (view === "list") return list;
  if (cols <= 0) return base;
  if (cols === 1) return single;
  return cols * Math.max(1, Math.round(base / cols));
}
