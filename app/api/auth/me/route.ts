/**
 * GET /api/auth/me
 * Ritorna lo stato auth corrente.
 * La UI usa questa route per sapere se mostrare i controlli admin.
 *
 * Risposta autenticato:  { isAdmin: true,  username: string }
 * Risposta non autenticato: { isAdmin: false }
 */

import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { ok } from "@/lib/api";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return ok({ isAdmin: false });
  }

  const [admin, recipeReview, menuReview] = await Promise.all([
    db.admin.findUnique({
      where: { id: session.adminId },
      select: { firstLogin: true, dedication: true, role: true },
    }),
    db.review.findFirst({ select: { id: true } }),
    db.menuReview.findFirst({ select: { id: true } }),
  ]);

  return ok({
    isAdmin: true,
    username: session.username,
    role: admin?.role ?? session.role,
    firstLogin: admin?.firstLogin ?? false,
    dedication: admin?.dedication ?? null,
    hasReviews: Boolean(recipeReview || menuReview),
  });
}

