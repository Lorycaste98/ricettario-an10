import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, Clock, Flame, Hourglass, Sigma, Users, ExternalLink, CalendarDays, ImageIcon } from "lucide-react";
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
import { formatMinutes } from "@/lib/types";
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
      id: true, name: true, servings: true, prep: true, cook: true,
      notes: true, links: true, photo: true, cookCount: true, published: true,
      createdAt: true, updatedAt: true,
      categories: { select: { category: { select: { id: true, name: true, color: true } } } },
      tags: { select: { tag: { select: { id: true, name: true } } } },
      photos: { select: { id: true, url: true, order: true }, orderBy: { order: "asc" } },
      ingredients: { select: { id: true, name: true, qty: true, unit: true, description: true, order: true }, orderBy: { order: "asc" } },
      steps: { select: { id: true, text: true, mins: true, kind: true, order: true }, orderBy: { order: "asc" } },
      reviews: { select: { id: true, nickname: true, rating: true, comment: true, createdAt: true }, orderBy: { createdAt: "desc" } },
      _count: { select: { reviews: true } },
    },
  });

  if (!raw) notFound();

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
    prep: recipe.prep ?? null,
    cook: recipe.cook ?? null,
    notes: recipe.notes ?? null,
    links: recipe.links ?? null,
    photo: allPhotos[0] ?? null,
    categories: recipe.categories.map((c: { name: string; color: string }) => ({ name: c.name, color: c.color })),
    tags: recipe.tags.map((t: { name: string }) => ({ name: t.name })),
    ingredients: recipe.ingredients.map((i: { name: string; qty: number | null; unit: string | null; description: string | null }) => ({
      name: i.name, qty: i.qty, unit: i.unit, description: i.description,
    })),
    steps: recipe.steps.map((s: { text: string; mins: number | null; kind: string }) => ({ text: s.text, mins: s.mins, kind: s.kind })),
  };

  return (
    <article className="mx-auto max-w-4xl space-y-8 sm:space-y-10">
      {/* Back */}
      <Link href="/ricette" className="inline-flex items-center gap-1.5 text-sm font-medium text-sky-950 [text-shadow:0_1px_3px_rgba(255,255,255,0.6)] hover:opacity-70 transition-opacity">
        <ArrowLeft size={16} /> Tutte le ricette
      </Link>

      {/* Header */}
      <div className="fade-up grid gap-6 lg:grid-cols-2 lg:gap-8" style={{ animationDelay: "0ms" }}>
        {/* Photo — slim su mobile, quadrata su desktop */}
        <div className="relative aspect-video sm:aspect-4/3 overflow-hidden rounded-2xl bg-white/20 backdrop-blur-sm">
          {allPhotos.length > 0 ? (
            <Image src={allPhotos[0]} alt={recipe.name} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" priority />
          ) : (
            <div className="flex h-full items-center justify-center text-7xl">🍽️</div>
          )}
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
              tiles.push(<MetaTile key="serv" icon={<Users size={16} />} label="Porzioni" value={`${recipe.servings} pers.`} />);
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

          {recipe.notes && (
            <p className="rounded-xl bg-amber-100/60 border border-amber-200/50 backdrop-blur-sm px-4 py-3 text-sm text-amber-900 leading-relaxed">
              📝 {recipe.notes}
            </p>
          )}

          {recipe.links && (
            <a href={recipe.links} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-orange-600 hover:underline">
              <ExternalLink size={15} /> Fonte / Ricetta originale
            </a>
          )}

          {/* Data aggiunta */}
          <p className="inline-flex items-center gap-1.5 text-xs text-sky-950/60">
            <CalendarDays size={13} /> Aggiunta il{" "}
            {new Date(recipe.createdAt ?? "2020-01-01").toLocaleDateString("it-IT", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <FavoriteButton recipeId={recipe.id} variant="detail" />
            <RecipePdfButton recipe={pdfData} />
          </div>

          {/* Admin actions */}
          <RecipeActions recipeId={recipe.id} cookCount={recipe.cookCount} published={recipe.published} />
        </div>
      </div>

      {/* Ingredienti compatti + Procedura interattiva */}
      <div className="fade-up" style={{ animationDelay: "80ms" }}>
        <RecipeProcedure
          recipeId={recipe.id}
          defaultServings={recipe.servings ?? null}
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
