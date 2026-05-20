/**
 * proxy.ts — Next.js 16+ (sostituisce l'obsoleto middleware.ts)
 *
 * Scopo: protezione delle PAGINE admin con redirect a /login.
 * Le API (/api/*) sono già protette a livello di route con requireAdmin()
 * e non vengono toccate qui (vedi matcher).
 *
 * Routes protette al momento:
 *   /admin/*  → richiede sessione admin valida
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decrypt } from "@/lib/session";

// Pagine che richiedono login admin
const ADMIN_PAGES = ["/admin"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminPage = ADMIN_PAGES.some((p) => pathname.startsWith(p));
  if (!isAdminPage) return NextResponse.next();

  // Verifica la sessione dal cookie (solo lettura JWT, nessuna query al DB)
  const token = request.cookies.get("admin_session")?.value;
  const session = token ? await decrypt(token) : null;

  if (!session) {
    // Redirect a /login, salva la pagina di destinazione per reindirizzare dopo il login
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Escludi esplicitamente:
     *  - /api/*            (protette per-route con requireAdmin)
     *  - /_next/static     (file statici)
     *  - /_next/image      (ottimizzazione immagini)
     *  - /favicon.ico, robots.txt, sitemap.xml
     */
    "/((?!api|_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml).*)",
  ],
};

