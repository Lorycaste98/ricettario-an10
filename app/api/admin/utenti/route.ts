/**
 * GET /api/admin/utenti — lista tutti gli account admin (solo superadmin)
 * POST /api/admin/utenti — crea un nuovo account (solo superadmin)
 */

import { type NextRequest } from "next/server";
import { hash } from "bcryptjs";
import { requireSuperAdmin } from "@/lib/session";
import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";

export async function GET() {
  const guard = await requireSuperAdmin();
  if (guard) return guard;

  const admins = await db.admin.findMany({
    select: { id: true, username: true, role: true, firstLogin: true, dedication: true },
    orderBy: { id: "asc" },
  });

  return ok(admins);
}

export async function POST(request: NextRequest) {
  const guard = await requireSuperAdmin();
  if (guard) return guard;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return err("Body JSON non valido");
  }

  const b = body as { username?: string; password?: string; role?: string; dedication?: string };

  if (!b.username?.trim()) return err("Username obbligatorio");
  if (!b.password || b.password.length < 6) return err("Password di almeno 6 caratteri");

  const role = b.role === "SUPERADMIN" ? "SUPERADMIN" : "ADMIN";

  const existing = await db.admin.findUnique({ where: { username: b.username.trim() } });
  if (existing) return err("Username già in uso", 409);

  const hashed = await hash(b.password, 10);

  const created = await db.admin.create({
    data: {
      username: b.username.trim(),
      password: hashed,
      role,
      dedication: b.dedication?.trim() || null,
    },
    select: { id: true, username: true, role: true, firstLogin: true, dedication: true },
  });

  return ok(created, 201);
}
