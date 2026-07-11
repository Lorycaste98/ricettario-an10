"use client";
import { useState } from "react";
import Image from "next/image";
import { Share2, Copy, Check } from "lucide-react";
import { Modal } from "@/components/ui/Modal";

export function ShareReviewLink({ url, qrDataUrl }: { url: string; qrDataUrl: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-xl border border-white/30 bg-black/40 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm active:bg-black/60 sm:hover:bg-black/60 transition"
      >
        <Share2 size={11} />
        Recensioni ospiti
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Condividi per farti recensire">
        <div className="space-y-4 p-6 pt-2">
          <p className="text-sm text-sky-800">
            Chi ha questo link (o scansiona il QR) può votare da 1 a 10 le ricette di questo menù, senza dover accedere.
          </p>

          <div className="flex justify-center">
            <Image src={qrDataUrl} alt="QR code recensione" width={200} height={200} className="rounded-xl border border-sky-100" unoptimized />
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2">
            <span className="min-w-0 flex-1 truncate text-xs text-sky-800">{url}</span>
            <button
              type="button"
              onClick={copy}
              className="flex shrink-0 items-center gap-1 rounded-lg bg-orange-500 px-2.5 py-1.5 text-xs font-medium text-white active:bg-orange-700 sm:hover:bg-orange-600 transition-colors"
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? "Copiato" : "Copia"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
