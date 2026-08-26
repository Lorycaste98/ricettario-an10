"use client";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

/**
 * Visore foto a schermo intero (dettaglio ricetta e menù).
 *
 * Montato **una volta sola** nel layout: si apre via evento su `window`
 * (`openPhotoViewer`), stesso pattern già usato da `lib/favorites.ts`. Così le
 * pagine di dettaglio restano server component e non serve nessun provider
 * attorno al loro JSX: l'unica cosa che diventa client è la singola immagine
 * cliccabile (`components/ui/ViewerImage.tsx`).
 *
 * Scorrimento tra le foto: **niente gesture a mano**. La traccia è un
 * contenitore `overflow-x-auto` con scroll-snap e ogni foto larga il 100%:
 * lo swipe è quello nativo del browser, le frecce sono `scrollBy(clientWidth)`.
 *
 * Zoom: su touch è **solo** la pinch nativa del viewport (`app/layout.tsx` non
 * imposta `maximumScale`/`userScalable: false`, quindi è disponibile). Il click
 * che ingrandisce al 200% è riservato al mouse (`canTapZoom`): su touch
 * trasformerebbe la slide in un contenitore scorrevole, interferendo con lo
 * swipe fra le foto. La panoramica da ingrandita è lo scroll nativo della slide,
 * quindi non c'è nessun calcolo di gesture da nessuna parte.
 */

const EVENT = "ricettario:photo-view";

interface PhotoViewRequest {
  photos: string[];
  index: number;
  alt?: string;
}

/** Apre il visore sulla galleria `photos`, partendo dalla posizione `index`. */
export function openPhotoViewer(photos: string[], index = 0, alt?: string) {
  if (typeof window === "undefined" || photos.length === 0) return;
  const safeIndex = Math.min(Math.max(index, 0), photos.length - 1);
  window.dispatchEvent(
    new CustomEvent<PhotoViewRequest>(EVENT, { detail: { photos, index: safeIndex, alt } })
  );
}

const noopSubscribe = () => () => {};

// Lo zoom "a click" è solo per il mouse: su touch lo zoom è la pinch nativa, e un
// tap che ingrandisce al 200% trasformerebbe la slide in un contenitore scorrevole
// interferendo con lo swipe fra le foto.
const FINE_POINTER = "(hover: hover) and (pointer: fine)";

