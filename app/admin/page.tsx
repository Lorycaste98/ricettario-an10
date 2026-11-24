import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { getAdminOverview } from "@/lib/admin-overview";
import { getCardConfig } from "@/lib/site-settings";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export const metadata: Metadata = { title: "Gestione — Ricettario" };

/** Data di oggi in italiano, nel fuso del ricettario (il server Vercel è in UTC) */
function todayLabel() {
  return new Intl.DateTimeFormat("it-IT", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Rome" }).format(new Date());
}

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const isSuperAdmin = session.role === "SUPERADMIN";

  // Nomi esclusi dai grafici (gestibili dalla pagina Ingredienti)
  const excludedNames = await db.ingredientMaster
    .findMany({ where: { excludedFromStats: true }, select: { name: true } })
    .then((rows) => rows.map((r) => r.name));

  const [overview, cardConfig, topCookedRaw, recentReviews, topIngredientsRaw, categoriesRaw, tagsRaw] = await Promise.all([
    getAdminOverview(),
    getCardConfig(),
    db.recipe.findMany({
      where: { cookCount: { gt: 0 } },
      orderBy: { cookCount: "desc" },
      take: 15,
      select: { id: true, name: true, cookCount: true },
    }),
    db.review.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        nickname: true,
        rating: true,
        comment: true,
        recipe: { select: { id: true, name: true, quick: true } },
        menu: { select: { name: true } },
      },
    }),
    db.ingredient.groupBy({
      by: ["name"],
      where: { name: { notIn: excludedNames } },
      _count: { name: true },
      orderBy: { _count: { name: "desc" } },
      take: 15,
    }),
    db.category.findMany({
      select: { name: true, color: true, _count: { select: { recipes: true } } },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    db.tag.findMany({ select: { name: true, _count: { select: { recipes: true } } }, orderBy: { name: "asc" } }),
  ]);

  const topCooked = topCookedRaw.map((r) => ({ name: r.name, value: r.cookCount }));
  const topIngredients = topIngredientsRaw.map((i) => ({ name: i.name, value: i._count.name }));
  const topCategories = categoriesRaw
    .map((c) => ({ name: c.name, value: c._count.recipes, color: c.color }))
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 15);
  const topTags = tagsRaw
    .map((t) => ({ name: t.name, value: t._count.recipes }))
    .filter((t) => t.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 15);

  return (
    <AdminDashboard
      username={session.username}
      today={todayLabel()}
      isSuperAdmin={isSuperAdmin}
      overview={overview}
      cardInfo={{
        recipe: Object.values(cardConfig.recipe).filter(Boolean).length,
        menu: Object.values(cardConfig.menu).filter(Boolean).length,
      }}
      charts={{ topCategories, topTags, topCooked, topIngredients }}
      recentReviews={recentReviews}
    />
  );
}
