import { getSession } from "@/lib/session";
import { getHomeRecipes, getHomeMenus } from "@/lib/queries";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import { BookOpen, ChevronRight } from "lucide-react";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import { MenuCard } from "@/components/menu/MenuCard";
import { FavoritesCta } from "@/components/home/FavoritesCta";
import { SearchTrigger } from "@/components/search/SearchTrigger";
import { An10Logo } from "@/components/brand/An10Logo";
import { ClocheIcon } from "@/components/icons";
import { EmptyState } from "@/components/ds/Feedback";
import { buttonClasses } from "@/components/ds/button-classes";

/**
 * Vetrina pubblica (restyle fase 6). Dentro la cornice come le altre pagine, così il visitatore
 * ha la stessa navigazione (Ricette, Menù, Cerca, Preferiti, Accedi). In cima la fascia blu con
 * logo e ricerca globale (overlay), sotto le ultime ricette e gli ultimi menù pronti.
 * Admin loggato: la pagina iniziale è la libreria ricette (decisione del 16/11/2026).
 */
export default async function LandingPage() {
  const session = await getSession();
  if (session) redirect("/ricette");

  // Dati pubblici serviti dalla cache (invalidata sui mutate admin)
  const [recipes, menus] = await Promise.all([getHomeRecipes(), getHomeMenus()]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-[calc(var(--gap)*2)]">
      <section className="flex flex-col items-center gap-4 rounded-card bg-blu-800 px-5 pt-8 pb-6 text-center text-white @min-[620px]:px-10 @min-[620px]:pt-12 @min-[620px]:pb-10">
        <h1 className="sr-only">Ricettario AN10</h1>
        <An10Logo variant="orizzontale" title="" className="h-[clamp(3rem,10cqi,4.5rem)] w-auto" />
        <p className="max-w-[30ch] text-(length:--fs-sec) text-balance text-nav-muted">Le ricette di casa, sempre a portata di mano</p>
        <SearchTrigger className="mt-2 max-w-md" />
        <FavoritesCta />
      </section>

      {recipes.length > 0 && (
        <HomeSection title="Ultime ricette" icon={<BookOpen />} href="/ricette" linkLabel="Tutte le ricette">
          <div className="grid grid-cols-2 gap-(--gap) @min-[620px]:grid-cols-4">
            {recipes.map((r) => (
              <RecipeCard key={r.id} recipe={r} />
            ))}
          </div>
        </HomeSection>
      )}

      {menus.length > 0 && (
        <HomeSection title="Menù" icon={<ClocheIcon />} href="/menu" linkLabel="Tutti i menù">
          <div className="grid gap-(--gap) @min-[620px]:grid-cols-2">
            {menus.map((m) => (
              <MenuCard key={m.id} menu={m} />
            ))}
          </div>
        </HomeSection>
      )}

      {recipes.length === 0 && menus.length === 0 && (
        <EmptyState icon={<BookOpen />} title="Ancora niente da mostrare">
          Le ricette compariranno qui appena saranno pronte.
        </EmptyState>
      )}
    </div>
  );
}

function HomeSection({
  title,
  icon,
  href,
  linkLabel,
  children,
}: {
  title: string;
  icon: ReactNode;
  href: string;
  linkLabel: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <span className="flex size-[1.875rem] items-center justify-center rounded-[0.5625rem] bg-blu-120 text-blu-800 [&_svg]:size-[1.05rem]">
          {icon}
        </span>
        <h2 className="min-w-0 flex-1 text-(length:--fs-sec) font-bold text-blu-950">{title}</h2>
        <Link href={href} className={buttonClasses("ghost", "sm")}>
          {linkLabel}
          <ChevronRight />
        </Link>
      </div>
      {children}
    </section>
  );
}
