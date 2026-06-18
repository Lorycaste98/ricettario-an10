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
// Color Picker
// ---------------------------------------------------------------------------
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
        className={`rounded-lg border border-gray-200 ${compact ? "h-8 w-8" : "h-9 w-9"} flex items-center justify-center`}
        title="Scegli colore"
      >
        <span className="h-4 w-4 rounded-full" style={{ backgroundColor: value }} />
      </button>
      {open && (
        <div className="absolute top-full left-0 z-50 mt-1 rounded-xl border border-gray-100 bg-white p-2 shadow-lg">
          <div className="grid grid-cols-5 gap-1.5 mb-2">
            {PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => { onChange(c); setOpen(false); }}
                className="h-6 w-6 rounded-full border-2 transition-transform hover:scale-110"
                style={{ backgroundColor: c, borderColor: value === c ? "#000" : "transparent" }}
              />
            ))}
          </div>
          {/* Input colore libero */}
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-7 rounded cursor-pointer"
            title="Colore personalizzato"
          />
        </div>
      )}
    </div>
  );
}
