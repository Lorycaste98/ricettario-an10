/**
 * GET /api/auth/me
 * Ritorna lo stato auth corrente.
 * La UI usa questa route per sapere se mostrare i controlli admin.
 *
 * Risposta autenticato:  { isAdmin: true,  username: string }
 * Risposta non autenticato: { isAdmin: false }
 */

import { getSession } from "@/lib/session";
import { ok } from "@/lib/api";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return ok({ isAdmin: false });
  }

  return ok({ isAdmin: true, username: session.username });
}

