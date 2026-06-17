/**
 * PUT /api/auth/first-login
 * Segna il primo accesso come visto per l'utente corrente.
 */

import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";

export async function PUT() {
  const session = await getSession();
  if (!session) return err("Non autorizzato", 401);

  await db.admin.update({
    where: { id: session.adminId },
    data: { firstLogin: false },
  });

  return ok({ ok: true });
}
