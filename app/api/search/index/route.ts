/**
 * GET /api/search/index — indice della ricerca globale (vedi `lib/search-index.ts`).
 * Il browser lo scarica una volta per sessione di pagina e cerca in locale.
 */
import { getSession } from "@/lib/session";
import { getSearchIndex } from "@/lib/search-index";

export async function GET() {
  const isAdmin = !!(await getSession());
  const index = await getSearchIndex(isAdmin);
  return Response.json(index, {
    // Dipende dal cookie di sessione: mai in cache condivise
    headers: { "Cache-Control": "private, no-store" },
  });
}
