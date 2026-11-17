"use client"; // gli error boundary devono essere client component

import { useEffect } from "react";
import Link from "next/link";
import { CloudOff, RotateCcw } from "lucide-react";
import { Button } from "@/components/ds/Button";
import { buttonClasses } from "@/components/ds/button-classes";
import { EmptyState } from "@/components/ds/Feedback";

/**
 * Errore in una pagina (restyle fase 8, stato 10.3): resta dentro la cornice, così la navigazione
 * funziona ancora. «Riprova» rifà il caricamento della pagina (`unstable_retry`, Next 16).
 */
export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-md pt-[8dvh]">
      <EmptyState
        icon={<CloudOff />}
        title="Qualcosa non ha funzionato"
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Button icon={<RotateCcw />} onClick={() => unstable_retry()}>
              Riprova
            </Button>
            <Link href="/ricette" className={buttonClasses("secondary")}>
              Vai alle ricette
            </Link>
          </div>
        }
      >
        La pagina non si è caricata. Di solito è la connessione: riprova tra un attimo.
      </EmptyState>
    </div>
  );
}
