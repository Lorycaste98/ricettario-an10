"use client";

import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import {
  urlToDataUrl,
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

export function MenuPdfButton({
  menu,
  variant = "default",
}: MenuPdfProps & { variant?: "default" | "overlay" | "bar" }) {
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
        urlToDataUrl("/apple-icon.png"),
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

  // Variante "barra azioni admin": stessa resa dei bottoni Modifica/Elimina della
  // MenuAdminBar (vetro chiaro, icona sempre visibile, testo "Esporta" solo da sm+)
  if (variant === "bar") {
    return (
      <button
        onClick={handleExport}
        disabled={loading || menu.recipeIds.length === 0}
        title={error ? "Riprova esporta PDF" : "Esporta in PDF"}
        className="flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-white/50 bg-white/70 px-3 text-sm font-medium text-sky-900 backdrop-blur-sm transition-colors hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <Loader2 size={16} className="shrink-0 animate-spin" />
        ) : (
          <FileDown size={16} className="shrink-0" />
        )}
        <span className="hidden sm:inline">{loading ? "PDF…" : error ? "Riprova" : "Esporta"}</span>
      </button>
    );
  }

  // Badge in sovrimpressione sulla foto: identico all'export della pagina ricetta
  // (vetro scuro, icona sempre visibile, testo "PDF" solo da desktop)
  if (variant === "overlay") {
    return (
      <button
        onClick={handleExport}
        disabled={loading || menu.recipeIds.length === 0}
        title={error ? "Riprova esporta PDF" : "Esporta in PDF"}
        className="inline-flex items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-2 text-xs font-medium text-white shadow-sm backdrop-blur-md transition-colors hover:bg-black/65 disabled:cursor-not-allowed disabled:opacity-60 lg:px-3"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
        <span className="hidden lg:inline">{loading ? "PDF…" : error ? "Riprova" : "PDF"}</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading || menu.recipeIds.length === 0}
      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-60"
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
