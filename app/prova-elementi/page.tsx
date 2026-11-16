import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Showcase } from "./Showcase";

export const metadata: Metadata = {
  title: "Prova elementi · restyle",
  robots: { index: false, follow: false },
};

/**
 * Pagina di prova del restyle: tutti i componenti di `components/ds` con i codici della tavola
 * (`docs/design/elementi-*.png`), per confrontarli a vista. Visibile in locale e sulle anteprime
 * Vercel, **mai in produzione**. Da eliminare a fine restyle (fase 8).
 */
export default function ProvaElementiPage() {
  if (process.env.VERCEL_ENV === "production") notFound();
  return <Showcase />;
}
