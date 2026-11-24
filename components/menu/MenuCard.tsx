"use client";
import Link from "next/link";
import Image from "next/image";
import { clsx } from "clsx";
import { Clock, Users } from "lucide-react";
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

/** Piatto tondo della tavola: foto, oppure piatto bianco vuoto (o con la cloche, il piatto grande). */
function TablePlate({ photo, big = false, className }: { photo?: string; big?: boolean; className?: string }) {
  return (
    <span
      className={clsx(
        "absolute aspect-square overflow-hidden rounded-full bg-white",
        big
          ? "shadow-[0_0_0_clamp(4px,3cqi,8px)_white,0_10px_22px_-6px_oklch(25%_0.038_228/.35)]"
          : "shadow-[0_0_0_clamp(3px,2cqi,5px)_white,0_6px_14px_-5px_oklch(25%_0.038_228/.3)]",
        className
      )}
    >
      {photo ? (
        <Image src={photo} alt="" fill sizes={big ? "(max-width: 700px) 40vw, 18vw" : "(max-width: 700px) 20vw, 9vw"} className="object-cover" />
      ) : big ? (
        <span className="flex size-full items-center justify-center text-area-menu">
          <ClocheIcon className="size-[42%]" strokeWidth={1.6} />
        </span>
      ) : (
        // piatto vuoto: solo il cavetto interno, come una tavola apparecchiata
        <span className="absolute inset-[18%] rounded-full border border-blu-150" />
      )}
    </span>
  );
}

/**
 * 8.5 · card menù «Tavola» (gemella della card ricetta 8.1 «Piatto»). Se una ricetta è un piatto,
 * un menù è una tavola apparecchiata: sulla tovaglia `blu-100` un piatto grande (foto del menù o
 * della prima ricetta) e due piatti più piccoli con le foto di altre ricette — piatti bianchi vuoti
 * se mancano le foto, nessuno se il menù ha una ricetta sola. In alto a sinistra la data come
 * biglietto del calendario (8.12, testata prugna = area menù, al posto del vecchio filo laterale),
 * sul piatto grande la medaglia del voto ospiti (6.11). Sotto: nome, ora, persone e ricette.
 * Non pronto (solo admin): come le ricette — tavola sbiadita, contorno tratteggiato, timbro
 * «Non pronto», testo e medaglia spenti. `@container/card`: stretta (2 per riga sul telefono)
 * nome più piccolo e solo ora + ricette; da 13rem anche le persone.
 */
export function MenuCard({ menu }: { menu: MenuSummary }) {
  const { isAdmin } = useAuth();
  const hidden = isAdmin && !menu.published;
  const hasRating = menu._count.reviews > 0 && menu.avgRating !== null;
  const n = menu._count.recipes;
  const main = menu.photo ?? menu.previewPhotos[0];
  const others = menu.previewPhotos.filter((p) => p !== main);

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
      {/* la tavola: piatto grande a sinistra, due piccoli a destra */}
      <div className="relative aspect-[5/4] w-full">
        <div className={clsx("absolute inset-0", hidden && "opacity-60 saturate-50")}>
          {n >= 2 && <TablePlate photo={others[0]} className="top-[2%] right-[2%] w-[36%]" />}
          {n >= 3 && <TablePlate photo={others[1]} className="right-[14%] bottom-[0%] w-[30%]" />}
          <TablePlate
            photo={main}
            big
            className="top-[10%] left-[6%] w-[64%] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:rotate-[8deg] motion-reduce:transition-none"
          />
        </div>
        {hasRating && (
          <RatingMedal
            value={menu.avgRating!}
            count={menu._count.reviews}
            muted={hidden}
            className="absolute top-[56%] left-[52%] w-[clamp(2rem,24cqi,3rem)] text-[clamp(0.6875rem,7cqi,0.9375rem)]"
          />
        )}
        {hidden && (
          // centrato sul piatto grande, un po' in alto: la medaglia sta in basso a destra del piatto
          <span className="pointer-events-none absolute top-[10%] left-[6%] flex aspect-square w-[64%] items-start justify-center pt-[20%]">
            <span className="-rotate-12 rounded-[0.375rem] border-2 border-dashed border-grigio bg-white px-[0.6em] py-[0.25em] text-[clamp(0.625rem,6cqi,0.9375rem)] leading-none font-extrabold tracking-[0.12em] whitespace-nowrap text-grigio uppercase shadow-[0_2px_6px_oklch(25%_0.038_228/.18)]">
              Non pronto
            </span>
          </span>
        )}
      </div>

      {/* biglietto del calendario, appoggiato sull'angolo della tovaglia */}
      <DateTicket
        date={menu.date}
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
        {menu.servingTime && (
          <span className="tabular flex items-center gap-1 whitespace-nowrap">
            <Clock className="size-3.5 shrink-0" aria-hidden /> {menu.servingTime}
          </span>
        )}
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
