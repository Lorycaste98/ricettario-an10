"use client";

import { useState } from "react";
import { ChipSearch } from "@/components/ui/ChipSearch";
import { ColorSwatches, nextPaletteColor } from "@/components/ui/ColorPicker";
import type { Category } from "@/lib/types";

/**
 * Elementi 11.6 + 11.7 · categorie della ricetta: chip scelti col pallino del colore + «+ Categoria»
 * che cerca o crea al volo (POST /api/categories) con la scelta del colore (12.5).
 * Rende un frammento: va dentro una fila `flex flex-wrap` (insieme ai tag).
 */
export function CategoryCombobox({
  categories,
  selectedIds,
  onToggle,
  onCreated,
}: {
  categories: Category[];
  selectedIds: number[];
  onToggle: (id: number) => void;
  /** Chiamato dopo la creazione: aggiunge la categoria alla lista e la seleziona. */
  onCreated: (category: Category) => void;
}) {
  const [color, setColor] = useState(() => nextPaletteColor(categories.map((c) => c.color)));

  const create = async (name: string) => {
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color }),
      });
      const json = await res.json();
      if (!res.ok) return (json.error as string) ?? "Errore nella creazione";
      onCreated({ id: json.id, name: json.name, color: json.color });
      setColor(nextPaletteColor([...categories.map((c) => c.color), json.color]));
      return null;
    } catch {
      return "Errore di rete";
    }
  };

  return (
    <ChipSearch
      items={categories.map((c) => ({ id: c.id, name: c.name, dot: c.color }))}
      selectedIds={selectedIds}
      onToggle={onToggle}
      addLabel="Categoria"
      placeholder="Cerca o crea…"
      onCreate={create}
      createExtra={<ColorSwatches value={color} onChange={setColor} />}
    />
  );
}
