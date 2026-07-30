"use client";
import { Reorder, useDragControls } from "motion/react";
import { GripVertical } from "lucide-react";

// Lista riordinabile via drag & drop (motion Reorder) con maniglia dedicata.
// Il drag parte SOLO dalla maniglia (dragListener={false}): gli input dentro
// le righe restano usabili e lo scroll touch della pagina non viene sequestrato.

export function ReorderList<T>({
  values,
  onReorder,
  as = "div",
  className,
  layoutScroll,
  children,
}: {
  values: T[];
  onReorder: (next: T[]) => void;
  as?: "div" | "ul";
  className?: string;
  /** Da attivare se il contenitore della lista è scrollabile (overflow-y-auto) */
  layoutScroll?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Reorder.Group
      axis="y"
      as={as}
      values={values}
      onReorder={onReorder}
      layoutScroll={layoutScroll}
      className={className}
    >
      {children}
    </Reorder.Group>
  );
}

export function ReorderRow<T>({
  value,
  as = "div",
  className,
  onDragEnd,
  children,
}: {
  value: T;
  as?: "div" | "li";
  className?: string;
  /** Chiamata al rilascio del drag (es. per persistere il nuovo ordine) */
  onDragEnd?: () => void;
  /** Render prop: riceve la maniglia di drag già pronta da piazzare nel layout */
  children: (handle: React.ReactNode) => React.ReactNode;
}) {
  const controls = useDragControls();

  const handle = (
    <button
      type="button"
      aria-label="Trascina per riordinare"
      onPointerDown={(e) => {
        e.preventDefault();
        controls.start(e);
      }}
      // Contrasto: lo sfondo dell'app è un gradiente, quindi le icone "tenui"
      // (sky-300, gray-300) sparivano su alcune porzioni. Pastiglia chiara fissa
      // + icona sky-600, come i bottoni riga del form menù.
      className="flex h-6 w-6 shrink-0 cursor-grab items-center justify-center rounded-lg border border-white/60 bg-white/70 text-sky-600 shadow-sm transition-colors hover:bg-white hover:text-sky-900 active:cursor-grabbing touch-none"
    >
      <GripVertical size={14} />
    </button>
  );

  return (
    <Reorder.Item
      as={as}
      value={value}
      dragListener={false}
      dragControls={controls}
      layout
      onDragEnd={onDragEnd}
      // zIndex alto: le Section con backdrop-blur creano stacking context propri
      whileDrag={{ scale: 1.02, zIndex: 30, boxShadow: "0 8px 24px rgba(0,0,0,.12)" }}
      className={className}
    >
      {children(handle)}
    </Reorder.Item>
  );
}
