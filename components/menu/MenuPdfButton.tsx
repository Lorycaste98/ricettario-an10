"use client";

import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import {
  urlToDataUrl,
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

export function MenuPdfButton({
  menu,
  variant = "default",
}: MenuPdfProps & { variant?: "default" | "overlay" | "bar" }) {
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
      // Una ricetta che non risponde non deve far fallire tutto il menù: la si segnala.
      // Le ricette veloci non si scaricano: non hanno dettaglio (l'API risponde 404).
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
      urlToDataUrl("/apple-icon.png"),
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

  const failedDialog = (
    <Modal open={pending !== null} onClose={() => setPending(null)} title="Ricetta non disponibile" size="sm">
      {pending && (
        <>
          <p className="text-sm text-sky-800">
            {pending.failed.length === 1 ? "Non riesco a leggere la ricetta " : "Non riesco a leggere le ricette "}
            <strong>{pending.failed.map((n) => `«${n}»`).join(", ")}</strong>.{" "}
            {pending.loaded.some((r) => !r.quick)
              ? `Vuoi esportare il PDF senza ${pending.failed.length === 1 ? "questa ricetta" : "queste ricette"}?`
              : "Nessun'altra ricetta del menù da esportare."}
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setPending(null)}>Annulla</Button>
            {pending.loaded.some((r) => !r.quick) && <Button onClick={exportWithout}>Esporta senza</Button>}
          </div>
        </>
      )}
    </Modal>
  );

  // Variante "barra azioni admin": stessa resa dei bottoni Modifica/Elimina della
  // MenuAdminBar (vetro chiaro, icona sempre visibile, testo "Esporta" solo da sm+)
  if (variant === "bar") {
    return (
      <>
      {failedDialog}
      <button
        onClick={handleExport}
        disabled={loading || menu.recipes.length === 0}
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
      </>
    );
  }

  // Badge in sovrimpressione sulla foto: identico all'export della pagina ricetta
  // (vetro scuro, icona sempre visibile, testo "PDF" solo da desktop)
  if (variant === "overlay") {
    return (
      <>
      {failedDialog}
      <button
        onClick={handleExport}
        disabled={loading || menu.recipes.length === 0}
        title={error ? "Riprova esporta PDF" : "Esporta in PDF"}
        className="inline-flex items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-2 text-xs font-medium text-white shadow-sm backdrop-blur-md transition-colors hover:bg-black/65 disabled:cursor-not-allowed disabled:opacity-60 lg:px-3"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
        <span className="hidden lg:inline">{loading ? "PDF…" : error ? "Riprova" : "PDF"}</span>
      </button>
      </>
    );
  }

  return (
    <>
    {failedDialog}
    <button
      onClick={handleExport}
      disabled={loading || menu.recipes.length === 0}
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
    </>
  );
}
