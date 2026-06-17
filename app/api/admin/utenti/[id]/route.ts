/**
 * PATCH /api/admin/utenti/[id] — aggiorna la dedica di un account admin
 * Body: { dedication?: string | null }
 */

import { type NextRequest } from "next/server";
import { requireSuperAdmin } from "@/lib/session";
import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireSuperAdmin();
  if (guard) return guard;

  const { id } = await params;
  const adminId = parseInt(id, 10);
  if (isNaN(adminId)) return err("ID non valido");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return err("Body JSON non valido");
  }

  const b = body as { dedication?: string | null };

  const updated = await db.admin.update({
    where: { id: adminId },
    data: { dedication: b.dedication ?? null },
    select: { id: true, username: true, dedication: true },
  });

  return ok(updated);
}
