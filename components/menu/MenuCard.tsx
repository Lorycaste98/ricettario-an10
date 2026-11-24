"use client";
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

/**
 * Piatto tondo della tavola: foto della ricetta, oppure il «10» blu sul piatto bianco (come la
 * card ricetta senza foto 8.2), oppure `more` = piatto «+N» con le ricette che non stanno sulla tavola.
 */
function TablePlate({ photo, more, className }: { photo?: string | null; more?: number; className?: string }) {
  return (
    <span
      className={clsx(
        "absolute aspect-square overflow-hidden rounded-full bg-white",
        "shadow-[0_0_0_clamp(3px,2.5cqi,7px)_white,0_8px_18px_-6px_oklch(25%_0.038_228/.35)]",
        !more && "transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:rotate-[8deg] motion-reduce:transition-none",
        className
      )}
    >
      {more ? (
        <span className="tabular flex size-full items-center justify-center text-[clamp(0.6875rem,6cqi,1rem)] font-extrabold text-blu-800">
          +{more}
        </span>
      ) : photo ? (
        <Image src={photo} alt="" fill sizes="(max-width: 700px) 25vw, 12vw" className="object-cover" />
      ) : (
        <span className="flex size-full items-center justify-center text-blu-800">
          <An10Logo variant="simbolo" title="" className="w-[42%]" />
        </span>
      )}
    </span>
  );
}

/**
 * Disposizione dei piatti sulla tavola (riquadro 5:4), per numero di ricette. In alto agli angoli
 * restano liberi il biglietto della data (sinistra) e la medaglia del voto (destra).
 */
const LAYOUT: Record<1 | 2 | 3 | 4, string[]> = {
  1: ["top-[20%] left-[22%] w-[56%]"],
  2: ["top-[34%] left-[6%] w-[44%]", "top-[34%] right-[6%] w-[44%]"],
  3: ["top-[2%] left-[31%] w-[38%]", "bottom-[1%] left-[8%] w-[40%]", "bottom-[1%] right-[8%] w-[40%]"],
  // 4 = tre piatti + «+N» a destra: il trio si sposta un po' a sinistra per fargli posto
  4: ["top-[2%] left-[33%] w-[38%]", "bottom-[1%] left-[6%] w-[40%]", "bottom-[1%] right-[14%] w-[40%]"],
};

/**
 * 8.5 · card menù «Tavola» (gemella della card ricetta 8.1 «Piatto»). Se una ricetta è un piatto,
 * un menù è una tavola apparecchiata: sulla tovaglia `blu-100` i **piatti delle sue ricette**
 * (fino a tre, prima quelle con la foto; senza foto il «10» blu come la card ricetta 8.2) e, se
 * sono di più, un piatto «+N» con quelle che non stanno sulla tavola. Nessun piatto «del menù»:
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
          {shown > 0 && LAYOUT[(more > 0 ? 4 : shown) as 1 | 2 | 3 | 4].map((pos, i) => <TablePlate key={i} photo={menu.previewPhotos[i]} className={pos} />)}
          {more > 0 && <TablePlate more={more} className="top-[40%] right-[0%] w-[20%]" />}
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
