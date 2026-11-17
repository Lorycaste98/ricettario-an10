"use client";

import { ChipSearch } from "@/components/ui/ChipSearch";
import type { Tag } from "@/lib/types";

/**
 * Elementi 11.6 + 11.7 · tag della ricetta: chip «#nome» + «+ Tag» che cerca o crea al volo
 * (POST /api/tags). Rende un frammento: va dentro una fila `flex flex-wrap` (con le categorie).
 */
export function TagCombobox({
  tags,
  selectedIds,
  onToggle,
  onCreated,
}: {
  tags: Tag[];
  selectedIds: number[];
  onToggle: (id: number) => void;
  /** Chiamato dopo la creazione: aggiunge il tag alla lista e lo seleziona. */
  onCreated: (tag: Tag) => void;
}) {
  const create = async (name: string) => {
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const json = await res.json();
      if (!res.ok) return (json.error as string) ?? "Errore nella creazione";
      onCreated({ id: json.id, name: json.name });
      return null;
    } catch {
      return "Errore di rete";
    }
  };

  return (
    <ChipSearch
      items={tags}
      selectedIds={selectedIds}
      onToggle={onToggle}
      addLabel="Tag"
      placeholder="Cerca o crea…"
      prefix="#"
      onCreate={create}
    />
  );
}
