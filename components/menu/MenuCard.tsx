"use client";
import type { CSSProperties } from "react";
import Link from "next/link";
import Image from "next/image";
import { clsx } from "clsx";
import { Users } from "lucide-react";
import type { MenuSummary } from "@/lib/types";
import { useAuth } from "@/components/AuthProvider";
import { An10Logo } from "@/components/brand/An10Logo";
import { RatingMedal } from "@/components/recipe/RatingMedal";
import { pressCls } from "@/components/recipe/card-info";
import { DateTicket } from "./DateTicket";

/** «sab 13 dic · 20:00»; anno solo se diverso da quello corrente */
export function formatMenuWhen(date: string | null, servingTime: string | null) {
  if (!date) return null;
  const d = new Date(date);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  const s = d.toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short", ...(sameYear ? {} : { year: "numeric" }) });
  return servingTime ? `${s} · ${servingTime}` : s;
}

type Spot = { cx: number; cy: number; d: number; r: number };

/**
 * Piatto tondo della tavola: foto della ricetta, oppure il «10» blu sul piatto bianco (come la
 * card ricetta senza foto 8.2), oppure `more` = piatto «+N» con le ricette che non stanno sulla tavola.
 * `spot` = centro e diametro in unità del riquadro (largo 100, alto 80) e rotazione in gradi.
 */
function TablePlate({ photo, more, spot }: { photo?: string | null; more?: number; spot: Spot }) {
  return (
    <span
      style={
        {
          left: `${spot.cx - spot.d / 2}%`,
          top: `${((spot.cy - spot.d / 2) / 80) * 100}%`,
          width: `${spot.d}%`,
          "--r": `${spot.r}deg`,
        } as CSSProperties
      }
      className={clsx(
        "absolute aspect-square overflow-hidden rounded-full bg-white",
        // ruota solo la foto: il «10» resta dritto
        photo && "rotate-(--r)",
        "shadow-[0_0_0_clamp(3px,2.5cqi,7px)_white,0_8px_18px_-6px_oklch(25%_0.038_228/.35)]",
        !more &&
          "transition-[rotate] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:rotate-[calc(var(--r,0deg)+8deg)] motion-reduce:transition-none"
      )}
    >
      {more ? (
        // si intravede da dietro gli altri piatti: il numero sta nella parte che resta scoperta
        <span className="tabular flex size-full items-end justify-end pr-[24%] pb-[26%] text-[clamp(0.6875rem,6cqi,1rem)] font-extrabold text-blu-800">
          +{more}
        </span>
      ) : photo ? (
        <Image src={photo} alt="" fill sizes="(max-width: 700px) 30vw, 14vw" className="object-cover" />
      ) : (
        <span className="flex size-full items-center justify-center text-blu-800">
          <An10Logo variant="simbolo" title="" className="w-[42%]" />
        </span>
      )}
    </span>
  );
}

/**
 * Composizioni possibili dei piatti sulla tavola (riquadro 5:4 = 100 × 80 unità), per numero di
 * ricette: centro `[cx, cy]` e diametro `d`. Ogni menù ne pesca una e la varia un poco (`tableFor`).
 * Sono tutte centrate: data e voto stanno sopra la tovaglia, agli angoli, e possono coprire un bordo.
 */
const COMPOSITIONS: Record<1 | 2 | 3, [number, number, number][][]> = {
  1: [[[50, 42, 58]], [[47, 44, 54]], [[53, 40, 62]]],
  2: [
    [[30, 44, 46], [70, 40, 44]],
    [[36, 34, 44], [66, 54, 46]],
    [[42, 42, 56], [80, 58, 30]],
    [[58, 42, 56], [22, 58, 30]],
  ],
  3: [
    [[50, 22, 38], [29, 56, 40], [71, 56, 40]],
    [[34, 30, 40], [70, 28, 40], [52, 60, 36]],
    [[38, 44, 50], [76, 40, 30], [66, 69, 24]],
    [[62, 42, 50], [24, 50, 30], [38, 72, 24]],
    [[20, 48, 34], [50, 40, 38], [80, 48, 34]],
  ],
};
/** piatto «+N»: sempre lì, dietro gli altri, in basso a destra (in parte fuori dalla tavola) */
const MORE_SPOT: Spot = { cx: 92, cy: 71, d: 26, r: 0 };

