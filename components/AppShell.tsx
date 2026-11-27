"use client";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import type { CSSProperties, ReactNode } from "react";
import { useNavHistoryTracker } from "@/lib/nav-history";
import { useCompactAttribute, usePreferenceSync } from "@/lib/preferences";
import { NavRail, TabBar, navToneFor } from "@/components/shell/AppNav";
import { useAuth } from "@/components/AuthProvider";
import { ADMIN_FORM_ROUTE } from "@/components/admin/admin-sections";
import { CookingRow } from "@/components/shell/CookingBar";
import { An10Logo } from "@/components/brand/An10Logo";

// Pagine senza il logo di testata: la vetrina e l'accesso hanno il loro logo grande, i form la barra 11.1 in cima
const NO_BRAND_ROUTE = /^\/(login\/?)?$/;

/**
 * Cornice dell'app (restyle, fase 2 — DESIGN.md D1).
 * - Navigazione: barra laterale da 700px in su, barra in basso sotto (unico punto di rottura
 *   legato allo schermo). Tutto il resto decide in base allo spazio del contenitore: `main` è
 *   un container (`@container`), quindi le pagine usano le varianti `@min-[620px]:` ecc.
 * - «Sto cucinando»: fila blu in cima, una scheda per ricetta.
 * - Sfondo pieno `blu-50` (in Gestione `adm-50`).
 * - Tono della navigazione = chi sei (D9, `navToneFor` in AppNav): visitatore barra chiara,
 *   entrato blu scuro, «dietro le quinte» (`/admin/*` e, per l'admin, `/impostazioni`, D7) indaco
 *   `adm-900` con fondo `adm-50`. La sotto-navigazione di Gestione sta in `AdminFrame`.
 * - La fascia del notch resta **sempre scura** (blu-800, indaco dietro le quinte), anche per il
 *   visitatore con la barra chiara: da app installata la barra di stato è trasparente con il testo
 *   bianco (`black-translucent`), su una fascia chiara non si leggerebbe.
 * La vetrina pubblica `/` sta dentro la cornice come le altre pagine (fase 6).
 * - **Logo di testata** (9.7) in cima a `main`, a tutte le larghezze e su tutte le pagine tranne vetrina,
 *   accesso e form: sta nella cornice e non nella pagina, così non sparisce cambiando pagina né
 *   durante il caricamento (gli skeleton gli stanno sotto). Scorre via con la pagina.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // Registra la provenienza di ogni pagina: la usa BackLink per tornare davvero indietro
  useNavHistoryTracker();
  // admin: preferenze della pagina Impostazioni allineate con l'account
  usePreferenceSync();
  useCompactAttribute();
  const { isAdmin, loading } = useAuth();

  // Tono della navigazione (D9); dietro le quinte (D7) anche fondi freddi
  const tone = navToneFor(pathname, isAdmin, loading);
  const admin = tone === "backstage";

  return (
    <div
      className={clsx("flex min-h-dvh [--tabs-h:3.75rem]", admin ? "bg-adm-50" : "bg-blu-50")}
      style={
        {
          // spazio in fondo su telefono: barra in basso + la collinetta della lente al centro, che sale sopra la barra
          "--bottom-space": "calc(var(--tabs-h) + env(safe-area-inset-bottom, 0px) + 2.5rem)",
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
      <NavRail tone={tone} />
      <div className="@container flex min-w-0 flex-1 flex-col">
        {/* «Sto cucinando» (8.4) a tutte le larghezze; nei form la barra 11.1 resta in alto: la fila lì scorre via con la pagina */}
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
          {!NO_BRAND_ROUTE.test(pathname) && !ADMIN_FORM_ROUTE.test(pathname) && (
            <BrandHeader className={clsx("mb-4", admin ? "text-adm-900" : "text-blu-800")} />
          )}
          {children}
        </main>
      </div>
      <TabBar tone={tone} />
    </div>
  );
}

/** 9.7 · logo di testata: anche `SearchOverlay` lo usa, nello stesso punto, così aprendo la ricerca resta fermo */
export function BrandHeader({ className }: { className?: string }) {
  return (
    <div className={clsx("-mt-3 flex justify-center", className)}>
      <An10Logo variant="orizzontale" title="Ricettario AN10" className="h-8 w-auto" />
    </div>
  );
}
