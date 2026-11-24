"use client";
import Link from "next/link";
import { clsx } from "clsx";
import { EyeOff, Users } from "lucide-react";
import type { MenuSummary } from "@/lib/types";
import { useAuth } from "@/components/AuthProvider";
import { RatingMedal } from "@/components/recipe/RatingMedal";
import { pressCls } from "@/components/recipe/card-info";
import { DateTicket } from "./DateTicket";

/**
 * 8.11 · riga menù «Carta» (vista a lista, gemella della riga ricetta 8.10): a sinistra il
 * biglietto del calendario (8.12) con la medaglia del voto ospiti (6.11) sul bordo, poi il nome e
 * i puntini di guida; sotto persone e ricette (l'ora del servizio sta in fondo al biglietto). Righe senza scheda sul fondo
 * pagina (`CollectionBody list="stack"`). Non pronto (solo admin): biglietto e testo spenti e
 * mini-timbro con l'occhio barrato, come le ricette.
 */
export function MenuRow({ menu }: { menu: MenuSummary }) {
  const { isAdmin } = useAuth();
  const hidden = isAdmin && !menu.published;
  const hasRating = menu._count.reviews > 0 && menu.avgRating !== null;
  const n = menu._count.recipes;

  return (
    <Link
      href={`/menu/${menu.id}`}
      className={clsx(
        "group @container/row flex min-w-0 items-center gap-6 rounded-ctl px-1 py-1.5 hover:bg-blu-100",
        "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-blu-600/35",
        pressCls
      )}
    >
      <span className="relative shrink-0 pt-0.5">
        <DateTicket date={menu.date} time={menu.servingTime} muted={hidden} className="w-[3.25rem] text-[0.9375rem]" />
        {hidden && (
          <span
            role="img"
            aria-label="Non pronto"
            title="Non pronto"
            className="absolute -top-1.5 -left-2 flex size-[1.625rem] items-center justify-center rounded-full border-2 border-dashed border-grigio bg-white text-grigio shadow-[0_2px_5px_oklch(25%_0.038_228/.2)]"
          >
            <EyeOff className="size-3.5" aria-hidden />
          </span>
        )}
        {hasRating && (
          <RatingMedal
            value={menu.avgRating!}
            count={menu._count.reviews}
            muted={hidden}
            // a metà del lato destro, accanto al giorno: non copre né il mese né l'ora in fondo
            className="absolute top-[34%] -right-[1.1rem] w-[1.875rem] text-[0.6875rem]"
          />
        )}
      </span>

      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex min-w-0 items-center gap-2">
          <span
            className={clsx(
              "line-clamp-2 min-w-0 text-[1rem] leading-tight font-extrabold group-hover:text-blu-700 @min-[34rem]/row:text-[1.125rem]",
              hidden ? "text-grigio" : "text-blu-950"
            )}
          >
            {menu.name}
          </span>
          <span aria-hidden className="min-w-4 flex-1 border-b-2 border-dotted border-blu-250" />
        </span>
        <span className={clsx("flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs", hidden ? "text-grigio-chiaro" : "text-grigio")}>
          {menu.people != null && (
            <span className="flex items-center gap-1 whitespace-nowrap">
              <Users className="size-3.5 shrink-0" aria-hidden /> {menu.people} persone
            </span>
          )}
          <span className="whitespace-nowrap">
            {n} {n === 1 ? "ricetta" : "ricette"}
          </span>
        </span>
      </span>
    </Link>
  );
}
