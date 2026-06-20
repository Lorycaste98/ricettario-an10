"use client";

import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import {
  urlToDataUrl,
  safeFileName,
  type RecipePdfData,
} from "@/components/recipe/RecipePdfButton";
import type { MenuPdfMeta, MenuPdfRecipe } from "./MenuPdfDocument";

export interface MenuPdfProps {
  menu: MenuPdfMeta & { photo: string | null; recipeIds: number[] };
}

/** Risposta (parziale) di GET /api/recipes/[id] usata per il PDF. */
interface RecipeDetailResponse {
  name: string;
  servings: number | null;
  prep: number | null;
  cook: number | null;
  notes: string | null;
  links: string | null;
  photo: string | null;
  categories: { name: string; color: string }[];
  tags: { name: string }[];
  ingredients: { name: string; qty: number | null; unit: string | null; description: string | null }[];
  steps: { text: string; mins: number | null; kind?: string }[];
}

function toPdfData(r: RecipeDetailResponse): RecipePdfData {
  return {
    name: r.name,
    servings: r.servings,
    prep: r.prep,
    cook: r.cook,
    notes: r.notes,
    links: r.links,
    photo: r.photo,
    categories: r.categories.map((c) => ({ name: c.name, color: c.color })),
    tags: r.tags.map((t) => ({ name: t.name })),
    ingredients: r.ingredients.map((i) => ({
      name: i.name, qty: i.qty, unit: i.unit, description: i.description,
    })),
    steps: r.steps.map((s) => ({ text: s.text, mins: s.mins, kind: s.kind })),
  };
}

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

      const coverPhoto = menu.photo ? await urlToDataUrl(menu.photo) : undefined;

      const blob = await pdf(
        <MenuPdfDocument
          menu={{ name: menu.name, description: menu.description, date: menu.date, servingTime: menu.servingTime }}
          recipes={recipes}
          coverPhoto={coverPhoto}
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

  return (
    <button
      onClick={handleExport}
      disabled={loading || menu.recipeIds.length === 0}
      className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-black/40 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition hover:bg-black/60 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? (
        <>
          <Loader2 size={11} className="animate-spin" /> Generazione…
        </>
      ) : error ? (
        <>
          <FileDown size={11} /> Riprova PDF
        </>
      ) : (
        <>
          <FileDown size={11} /> Esporta PDF
        </>
      )}
    </button>
  );
}
