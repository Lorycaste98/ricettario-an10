"use client";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import type { CSSProperties, ReactNode } from "react";
import { useNavHistoryTracker } from "@/lib/nav-history";
import { NavRail, TabBar } from "@/components/shell/AppNav";
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
 * La home pubblica `/` resta fuori dalla cornice (ha la sua vetrina).
 */
const RESTYLED: string[] = ["/prova-elementi"];

function isRestyled(pathname: string) {
  return RESTYLED.some((p) => pathname === p || pathname.startsWith(p + "/"));
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

  return (
    <div
      className={clsx("flex min-h-dvh [--tabs-h:3.75rem]", restyled ? "bg-blu-50" : "page-bg")}
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
        className="pointer-events-none fixed inset-x-0 top-0 z-50 bg-blu-800 min-[700px]:hidden"
        style={{ height: "env(safe-area-inset-top, 0px)" }}
      />
      <NavRail />
      <div className="@container flex min-w-0 flex-1 flex-col">
        <CookingRow />
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
