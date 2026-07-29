// Sezioni degli ingredienti (es. "Per l'impasto" / "Per la crema pasticcera").
// La sezione è un campo libero sull'ingrediente (`Ingredient.section`, null = nessuna):
// qui si raggruppano le righe per sezione mantenendo l'ordine di PRIMA APPARIZIONE,
// così l'ordine dei gruppi segue quello scelto nel form anche se le righe della stessa
// sezione non sono contigue (dopo un riordino drag & drop).

export interface SectionedIngredient {
  section?: string | null;
}

export interface IngredientSection<T> {
  /** Nome della sezione; null = ingredienti senza sezione */
  section: string | null;
  items: T[];
}

/** Normalizza il valore grezzo della sezione: stringa vuota/spazi → null. */
export function normalizeSection(raw: string | null | undefined): string | null {
  return raw?.trim() || null;
}

export function groupIngredientsBySection<T extends SectionedIngredient>(items: T[]): IngredientSection<T>[] {
  const groups = new Map<string, IngredientSection<T>>();
  for (const item of items) {
    const section = normalizeSection(item.section);
    const key = section ?? "";
    const group = groups.get(key);
    if (group) group.items.push(item);
    else groups.set(key, { section, items: [item] });
  }
  return [...groups.values()];
}

/** true se c'è almeno una sezione: sotto questa soglia si rende la lista piatta di sempre. */
export function hasSections(items: SectionedIngredient[]): boolean {
  return items.some((i) => normalizeSection(i.section) !== null);
}
