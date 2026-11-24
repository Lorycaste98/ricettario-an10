import type { Metadata } from "next";
import { PageHeader } from "@/components/ds/PageHeader";
import { getSession } from "@/lib/session";
import { SettingsClient } from "./SettingsClient";

export const metadata: Metadata = { title: "Impostazioni — Ricettario" };

/** Impostazioni (fase 9): per tutti, si apre dalla voce account della navigazione. */
export default async function ImpostazioniPage() {
  const session = await getSession();
  return (
    <div className="flex flex-col gap-4">
      <PageHeader brand title="Impostazioni" meta={session ? "Salvate sul tuo account, su tutti i dispositivi" : "Le scelte valgono su questo dispositivo"} />
      <SettingsClient />
    </div>
  );
}
