/**
 * GET  /api/tags  — lista tutti i tag (con conteggio ricette)
 * POST /api/tags  — crea tag
 */

import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";
import { requireAdmin } from "@/lib/session";

export async function GET() {
  const tags = await db.tag.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { recipes: true } } },
  });
  return ok(tags);
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

  const b = body as { name?: string };
  if (!b.name?.trim()) return err("Il campo 'name' è obbligatorio");

  try {
    const tag = await db.tag.create({ data: { name: b.name.trim() } });
    return ok(tag, 201);
  } catch {
    return err("Esiste già un tag con questo nome", 409);
  }
}

