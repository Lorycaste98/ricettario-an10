/**
 * PUT /api/auth/username
 * Body: { currentPassword: string, newUsername: string }
 *
 * Cambia lo username dell'admin autenticato.
 * Richiede la password attuale per conferma e ricrea la sessione
 * con il nuovo username (presente nel JWT).
 */

import { type NextRequest } from "next/server";
import { compare } from "bcryptjs";
import { db } from "@/lib/db";
import { getSession, createSession } from "@/lib/session";
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

  const b = body as { currentPassword?: string; newUsername?: string };
  const newUsername = b.newUsername?.trim();

  if (!b.currentPassword || !newUsername) {
    return err("currentPassword e newUsername sono obbligatori");
  }
  if (newUsername.length < 3) {
    return err("Lo username deve avere almeno 3 caratteri");
  }

  const admin = await db.admin.findUnique({ where: { id: session.adminId } });
  if (!admin) return err("Admin non trovato", 404);

  const valid = await compare(b.currentPassword, admin.password);
  if (!valid) return err("Password attuale non corretta", 401);

  if (newUsername === admin.username) {
    return err("Il nuovo username coincide con quello attuale");
  }

  const existing = await db.admin.findUnique({ where: { username: newUsername } });
  if (existing) return err("Username già in uso", 409);

  await db.admin.update({ where: { id: admin.id }, data: { username: newUsername } });

  // Ricrea la sessione: lo username è memorizzato nel JWT
  await createSession({ adminId: admin.id, username: newUsername, role: admin.role });

  return ok({ message: "Username aggiornato con successo", username: newUsername });
}
