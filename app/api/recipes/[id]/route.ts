/**
 * GET    /api/recipes/[id]  — dettaglio completo
 * PUT    /api/recipes/[id]  — modifica (rimpiazza categorie/tag/ingredienti/step/foto)
 * DELETE /api/recipes/[id]  — elimina (cascade automatico su tutte le relazioni)
 */

import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { recipeDetailSelect, flattenRecipe, ok, err } from "@/lib/api";
import { requireAdmin } from "@/lib/session";
import { toStepKind } from "@/lib/types";

type TxClient = Parameters<Parameters<typeof db.$transaction>[0]>[0];

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/recipes/[id]">
) {
  const { id } = await ctx.params;
  const recipe = await db.recipe.findUnique({
    where: { id: Number(id) },
    select: recipeDetailSelect,
  });

  if (!recipe) return err("Ricetta non trovata", 404);
  return ok(flattenRecipe(recipe));
}

export async function PUT(
  request: NextRequest,
  ctx: RouteContext<"/api/recipes/[id]">
) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await ctx.params;
  const recipeId = Number(id);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return err("Body JSON non valido");
  }

  const b = body as {
    name?: string;
    servings?: number | null;
    prep?: number | null;
    cook?: number | null;
    notes?: string | null;
    links?: string | null;
    photo?: string | null;
    categoryIds?: number[];
    tagIds?: number[];
    ingredients?: { name: string; qty?: number | null; unit?: string | null; description?: string | null; order: number }[];
    steps?: { text: string; mins?: number | null; kind?: string; order: number }[];
    photos?: { url: string; order?: number }[];
  };

  // Verifica esistenza
  const exists = await db.recipe.findUnique({ where: { id: recipeId }, select: { id: true } });
  if (!exists) return err("Ricetta non trovata", 404);

  // Aggiorna in una transazione: cancella le relazioni e le riscrive
  const recipe = await db.$transaction(async (tx: TxClient) => {
    // Elimina tutte le relazioni esistenti
    if (b.categoryIds !== undefined) {
      await tx.recipeCategory.deleteMany({ where: { recipeId } });
    }
    if (b.tagIds !== undefined) {
      await tx.recipeTag.deleteMany({ where: { recipeId } });
    }
    if (b.ingredients !== undefined) {
      await tx.ingredient.deleteMany({ where: { recipeId } });
    }
    if (b.steps !== undefined) {
      await tx.step.deleteMany({ where: { recipeId } });
    }
    if (b.photos !== undefined) {
      await tx.recipePhoto.deleteMany({ where: { recipeId } });
    }

    return tx.recipe.update({
      where: { id: recipeId },
      data: {
        ...(b.name !== undefined ? { name: b.name.trim() } : {}),
        ...(b.servings !== undefined ? { servings: b.servings } : {}),
        ...(b.prep !== undefined ? { prep: b.prep } : {}),
        ...(b.cook !== undefined ? { cook: b.cook } : {}),
        ...(b.notes !== undefined ? { notes: b.notes?.trim() || null } : {}),
        ...(b.links !== undefined ? { links: b.links?.trim() || null } : {}),
        ...(b.photo !== undefined ? { photo: b.photo } : {}),
        ...(b.categoryIds
          ? { categories: { create: b.categoryIds.map((cid) => ({ categoryId: cid })) } }
          : {}),
        ...(b.tagIds
          ? { tags: { create: b.tagIds.map((tid) => ({ tagId: tid })) } }
          : {}),
        ...(b.ingredients
          ? {
              ingredients: {
                create: b.ingredients.map((i) => ({
                  name: i.name,
                  qty: i.qty ?? null,
                  unit: i.unit ?? null,
                  description: i.description ?? null,
                  order: i.order,
                })),
              },
            }
          : {}),
        ...(b.steps
          ? {
              steps: {
                create: b.steps.map((s) => ({
                  text: s.text,
                  mins: s.mins ?? null,
                  kind: toStepKind(s.kind),
                  order: s.order,
                })),
              },
            }
          : {}),
        ...(b.photos
          ? {
              photos: {
                create: b.photos.map((p, idx) => ({
                  url: p.url,
                  order: p.order ?? idx,
                })),
              },
            }
          : {}),
      },
      select: recipeDetailSelect,
    });
  });

  // Sincronizza i nuovi nomi nel catalogo ingredienti
  if (b.ingredients) {
    const names = b.ingredients.map((i) => i.name.trim()).filter(Boolean);
    if (names.length > 0) {
      await Promise.all(
        names.map((name) =>
          db.ingredientMaster.upsert({ where: { name }, create: { name }, update: {} })
        )
      );
    }
  }

  return ok(flattenRecipe(recipe));
}

// PATCH — aggiornamento parziale (al momento solo lo stato "pronta"/published)
export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/recipes/[id]">
) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await ctx.params;
  const recipeId = Number(id);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return err("Body JSON non valido");
  }

  const { published } = body as { published?: unknown };
  if (typeof published !== "boolean") {
    return err("Il campo 'published' deve essere un booleano");
  }

  const exists = await db.recipe.findUnique({ where: { id: recipeId }, select: { id: true } });
  if (!exists) return err("Ricetta non trovata", 404);

  const updated = await db.recipe.update({
    where: { id: recipeId },
    data: { published },
    select: { id: true, published: true },
  });
  return ok(updated);
}

export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<"/api/recipes/[id]">
) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await ctx.params;
  const recipeId = Number(id);

  const exists = await db.recipe.findUnique({ where: { id: recipeId }, select: { id: true } });
  if (!exists) return err("Ricetta non trovata", 404);

  await db.recipe.delete({ where: { id: recipeId } });
  return ok({ message: "Ricetta eliminata" });
}