function subscribeFinePointer(callback: () => void): () => void {
  const mq = window.matchMedia(FINE_POINTER);
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getFinePointer(): boolean {
  return window.matchMedia(FINE_POINTER).matches;
}

export function PhotoViewer() {
  const [req, setReq] = useState<PhotoViewRequest | null>(null);
  const [current, setCurrent] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // Come in Modal.tsx: il dialog vive in un portale su <body> (gli antenati con
  // backdrop-filter creerebbero un containing block e su Safari/iPad il dialog
  // finirebbe centrato — e ritagliato — dentro la card).
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const canTapZoom = useSyncExternalStore(subscribeFinePointer, getFinePointer, () => false);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<PhotoViewRequest>).detail;
      if (!detail?.photos?.length) return;
      setReq(detail);
      setCurrent(detail.index);
      setZoomed(false);
    };
    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
  }, []);

  const close = useCallback(() => {
    setReq(null);
    setZoomed(false);
  }, []);

  // Apertura/chiusura del <dialog> + posizionamento sulla foto scelta.
  // `scrollLeft` va scritto dopo lo showModal (prima la traccia non ha larghezza).
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (!req) {
      if (el.open) el.close();
      return;
    }
    if (!el.open) el.showModal();

    // Il dialog è appena passato da display:none a visibile: se la larghezza non è
    // ancora misurabile si riprova al frame dopo, altrimenti si aprirebbe sempre
    // sulla prima foto invece che su quella toccata.
    let raf = 0;
    const place = () => {
      const track = trackRef.current;
      if (!track) return;
      if (track.clientWidth === 0) {
        raf = requestAnimationFrame(place);
        return;
      }
      track.scrollLeft = req.index * track.clientWidth;
    };
    place();
    return () => { if (raf) cancelAnimationFrame(raf); };
  }, [req]);

  const go = useCallback((delta: number) => {
    const track = trackRef.current;
    if (!track) return;
    setZoomed(false);
    track.scrollBy({ left: delta * track.clientWidth, behavior: "smooth" });
  }, []);

  if (!mounted || !req) return null;

  const { photos, alt } = req;
  const many = photos.length > 1;

  return createPortal(
    <dialog
      ref={dialogRef}
      onClose={close}
      onKeyDown={(e) => {
        if (!many) return;
        if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
        if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
      }}
      // touch-action su tutto il visore: consentito solo il pan orizzontale (lo swipe
      // fra le foto) e la pinch nativa. Senza, il trascinamento verticale scorre la
      // pagina dietro — su iOS la barra di Safari si nasconde, `h-dvh` cambia e il
      // dialog sobbalza a metà gesto.
      className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none border-0 bg-sky-950/95 p-0 backdrop:bg-sky-950/80 [touch-action:pan-x_pinch-zoom] open:flex open:flex-col"
    >
      {/* Traccia scorrevole: una slide a schermo pieno per foto, snap nativo */}
      <div
        ref={trackRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          if (el.clientWidth > 0) setCurrent(Math.round(el.scrollLeft / el.clientWidth));
        }}
        className={`flex flex-1 overflow-x-auto overflow-y-hidden overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
          zoomed ? "snap-none" : "snap-x snap-mandatory"
        }`}
      >
        {photos.map((url, i) => {
          // La slide diventa contenitore di scorrimento **solo** da ingrandita (mouse):
          // un `overflow-auto` sempre attivo, con `overscroll-contain`, impedisce al
          // browser di propagare lo swipe alla traccia e su touch lo scorrimento fra
          // le foto risulta bloccato o a scatti.
          const isZoomed = canTapZoom && zoomed && i === current;
          return (
          <div
            key={`${url}-${i}`}
            onClick={(e) => { if (e.target === e.currentTarget) close(); }}
            // `w-full` (non solo `min-w-full`) è essenziale: con la larghezza
            // indefinita la slide si dimensiona sul contenuto e il browser, dato
            // che l'immagine ha `max-h-full` e un aspect ratio, le trasferisce una
            // larghezza intrinseca ≈ altezza×ratio. Su desktop resta sotto il
            // viewport e non si nota; su un telefono in verticale diventa il
            // triplo dello schermo, quindi gli snap point vanno fuori posto e lo
            // scorrimento fra le foto sembra impazzito.
            className={`flex w-full min-w-full shrink-0 snap-center p-2 sm:p-6 ${
              isZoomed ? "overflow-auto overscroll-contain" : "overflow-hidden"
            }`}
          >
            {/* Centratura con `m-auto` e non con `justify-center`: in un contenitore
                scorrevole `justify-content: center` rende irraggiungibile la parte
                che sborda dal lato iniziale (a immagine ingrandita non si torna
                indietro). `shrink-0` perché di default un flex item si ricomprime
                nel contenitore e lo zoom non si vedrebbe. */}
            {/* eslint-disable-next-line @next/next/no-img-element -- nel visore serve il file pieno, non la variante ottimizzata per il layout */}
            <img
              src={url}
              alt={alt ? `${alt}${many ? ` (${i + 1} di ${photos.length})` : ""}` : `Foto ${i + 1}`}
              onClick={canTapZoom ? () => setZoomed((z) => !z) : undefined}
              draggable={false}
              className={
                isZoomed
                  ? "m-auto w-[200%] max-w-none shrink-0 cursor-zoom-out select-none"
                  : `m-auto max-h-full w-auto max-w-full shrink-0 object-contain select-none ${
                      canTapZoom ? "cursor-zoom-in" : ""
                    }`
              }
            />
          </div>
          );
        })}
      </div>

      {/* Chiudi */}
      <button
        type="button"
        onClick={close}
        aria-label="Chiudi"
        className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md transition-colors hover:bg-black/70"
        style={{ top: "calc(env(safe-area-inset-top, 0px) + 0.75rem)" }}
      >
        <X size={20} />
      </button>

      {many && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={current === 0}
            aria-label="Foto precedente"
            className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md transition-colors hover:bg-black/70 disabled:opacity-30 sm:left-4"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            disabled={current >= photos.length - 1}
            aria-label="Foto successiva"
            className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md transition-colors hover:bg-black/70 disabled:opacity-30 sm:right-4"
          >
            <ChevronRight size={22} />
          </button>

          {/* Contatore */}
          <div
            className="absolute left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md"
            style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)" }}
          >
            {current + 1} / {photos.length}
          </div>
        </>
      )}
    </dialog>,
    document.body
  );
}
