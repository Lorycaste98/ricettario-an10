import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { recipeSummarySelect, flattenRecipe } from "@/lib/api";
import { getSession } from "@/lib/session";
import { formatMinutes } from "@/lib/types";
import type { Metadata } from "next";
import { CalendarDays, UtensilsCrossed, Star, Clock, Users, Pencil } from "lucide-react";
import { MenuReviewSection } from "./MenuReviewSection";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const menu = await db.menu.findUnique({
    where: { id: Number(id) },
    select: { name: true },
  });
  return { title: menu ? `${menu.name} — Ricettario` : "Menù — Ricettario" };
}

export const dynamic = "force-dynamic";

async function getMenu(id: number) {
  const menu = await db.menu.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      date: true,
      photo: true,
      createdAt: true,
      updatedAt: true,
      reviews: {
        select: { id: true, nickname: true, rating: true, comment: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      },
      recipes: {
        select: { order: true, recipe: { select: recipeSummarySelect } },
        orderBy: { order: "asc" },
      },
    },
  });
  if (!menu) return null;

  const reviews = menu.reviews as { rating: number }[];
  const avgRating =
    reviews.length > 0
      ? Math.round(
          (reviews.reduce((s: number, r: { rating: number }) => s + r.rating, 0) / reviews.length) * 10
        ) / 10
      : null;

  return {
    ...menu,
    date: menu.date ? menu.date.toISOString() : null,
    createdAt: menu.createdAt.toISOString(),
    updatedAt: menu.updatedAt.toISOString(),
    avgRating,
    _count: { reviews: menu.reviews.length, recipes: menu.recipes.length },
    recipes: menu.recipes.map((mr: { order: number; recipe: unknown }) => ({
      order: mr.order,
      recipe: flattenRecipe(mr.recipe),
    })),
    reviews: menu.reviews.map((r: { id: number; nickname: string; rating: number; comment: string | null; createdAt: Date }) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    })),
  };
}

export default async function MenuDetailPage({ params }: Params) {
  const { id } = await params;
  const menuId = Number(id);
  if (isNaN(menuId)) notFound();

  const [menu, session] = await Promise.all([getMenu(menuId), getSession()]);
  if (!menu) notFound();

  const formattedDate = menu.date
    ? new Date(menu.date).toLocaleDateString("it-IT", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-2xl">
        <div className="relative aspect-3/1 sm:aspect-4/1 min-h-45">
          {menu.photo ? (
            <Image
              src={menu.photo}
              alt={menu.name}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 1024px"
              priority
            />
          ) : (
            <div className="h-full w-full bg-linear-to-br from-sky-900 to-sky-950 flex items-center justify-center">
              <UtensilsCrossed size={64} className="text-sky-600/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-linear-to-t from-sky-950/90 via-sky-950/40 to-transparent" />

          {/* Admin edit button */}
          {session && (
            <div className="absolute top-3 right-3">
              <Link
                href={`/admin/menu/${menu.id}/modifica`}
                className="flex items-center gap-1.5 rounded-xl border border-white/30 bg-black/40 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm hover:bg-black/60 transition"
              >
                <Pencil size={11} />
                Modifica
              </Link>
            </div>
          )}

          {/* Text overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow">
              {menu.name}
            </h1>
            {menu.description && (
              <p className="mt-1 text-sm text-white/80 max-w-2xl">{menu.description}</p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-3">
              {formattedDate && (
                <span className="flex items-center gap-1.5 text-xs text-white/70">
                  <CalendarDays size={11} />
                  {formattedDate}
                </span>
              )}
              <span className="flex items-center gap-1.5 text-xs text-white/70">
                <UtensilsCrossed size={11} />
                {menu._count.recipes} ricette
              </span>
              {menu.avgRating !== null && (
                <span className="flex items-center gap-1.5 text-xs text-amber-300">
                  <Star size={11} fill="currentColor" />
                  <span className="font-semibold">{menu.avgRating.toFixed(1)}</span>
                  <span className="text-white/60">({menu._count.reviews} rec.)</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Ricette */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-sky-50">Le ricette del menù</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {menu.recipes.map(({ order, recipe }) => {
            const totalTime = (recipe.prep ?? 0) + (recipe.cook ?? 0);
            return (
              <Link
                key={recipe.id}
                href={`/ricette/${recipe.id}`}
                className="group flex items-start gap-3 rounded-2xl border border-white/25 bg-white/30 backdrop-blur-sm p-3.5 hover:bg-white/45 hover:shadow-md transition-all duration-200"
              >
                {/* Order number */}
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-orange-500/90 text-xs font-bold text-white shadow-sm">
                  {order + 1}
                </span>

                {/* Thumb */}
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-sky-100">
                  {recipe.photo ? (
                    <Image
                      src={recipe.photo}
                      alt={recipe.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="64px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Image src="/an10.svg" alt="" width={28} height={28} className="opacity-40 rounded-lg" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-sky-950 group-hover:text-orange-600 transition-colors line-clamp-1">
                    {recipe.name}
                  </h3>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-sky-700/70">
                    {totalTime > 0 && (
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {formatMinutes(totalTime)}
                      </span>
                    )}
                    {recipe.servings && (
                      <span className="flex items-center gap-1">
                        <Users size={10} />
                        {recipe.servings}p
                      </span>
                    )}
                    {recipe.avgRating !== null && (
                      <span className="flex items-center gap-1 text-amber-500">
                        <Star size={10} fill="currentColor" />
                        {recipe.avgRating.toFixed(1)}
                      </span>
                    )}
                  </div>
                  {/* Categories */}
                  {recipe.categories.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {recipe.categories.slice(0, 2).map((c: { id: number; name: string; color: string }) => (
                        <span
                          key={c.id}
                          className="rounded-full px-2 py-0.5 text-[9px] font-semibold text-white"
                          style={{ backgroundColor: c.color + "cc" }}
                        >
                          {c.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Recensioni */}
      <MenuReviewSection
        menuId={menu.id}
        reviews={menu.reviews}
        avgRating={menu.avgRating}
        isAdmin={!!session}
      />
    </div>
  );
}



