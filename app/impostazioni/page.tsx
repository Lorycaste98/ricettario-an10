import type { Metadata } from "next";
import Link from "next/link";
import { ChefHat, LogIn } from "lucide-react";
import { PageHeader } from "@/components/ds/PageHeader";
import { buttonClasses } from "@/components/ds/button-classes";
import { An10Logo } from "@/components/brand/An10Logo";
import { getSession } from "@/lib/session";
import { SettingsClient } from "./SettingsClient";

export const metadata: Metadata = { title: "Impostazioni — Ricettario" };

/**
 * Impostazioni: per il visitatore è la quinta voce «Accedi» della navigazione (prima la scheda
 * «Accedi», poi le scelte del dispositivo); per l'admin sta nel blocco «Tu» della zona dietro le
 * quinte (layout). Le informazioni sulle card, che valgono per tutti, sono in Gestione → Aspetto del sito.
 */
export default async function ImpostazioniPage() {
  const session = await getSession();
  return (
    <div className="flex flex-col gap-4">
      {!session && <SignInCard />}
      <PageHeader
        title="Impostazioni"
        meta={session ? "Salvate sul tuo account, su tutti i dispositivi" : "Le scelte valgono su questo dispositivo"}
        className={!session ? "mt-2" : undefined}
      />
      <SettingsClient />
    </div>
  );
}

/**
 * 13.8 · scheda «Accedi» del visitatore: fondo `blu-800`, lo stesso della navigazione di chi è
 * entrato (D9), così la scheda anticipa com'è il sito da dentro. Il simbolo «10» in `blu-700` è un
 * filigrana (colore pieno, non trasparenza) che esce dal bordo destro.
 */
function SignInCard() {
  return (
    <section className="@container relative overflow-hidden rounded-card bg-blu-800 text-white">
      <An10Logo
        variant="simbolo"
        title=""
        className="pointer-events-none absolute -right-6 -bottom-10 h-[11rem] w-auto text-blu-700 @min-[520px]:-bottom-12 @min-[520px]:h-[13rem]"
      />
      <div className="relative flex flex-col gap-4 p-[clamp(1.25rem,5cqi,2rem)] @min-[520px]:flex-row @min-[520px]:items-center">
        <span className="grid size-14 shrink-0 place-items-center rounded-full bg-blu-700 text-white">
          <ChefHat className="size-7" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[clamp(1.375rem,5cqi,1.75rem)] leading-tight font-bold text-balance">Entra in cucina</h2>
          <p className="mt-1 text-blu-200">Entra per creare e modificare ricette e menù.</p>
        </div>
        <Link href="/login" className={buttonClasses("primary", "lg")}>
          <LogIn className="size-[1.15em]" aria-hidden /> Accedi
        </Link>
      </div>
    </section>
  );
}
