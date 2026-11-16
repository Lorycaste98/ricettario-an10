import { getSession } from "@/lib/session";
import { getRecipeSummaries } from "@/lib/queries";
import { FavoritesClient } from "./FavoritesClient";
import { PageHeader } from "@/components/ds/PageHeader";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Preferiti — Ricettario" };

export default async function PreferitiPage() {
  const session = await getSession();
  const recipes = await getRecipeSummaries(session?.adminId ?? null);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Preferiti"
        meta={session ? "Salvati sul tuo account, su tutti i dispositivi" : "Salvati su questo dispositivo"}
      />
      <FavoritesClient recipes={recipes} />
    </div>
  );
}
