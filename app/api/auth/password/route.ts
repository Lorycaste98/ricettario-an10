/**
 * PUT /api/auth/password
 * Body: { currentPassword: string, newPassword: string }
 *
 * Cambia la password dell'admin autenticato.
 * Richiede sessione admin valida.
 */

import { type NextRequest } from "next/server";
import { compare, hash } from "bcryptjs";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { ok, err } from "@/lib/api";

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session) return err("Non autorizzato", 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return err("Body JSON non valido");
  }

  const b = body as { currentPassword?: string; newPassword?: string };

  if (!b.currentPassword || !b.newPassword) {
    return err("currentPassword e newPassword sono obbligatori");
  }
  if (b.newPassword.length < 8) {
    return err("La nuova password deve avere almeno 8 caratteri");
  }

  const admin = await db.admin.findUnique({ where: { id: session.adminId } });
  if (!admin) return err("Admin non trovato", 404);

  const valid = await compare(b.currentPassword, admin.password);
  if (!valid) return err("Password attuale non corretta", 401);

  const hashed = await hash(b.newPassword, 12);
  await db.admin.update({ where: { id: admin.id }, data: { password: hashed } });

  return ok({ message: "Password aggiornata con successo" });
}

