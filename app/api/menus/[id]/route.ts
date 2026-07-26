/**
 * GET    /api/menus/[id]  — dettaglio menu
 * PUT    /api/menus/[id]  — aggiorna menu (admin)
 * PATCH  /api/menus/[id]  — aggiorna la sola visibilità `published` (admin)
 * DELETE /api/menus/[id]  — elimina menu (admin)
 */

import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { recipeSummarySelect, ok, err, normalizePeople, normalizeMoney, normalizeMenuRecipes } from "@/lib/api";
import { attachRecipeRatings, revalidateMenus } from "@/lib/queries";
import { getSession, requireAdmin } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

// Le ricette "non pronte" sono nascoste ai visitatori anche dentro un menù
const menuDetailSelect = (isAdmin: boolean) =>
  ({
    id: true,
    name: true,
    description: true,
    date: true,
    servingTime: true,
    people: true,
    photo: true,
    published: true,
    createdAt: true,
    updatedAt: true,
    _count: { select: { recipeReviews: true, recipes: true } },
    recipeReviews: {
      select: { id: true, nickname: true, rating: true, comment: true, createdAt: true },
      orderBy: { createdAt: "desc" as const },
    },
    recipes: {
      where: isAdmin ? {} : { recipe: { published: true } },
      select: {
        order: true,
        servings: true,
        recipe: { select: recipeSummarySelect },
      },
      orderBy: { order: "asc" as const },
    },
  }) as const;

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const menuId = Number(id);
  if (isNaN(menuId)) return err("ID non valido", 400);

  const isAdmin = !!(await getSession());
  const menu = await db.menu.findUnique({
    where: { id: menuId },
    select: menuDetailSelect(isAdmin),
  });
  if (!menu) return err("Menu non trovato", 404);
  // Menù "non pronto": invisibile ai visitatori
  if (!isAdmin && !menu.published) return err("Menu non trovato", 404);

  const reviews = menu.recipeReviews as { rating: number }[];
  const avgRating =
    reviews.length > 0
      ? Math.round(
          (reviews.reduce((s: number, r: { rating: number }) => s + r.rating, 0) / reviews.length) * 10
        ) / 10
      : null;
  const previewPhotos = (menu.recipes
    .map((mr: { order: number; recipe: { photo?: string | null } }) => mr.recipe.photo ?? null) as (string | null)[])
    .filter((p: string | null): p is string => p !== null);

  const rated = await attachRecipeRatings(menu.recipes.map((mr) => mr.recipe));

  return ok({
    ...menu,
    // Allinea il conteggio alla lista filtrata (niente ricette nascoste per i visitatori)
    _count: { reviews: menu._count.recipeReviews, recipes: menu.recipes.length },
    avgRating,
    previewPhotos,
    recipes: menu.recipes.map((mr: { order: number; servings: number | null }, i: number) => ({
      order: mr.order,
      servings: mr.servings,
      recipe: rated[i],
    })),
  });
}

export async function PUT(request: NextRequest, { params }: Params) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await params;
  const menuId = Number(id);
  if (isNaN(menuId)) return err("ID non valido", 400);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return err("Body JSON non valido");
  }

  const b = body as {
    name?: string;
    description?: string;
    date?: string | null;
    servingTime?: string | null;
    people?: number | null;
    photo?: string | null;
    published?: boolean;
    recipeIds?: number[];
    recipes?: { recipeId: number; servings?: number | null }[];
  };

  if (!b.name?.trim()) return err("Il campo 'name' è obbligatorio");

  const recipeRows = normalizeMenuRecipes(b.recipes, b.recipeIds);

  // Replace recipes: preserva i cookStartAt pianificati (timeline modalità cucina)
  // per le ricette che restano nel menù, altrimenti il delete-recreate li azzererebbe
  const prev = await db.menuRecipe.findMany({
    where: { menuId },
    select: { recipeId: true, cookStartAt: true },
  });
  const prevStarts = new Map(prev.map((mr) => [mr.recipeId, mr.cookStartAt]));
  await db.menuRecipe.deleteMany({ where: { menuId } });

  const menu = await db.menu.update({
    where: { id: menuId },
    data: {
      name: b.name.trim(),
      description: b.description?.trim() || null,
      date: b.date ? new Date(b.date) : null,
      servingTime: b.date ? (b.servingTime?.trim() || null) : null,
      people: normalizePeople(b.people),
      photo: b.photo?.trim() || null,
      ...(typeof b.published === "boolean" ? { published: b.published } : {}),
      recipes: {
        create: recipeRows.map((r, idx) => ({
          recipeId: r.recipeId,
          order: idx,
          servings: r.servings,
          cookStartAt: prevStarts.get(r.recipeId) ?? null,
        })),
      },
    },
    select: { id: true, name: true },
  });

  revalidateMenus();
  return ok(menu);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await params;
  const menuId = Number(id);
  if (isNaN(menuId)) return err("ID non valido", 400);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return err("Body JSON non valido");
  }

  const b = body as {
    published?: boolean;
    notes?: string | null;
    groceryCost?: number | null;
  };

  // Update parziale dei campi scalari admin: aggiorna solo le chiavi presenti nel body
  const data: { published?: boolean; notes?: string | null; groceryCost?: number | null } = {};
  if (typeof b.published === "boolean") data.published = b.published;
  if ("notes" in b) data.notes = b.notes?.trim() || null;
  if ("groceryCost" in b) data.groceryCost = normalizeMoney(b.groceryCost);

  if (Object.keys(data).length === 0) return err("Nessun campo aggiornabile nel body");

  const menu = await db.menu.update({
    where: { id: menuId },
    data,
    select: { id: true, published: true },
  });

  // La visibilità cambia le liste/anteprime cachate; note/costi sono admin-only (non cachati)
  if ("published" in data) revalidateMenus();
  return ok(menu);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await params;
  const menuId = Number(id);
  if (isNaN(menuId)) return err("ID non valido", 400);

  await db.menu.delete({ where: { id: menuId } });
  revalidateMenus();
  return ok({ deleted: true });
}

