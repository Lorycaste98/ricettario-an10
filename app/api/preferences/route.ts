/**
 * GET/PUT /api/preferences — preferenze della pagina Impostazioni dell'admin loggato
 * (`AdminPreference`, una riga per account). I visitatori restano su localStorage.
 * `data` = { chiave: valore } con le sole chiavi di `PREF_KEYS`; PUT sostituisce tutto
 * (il client manda sempre lo stato completo). GET senza riga → `{ data: null }`: il client
 * allora carica le scelte che ha sul dispositivo (primo accesso dopo l'introduzione).
 */

import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";
import { getSession } from "@/lib/session";
import { PREF_KEYS } from "@/lib/preference-keys";

const ALLOWED = new Set<string>(PREF_KEYS);

export async function GET() {
  const session = await getSession();
  if (!session) return err("Non autorizzato", 401);
  const row = await db.adminPreference.findUnique({ where: { adminId: session.adminId }, select: { data: true } });
  return ok({ data: row?.data ?? null });
}

export async function PUT(req: Request) {
  const session = await getSession();
  if (!session) return err("Non autorizzato", 401);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return err("JSON non valido");
  }
  const raw = (body as { data?: unknown })?.data;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return err("Dati non validi");

  // solo le chiavi note, valori semplici (stringhe, numeri, booleani, null o liste di stringhe)
  const data: Record<string, Prisma.InputJsonValue | null> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!ALLOWED.has(k)) continue;
    const simple = v === null || ["string", "number", "boolean"].includes(typeof v);
    const list = Array.isArray(v) && v.length <= 10 && v.every((x) => typeof x === "string");
    if (simple || list) data[k] = v as Prisma.InputJsonValue | null;
  }

  await db.adminPreference.upsert({
    where: { adminId: session.adminId },
    create: { adminId: session.adminId, data },
    update: { data },
  });
  return ok({ ok: true });
}
