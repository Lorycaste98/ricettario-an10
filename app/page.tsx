import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { flattenRecipe, recipeSummarySelect } from "@/lib/api";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Fraunces } from "next/font/google";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import { MenuCard } from "@/components/menu/MenuCard";
import { FavoritesCta } from "@/components/home/FavoritesCta";
import {
  BookOpen,
  UtensilsCrossed,
  LogIn,
  ChevronRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: "700",
  style: "italic",
  display: "swap",
});

type MenuRow = {
  id: number;
  name: string;
  description: string | null;
  date: Date | null;
  photo: string | null;
  createdAt: Date;
  _count: { reviews: number; recipes: number };
  reviews: { rating: number }[];
  recipes: { order: number; recipe: { photo: string | null } }[];
};

function processMenu(m: MenuRow) {
  const reviews = m.reviews;
  const avgRating =
    reviews.length > 0
      ? Math.round(
          (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10
        ) / 10
      : null;
  const previewPhotos = m.recipes
    .map((mr) => mr.recipe.photo)
    .filter((p): p is string => p !== null);
  return {
    ...m,
    date: m.date ? m.date.toISOString() : null,
    createdAt: m.createdAt.toISOString(),
    avgRating,
    previewPhotos,
  };
}

export default async function LandingPage() {
  // Gli admin loggati hanno la loro landing dedicata: la dashboard gestionale.
  const session = await getSession();
  if (session) redirect("/admin");

  const [rawRecipes, rawMenus] = await Promise.all([
    db.recipe.findMany({
      select: recipeSummarySelect,
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    db.menu.findMany({
      orderBy: { createdAt: "desc" },
      take: 4,
      select: {
        id: true,
        name: true,
        description: true,
        date: true,
        photo: true,
        createdAt: true,
        _count: { select: { reviews: true, recipes: true } },
        reviews: { select: { rating: true } },
        recipes: {
          select: { order: true, recipe: { select: { photo: true } } },
          orderBy: { order: "asc" as const },
          take: 4,
        },
      },
    }),
  ]);

  const recipes = rawRecipes.map(flattenRecipe);
  const menus = rawMenus.map(processMenu);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Safe-area bar — copre la zona dynamic island/notch su iPhone/iPad */}
      <div
        className="fixed top-0 left-0 right-0 z-50 bg-sky-950 lg:hidden pointer-events-none"
        style={{ height: "env(safe-area-inset-top, 0px)" }}
      />

      {/* ── Hero ── */}
      <section className="fade-up flex flex-col items-center justify-center pt-24 pb-16 px-4 text-center">
        <div className="mb-6 relative">
          <div className="absolute inset-0 rounded-3xl bg-orange-500/20 blur-2xl scale-150" />
          <Image
            src="/an10.webp"
            alt="AN10"
            width={88}
            height={88}
            priority
            className="relative rounded-2xl shadow-2xl ring-2 ring-white/20"
          />
        </div>

        <h1
          className={`${fraunces.className} text-6xl sm:text-7xl lg:text-8xl text-white drop-shadow-2xl mb-3 leading-none`}
        >
          Ricettario
        </h1>

        <p className="text-sky-200/70 text-base sm:text-lg max-w-xs mb-10">
          Le ricette di casa, sempre a portata di mano
        </p>

        {/* CTA */}
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl border border-sky-600 bg-sky-900/60 backdrop-blur-sm px-6 py-2.5 text-sm font-semibold text-sky-100 hover:bg-sky-800/80 transition-colors shadow-lg"
          >
            <LogIn size={16} />
            Accedi
          </Link>
          <FavoritesCta />
        </div>
      </section>

      {/* ── Ricette ── */}
      {recipes.length > 0 && (
        <section className="fade-up max-w-6xl mx-auto w-full px-4 pb-14" style={{ animationDelay: "80ms" }}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3 text-sky-50">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-rose-500 text-white shadow-md shadow-orange-500/30">
                <BookOpen size={17} />
              </span>
              <h2 className="text-xl font-bold drop-shadow">Ultime ricette</h2>
            </div>
            <Link
              href="/ricette"
              className="inline-flex items-center gap-1 text-sm font-medium text-sky-300 hover:text-sky-100 transition-colors"
            >
              Vedi tutte
              <ChevronRight size={15} />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-4">
            {recipes.map((r) => (
              <RecipeCard key={r.id} recipe={r} />
            ))}
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/ricette"
              className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.98]"
            >
              <BookOpen size={15} />
              Vedi tutte le ricette
              <ChevronRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </section>
      )}

      {/* ── Menù ── */}
      {menus.length > 0 && (
        <section className="fade-up max-w-6xl mx-auto w-full px-4 pb-20" style={{ animationDelay: "140ms" }}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3 text-sky-50">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-cyan-500 text-white shadow-md shadow-sky-500/30">
                <UtensilsCrossed size={17} />
              </span>
              <h2 className="text-xl font-bold drop-shadow">Menù</h2>
            </div>
            <Link
              href="/menu"
              className="inline-flex items-center gap-1 text-sm font-medium text-sky-300 hover:text-sky-100 transition-colors"
            >
              Vedi tutti
              <ChevronRight size={15} />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-4">
            {menus.map((m) => (
              <MenuCard key={m.id} menu={m} />
            ))}
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/menu"
              className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.98]"
            >
              <UtensilsCrossed size={15} />
              Vedi tutti i menù
              <ChevronRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
