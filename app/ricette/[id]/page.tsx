import { notFound } from "next/navigation";
import { ExternalLink, CalendarDays, StickyNote, Link2, Clock, Users } from "lucide-react";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { flattenRecipe, recipeDetailSelect } from "@/lib/api";
import { BackLink } from "@/components/ui/BackLink";
import { ViewerImage } from "@/components/ui/ViewerImage";
import { ReviewSection } from "@/components/recipe/ReviewSection";
import { PersonalRatingCard } from "@/components/recipe/PersonalRatingCard";
import { MyRatingLink } from "@/components/recipe/MyRatingLink";
import { RecipeProcedure } from "@/components/recipe/RecipeProcedure";
import { RecipeActions } from "./RecipeActions";
import { RecipeAdminBar } from "./RecipeAdminBar";
import { formatMinutes, formatServings } from "@/lib/types";
import { PageHeader } from "@/components/ds/PageHeader";
import { NoPhoto } from "@/components/recipe/NoPhoto";
import { HeaderCategories } from "@/components/recipe/CardCategory";
import type { StepIngredientLink } from "@/lib/step-ingredients";
import type { Metadata } from "next";

export async function generateMetadata({ params }: PageProps<"/ricette/[id]">): Promise<Metadata> {
  const { id } = await params;
  const recipe = await db.recipe.findUnique({ where: { id: Number(id) }, select: { name: true } });
  return { title: recipe ? `${recipe.name} — Ricettario` : "Ricetta non trovata" };
}

