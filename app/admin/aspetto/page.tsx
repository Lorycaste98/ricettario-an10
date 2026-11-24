import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import { getMenuSummaries, getRecipeSummaries } from "@/lib/queries";
import { PageHeader } from "@/components/ds/PageHeader";
import { AdminTag } from "@/components/ds/Tag";
import { CardInfoPanel } from "./CardInfoPanel";

export const metadata: Metadata = { title: "Aspetto del sito — Ricettario" };

/**
 * Aspetto del sito (blocco «Il sito» di Gestione): scelte che valgono **per tutti**, oggi le
 * informazioni sulle card (`lib/card-config.ts`). Stava nelle Impostazioni, ma non è una scelta tua.
 */
export default async function AspettoPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  // Una ricetta e un menù veri per l'anteprima (i più «pieni»: foto, categoria, voti), così si
  // vede l'effetto di ogni interruttore
  const [recipes, menus] = await Promise.all([getRecipeSummaries(session.adminId), getMenuSummaries(true)]);
  const score = (r: (typeof recipes)[number]) =>
    (r.photo ? 4 : 0) + (r.categories.length ? 2 : 0) + (r._count.reviews ? 2 : 0) + (r.tags.length ? 1 : 0) + (r.servings ? 1 : 0);
  const recipe = [...recipes].sort((a, b) => score(b) - score(a))[0] ?? null;
  const menu = menus.find((m) => m.previewPhotos.length && m._count.reviews && m.people) ?? menus[0] ?? null;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={
          <>
            Aspetto del sito
            <AdminTag />
          </>
        }
        meta="Scelte che valgono per tutti, anche per chi non è entrato"
      />
      <CardInfoPanel samples={{ recipe, menu }} />
    </div>
  );
}
