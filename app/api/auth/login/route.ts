/**
 * POST /api/auth/login
 * Body: { username: string, password: string }
 * Risposta: { isAdmin: true, username: string }
 */

import { type NextRequest } from "next/server";
import { compare } from "bcryptjs";
import { db } from "@/lib/db";
import { createSession } from "@/lib/session";
import { ok, err } from "@/lib/api";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return err("Body JSON non valido");
  }

  const b = body as { username?: string; password?: string };

  if (!b.username?.trim() || !b.password) {
    return err("username e password sono obbligatori");
  }

  try {
    const admin = await db.admin.findUnique({
      where: { username: b.username.trim() },
      select: { id: true, username: true, password: true, role: true, firstLogin: true, dedication: true },
    });

    // Usa compare anche se l'admin non esiste (timing-safe)
    const dummyHash =
      "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";
    const passwordMatches = await compare(
      b.password,
      admin?.password ?? dummyHash
    );

    if (!admin || !passwordMatches) {
      return err("Credenziali non valide", 401);
    }

    await createSession({ adminId: admin.id, username: admin.username, role: admin.role });

    return ok({
      isAdmin: true,
      username: admin.username,
      role: admin.role,
      firstLogin: admin.firstLogin,
      dedication: admin.dedication,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[POST /api/auth/login] errore:", message);
    return err(`Errore interno del server: ${message}`, 500);
  }
}

