import { db } from "@/lib/db";
import { MenuCard } from "@/components/menu/MenuCard";
import type { Metadata } from "next";
import { UtensilsCrossed } from "lucide-react";

export const metadata: Metadata = { title: "Menù — Ricettario" };
export const dynamic = "force-dynamic";

async function getMenus() {
  const menus = await db.menu.findMany({
    orderBy: { createdAt: "desc" },
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
        orderBy: { order: "asc" },
        take: 4,
      },
    },
  });

  return menus.map((m) => {
    const reviews = m.reviews as { rating: number }[];
    const avgRating =
      reviews.length > 0
        ? Math.round(
            (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10
          ) / 10
        : null;
    const previewPhotos = m.recipes
      .map((mr) => mr.recipe.photo)
      .filter(Boolean) as string[];
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
        <h1 className="text-3xl font-bold text-sky-50 drop-shadow">I nostri menù</h1>
        <p className="text-sky-200/80 text-sm">
          Raccolte di ricette per ogni occasione
        </p>
      </div>

      {menus.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/20 bg-white/20 backdrop-blur-sm py-20">
          <UtensilsCrossed size={48} className="text-sky-300/50" />
          <p className="text-sky-200/60 text-sm">Nessun menù disponibile per ora.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-4">
          {menus.map((menu) => (
            <MenuCard key={menu.id} menu={menu} />
          ))}
        </div>
      )}
    </div>
  );
}