export default async function RecipePage({ params }: PageProps<"/ricette/[id]">) {
  const { id } = await params;

  // Select condiviso con l'API (`recipeDetailSelect`): duplicarlo qui aveva già
  // fatto perdere per strada un campo nuovo (`Ingredient.section`)
  const raw = await db.recipe.findUnique({
    where: { id: Number(id) },
    select: recipeDetailSelect,
  });

  if (!raw) notFound();

  // Le ricette "veloci" non hanno una pagina di dettaglio, nemmeno per l'admin
  if (raw.quick) notFound();

  // Le ricette non pronte sono visibili solo agli admin
  const session = await getSession();
  const isAdmin = !!session;
  if (!raw.published && !isAdmin) notFound();

  // Voto personale dell'admin loggato (uno per account): distinto dalle recensioni ospiti
  const myRating = session
    ? await db.recipeRating.findUnique({
        where: { adminId_recipeId: { adminId: session.adminId, recipeId: raw.id } },
        select: { rating: true, note: true },
      })
    : null;

  const recipe = flattenRecipe(raw) as ReturnType<typeof flattenRecipe> & typeof raw;

  // Attesa = somma dei minuti degli step di tipo WAIT; il totale le include tutte
  const waitTime = (recipe.steps as { mins: number | null; kind: string }[]).reduce(
    (s, st) => (st.kind === "WAIT" ? s + (st.mins ?? 0) : s),
    0
  );
  const totalTime = (recipe.prep ?? 0) + (recipe.cook ?? 0) + waitTime;
  const allPhotos = recipe.photo
    ? [recipe.photo, ...recipe.photos.map((p: { url: string }) => p.url).filter((u: string) => u !== recipe.photo)]
    : recipe.photos.map((p: { url: string }) => p.url);

  const pdfData = {
    name: recipe.name,
    servings: recipe.servings ?? null,
    servingsUnit: recipe.servingsUnit ?? null,
    prep: recipe.prep ?? null,
    cook: recipe.cook ?? null,
    notes: recipe.notes ?? null,
    links: recipe.links ?? null,
    photo: allPhotos[0] ?? null,
    categories: recipe.categories.map((c: { name: string; color: string }) => ({ name: c.name, color: c.color })),
    tags: recipe.tags.map((t: { name: string }) => ({ name: t.name })),
    ingredients: recipe.ingredients.map((i: { id: number; name: string; qty: number | null; unit: string | null; description: string | null; optional: boolean; section: string | null }) => ({
      id: i.id, name: i.name, qty: i.qty, unit: i.unit, description: i.description, optional: i.optional, section: i.section,
    })),
    // `stepIngredients` (legami passo↔ingrediente + quantità) arriva da flattenRecipe
    steps: recipe.steps.map((s: { text: string; mins: number | null; kind: string; stepIngredients?: StepIngredientLink[] }) => ({
      text: s.text, mins: s.mins, kind: s.kind, stepIngredients: s.stepIngredients,
    })),
  };

  const facts: { label: string; value: string; strong?: boolean }[] = [];
  if (recipe.prep) facts.push({ label: "Preparazione", value: formatMinutes(recipe.prep) });
  if (recipe.cook && recipe.cook > 0) facts.push({ label: "Cottura", value: formatMinutes(recipe.cook) });
  if (waitTime > 0) facts.push({ label: "Attesa", value: formatMinutes(waitTime) });
  if (totalTime > 0) facts.push({ label: "Totale", value: formatMinutes(totalTime), strong: true });
  // Testata (9.5): categorie su una riga (stesso stile delle card), poi tempo e porzioni con le icone
  const cats = recipe.categories as { name: string; color: string }[];
  const facts2 = [
    totalTime > 0 && (
      <span key="t" className="tabular inline-flex items-center gap-1 whitespace-nowrap">
        <Clock className="size-[1.05em]" aria-hidden /> {formatMinutes(totalTime)}
      </span>
    ),
    recipe.servings && (
      <span key="s" className="inline-flex min-w-0 items-center gap-1">
        <Users className="size-[1.05em] shrink-0" aria-hidden /> {formatServings(recipe.servings, recipe.servingsUnit)}
      </span>
    ),
  ].filter(Boolean);
  const meta =
    cats.length > 0 || facts2.length > 0 ? (
      <>
        {cats.length > 0 && <HeaderCategories cats={cats} />}
        {facts2.length > 0 && <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5">{facts2}</span>}
      </>
    ) : undefined;

  return (
    <article className="cx-page flex flex-col gap-4">
      <PageHeader
        back={<BackLink href="/ricette" label="Tutte le ricette" />}
        thumb={
          allPhotos[0] ? (
            <div className="relative size-full">
              <ViewerImage photos={allPhotos} index={0} src={allPhotos[0]} alt={recipe.name} className="object-cover" sizes="64px" priority />
            </div>
          ) : (
            <NoPhoto logo="w-3/5" />
          )
        }
        title={recipe.name}
        meta={meta}
        actions={<RecipeAdminBar recipeId={recipe.id} published={recipe.published} pdf={pdfData} />}
      />

      {/* Corpo: ingredienti + procedura (2 colonne da 620px) · da 1000px terza colonna con foto e dettagli */}
      <div className="cx-one grid items-start gap-(--gap) @min-[1000px]:grid-cols-[1fr_clamp(16rem,26cqi,20rem)]">
        <RecipeProcedure
          recipeId={recipe.id}
          recipeName={recipe.name}
          recipePhoto={allPhotos[0] ?? null}
          defaultServings={recipe.servings ?? null}
          servingsUnit={recipe.servingsUnit ?? null}
          ingredients={recipe.ingredients}
          steps={recipe.steps}
        />

        {/* vista compatta: foto, tempi, note, link, cotture e voto spariscono (.cx-hide) */}
        <aside className="cx-hide flex flex-col gap-3">
          {allPhotos.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              <div className="relative col-span-3 aspect-4/3 overflow-hidden rounded-card bg-blu-100">
                <ViewerImage photos={allPhotos} index={0} src={allPhotos[0]} alt={recipe.name} className="object-cover" sizes="(max-width: 1000px) 100vw, 20rem" />
              </div>
              {allPhotos.slice(1).map((url: string, i: number) => (
                <div key={url} className="relative aspect-square overflow-hidden rounded-ctl bg-blu-100">
                  <ViewerImage photos={allPhotos} index={i + 1} src={url} alt={`${recipe.name} foto ${i + 2}`} className="object-cover" sizes="7rem" />
                </div>
              ))}
            </div>
          )}

          {facts.length > 0 && (
            <dl className="grid grid-cols-2 gap-2">
              {facts.map((f) => (
                <div key={f.label} className={f.strong ? "rounded-ctl bg-blu-800 px-3 py-2 text-white" : "rounded-ctl border border-blu-150 bg-white px-3 py-2"}>
                  <dt className={f.strong ? "text-xs text-nav-ink" : "text-xs text-grigio"}>{f.label}</dt>
                  <dd className="tabular font-bold">{f.value}</dd>
                </div>
              ))}
            </dl>
          )}

          {recipe.notes && (
            <p className="flex items-start gap-2 rounded-card border border-giallo-400/60 bg-giallo-100 px-3.5 py-3 text-[0.875rem] whitespace-pre-line text-giallo-ink">
              <StickyNote className="mt-0.5 size-4 shrink-0" aria-hidden /> <span>{recipe.notes}</span>
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {isAdmin && <MyRatingLink rating={myRating?.rating ?? null} />}
            {recipe.links && (
              <a
                href={recipe.links}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-(--h-sm) items-center gap-1.5 rounded-[0.625rem] border border-blu-200 bg-white px-3 text-[0.875rem] font-semibold text-blu-600 hover:bg-blu-100"
              >
                <Link2 className="size-4" aria-hidden /> Ricetta originale <ExternalLink className="size-3.5" aria-hidden />
              </a>
            )}
            <span className="inline-flex items-center gap-1.5 text-xs text-grigio">
              <CalendarDays className="size-3.5" aria-hidden />
              {new Date(recipe.createdAt ?? "2020-01-01").toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </div>

          {/* Volte cucinata (solo admin) */}
          <RecipeActions recipeId={recipe.id} cookCount={recipe.cookCount} />

          {isAdmin && (
            <div id="mio-voto" className="scroll-mt-24">
              <PersonalRatingCard recipeId={recipe.id} initial={myRating} />
            </div>
          )}
        </aside>
      </div>

      <div className="cx-hide">
        <ReviewSection initialReviews={recipe.reviews} />
      </div>
    </article>
  );
}
