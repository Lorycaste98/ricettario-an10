/**
 * POST /api/auth/logout
 * Cancella il cookie di sessione
 */
import { deleteSession } from "@/lib/session";
import { ok } from "@/lib/api";
export async function POST() {
  await deleteSession();
  return ok({ message: "Logout effettuato" });
}
