import type { Metadata } from "next";
import { PageHeader } from "@/components/ds/PageHeader";
import { getSession } from "@/lib/session";
import { getMenuSummaries, getRecipeSummaries } from "@/lib/queries";
import { SettingsClient } from "./SettingsClient";

export const metadata: Metadata = { title: "Impostazioni — Ricettario" };

/** Impostazioni (fase 9): per tutti, si apre dalla voce «Account» della navigazione. */
export default async function ImpostazioniPage() {
  const session = await getSession();
  // Admin: una ricetta e un menù veri per l'anteprima delle informazioni sulle card
  // (i più «pieni»: con foto, categoria e voti), così si vede l'effetto di ogni interruttore
  let samples = null;
  if (session) {
    const [recipes, menus] = await Promise.all([getRecipeSummaries(session.adminId), getMenuSummaries(true)]);
    const score = (r: (typeof recipes)[number]) =>
      (r.photo ? 4 : 0) + (r.categories.length ? 2 : 0) + (r._count.reviews ? 2 : 0) + (r.tags.length ? 1 : 0) + (r.servings ? 1 : 0);
    const recipe = [...recipes].sort((a, b) => score(b) - score(a))[0] ?? null;
    const menu = menus.find((m) => m.previewPhotos.length && m._count.reviews && m.people) ?? menus[0] ?? null;
    samples = { recipe, menu };
  }
  return (
    <div className="flex flex-col gap-4">
      <PageHeader brand title="Impostazioni" meta={session ? "Salvate sul tuo account, su tutti i dispositivi" : "Le scelte valgono su questo dispositivo"} />
      <SettingsClient samples={samples} />
    </div>
  );
}
