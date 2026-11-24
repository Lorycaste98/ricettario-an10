import Link from "next/link";
import { ChefHat, ChevronRight, Plus, Star } from "lucide-react";
import type { AdminOverview } from "@/lib/admin-overview";
import { PageHeader } from "@/components/ds/PageHeader";
import { Panel } from "@/components/ds/Panel";
import { AdminTag } from "@/components/ds/Tag";
import { buttonClasses } from "@/components/ds/button-classes";
import { ADMIN_CREATE, ADMIN_SECTIONS, ADMIN_YOU, AREA_CLS, type AdminSectionKey } from "@/components/admin/admin-sections";
import { LogoutButton } from "@/components/admin/LogoutButton";
import ChartsSection, { type ChartsData } from "@/components/admin/ChartsSection";

/**
 * Hub «dietro le quinte» (`/admin`, la quinta voce col cappello della navigazione; D7, D9).
 * Due blocchi distinti:
 * - **Il sito** (vale per tutti): «Crea» (schede-azione con il + arancio), «Consulta e gestisci»
 *   (tessere-numero 13.1/13.2 con il colore di area sul filo in cima, compreso «Aspetto del sito»),
 *   grafici (13.3) e ultime recensioni;
 * - **Tu** (solo tuo), corto e in fondo: profilo, impostazioni del dispositivo, Esci.
 * Solo presentazione: i dati li legge `app/admin/page.tsx`.
 */
export interface RecentReview {
  id: number;
  nickname: string;
  rating: number;
  comment: string | null;
  recipe: { id: number; name: string; quick: boolean };
  menu: { name: string } | null;
}

const fmt1 = (n: number) => n.toFixed(1).replace(".", ",");

/** Numero grande e riga sotto di ogni tessera «Consulta e gestisci» */
function tileValue(key: AdminSectionKey, o: AdminOverview, cardInfo: { recipe: number; menu: number }): { value: string; meta: string } {
  switch (key) {
    case "ricette":
      return {
        value: String(o.recipes),
        meta: [o.recipesHidden ? `${o.recipesHidden} non pronte` : "tutte pronte", `${o.cooks30d} cotture in 30 giorni`].join(" · "),
      };
    case "menu":
      return { value: String(o.menus), meta: o.menusUpcoming ? `${o.menusUpcoming} in programma` : "nessuno in programma" };
    case "ingredienti":
      return { value: String(o.ingredients), meta: `${o.ingredientsExcluded} fuori dalle statistiche` };
    case "vocabolario":
      return { value: `${o.categories} · ${o.tags}`, meta: "categorie · tag" };
    case "recensioni":
      return { value: String(o.reviews), meta: o.reviewsAvg != null ? `media ${fmt1(o.reviewsAvg)}` : "nessun voto ancora" };
    case "utenti":
      return { value: String(o.users), meta: `${o.superadmins} superadmin` };
    case "aspetto":
      return { value: `${cardInfo.recipe} · ${cardInfo.menu}`, meta: "informazioni su card ricette · menù" };
  }
}

function SectionLabel({ children }: { children: string }) {
  return <h3 className="text-[0.75rem] font-bold tracking-[0.08em] text-grigio uppercase">{children}</h3>;
}

/** Titolo di blocco dell'hub (2.2): separa «Il sito» da «Tu» */
function BlockTitle({ id, children, hint }: { id: string; children: string; hint: string }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 border-b border-adm-150 pb-1.5">
      <h2 id={id} className="text-(length:--fs-sec) font-bold">
        {children}
      </h2>
      <p className="text-(length:--fs-meta) text-grigio">{hint}</p>
    </div>
  );
}

