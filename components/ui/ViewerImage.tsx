"use client";
import Image from "next/image";
import { clsx } from "clsx";
import { openPhotoViewer } from "./PhotoViewer";

/**
 * Immagine cliccabile che apre `PhotoViewer` a schermo intero sulla galleria
 * `photos`, partendo da `index`. Sostituisce un `<Image fill>` dentro un
 * contenitore già `relative` (hero ricetta/menù, griglia foto).
 *
 * È l'unico pezzo client che serve nelle pagine di dettaglio: il visore è
 * montato una volta nel layout e si apre via evento (vedi PhotoViewer).
 */
interface Props {
  /** Galleria completa da poter scorrere nel visore */
  photos: string[];
  /** Posizione di questa foto dentro `photos` */
  index?: number;
  src: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
  /** Classi sull'immagine (es. `object-cover`) */
  className?: string;
  /** Classi extra sul bottone che copre il contenitore */
  buttonClassName?: string;
}

export function ViewerImage({
  photos,
  index = 0,
  src,
  alt,
  sizes,
  priority,
  className,
  buttonClassName,
}: Props) {
  return (
    <button
      type="button"
      onClick={() => openPhotoViewer(photos, index, alt)}
      aria-label={`Apri la foto a schermo intero: ${alt}`}
      className={clsx("absolute inset-0 cursor-zoom-in", buttonClassName)}
    >
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={className} />
    </button>
  );
}