/** Numeri pseudo-casuali dall'id del menù: stessa tavola a ogni visita, su server e browser. */
function seeded(seed: number) {
  let a = (seed * 2654435761) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** il numero del piatto «+N» (in basso a destra del piatto) deve restare scoperto */
const MORE_LABEL = { x: 94, y: 75 };
const leavesMoreVisible = (c: [number, number, number][]) =>
  c.every(([cx, cy, d]) => Math.hypot(cx - MORE_LABEL.x, cy - MORE_LABEL.y) > d / 2 + 9);

/**
 * Composizione del menù: una fra quelle possibili (con il «+N», solo quelle che ne lasciano vedere
 * il numero), spostata di ±3, ingrandita di ±3, foto ruotate di ±10°.
 */
function tableFor(id: number, count: 1 | 2 | 3, withMore: boolean): Spot[] {
  const rnd = seeded(id);
  const jitter = (k: number) => (rnd() * 2 - 1) * k;
  const all = COMPOSITIONS[count];
  const fit = withMore ? all.filter(leavesMoreVisible) : all;
  const options = fit.length ? fit : all;
  const base = options[Math.floor(rnd() * options.length)];
  return base.map(([cx, cy, d]) => {
    const dd = d + jitter(3);
    return {
      d: dd,
      cx: Math.min(104 - dd / 2, Math.max(dd / 2 - 4, cx + jitter(3))),
      cy: Math.min(84 - dd / 2, Math.max(dd / 2 - 4, cy + jitter(3))),
      r: jitter(10),
    };
  });
}

/**
 * 8.5 · card menù «Tavola» (gemella della card ricetta 8.1 «Piatto»). Se una ricetta è un piatto,
 * un menù è una tavola apparecchiata: sulla tovaglia `blu-100` i **piatti delle sue ricette**
 * (fino a tre, prima quelle con la foto; senza foto il «10» blu come la card ricetta 8.2) e, se
 * sono di più, un piatto «+N» con quelle che non stanno sulla tavola, sempre in basso a destra e
 * dietro gli altri. Ogni menù ha la sua tavola: composizione, grandezze e rotazioni «casuali» ma
 * fisse, ricavate dall'id (`tableFor`, entro i limiti di `COMPOSITIONS`). Nessun piatto «del menù»:
 * quasi nessun menù ha una foto propria, e un segnaposto grande uguale per tutti non distingueva
 * niente. Agli angoli in alto, sulla tovaglia e non su un piatto: a sinistra la data come
 * biglietto del calendario (8.12, con l'ora del servizio), a destra la medaglia del voto ospiti
 * (6.11, media di tutti i voti arrivati dal link del menù) — quando è stata la cena e com'è andata.
 * Sotto: nome, persone e ricette.
 * Non pronto (solo admin): come le ricette — tavola sbiadita, contorno tratteggiato, timbro
 * «Non pronto» al centro, testo e medaglia spenti. `@container/card`: stretta (2 per riga sul
 * telefono) nome più piccolo e solo le ricette; da 13rem anche le persone.
 */
export function MenuCard({ menu }: { menu: MenuSummary }) {
  const { isAdmin } = useAuth();
  const hidden = isAdmin && !menu.published;
  const hasRating = menu._count.reviews > 0 && menu.avgRating !== null;
  const n = menu._count.recipes;
  const shown = Math.min(n, 3);
  const more = n > 3 ? n - 3 : 0;
  const spots = shown > 0 ? tableFor(menu.id, shown as 1 | 2 | 3, more > 0) : [];
  // le foto (prima quelle che ci sono) vanno sui piatti più grandi
  const bySize = spots.map((_, i) => i).sort((x, y) => spots[y].d - spots[x].d);
  const photoOf = (i: number) => menu.previewPhotos[bySize.indexOf(i)];
  return (
    <Link
      href={`/menu/${menu.id}`}
      className={clsx(
        "group @container/card relative flex min-w-0 flex-col overflow-hidden rounded-card bg-blu-100 px-[6%] pt-[6%] pb-[0.75em] hover:bg-blu-120",
        "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-blu-600/35",
        pressCls,
        hidden && "outline-2 outline-offset-[-2px] outline-blu-250 outline-dashed"
      )}
    >
      {/* la tavola: i piatti delle ricette */}
      <div className="relative aspect-[5/4] w-full">
        <div className={clsx("absolute inset-0", hidden && "opacity-60 saturate-50")}>
          {more > 0 && <TablePlate more={more} spot={MORE_SPOT} />}
          {spots.map((spot, i) => (
            <TablePlate key={i} photo={photoOf(i)} spot={spot} />
          ))}
        </div>
        {hidden && (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="-rotate-12 rounded-[0.375rem] border-2 border-dashed border-grigio bg-white px-[0.6em] py-[0.25em] text-[clamp(0.625rem,6cqi,0.9375rem)] leading-none font-extrabold tracking-[0.12em] whitespace-nowrap text-grigio uppercase shadow-[0_2px_6px_oklch(25%_0.038_228/.18)]">
              Non pronto
            </span>
          </span>
        )}
      </div>

      {/* voto del menù: sulla tovaglia, nell'angolo opposto alla data */}
      {hasRating && (
        <RatingMedal
          value={menu.avgRating!}
          count={menu._count.reviews}
          muted={hidden}
          className="absolute top-[0.45rem] right-[0.45rem] w-[clamp(2.25rem,22cqi,3.25rem)] text-[clamp(0.6875rem,6.5cqi,1rem)]"
        />
      )}

      {/* biglietto del calendario, appoggiato sull'angolo della tovaglia */}
      <DateTicket
        date={menu.date}
        time={menu.servingTime}
        muted={hidden}
        className="absolute top-[0.45rem] left-[0.45rem] w-[clamp(2.5rem,22cqi,3.5rem)] text-[clamp(0.75rem,6.5cqi,1rem)]"
      />

      <h3
        className={clsx(
          "mt-[0.6em] line-clamp-2 text-center text-[0.875rem] leading-tight font-extrabold group-hover:text-blu-700 @min-[13rem]/card:text-[1.0625rem] @min-[18rem]/card:text-[1.25rem]",
          hidden ? "text-grigio" : "text-blu-950"
        )}
      >
        {menu.name}
      </h3>
      <span
        className={clsx(
          "mt-1 flex min-w-0 flex-wrap items-center justify-center gap-x-2.5 gap-y-0.5 text-[0.6875rem] @min-[13rem]/card:text-xs",
          hidden ? "text-grigio-chiaro" : "text-grigio"
        )}
      >
        {menu.people != null && (
          <span className="hidden items-center gap-1 whitespace-nowrap @min-[13rem]/card:flex">
            <Users className="size-3.5 shrink-0" aria-hidden /> {menu.people}
          </span>
        )}
        <span className="whitespace-nowrap">
          {n} {n === 1 ? "ricetta" : "ricette"}
        </span>
      </span>
    </Link>
  );
}
