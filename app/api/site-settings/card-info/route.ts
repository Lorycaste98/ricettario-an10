/**
 * PUT /api/site-settings/card-info — informazioni delle card per tutti (admin e superadmin).
 * Corpo: `{ recipe: {...}, menu: {...} }`, normalizzato da `normalizeCardConfig`. Scade subito
 * la cache del layout (`site-settings`): al prossimo caricamento tutti vedono le card nuove.
 */
import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";
import { requireAdmin } from "@/lib/session";
import { CARD_CONFIG_KEY, SITE_SETTINGS_TAG, normalizeCardConfig } from "@/lib/card-config";

export async function PUT(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return err("JSON non valido");
  }
  const value = normalizeCardConfig(body);
  await db.siteSetting.upsert({
    where: { key: CARD_CONFIG_KEY },
    create: { key: CARD_CONFIG_KEY, value },
    update: { value },
  });
  revalidateTag(SITE_SETTINGS_TAG, { expire: 0 });
  return ok(value);
}
