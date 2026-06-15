/**
 * GET  /api/ingredients  — lista ingredienti canonici (per la combobox nel form ricette)
 * POST /api/ingredients  — crea/assicura un ingrediente canonico
 */

import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const ingredients = await db.ingredientMaster.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  return NextResponse.json(ingredients);
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body non valido" }, { status: 400 });
  }

  const { name } = body as { name?: string };
  if (!name?.trim()) {
    return NextResponse.json({ error: "Nome richiesto" }, { status: 400 });
  }

  const ingredient = await db.ingredientMaster.upsert({
    where: { name: name.trim() },
    create: { name: name.trim() },
    update: {},
    select: { id: true, name: true },
  });

  return NextResponse.json(ingredient, { status: 201 });
}
