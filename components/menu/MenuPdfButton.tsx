"use client";

import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import {
  urlToDataUrl,
  logoPngDataUrl,
  safeFileName,
  type RecipePdfData,
} from "@/components/recipe/RecipePdfButton";
import type { StepIngredientLink } from "@/lib/step-ingredients";
import type { MenuPdfMeta, MenuPdfRecipe } from "./MenuPdfDocument";

export interface MenuPdfProps {
  menu: MenuPdfMeta & { photo: string | null; recipeIds: number[] };
}

/** Risposta (parziale) di GET /api/recipes/[id] usata per il PDF. */
interface RecipeDetailResponse {
  name: string;
  servings: number | null;
  servingsUnit?: string | null;
  prep: number | null;
  cook: number | null;
  notes: string | null;
  links: string | null;
  photo: string | null;
  categories: { name: string; color: string }[];
  tags: { name: string }[];
  ingredients: { id?: number; name: string; qty: number | null; unit: string | null; description: string | null; optional?: boolean; section?: string | null }[];
  steps: { text: string; mins: number | null; kind?: string; stepIngredients?: StepIngredientLink[] }[];
}

function toPdfData(r: RecipeDetailResponse): RecipePdfData {
  return {
    name: r.name,
    servings: r.servings,
    servingsUnit: r.servingsUnit ?? null,
    prep: r.prep,
    cook: r.cook,
    notes: r.notes,
    links: r.links,
    photo: r.photo,
    categories: r.categories.map((c) => ({ name: c.name, color: c.color })),
    tags: r.tags.map((t) => ({ name: t.name })),
    ingredients: r.ingredients.map((i) => ({
      id: i.id, name: i.name, qty: i.qty, unit: i.unit, description: i.description, optional: i.optional, section: i.section ?? null,
    })),
    steps: r.steps.map((s) => ({ text: s.text, mins: s.mins, kind: s.kind, stepIngredients: s.stepIngredients })),
  };
}

/**
 * Esporta il menù in PDF: bottone tondo con icona (3.10), gemello del PDF del dettaglio ricetta
 * (`RecipePdfButton`), nelle azioni della testata.
 */
export function MenuPdfButton({ menu }: MenuPdfProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const handleExport = async () => {
    if (loading) return;
    setLoading(true);
    setError(false);
    try {
      // Recupera il dettaglio completo di ogni ricetta (ingredienti, step…)
      const details = await Promise.all(
        menu.recipeIds.map(async (id) => {
          const res = await fetch(`/api/recipes/${id}`);
          if (!res.ok) throw new Error(`Ricetta ${id} non trovata`);
          return (await res.json()) as RecipeDetailResponse;
        })
      );

      const [{ pdf }, { MenuPdfDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./MenuPdfDocument"),
      ]);

      const recipes: MenuPdfRecipe[] = await Promise.all(
        details.map(async (d) => {
          const recipe = toPdfData(d);
          const photoData = recipe.photo ? await urlToDataUrl(recipe.photo) : undefined;
          return { recipe, photoData };
        })
      );

      const [coverPhoto, logoData] = await Promise.all([
        menu.photo ? urlToDataUrl(menu.photo) : Promise.resolve(undefined),
        logoPngDataUrl(),
      ]);

      const blob = await pdf(
        <MenuPdfDocument
          menu={{ name: menu.name, description: menu.description, date: menu.date, servingTime: menu.servingTime }}
          recipes={recipes}
          coverPhoto={coverPhoto}
          logoData={logoData}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${safeFileName(menu.name, "menu")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Errore export PDF menù", e);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const label = error ? "Riprova a esportare in PDF" : "Esporta in PDF";
  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={loading || menu.recipeIds.length === 0}
      aria-label={label}
      title={label}
      className="inline-flex size-(--h-icon) shrink-0 items-center justify-center rounded-full border border-blu-200 bg-white text-blu-800 transition-colors hover:bg-blu-100 disabled:opacity-60"
    >
      {loading ? <Loader2 size={20} className="animate-spin motion-reduce:animate-none" /> : <FileDown size={20} />}
    </button>
  );
}
