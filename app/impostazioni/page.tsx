import type { Metadata } from "next";
import { PageHeader } from "@/components/ds/PageHeader";
import { getSession } from "@/lib/session";
import { SettingsClient } from "./SettingsClient";

export const metadata: Metadata = { title: "Impostazioni — Ricettario" };

/**
 * Impostazioni: per il visitatore è la quinta voce «Accedi» della navigazione (Accedi in cima +
 * scelte del dispositivo); per l'admin sta nel blocco «Tu» della zona dietro le quinte (layout).
 * Le informazioni sulle card, che valgono per tutti, sono in Gestione → Aspetto del sito.
 */
export default async function ImpostazioniPage() {
  const session = await getSession();
  return (
    <div className="flex flex-col gap-4">
      <PageHeader brand={!session} title="Impostazioni" meta={session ? "Salvate sul tuo account, su tutti i dispositivi" : "Le scelte valgono su questo dispositivo"} />
      <SettingsClient />
    </div>
  );
}
