import type { Metadata } from "next";
import { PageHeader } from "@/components/ds/PageHeader";
import { SettingsClient } from "./SettingsClient";

export const metadata: Metadata = { title: "Impostazioni — Ricettario" };

/** Impostazioni (fase 9): per tutti, si apre dalla voce account della navigazione. */
export default function ImpostazioniPage() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader brand title="Impostazioni" meta="Le scelte valgono su questo dispositivo" />
      <SettingsClient />
    </div>
  );
}
