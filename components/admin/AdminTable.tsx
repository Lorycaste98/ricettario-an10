"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { Trash2 } from "lucide-react";
import { IconButton } from "@/components/ds/Button";
import { ConfirmModal } from "@/components/ui/Modal";
import { An10Logo } from "@/components/brand/An10Logo";

/**
 * Tabelle di Gestione (12.1, 12.2): scheda bianca con riga di intestazione `adm-100` e righe
 * separate da filetti. È un `@container/t`: le colonne secondarie (`col`) compaiono solo da 600px
 * di tabella, sotto quella misura le stesse informazioni vanno nella riga del nome.
 * Azioni di riga = icone piccole 3.12 (`IconButton size="row"`, `rowIconCls` per i link).
 */
export function AdminTable({ head, children, className }: { head?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={clsx("@container/t overflow-hidden rounded-card border border-blu-150 bg-white", className)}>
      {head && (
        <div className="hidden items-center gap-3 border-b border-blu-150 bg-adm-100 px-3 py-2 text-[0.6875rem] font-bold tracking-[0.08em] text-grigio uppercase @min-[600px]/t:flex">
          {head}
        </div>
      )}
      <ul className="divide-y divide-blu-150">{children}</ul>
    </div>
  );
}

/** Colonna visibile solo con la tabella larga (intestazione e celle usano la stessa classe) */
export const colCls = "hidden shrink-0 @min-[600px]/t:block";

/** Riga di tabella: `picked` = selezionata (fondo arancio chiaro, 12.2) */
export function AdminRow({ children, picked = false, className }: { children: ReactNode; picked?: boolean; className?: string }) {
  return (
    <li className={clsx("flex min-h-14 items-center gap-2.5 px-3 py-2 transition-colors @min-[600px]/t:gap-3", picked ? "bg-arancio-50" : "hover:bg-blu-50", className)}>
      {children}
    </li>
  );
}

/** Miniatura quadrata di riga: foto, altrimenti il logo AN10 su blu-100 (come le card) */
export function AdminThumb({ src, alt }: { src: string | null; alt: string }) {
  return (
    <div className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-[0.625rem] bg-blu-100 text-blu-600">
      {src ? <Image src={src} alt={alt} fill sizes="40px" className="object-cover" /> : <An10Logo variant="simbolo" title="" className="size-6" />}
    </div>
  );
}

/** Messaggio a tutta riga (nessun risultato) */
export function AdminEmptyRow({ children }: { children: ReactNode }) {
  return <li className="px-3 py-10 text-center text-grigio">{children}</li>;
}

/** Cestino di riga con finestra di conferma (10.1); chiama `DELETE url` e poi `onDeleted` o il refresh. */
export function DeleteRowButton({
  url,
  title,
  message = "L'azione è irreversibile.",
  label = "Elimina",
  onDeleted,
}: {
  url: string;
  title: string;
  message?: string;
  label?: string;
  onDeleted?: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const confirm = async () => {
    setBusy(true);
    setError(false);
    const res = await fetch(url, { method: "DELETE" }).catch(() => null);
    setBusy(false);
    if (!res?.ok) {
      setError(true);
      return;
    }
    setOpen(false);
    onDeleted?.();
    router.refresh();
  };

  return (
    <>
      <IconButton label={label} tone="danger" size="row" onClick={() => setOpen(true)}>
        <Trash2 />
      </IconButton>
      <ConfirmModal
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={confirm}
        loading={busy}
        title={title}
        message={error ? "Non è stato possibile eliminare. Riprova." : message}
      />
    </>
  );
}
