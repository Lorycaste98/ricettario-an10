/**
 * GET  /api/categories  — lista tutte le categorie (con conteggio ricette)
 * POST /api/categories  — crea categoria
 */

import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";
import { revalidateRecipes } from "@/lib/queries";
import { requireAdmin } from "@/lib/session";

export async function GET() {
  const categories = await db.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { recipes: true } } },
  });
  return ok(categories);
}

export async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return err("Body JSON non valido");
  }

  const b = body as { name?: string; color?: string };

  if (!b.name?.trim()) return err("Il campo 'name' è obbligatorio");
  if (!b.color?.trim()) return err("Il campo 'color' è obbligatorio");

  try {
    const category = await db.category.create({
      data: { name: b.name.trim(), color: b.color.trim() },
    });
    revalidateRecipes();
    return ok(category, 201);
  } catch {
    return err("Esiste già una categoria con questo nome", 409);
  }
}

