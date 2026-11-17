"use client";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import type { CSSProperties, ReactNode } from "react";
import { useNavHistoryTracker } from "@/lib/nav-history";
import { NavRail, TabBar } from "@/components/shell/AppNav";
import { ADMIN_FORM_ROUTE } from "@/components/admin/admin-sections";
import { CookingMiniBar, CookingRow, useHasCooking } from "@/components/shell/CookingBar";

/**
 * Cornice dell'app (restyle, fase 2 — DESIGN.md D1).
 * - Navigazione: barra laterale da 700px in su, barra in basso sotto (unico punto di rottura
 *   legato allo schermo). Tutto il resto decide in base allo spazio del contenitore: `main` è
 *   un container (`@container`), quindi le pagine usano le varianti `@min-[620px]:` ecc.
 * - «Sto cucinando»: fila blu in cima (contenitore largo) o mini-barra (stretto).
 * - Sfondo: le pagine già rifatte (`RESTYLED`) hanno il fondo pieno `blu-50`; le altre tengono
 *   ancora il vecchio gradiente fisso (`.page-bg`) finché non vengono rifatte, perché hanno
 *   testi chiari pensati per quel fondo. A restyle finito `RESTYLED` e `.page-bg` spariscono.
 * - Gestione (`/admin/*`, D7): barra laterale inchiostro-indaco `adm-900` e fondo `adm-50`; la
 *   sotto-navigazione di Gestione sta in `app/admin/layout.tsx`.
 * La home pubblica `/` resta fuori dalla cornice (ha la sua vetrina).
 */
// Voce esatta ("/ricette") o con tutte le sotto-pagine ("/ricette/*")
const RESTYLED: string[] = ["/prova-elementi", "/ricette/*", "/preferiti", "/menu/*", "/admin/*"];

function isRestyled(pathname: string) {
  return RESTYLED.some((p) =>
    p.endsWith("/*") ? pathname === p.slice(0, -2) || pathname.startsWith(p.slice(0, -1)) : pathname === p
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // Registra la provenienza di ogni pagina: la usa BackLink per tornare davvero indietro
  useNavHistoryTracker();
  const cooking = useHasCooking();

  if (pathname === "/") {
    return <div className="page-bg min-h-dvh">{children}</div>;
  }

  const restyled = isRestyled(pathname);
  // Gestione (D7): stessa cornice con la barra inchiostro-indaco e i fondi freddi
  const admin = pathname === "/admin" || pathname.startsWith("/admin/");

  return (
    <div
      className={clsx("flex min-h-dvh [--tabs-h:3.75rem]", restyled ? (admin ? "bg-adm-50" : "bg-blu-50") : "page-bg")}
      style={
        {
          // spazio in fondo su telefono: barra in basso (+ mini-barra se si sta cucinando)
          "--bottom-space": cooking
            ? "calc(var(--tabs-h) + env(safe-area-inset-bottom, 0px) + 4.75rem)"
            : "calc(var(--tabs-h) + env(safe-area-inset-bottom, 0px) + 1rem)",
        } as CSSProperties
      }
    >
      {/* copre la zona del notch / Dynamic Island su telefono, dove non c'è barra in alto */}
      <div
        aria-hidden
        className={clsx("pointer-events-none fixed inset-x-0 top-0 z-50 min-[700px]:hidden", admin ? "bg-adm-900" : "bg-blu-800")}
        style={{ height: "env(safe-area-inset-top, 0px)" }}
      />
      <NavRail adminArea={admin} />
      <div className="@container flex min-w-0 flex-1 flex-col">
        {/* nei form la barra 11.1 resta in alto: la fila «Sto cucinando» lì scorre via con la pagina */}
        <CookingRow sticky={!ADMIN_FORM_ROUTE.test(pathname)} />
        <main
          className={clsx(
            "mx-auto w-full max-w-7xl flex-1 px-4 pt-8 sm:px-6",
            "pb-(--bottom-space) min-[700px]:pb-8"
          )}
          style={{ paddingTop: "max(2rem, calc(env(safe-area-inset-top, 0px) + 1rem))" }}
        >
          {children}
        </main>
        <CookingMiniBar />
      </div>
      <TabBar />
    </div>
  );
}
