import Link from "next/link";
import type { Metadata } from "next";
import { SearchX } from "lucide-react";
import { buttonClasses } from "@/components/ds/button-classes";
import { EmptyState } from "@/components/ds/Feedback";

export const metadata: Metadata = { title: "Pagina non trovata — Ricettario" };

/** Pagina inesistente, ricetta o menù non pronto per i visitatori (restyle fase 8, stato 10.3) */
export default function NotFound() {
  return (
    <div className="mx-auto max-w-md pt-[8dvh]">
      <EmptyState
        icon={<SearchX />}
        title="Pagina non trovata"
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Link href="/ricette" className={buttonClasses("primary")}>
              Vai alle ricette
            </Link>
            <Link href="/menu" className={buttonClasses("secondary")}>
              Vai ai menù
            </Link>
          </div>
        }
      >
        Il link potrebbe essere vecchio, oppure la ricetta o il menù non sono ancora pronti.
      </EmptyState>
    </div>
  );
}
