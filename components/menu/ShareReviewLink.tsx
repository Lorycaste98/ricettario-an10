"use client";
import { useState } from "react";
import Image from "next/image";
import { Check, Copy, QrCode, Share2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ds/Button";

/**
 * 13.5 · link per le recensioni degli ospiti (solo admin). Bottone «Recensioni ospiti» nella riga
 * azioni del dettaglio menù; la finestra mostra il QR, il link, «Copia» e «Invia» (condivisione
 * di sistema, dove c'è).
 */
export function ShareReviewLink({ url, qrDataUrl, menuName }: { url: string; qrDataUrl: string; menuName?: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const share = () => {
    void navigator.share({ title: menuName ? `Vota il menù «${menuName}»` : "Vota il menù", url }).catch(() => {});
  };

  return (
    <>
      <Button variant="secondary" icon={<QrCode />} onClick={() => setOpen(true)}>
        Recensioni ospiti
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Recensioni degli ospiti" size="sm">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-[0.9375rem] text-grigio">
            Chi apre il link o inquadra il QR vota da 1 a 10 le ricette del menù, senza accedere.
          </p>
          <Image src={qrDataUrl} alt="QR per le recensioni" width={200} height={200} className="rounded-ctl border border-blu-150" unoptimized />
          <p className="w-full truncate rounded-ctl bg-blu-100 px-3 py-2 text-[0.8125rem] text-blu-800">{url}</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="secondary" icon={copied ? <Check /> : <Copy />} onClick={() => void copy()}>
              {copied ? "Copiato" : "Copia link"}
            </Button>
            {canShare && (
              <Button variant="tonal" icon={<Share2 />} onClick={share}>
                Invia
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}
