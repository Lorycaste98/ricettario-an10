"use client";

import { useState, useEffect, useRef } from "react";

// ---------------------------------------------------------------------------
// Palette colori predefinita (condivisa: vocabolario + form ricetta)
// ---------------------------------------------------------------------------
export const PALETTE = [
  "#0A7EA4", "#2e7d32", "#ad1457", "#558b2f", "#1565c0",
  "#37474f", "#6a1b9a", "#00695c", "#e64a19", "#0277bd",
  "#e65100", "#24addb", "#068604", "#f57f17", "#c62828",
];

/**
 * Restituisce il primo colore della PALETTE non ancora usato dalle categorie
 * esistenti; se sono tutti usati, ritorna il primo della palette.
 */
export function nextPaletteColor(usedColors: string[]): string {
  const used = new Set(usedColors.map((c) => c.toLowerCase()));
  return PALETTE.find((c) => !used.has(c.toLowerCase())) ?? PALETTE[0];
}

// ---------------------------------------------------------------------------
// 12.5 · scelta colore
// ---------------------------------------------------------------------------
/** Pallini della palette + colore libero, in linea (finestra di modifica categoria) */
export function ColorSwatches({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const custom = !PALETTE.some((c) => c.toLowerCase() === value.toLowerCase());
  return (
    <div role="radiogroup" aria-label="Colore" className="flex flex-wrap gap-2">
      {PALETTE.map((c) => {
        const on = c.toLowerCase() === value.toLowerCase();
        return (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={c}
            onClick={() => onChange(c)}
            className={`size-8 rounded-full transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-blu-600/35 ${on ? "ring-2 ring-blu-950 ring-offset-2" : ""}`}
            style={{ backgroundColor: c }}
          />
        );
      })}
      {/* colore libero: il selettore di sistema */}
      <label
        title="Colore personalizzato"
        className={`relative flex size-8 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-blu-250 text-[0.75rem] font-bold text-grigio ${custom ? "ring-2 ring-blu-950 ring-offset-2" : ""}`}
        style={custom ? { backgroundColor: value, borderStyle: "solid", borderColor: "white" } : undefined}
      >
        {!custom && "+"}
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" aria-label="Colore personalizzato" />
      </label>
    </div>
  );
}

/** Bottone col pallino del colore che apre i pallini in un riquadro (combobox categoria del form) */
export function ColorPicker({
  value,
  onChange,
  compact = false,
}: {
  value: string;
  onChange: (v: string) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center justify-center rounded-[0.625rem] border border-blu-200 bg-white hover:bg-blu-100 ${compact ? "size-8" : "size-(--h-field)"}`}
        title="Scegli colore"
        aria-label="Scegli colore"
      >
        <span className="size-4 rounded-full" style={{ backgroundColor: value }} />
      </button>
      {open && (
        <div className="absolute top-full left-0 z-50 mt-1 w-[15.5rem] rounded-ctl border border-blu-150 bg-white p-3 shadow-[0_10px_30px_oklch(25%_0.038_228/.18)]">
          <ColorSwatches
            value={value}
            onChange={(c) => {
              onChange(c);
              if (PALETTE.includes(c)) setOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
}
