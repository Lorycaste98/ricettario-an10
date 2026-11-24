"use client";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ds/Button";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  /** Classi extra sul corpo scrollabile (es. `min-h-[...]` per garantire leggibilità su mobile). */
  bodyClassName?: string;
  /** Fondo fisso sotto il corpo scorrevole (es. «Mostra N ricette» del foglio filtri) */
  footer?: React.ReactNode;
  /**
   * `sheet` = foglio dal basso (filtri della libreria su contenitore stretto): attaccato al bordo
   * in basso, angoli tondi solo in alto, maniglia, sale con una transizione (`@starting-style`,
   * niente con «riduci movimento»), fondo sopra l'indicatore home (safe-area).
   */
  variant?: "dialog" | "sheet";
}

const SIZE_PX = { sm: 360, md: 560, lg: 720, xl: 900 } as const;

const noopSubscribe = () => () => {};

export function Modal({ open, onClose, title, children, size = "md", bodyClassName = "", footer, variant = "dialog" }: Props) {
  const sheet = variant === "sheet";
  const ref = useRef<HTMLDialogElement>(null);
  // Il dialog viene montato in un portale su <body>: gli antenati con
  // `backdrop-filter` (le card "vetro chiaro" della modalità cucina, la timeline)
  // creano un containing block per i figli `position: fixed` e su Safari/iPad il
  // dialog veniva centrato — e ritagliato — dentro la card invece che nel viewport.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open) el.showModal();
    else el.close();
  }, [open]);

  if (!open || !mounted) return null;

  return createPortal(
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}
      className={
        sheet
          ? "ds fixed inset-x-0 bottom-0 z-50 rounded-t-dlg border border-b-0 border-blu-150 bg-white p-0 text-blu-950 shadow-[0_-12px_40px_oklch(25%_0.038_228/.2)] transition-transform duration-300 ease-[cubic-bezier(.32,.72,0,1)] backdrop:bg-blu-950/45 open:flex open:flex-col motion-reduce:transition-none starting:open:translate-y-full"
          : "ds fixed inset-0 z-50 m-auto rounded-dlg border border-blu-150 bg-white p-0 text-blu-950 shadow-[0_18px_50px_oklch(25%_0.038_228/.22)] backdrop:bg-blu-950/45 open:flex open:flex-col"
      }
      style={
        sheet
          ? {
              width: `min(${SIZE_PX[size]}px, 100vw)`,
              maxWidth: "100vw",
              maxHeight: "calc(100dvh - env(safe-area-inset-top, 0px) - 1.5rem)",
              margin: "auto auto 0",
            }
          : {
              width: `min(${SIZE_PX[size]}px, calc(100vw - 2rem))`,
              maxHeight: "calc(100dvh - 2rem)",
            }
      }
    >
      {sheet && <span aria-hidden className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-blu-200" />}
      {title && (
        <div className="flex items-center justify-between gap-3 border-b border-blu-150 px-5 py-3 sm:px-6">
          <h2 className="text-(length:--fs-sec) font-bold">{title}</h2>
          {/* 10.1 · chiudi: bersaglio pieno, non solo la ✕ */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi"
            className="-mr-1.5 flex size-(--h-icon) shrink-0 items-center justify-center rounded-full text-blu-800 hover:bg-blu-100"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
      )}
      {/* `flex-auto`, NON `flex-1`: il dialog ha altezza automatica (solo maxHeight) e con
          `flex-basis: 0%` + overflow Safari/iPad collassa il corpo a 0 (si vedeva solo il titolo).
          Base = contenuto; `min-h-0` lo lascia restringere e scorrere quando tocca maxHeight. */}
      <div className={`min-h-0 flex-auto overflow-y-auto p-5 sm:p-6 ${bodyClassName}`}>{children}</div>
      {footer && (
        <div
          className="flex shrink-0 gap-2 border-t border-blu-150 px-5 pt-3 sm:px-6"
          // foglio: il fondo resta sopra l'indicatore home dell'iPhone
          style={{ paddingBottom: sheet ? "calc(0.75rem + env(safe-area-inset-bottom, 0px))" : "0.75rem" }}
        >
          {footer}
        </div>
      )}
    </dialog>,
    document.body
  );
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Elimina",
  loading = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      {/* 10.1 · finestra di conferma */}
      <p className="text-grigio">{message}</p>
      <div className="mt-5 flex justify-end gap-2.5">
        <Button variant="secondary" onClick={onClose} disabled={loading}>Annulla</Button>
        <Button variant="dangerSolid" onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
      </div>
    </Modal>
  );
}

