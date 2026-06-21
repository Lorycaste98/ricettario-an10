"use client";

import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";

export interface RecipePdfData {
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

export function safeFileName(name: string, fallback = "ricetta"): string {
  const cleaned = name.replace(/[^\p{L}\p{N} _-]/gu, "").trim();
  return (cleaned || fallback).slice(0, 80);
}

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
        urlToDataUrl("/apple-icon.png"),
      ]);
      const blob = await pdf(
        <RecipePdfDocument recipe={recipe} photoData={photoData} logoData={logoData} />
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
      onClick={handleExport}
      disabled={loading}
      className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/40 bg-white/60 px-4 py-2 text-sm font-medium text-sky-900 backdrop-blur-sm transition-colors hover:bg-white/80 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? (
        <>
          <Loader2 size={15} className="animate-spin" /> Generazione PDF…
        </>
      ) : (
        <>
          <FileDown size={15} /> Esporta in PDF
        </>
      )}
    </button>
  );
}
