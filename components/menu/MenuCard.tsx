"use client";
import Link from "next/link";
import Image from "next/image";
import { clsx } from "clsx";
import { Users } from "lucide-react";
import type { MenuSummary } from "@/lib/types";
import { useAuth } from "@/components/AuthProvider";
import { ClocheIcon } from "@/components/icons";
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
 * 8.5 · card menù «menù stampato» (gemella della card ricetta 8.1 «Piatto»). Se una ricetta è un
 * piatto, un menù è il **cartoncino del menù** appoggiato sulla tovaglia `blu-100`: in cima l'icona
 * dei menù (5.23) e un filetto, poi i nomi delle prime tre ricette (`previewNames`, veloci comprese:
 * sono piatti del menù) e «e altre N». È il dato che distingue davvero un menù dall'altro, e c'è
 * sempre: quasi nessun menù ha foto proprie e molte ricette non ne hanno.
 * Se almeno una ricetta ha la foto, un piatto tondo con quella foto è appoggiato in basso a
 * sinistra, sopra il bordo del cartoncino (che si sposta a destra, lontano dal biglietto della
 * data); senza foto il cartoncino resta solo, centrato. Card stretta: 2 nomi, da 13rem 3. Agli angoli in alto, sulla tovaglia: a
 * sinistra la data come biglietto del calendario (8.12, con l'ora del servizio), a destra la
 * medaglia del voto ospiti (6.11, media di tutti i voti arrivati dal link del menù), che così sta
 * sul menù e non su un piatto. Sotto: nome, persone e ricette.
 * Non pronto (solo admin): come le ricette — tavola sbiadita, contorno tratteggiato, timbro
 * «Non pronto» sul cartoncino, testo e medaglia spenti. `@container/card`: stretta (2 per riga sul
 * telefono) nome più piccolo e solo le ricette; da 13rem anche le persone.
 */
export function MenuCard({ menu }: { menu: MenuSummary }) {
  const { isAdmin } = useAuth();
  const hidden = isAdmin && !menu.published;
  const hasRating = menu._count.reviews > 0 && menu.avgRating !== null;
  const n = menu._count.recipes;
  const names = menu.previewNames.slice(0, 3);
  // card stretta (telefono, 2 per riga): 2 nomi più leggibili; da 13rem 3
  const moreWide = Math.max(0, n - names.length);
  const moreNarrow = Math.max(0, n - Math.min(names.length, 2));
  const moreLabel = (k: number) => (k === 1 ? "e un'altra" : `e altre ${k}`);
  const photo = menu.previewPhotos[0];

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
      {/* la tavola: il cartoncino del menù (e, se c'è, un piatto con la foto) */}
      <div className="relative aspect-[5/4] w-full">
        <div className={clsx("absolute inset-0", hidden && "opacity-60 saturate-50")}>
          <div
            className={clsx(
              "absolute top-[4%] bottom-[4%] flex -rotate-2 flex-col items-center justify-center gap-[0.35em] rounded-[0.5rem] bg-white text-center",
              "shadow-[0_1px_2px_oklch(25%_0.038_228/.12),0_10px_22px_-8px_oklch(25%_0.038_228/.35)]",
              "transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:rotate-0 motion-reduce:transition-none",
              // con la foto il testo si tiene a destra del piatto
              photo ? "left-[25%] w-[72%] pr-[6%] pl-[13%]" : "left-[18%] w-[64%] px-[8%]"
            )}
          >
            <ClocheIcon className="size-[clamp(0.875rem,9cqi,1.375rem)] shrink-0 text-blu-800" aria-hidden />
            <span aria-hidden className="w-[38%] border-t border-blu-150" />
            <ul className="flex w-full min-w-0 flex-col gap-[0.25em] text-[0.75rem] leading-tight @min-[13rem]/card:text-[clamp(0.75rem,5cqi,0.9375rem)]">
              {names.map((name, i) => (
                <li
                  key={i}
                  className={clsx("truncate font-semibold", hidden ? "text-grigio" : "text-blu-950", i === 2 && "hidden @min-[13rem]/card:block")}
                >
                  {name}
                </li>
              ))}
              {moreNarrow > 0 && (
                <li className={clsx("font-medium @min-[13rem]/card:hidden", hidden ? "text-grigio-chiaro" : "text-grigio")}>{moreLabel(moreNarrow)}</li>
              )}
              {moreWide > 0 && (
                <li className={clsx("hidden font-medium @min-[13rem]/card:block", hidden ? "text-grigio-chiaro" : "text-grigio")}>{moreLabel(moreWide)}</li>
              )}
            </ul>
          </div>
          {photo && (
            <span
              className={clsx(
                "absolute bottom-[2%] left-[0%] aspect-square w-[34%] overflow-hidden rounded-full bg-white",
                "shadow-[0_0_0_clamp(3px,2.5cqi,7px)_white,0_8px_18px_-6px_oklch(25%_0.038_228/.35)]",
                "transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:rotate-[8deg] motion-reduce:transition-none"
              )}
            >
              <Image src={photo} alt="" fill sizes="(max-width: 700px) 25vw, 12vw" className="object-cover" />
            </span>
          )}
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
        className="absolute top-[0.45rem] left-[0.45rem] w-[clamp(2.25rem,20cqi,3.5rem)] text-[clamp(0.6875rem,6cqi,1rem)]"
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
