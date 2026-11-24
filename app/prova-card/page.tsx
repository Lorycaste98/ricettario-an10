import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import { getRecipeSummaries } from "@/lib/queries";
import { CardShowcase } from "./CardShowcase";

export const metadata: Metadata = {
  title: "Prova card · restyle",
  robots: { index: false, follow: false },
};

/**
 * Pagina di prova delle proposte di card ricetta (branch `anteprima/card`): le stesse ricette vere
 * nella card di oggi e nelle tre proposte, a larghezza telefono o larga e con le card per riga
 * scelte a mano. Visibile in locale e sulle anteprime, **mai in produzione**.
 */
export default async function ProvaCardPage() {
  if (process.env.VERCEL_ENV === "production") notFound();
  const session = await getSession();
  const all = await getRecipeSummaries(session?.adminId ?? null);
  // un po' con foto e un po' senza, con e senza voti
  const byVotes = (a: (typeof all)[number], b: (typeof all)[number]) => (b.avgRating ?? 0) - (a.avgRating ?? 0);
  const withPhoto = all.filter((r) => r.photo).sort(byVotes).slice(0, 5);
  const without = all.filter((r) => !r.photo).sort(byVotes).slice(0, 3);
  const recipes = [withPhoto[0], without[0], withPhoto[1], withPhoto[2], without[1], withPhoto[3], withPhoto[4], without[2]].filter(Boolean);
  return <CardShowcase recipes={recipes} />;
}
