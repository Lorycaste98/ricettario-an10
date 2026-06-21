/**
 * POST /api/menus/[id]/reviews  — aggiunge una recensione al menu
 * DELETE /api/menus/[id]/reviews?reviewId=X — elimina recensione (admin)
 */

import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";
import { revalidateMenus } from "@/lib/queries";
import { requireAdmin } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const menuId = Number(id);
  if (isNaN(menuId)) return err("ID non valido", 400);

  const menu = await db.menu.findUnique({ where: { id: menuId }, select: { id: true } });
  if (!menu) return err("Menu non trovato", 404);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return err("Body JSON non valido");
  }

  const b = body as { nickname?: string; rating?: number; comment?: string };
  if (!b.nickname?.trim()) return err("Il campo 'nickname' è obbligatorio");
  if (!b.rating || b.rating < 1 || b.rating > 5) return err("Rating deve essere tra 1 e 5");

  const review = await db.menuReview.create({
    data: {
      menuId,
      nickname: b.nickname.trim(),
      rating: Math.round(b.rating),
      comment: b.comment?.trim() || null,
    },
    select: { id: true, nickname: true, rating: true, comment: true, createdAt: true },
  });

  revalidateMenus();
  return ok(review, 201);
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await params;
  const menuId = Number(id);
  const reviewId = Number(request.nextUrl.searchParams.get("reviewId"));
  if (isNaN(menuId) || isNaN(reviewId)) return err("ID non valido", 400);

  await db.menuReview.deleteMany({ where: { id: reviewId, menuId } });
  revalidateMenus();
  return ok({ deleted: true });
}

