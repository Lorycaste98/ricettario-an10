import { db } from "@/lib/db";
import { MenuGrid } from "@/components/menu/MenuGrid";
import type { Metadata } from "next";
import { UtensilsCrossed } from "lucide-react";

export const metadata: Metadata = { title: "Menù — Ricettario" };
export const dynamic = "force-dynamic";

type MenuRow = {
  id: number;
  name: string;
  description: string | null;
  date: Date | null;
  servingTime: string | null;
  photo: string | null;
  createdAt: Date;
  _count: { reviews: number; recipes: number };
  reviews: { rating: number }[];
  recipes: { order: number; recipe: { photo: string | null } }[];
};

async function getMenus() {
  const menus: MenuRow[] = await db.menu.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      date: true,
      servingTime: true,
      photo: true,
      createdAt: true,
      _count: { select: { reviews: true, recipes: true } },
      reviews: { select: { rating: true } },
      recipes: {
        select: { order: true, recipe: { select: { photo: true } } },
        orderBy: { order: "asc" },
        take: 4,
      },
    },
  });

  return menus.map((m: MenuRow) => {
    const reviews = m.reviews;
    const avgRating =
      reviews.length > 0
        ? Math.round(
            (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10
          ) / 10
        : null;
    const previewPhotos = m.recipes
      .map((mr: { order: number; recipe: { photo: string | null } }) => mr.recipe.photo)
      .filter((p): p is string => p !== null);
    return {
      ...m,
      date: m.date ? m.date.toISOString() : null,
      createdAt: m.createdAt.toISOString(),
      avgRating,
      previewPhotos,
    };
  });
}

export default async function MenuListPage() {
  const menus = await getMenus();

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/30 px-4 py-1.5 text-xs font-semibold text-sky-700 backdrop-blur-sm">
          <UtensilsCrossed size={12} />
          Menù
        </div>
        <h1 className="text-3xl font-bold text-sky-50 drop-shadow">I miei menù</h1>
        <p className="text-sky-200/80 text-sm">
          Raccolte di ricette per ogni occasione
        </p>
      </div>

      <MenuGrid menus={menus} />
    </div>
  );
}


