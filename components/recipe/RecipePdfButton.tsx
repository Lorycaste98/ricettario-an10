"use client";

import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import type { StepIngredientLink } from "@/lib/step-ingredients";

export interface RecipePdfData {
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
  /** `id` serve solo a risolvere i legami `steps[].stepIngredients` */
  ingredients: {
    id?: number;
    name: string;
    qty: number | null;
    unit: string | null;
    description: string | null;
    optional?: boolean;
    section?: string | null;
  }[];
  steps: {
    text: string;
    mins: number | null;
    kind?: string;
    stepIngredients?: StepIngredientLink[];
  }[];
}

/** Scarica un'immagine remota e la converte in data URL (per includerla nel PDF in modo affidabile). */
export async function urlToDataUrl(url: string): Promise<string | undefined> {
  try {
    const res = await fetch(url);
    if (!res.ok) return undefined;
    const blob = await res.blob();
    return await new Promise<string | undefined>((resolve) => {
      const fr = new FileReader();
      fr.onloadend = () => resolve(fr.result as string);
      fr.onerror = () => resolve(undefined);
      fr.readAsDataURL(blob);
    });
  } catch {
    return undefined;
  }
}

/**
 * Logo AN10 orizzontale (blu) per l'intestazione dei PDF, come PNG. Il file SVG ha i ritagli
 * come maschere, che react-pdf non disegna: lo rasterizza il browser su un canvas (3× la misura
 * di stampa, per restare nitido). Se qualcosa va storto il PDF esce senza logo.
 */
export async function logoPngDataUrl(): Promise<string | undefined> {
  let objectUrl: string | undefined;
  try {
    // Misure esplicite: senza width/height alcuni browser (Firefox) non disegnano l'SVG sul canvas
    const svg = (
      await (await fetch("/brand/an10-orizzontale-blu.svg")).text()
    ).replace("<svg ", '<svg width="720" height="236" ');
    objectUrl = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    const img = new window.Image();
    img.src = objectUrl;
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = 720;
    canvas.height = 236;
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png");
  } catch {
    return undefined;
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
}

export function safeFileName(name: string, fallback = "ricetta"): string {
  const cleaned = name.replace(/[^\p{L}\p{N} _-]/gu, "").trim();
  return (cleaned || fallback).slice(0, 80);
}

/** Bottone tondo con sola icona (tavola 3.10) nella testata del dettaglio ricetta */
export function RecipePdfButton({ recipe }: { recipe: RecipePdfData }) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    if (loading) return;
    setLoading(true);
    try {
      // Carica la libreria PDF solo al click (non appesantisce il bundle iniziale)
      const [{ pdf }, { RecipePdfDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./RecipePdfDocument"),
      ]);
      const [photoData, logoData] = await Promise.all([
        recipe.photo ? urlToDataUrl(recipe.photo) : Promise.resolve(undefined),
        logoPngDataUrl(),
      ]);
      const blob = await pdf(
        <RecipePdfDocument
          recipe={recipe}
          photoData={photoData}
          logoData={logoData}
        />,
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${safeFileName(recipe.name)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Errore export PDF", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={loading}
      aria-label="Esporta in PDF"
      title="Esporta in PDF"
      className="inline-flex size-(--h-icon) shrink-0 items-center justify-center rounded-full border border-blu-200 bg-white text-blu-800 transition-colors hover:bg-blu-100 disabled:opacity-60"
    >
      {loading ? (
        <Loader2
          size={20}
          className="animate-spin motion-reduce:animate-none"
        />
      ) : (
        <FileDown size={20} />
      )}
    </button>
  );
}
