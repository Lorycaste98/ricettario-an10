/**
 * GET /api/admin/stats?from=YYYY-MM-DD&to=YYYY-MM-DD
 *
 * Statistiche per i grafici della dashboard, filtrate per periodo.
 * - topCategories / topIngredients → filtrati per data di creazione della ricetta
 * - topCooked → filtrato per data di cottura (tabella CookLog) se è indicato un
 *   periodo; senza periodo usa il contatore storico `cookCount`.
 *
 * Solo admin.
 */

import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok } from "@/lib/api";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

/** Costruisce il filtro Prisma per un campo data da query string (to inclusivo a fine giornata). */
function buildDateRange(fromStr: string | null, toStr: string | null) {
  const range: { gte?: Date; lte?: Date } = {};
  if (fromStr) {
    const from = new Date(fromStr);
    if (!Number.isNaN(from.getTime())) {
      from.setHours(0, 0, 0, 0);
      range.gte = from;
    }
  }
  if (toStr) {
    const to = new Date(toStr);
    if (!Number.isNaN(to.getTime())) {
      to.setHours(23, 59, 59, 999);
      range.lte = to;
    }
  }
  return Object.keys(range).length > 0 ? range : null;
}

export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { searchParams } = new URL(req.url);
  const dateRange = buildDateRange(searchParams.get("from"), searchParams.get("to"));
  const recipeWhere = dateRange ? { createdAt: dateRange } : undefined;

  const excludedNames = await db.ingredientMaster
    .findMany({ where: { excludedFromStats: true }, select: { name: true } })
    .then((rows) => rows.map((r) => r.name));

  // ── Categorie: ricette per categoria (filtrate per data ricetta) ──
  const categoriesAll = await db.category.findMany({
    select: { id: true, name: true, color: true },
  });
  const catCounts = await db.recipeCategory.groupBy({
    by: ["categoryId"],
    where: recipeWhere ? { recipe: recipeWhere } : undefined,
    _count: { categoryId: true },
  });
  const catCountMap = new Map(catCounts.map((c) => [c.categoryId, c._count.categoryId]));
  const topCategories = categoriesAll
    .map((c) => ({ name: c.name, value: catCountMap.get(c.id) ?? 0, color: c.color }))
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 15);

  // ── Tag: ricette per tag (filtrate per data ricetta) ──
  const tagsAll = await db.tag.findMany({ select: { id: true, name: true } });
  const tagCounts = await db.recipeTag.groupBy({
    by: ["tagId"],
    where: recipeWhere ? { recipe: recipeWhere } : undefined,
    _count: { tagId: true },
  });
  const tagCountMap = new Map(tagCounts.map((t) => [t.tagId, t._count.tagId]));
  const topTags = tagsAll
    .map((t) => ({ name: t.name, value: tagCountMap.get(t.id) ?? 0 }))
    .filter((t) => t.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 15);

  // ── Ingredienti più usati (filtrati per data ricetta) ──
  const ingredientsRaw = await db.ingredient.groupBy({
    by: ["name"],
    where: {
      name: { notIn: excludedNames },
      ...(recipeWhere ? { recipe: recipeWhere } : {}),
    },
    _count: { name: true },
    orderBy: { _count: { name: "desc" } },
    take: 15,
  });
  const topIngredients = ingredientsRaw.map((i) => ({ name: i.name, value: i._count.name }));

  // ── Ricette più cucinate ──
  let topCooked: { name: string; value: number }[];
  if (dateRange) {
    // Periodo selezionato → conta gli eventi di cottura nel range
    const cookedRaw = await db.cookLog.groupBy({
      by: ["recipeId"],
      where: { cookedAt: dateRange },
      _count: { recipeId: true },
      orderBy: { _count: { recipeId: "desc" } },
      take: 15,
    });
    const recipeNames = await db.recipe.findMany({
      where: { id: { in: cookedRaw.map((c) => c.recipeId) } },
      select: { id: true, name: true },
    });
    const nameMap = new Map(recipeNames.map((r) => [r.id, r.name]));
    topCooked = cookedRaw
      .map((c) => ({ name: nameMap.get(c.recipeId) ?? "—", value: c._count.recipeId }))
      .filter((c) => c.value > 0);
  } else {
    // Tutto → contatore storico
    const cookedRaw = await db.recipe.findMany({
      where: { cookCount: { gt: 0 } },
      orderBy: { cookCount: "desc" },
      take: 15,
      select: { name: true, cookCount: true },
    });
    topCooked = cookedRaw.map((r) => ({ name: r.name, value: r.cookCount }));
  }

  return ok({ topCategories, topTags, topCooked, topIngredients });
}
