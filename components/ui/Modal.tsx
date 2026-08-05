"use client";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Button } from "./Button";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  /** Classi extra sul corpo scrollabile (es. `min-h-[...]` per garantire leggibilità su mobile). */
  bodyClassName?: string;
}

const SIZE_PX = { sm: 360, md: 560, lg: 720, xl: 900 } as const;

const noopSubscribe = () => () => {};

export function Modal({ open, onClose, title, children, size = "md", bodyClassName = "" }: Props) {
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
      className="fixed inset-0 z-50 m-auto rounded-2xl border border-white/30 bg-white/85 backdrop-blur-xl p-0 shadow-2xl backdrop:bg-sky-950/40 open:flex open:flex-col"
      style={{
        width: `min(${SIZE_PX[size]}px, calc(100vw - 2rem))`,
        maxHeight: "calc(100dvh - 2rem)",
      }}
    >
      {title && (
        <div className="flex items-center justify-between border-b border-white/30 px-5 py-3.5 sm:px-6 sm:py-4">
          <h2 className="text-base sm:text-lg font-semibold text-sky-950">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-sky-600 hover:bg-white/50 hover:text-sky-900">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      <div className={`flex-1 overflow-y-auto p-5 sm:p-6 ${bodyClassName}`}>{children}</div>
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
      <p className="text-sm text-sky-800">{message}</p>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose} disabled={loading}>Annulla</Button>
        <Button variant="danger" onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
      </div>
    </Modal>
  );
}

