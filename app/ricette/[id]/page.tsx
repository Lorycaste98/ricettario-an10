import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, Clock, Flame, Hourglass, Sigma, Users, ExternalLink, CalendarDays, ImageIcon, UtensilsCrossed, StickyNote, Link2 } from "lucide-react";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { flattenRecipe } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ReviewSection } from "@/components/recipe/ReviewSection";
import { RecipeProcedure } from "@/components/recipe/RecipeProcedure";
import { FavoriteButton } from "@/components/recipe/FavoriteButton";
import { RecipePdfButton } from "@/components/recipe/RecipePdfButton";
import { RecipeActions } from "./RecipeActions";
import { RecipeAdminBar } from "./RecipeAdminBar";
import { formatMinutes, formatServings } from "@/lib/types";
import type { Metadata } from "next";

export async function generateMetadata({ params }: PageProps<"/ricette/[id]">): Promise<Metadata> {
  const { id } = await params;
  const recipe = await db.recipe.findUnique({ where: { id: Number(id) }, select: { name: true } });
  return { title: recipe ? `${recipe.name} — Ricettario` : "Ricetta non trovata" };
}

export default async function RecipePage({ params }: PageProps<"/ricette/[id]">) {
  const { id } = await params;

  const raw = await db.recipe.findUnique({
    where: { id: Number(id) },
    select: {
      id: true, name: true, servings: true, servingsUnit: true, prep: true, cook: true,
      notes: true, links: true, photo: true, cookCount: true, published: true, quick: true,
      createdAt: true, updatedAt: true,
      categories: { select: { category: { select: { id: true, name: true, color: true } } } },
      tags: { select: { tag: { select: { id: true, name: true } } } },
      photos: { select: { id: true, url: true, order: true }, orderBy: { order: "asc" } },
      ingredients: { select: { id: true, name: true, qty: true, unit: true, description: true, optional: true, order: true }, orderBy: { order: "asc" } },
      steps: { select: { id: true, text: true, mins: true, kind: true, order: true }, orderBy: { order: "asc" } },
      reviews: {
        select: { id: true, nickname: true, rating: true, comment: true, createdAt: true, menu: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
      _count: { select: { reviews: true } },
    },
  });

  if (!raw) notFound();

  // Le ricette "veloci" non hanno una pagina di dettaglio, nemmeno per l'admin
  if (raw.quick) notFound();

  // Le ricette non pronte sono visibili solo agli admin
  const isAdmin = !!(await getSession());
  if (!raw.published && !isAdmin) notFound();

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
    ingredients: recipe.ingredients.map((i: { name: string; qty: number | null; unit: string | null; description: string | null; optional: boolean }) => ({
      name: i.name, qty: i.qty, unit: i.unit, description: i.description, optional: i.optional,
    })),
    steps: recipe.steps.map((s: { text: string; mins: number | null; kind: string }) => ({ text: s.text, mins: s.mins, kind: s.kind })),
  };

  return (
    <article className="mx-auto max-w-4xl space-y-8 sm:space-y-10">
      {/* Back */}
      <Link href="/ricette" className="inline-flex items-center gap-1.5 text-sm font-medium text-sky-950 [text-shadow:0_1px_3px_rgba(255,255,255,0.6)] hover:opacity-70 transition-opacity">
        <ArrowLeft size={16} /> Tutte le ricette
      </Link>

      {/* Azioni admin (solo admin): pronta/non pronta + modifica + elimina, in cima */}
      <RecipeAdminBar recipeId={recipe.id} published={recipe.published} />

      {/* Header */}
      <div className="fade-up grid gap-6 lg:grid-cols-2 lg:gap-8" style={{ animationDelay: "0ms" }}>
        {/* Photo — slim su mobile, quadrata su desktop */}
        <div className="relative aspect-video sm:aspect-4/3 overflow-hidden rounded-2xl bg-white/20 backdrop-blur-sm">
          {allPhotos.length > 0 ? (
            <Image src={allPhotos[0]} alt={recipe.name} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" priority />
          ) : (
            <div className="flex h-full items-center justify-center text-sky-300"><UtensilsCrossed size={72} /></div>
          )}

          {/* Azioni rapide in alto a destra: preferiti + esporta PDF */}
          <div className="absolute right-2 top-2 flex items-center gap-2">
            <FavoriteButton recipeId={recipe.id} variant="overlay" />
            <RecipePdfButton recipe={pdfData} overlay />
          </div>

          {/* Data in basso a sinistra */}
          <div className="absolute bottom-2 left-2 inline-flex items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1.5 text-xs font-medium text-white shadow-sm backdrop-blur-md">
            <CalendarDays size={13} className="shrink-0" />
            {new Date(recipe.createdAt ?? "2020-01-01").toLocaleDateString("it-IT", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col gap-4">
          <div>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {recipe.categories.map((c: { id: number; name: string; color: string }) => (
                <Badge key={c.id} label={c.name} color={c.color} />
              ))}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-sky-950 leading-tight">{recipe.name}</h1>
          </div>

          {/* Meta grid — colonne dinamiche in base ai tile presenti */}
          {(() => {
            const tiles: ReactNode[] = [];
            if (recipe.prep)
              tiles.push(<MetaTile key="prep" icon={<Clock size={16} />} label="Preparazione" value={formatMinutes(recipe.prep)} />);
            if (recipe.cook && recipe.cook > 0)
              tiles.push(<MetaTile key="cook" icon={<Flame size={16} />} label="Cottura" value={formatMinutes(recipe.cook)} />);
            if (waitTime > 0)
              tiles.push(<MetaTile key="wait" icon={<Hourglass size={16} />} label="Attesa" value={formatMinutes(waitTime)} />);
            if (totalTime > 0)
              tiles.push(<MetaTile key="total" icon={<Sigma size={16} />} label="Totale" value={formatMinutes(totalTime)} accent />);
            if (recipe.servings)
              tiles.push(<MetaTile key="serv" icon={<Users size={16} />} label="Porzioni" value={formatServings(recipe.servings, recipe.servingsUnit)} />);
            const cols: Record<number, string> = {
              1: "sm:grid-cols-2", 2: "sm:grid-cols-2", 3: "sm:grid-cols-3",
              4: "sm:grid-cols-4", 5: "sm:grid-cols-5",
            };
            return (
              <div className={`grid grid-cols-2 gap-2 sm:gap-3 ${cols[tiles.length] ?? "sm:grid-cols-4"}`}>
                {tiles}
              </div>
            );
          })()}

          {recipe.links && (
            <a href={recipe.links} target="_blank" rel="noopener noreferrer"
              className="inline-flex w-fit items-center gap-2 rounded-full border border-orange-200/70 bg-orange-50/70 px-3.5 py-2 text-sm font-medium text-orange-700 backdrop-blur-sm transition-colors hover:bg-orange-100/80">
              <Link2 size={15} className="shrink-0" /> Ricetta originale
              <ExternalLink size={13} className="opacity-70" />
            </a>
          )}

          {recipe.notes && (
            <p className="flex items-start gap-2 rounded-xl bg-amber-100/60 border border-amber-200/50 backdrop-blur-sm px-4 py-3 text-sm text-amber-900 leading-relaxed">
              <StickyNote size={16} className="mt-0.5 shrink-0" /> <span>{recipe.notes}</span>
            </p>
          )}

          {/* Volte cucinata (solo admin) */}
          <RecipeActions recipeId={recipe.id} cookCount={recipe.cookCount} />
        </div>
      </div>

      {/* Ingredienti compatti + Procedura interattiva */}
      <div className="fade-up" style={{ animationDelay: "80ms" }}>
        <RecipeProcedure
          recipeId={recipe.id}
          defaultServings={recipe.servings ?? null}
          servingsUnit={recipe.servingsUnit ?? null}
          ingredients={recipe.ingredients}
          steps={recipe.steps}
        />
      </div>

      {/* Altre foto */}
      {allPhotos.length > 1 && (
        <section className="fade-up" style={{ animationDelay: "160ms" }}>
          <SectionHeader title="Foto" icon={<ImageIcon size={20} />} tone="violet" size="lg" className="mb-4" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {allPhotos.slice(1).map((url: string, i: number) => (
              <div key={i} className="relative aspect-square overflow-hidden rounded-xl bg-white/20 transition-transform duration-300 hover:scale-[1.02]">
                <Image src={url} alt={`${recipe.name} foto ${i + 2}`} fill className="object-cover" sizes="33vw" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recensioni */}
      <div className="fade-up" style={{ animationDelay: "240ms" }}>
        <ReviewSection recipeId={recipe.id} initialReviews={recipe.reviews} />
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Tile meta (tempo prep/cottura/totale/porzioni) — vetro con icona
// ---------------------------------------------------------------------------
function MetaTile({
  icon,
  label,
  value,
  accent = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-center ${
        accent
          ? "border-orange-500 bg-gradient-to-br from-orange-500 to-orange-600 shadow-md shadow-orange-500/30"
          : "border-white/40 bg-white/50 backdrop-blur-sm"
      }`}
    >
      <span className={accent ? "text-white" : "text-sky-500"}>{icon}</span>
      <p className={`text-[11px] ${accent ? "font-medium text-orange-50" : "text-sky-600"}`}>{label}</p>
      <p className={`text-sm font-bold ${accent ? "text-white" : "font-semibold text-sky-950"}`}>{value}</p>
    </div>
  );
}