export function AdminDashboard({
  username,
  today,
  isSuperAdmin,
  overview,
  cardInfo,
  charts,
  recentReviews,
}: {
  username: string;
  today: string;
  isSuperAdmin: boolean;
  overview: AdminOverview;
  /** quante informazioni mostrano oggi le card delle ricette e dei menù (Aspetto del sito) */
  cardInfo: { recipe: number; menu: number };
  charts: ChartsData;
  recentReviews: RecentReview[];
}) {
  const sections = ADMIN_SECTIONS.filter((s) => !s.superOnly || isSuperAdmin);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={
          <>
            Gestione
            <AdminTag />
          </>
        }
        meta={`Ciao ${username} · ${today}`}
      />

      <section aria-labelledby="hub-sito" className="flex flex-col gap-5">
        <BlockTitle id="hub-sito" hint="Contenuti e scelte che valgono per tutti">
          Il sito
        </BlockTitle>

        {/* Crea: schede-azione con il + arancio (D7) */}
        <section className="flex flex-col gap-2.5">
          <SectionLabel>Crea</SectionLabel>
          <div className="grid gap-(--gap) @min-[620px]:grid-cols-3">
            {ADMIN_CREATE.map(({ href, label, hint, icon: Icon, area }) => (
              <Link
                key={href}
                href={href}
                className="group flex items-center gap-3 rounded-card border border-blu-150 bg-white p-[clamp(0.75rem,2cqi,1rem)] transition-colors hover:border-blu-200 hover:bg-blu-50"
              >
                <span className={`flex size-12 shrink-0 items-center justify-center rounded-ctl ${AREA_CLS[area].bg} ${AREA_CLS[area].text}`}>
                  <Icon className="size-6" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block leading-tight font-bold">{label}</span>
                  <span className="block text-(length:--fs-meta) text-grigio">{hint}</span>
                </span>
                <span
                  aria-hidden
                  className="flex size-11 shrink-0 items-center justify-center rounded-full bg-arancio-pieno text-white transition-colors group-hover:bg-arancio-scuro"
                >
                  <Plus className="size-6" strokeWidth={2.5} />
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Consulta e gestisci: tessere-numero con freccia, senza + */}
        <section className="flex flex-col gap-2.5">
          <SectionLabel>Consulta e gestisci</SectionLabel>
          <div className="grid grid-cols-2 gap-(--gap) @min-[760px]:grid-cols-4">
            {sections.map(({ key, href, label, icon: Icon, area }) => {
              const { value, meta } = tileValue(key, overview, cardInfo);
              return (
                <Link
                  key={key}
                  href={href}
                  className={`group flex min-w-0 flex-col gap-1 rounded-card border border-t-4 border-blu-150 bg-white p-[clamp(0.75rem,2cqi,1rem)] transition-colors hover:bg-blu-50 ${AREA_CLS[area].top}`}
                >
                  <span className="flex items-center gap-1.5 font-bold">
                    <Icon className={`size-[1.1rem] shrink-0 ${AREA_CLS[area].text}`} />
                    <span className="min-w-0 flex-1 leading-tight">{label}</span>
                    <ChevronRight className="size-4 shrink-0 text-grigio transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </span>
                  <span className="tabular text-[clamp(1.5rem,4.5cqi,1.875rem)] leading-tight font-bold">{value}</span>
                  <span className="text-(length:--fs-meta) text-grigio">{meta}</span>
                </Link>
              );
            })}
          </div>
        </section>

        <div className="grid items-start gap-(--gap) @min-[1000px]:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <ChartsSection {...charts} />

          <Panel
            title="Ultime recensioni"
            icon={<Star />}
            actions={
              <Link href="/admin/recensioni" className="rounded-[0.5rem] px-2 py-1 text-[0.875rem] font-semibold text-blu-600 hover:bg-blu-100">
                Tutte
              </Link>
            }
          >
            {recentReviews.length === 0 ? (
              <p className="text-grigio">Nessuna recensione ancora.</p>
            ) : (
              <ul className="-my-1 divide-y divide-blu-150">
                {recentReviews.map((r) => (
                  <li key={r.id} className="flex items-start gap-3 py-2.5">
                    <span className="tabular flex size-8 shrink-0 items-center justify-center rounded-full bg-oro-50 text-[0.875rem] font-bold text-giallo-ink">
                      {r.rating}
                    </span>
                    <div className="min-w-0 flex-1">
                      {r.recipe.quick ? (
                        <p className="truncate font-semibold">{r.recipe.name}</p>
                      ) : (
                        <Link href={`/ricette/${r.recipe.id}`} className="block truncate font-semibold hover:underline">
                          {r.recipe.name}
                        </Link>
                      )}
                      <p className="truncate text-(length:--fs-meta) text-grigio">
                        {r.nickname}
                        {r.menu ? ` · ${r.menu.name}` : ""}
                      </p>
                      {r.comment && <p className="mt-0.5 line-clamp-2 text-[0.875rem]">«{r.comment}»</p>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </section>

      {/* Tu: corto e in fondo (profilo, impostazioni, esci) */}
      <section aria-labelledby="hub-tu" className="flex flex-col gap-2.5">
        <BlockTitle id="hub-tu" hint="Solo per te, su tutti i tuoi dispositivi">
          Tu
        </BlockTitle>
        <div className="flex flex-col gap-3 rounded-card border border-blu-150 bg-white p-[clamp(0.75rem,2cqi,1rem)] @min-[760px]:flex-row @min-[760px]:items-center">
          <div className="flex min-w-0 items-center gap-3 @min-[760px]:flex-1">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-blu-800 text-white">
              <ChefHat className="size-5" aria-hidden />
            </span>
            <p className="min-w-0">
              <span className="block text-(length:--fs-meta) text-grigio">Sei entrato come</span>
              <span className="block truncate font-bold">{username}</span>
            </p>
          </div>
          <div className="grid gap-2 @min-[480px]:grid-cols-3 @min-[760px]:flex">
            {ADMIN_YOU.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className={buttonClasses("secondary", "md")}>
                <Icon className="size-[1.15em]" aria-hidden /> {label}
              </Link>
            ))}
            <LogoutButton />
          </div>
        </div>
      </section>
    </div>
  );
}
