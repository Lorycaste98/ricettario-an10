/**
 * Numeri dell'area Gestione (restyle fase 5): li usano la sotto-navigazione (`app/admin/layout.tsx`,
 * conteggi accanto alle voci) e la dashboard (`app/admin/page.tsx`, tessere «Consulta e gestisci»).
 * `cache` di React: layout e pagina chiedono gli stessi numeri nella stessa richiesta e la query
 * parte una volta sola. Mai cachati fra richieste: sono dati admin, devono essere freschi.
 */
import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";

export interface AdminOverview {
  recipes: number;
  recipesHidden: number;
  cooks30d: number;
  menus: number;
  menusUpcoming: number;
  ingredients: number;
  ingredientsExcluded: number;
  categories: number;
  tags: number;
  reviews: number;
  reviewsAvg: number | null;
  users: number;
  superadmins: number;
}

const DAY = 24 * 60 * 60 * 1000;

export const getAdminOverview = cache(async (): Promise<AdminOverview> => {
  // Un menù resta «in programma» fino al giorno dopo (la data è salvata a mezzanotte UTC)
  const since = new Date(Date.now() - DAY);
  const [
    recipes,
    recipesHidden,
    cooks30d,
    menus,
    menusUpcoming,
    ingredients,
    ingredientsExcluded,
    categories,
    tags,
    reviewAgg,
    users,
    superadmins,
  ] = await Promise.all([
    db.recipe.count({ where: { quick: false } }),
    db.recipe.count({ where: { quick: false, published: false } }),
    db.cookLog.count({ where: { cookedAt: { gte: new Date(Date.now() - 30 * DAY) } } }),
    db.menu.count(),
    db.menu.count({ where: { date: { gte: since } } }),
    db.ingredientMaster.count(),
    db.ingredientMaster.count({ where: { excludedFromStats: true } }),
    db.category.count(),
    db.tag.count(),
    db.review.aggregate({ _count: { _all: true }, _avg: { rating: true } }),
    db.admin.count(),
    db.admin.count({ where: { role: "SUPERADMIN" } }),
  ]);
  return {
    recipes,
    recipesHidden,
    cooks30d,
    menus,
    menusUpcoming,
    ingredients,
    ingredientsExcluded,
    categories,
    tags,
    reviews: reviewAgg._count._all,
    reviewsAvg: reviewAgg._avg.rating,
    users,
    superadmins,
  };
});
