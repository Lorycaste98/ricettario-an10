"use client";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import type { CSSProperties, ReactNode } from "react";
import { useNavHistoryTracker } from "@/lib/nav-history";
import { usePreferenceSync } from "@/lib/preferences";
import { NavRail, TabBar } from "@/components/shell/AppNav";
import { ADMIN_FORM_ROUTE } from "@/components/admin/admin-sections";
import { CookingMiniBar, CookingRow, useHasCooking } from "@/components/shell/CookingBar";

/**
 * Cornice dell'app (restyle, fase 2 — DESIGN.md D1).
 * - Navigazione: barra laterale da 700px in su, barra in basso sotto (unico punto di rottura
 *   legato allo schermo). Tutto il resto decide in base allo spazio del contenitore: `main` è
 *   un container (`@container`), quindi le pagine usano le varianti `@min-[620px]:` ecc.
 * - «Sto cucinando»: fila blu in cima (contenitore largo) o mini-barra (stretto).
 * - Sfondo pieno `blu-50` (in Gestione `adm-50`).
 * - Gestione (`/admin/*`, D7): barra laterale inchiostro-indaco `adm-900` e fondo `adm-50`; la
 *   sotto-navigazione di Gestione sta in `app/admin/layout.tsx`.
 * La vetrina pubblica `/` sta dentro la cornice come le altre pagine (fase 6).
 */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // Registra la provenienza di ogni pagina: la usa BackLink per tornare davvero indietro
  useNavHistoryTracker();
  // admin: preferenze della pagina Impostazioni allineate con l'account
  usePreferenceSync();
  const cooking = useHasCooking();

  // Gestione (D7): stessa cornice con la barra inchiostro-indaco e i fondi freddi
  const admin = pathname === "/admin" || pathname.startsWith("/admin/");

  return (
    <div
      className={clsx("flex min-h-dvh [--tabs-h:3.75rem]", admin ? "bg-adm-50" : "bg-blu-50")}
      style={
        {
          // spazio in fondo su telefono: barra in basso (+ mini-barra se si sta cucinando)
          "--bottom-space": cooking
            ? "calc(var(--tabs-h) + env(safe-area-inset-bottom, 0px) + 4.75rem)"
            : "calc(var(--tabs-h) + env(safe-area-inset-bottom, 0px) + 1rem)",
        } as CSSProperties
      }
    >
      {/* Copre la zona del notch / Dynamic Island e, da app installata (barra di stato trasparente,
          `appleWebApp` in app/layout.tsx), la barra di stato di iPhone e iPad. Nel browser è alta 0. */}
      <div
        aria-hidden
        className={clsx("pointer-events-none fixed inset-x-0 top-0 z-50", admin ? "bg-adm-900" : "bg-blu-800")}
        style={{ height: "env(safe-area-inset-top, 0px)" }}
      />
      <NavRail adminArea={admin} />
      <div className="@container flex min-w-0 flex-1 flex-col">
        {/* nei form la barra 11.1 resta in alto: la fila «Sto cucinando» lì scorre via con la pagina */}
        <CookingRow sticky={!ADMIN_FORM_ROUTE.test(pathname)} />
        <main
          className={clsx(
            // --main-px = margine laterale; a destra si allarga sotto il notch (iPhone in orizzontale).
            // FormBar e FormSkeleton lo annullano con la stessa espressione.
            "mx-auto w-full max-w-7xl flex-1 pt-8 [--main-px:1rem] sm:[--main-px:1.5rem]",
            "pb-(--bottom-space) min-[700px]:pb-8"
          )}
          style={{
            paddingTop: "max(2rem, calc(env(safe-area-inset-top, 0px) + 1rem))",
            paddingLeft: "var(--main-px)",
            paddingRight: "max(var(--main-px), env(safe-area-inset-right, 0px))",
          }}
        >
          {children}
        </main>
        <CookingMiniBar />
      </div>
      <TabBar adminArea={admin} />
    </div>
  );
}
