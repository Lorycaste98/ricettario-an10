/**
 * GET /api/menus/[id]/guest-card — foglio «Per gli ospiti» del menù (admin): quello salvato o,
 *   se non c'è, una proposta dalle categorie delle ricette (`defaultGuestCard`), più le ricette
 *   del menù in ordine (servono alla finestra per i nomi e per le «da sistemare").
 * PUT /api/menus/[id]/guest-card — salva il foglio (admin), normalizzato da `normalizeGuestCard`.
 *
 * Admin-only e non cachato: nessun `revalidateMenus()`. Se la tabella `MenuGuestCard` manca
 * (migrazione non ancora applicata) GET ripiega sulla proposta e PUT risponde 503: il PDF si
 * genera lo stesso, solo senza ricordare l'organizzazione.
 */

import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";
import { requireAdmin } from "@/lib/session";
import { defaultGuestCard, normalizeGuestCard } from "@/lib/menu-guest-card";
import { guestMenuData, storedGuestCard } from "@/lib/guest-menu";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await params;
  const menuId = Number(id);
  if (isNaN(menuId)) return err("ID non valido", 400);

  const data = await guestMenuData({ id: menuId });
  if (!data) return err("Menu non trovato", 404);
  const { recipes, theme } = data;
  const { card, canSave } = await storedGuestCard(menuId, recipes, theme);
  // token del link pubblico `/ospiti/[token]` (lo stesso delle recensioni: stesso pubblico)
  return ok({ card: card ?? defaultGuestCard(recipes, theme), isDefault: !card, canSave, recipes, token: data.menu.reviewToken });
}

export async function PUT(request: NextRequest, { params }: Params) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await params;
  const menuId = Number(id);
  if (isNaN(menuId)) return err("ID non valido", 400);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return err("Body JSON non valido");
  }

  const menu = await guestMenuData({ id: menuId });
  if (!menu) return err("Menu non trovato", 404);
  const card = normalizeGuestCard(body, new Set(menu.recipes.map((r) => r.id)), menu.theme);
  if (!card) return err("Foglio non valido");

  // Prisma vuole un JSON "puro": la forma è già validata
  const data = JSON.parse(JSON.stringify(card));
  try {
    await db.menuGuestCard.upsert({
      where: { menuId },
      create: { menuId, data },
      update: { data },
    });
  } catch (e) {
    console.error("MenuGuestCard non scrivibile (migrazione applicata?)", e);
    return err("Organizzazione non salvata", 503);
  }
  return ok(card);
}
