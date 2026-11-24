"use client";

import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ds/Button";
import {
  urlToDataUrl,
  logoPngDataUrl,
  safeFileName,
  type RecipePdfData,
} from "@/components/recipe/RecipePdfButton";
import type { StepIngredientLink } from "@/lib/step-ingredients";
import type { MenuPdfMeta, MenuPdfRecipe, MenuPdfTocItem } from "./MenuPdfDocument";

export interface MenuPdfProps {
  /** Ricette del menù in ordine. Le "veloci" (`quick`) non hanno dettaglio: solo nell'elenco in copertina */
  menu: MenuPdfMeta & { photo: string | null; recipes: { id: number; name: string; quick: boolean }[] };
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

/** Una ricetta del menù dopo il caricamento: `detail` nullo = veloce oppure non letta */
interface Loaded {
  name: string;
  quick: boolean;
  detail: RecipeDetailResponse | null;
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
  // Ricette che non si sono potute leggere: si chiede se esportare senza
  const [pending, setPending] = useState<{ failed: string[]; loaded: Loaded[] } | null>(null);

  const handleExport = async () => {
    if (loading) return;
    setLoading(true);
    setError(false);
    try {
      // Recupera il dettaglio completo di ogni ricetta (ingredienti, step…).
      // Le veloci non si scaricano: non hanno dettaglio (l'API risponde 404).
      // Una ricetta che non risponde non deve far fallire tutto il menù: la si segnala.
      const results: Loaded[] = await Promise.all(
        menu.recipes.map(async ({ id, name, quick }): Promise<Loaded> => {
          if (quick) return { name, quick: true, detail: null };
          try {
            const res = await fetch(`/api/recipes/${id}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return { name, quick: false, detail: (await res.json()) as RecipeDetailResponse };
          } catch (e) {
            console.error(`Errore export PDF menù: ricetta «${name}» (${id})`, e);
            return { name, quick: false, detail: null };
          }
        })
      );
      const failed = results.filter((r) => !r.quick && !r.detail);
      if (failed.length > 0) {
        setPending({ failed: failed.map((r) => r.name), loaded: results.filter((r) => r.quick || r.detail) });
        return;
      }
      await buildPdf(results);
    } catch (e) {
      console.error("Errore export PDF menù", e);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const exportWithout = async () => {
    if (!pending) return;
    const { loaded } = pending;
    setPending(null);
    setLoading(true);
    try {
      await buildPdf(loaded);
    } catch (e) {
      console.error("Errore export PDF menù", e);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const buildPdf = async (loaded: Loaded[]) => {
    // Elenco in copertina: tutte le ricette in ordine di menù, veloci comprese
    const toc: MenuPdfTocItem[] = loaded.map((r) => ({ name: r.detail?.name ?? r.name, quick: r.quick }));
    const details = loaded.flatMap((r) => (r.detail ? [r.detail] : []));

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
        toc={toc}
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
  };

  const label = error ? "Riprova a esportare in PDF" : "Esporta in PDF";
  const canSkip = pending?.loaded.some((r) => !r.quick) ?? false;
  return (
    <>
      <Modal open={pending !== null} onClose={() => setPending(null)} title="Ricetta non disponibile" size="sm">
        {pending && (
          <>
            <p className="text-grigio">
              {pending.failed.length === 1 ? "Non riesco a leggere la ricetta " : "Non riesco a leggere le ricette "}
              <strong className="text-blu-950">{pending.failed.map((n) => `«${n}»`).join(", ")}</strong>.{" "}
              {canSkip
                ? `Vuoi esportare il PDF senza ${pending.failed.length === 1 ? "questa ricetta" : "queste ricette"}?`
                : "Nessun'altra ricetta del menù da esportare."}
            </p>
            <div className="mt-5 flex justify-end gap-2.5">
              <Button variant="secondary" onClick={() => setPending(null)}>Annulla</Button>
              {canSkip && <Button onClick={exportWithout}>Esporta senza</Button>}
            </div>
          </>
        )}
      </Modal>
      <button
        type="button"
        onClick={handleExport}
        disabled={loading || menu.recipes.length === 0}
        aria-label={label}
        title={label}
        className="inline-flex size-(--h-icon) shrink-0 items-center justify-center rounded-full border border-blu-200 bg-white text-blu-800 transition-colors hover:bg-blu-100 disabled:opacity-60"
      >
        {loading ? <Loader2 size={20} className="animate-spin motion-reduce:animate-none" /> : <FileDown size={20} />}
      </button>
    </>
  );
}
