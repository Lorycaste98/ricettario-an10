"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useLocalStore } from "@/lib/local-store";
import { resolveServeAt } from "@/lib/cook-schedule";
import { GroceryBagIcon, PotIcon } from "@/components/icons";
import { HiddenTag } from "@/components/ds/Tag";
import type { NextMenu } from "@/lib/queries";

/**
 * Scheda «prossimo menù» in cima a /menu (schermata 2-menu). Fondo blu-800, conto alla rovescia
 * in giallo (il giallo è il tempo), tre contatori e le azioni rapide.
 * - «si inizia tra»: fino all'inizio più presto fra le ricette (orario pianificato nella timeline o
 *   calcolato all'indietro dal servizio); poi «al servizio tra»; dopo il servizio sparisce.
 * - Spesa e ricette pronte (solo admin) si leggono dal browser, dove li salvano lista spesa e
 *   modalità cucina (`ricettario:shopping-list:{id}`, `ricettario:cook-mode:{id}`).
 */
const TICK = 30_000;
const subscribeClock = (cb: () => void) => {
  const t = setInterval(cb, TICK);
  return () => clearInterval(t);
};

function useNow() {
  // Snapshot stabile fra due tick; null sul server (niente orari in HTML: fuso diverso)
  const tick = useSyncExternalStore(
    subscribeClock,
    () => Math.floor(Date.now() / TICK),
    () => null,
  );
  return tick == null ? null : tick * TICK;
}

function formatSpan(ms: number) {
  const mins = Math.max(0, Math.round(ms / 60_000));
  const d = Math.floor(mins / 1440);
  const h = Math.floor((mins % 1440) / 60);
  const m = mins % 60;
  if (d > 0) return `${d}g ${h}h`;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  return `${m}m`;
}

const parseKeys = (raw: string): string[] => {
  const v: unknown = JSON.parse(raw);
  return Array.isArray(v)
    ? v.filter((x): x is string => typeof x === "string")
    : [];
};
const parseCook = (raw: string): Record<string, { cooked?: boolean }> => {
  const v: unknown = JSON.parse(raw);
  return typeof v === "object" && v !== null
    ? (v as Record<string, { cooked?: boolean }>)
    : {};
};
const EMPTY_KEYS: string[] = [];
const EMPTY_COOK: Record<string, { cooked?: boolean }> = {};

export function NextMenuCard({ menu }: { menu: NextMenu }) {
  const { isAdmin } = useAuth();
  const now = useNow();
  const [checked] = useLocalStore(
    `ricettario:shopping-list:${menu.id}`,
    EMPTY_KEYS,
    parseKeys,
  );
  const [cook] = useLocalStore(
    `ricettario:cook-mode:${menu.id}`,
    EMPTY_COOK,
    parseCook,
  );

  const serve = resolveServeAt(menu.date, menu.servingTime);
  const serveAt = serve?.serveAt.getTime() ?? null;
  const starts = menu.recipeLeads
    .map((r) =>
      r.cookStartAt
        ? new Date(r.cookStartAt).getTime()
        : serveAt != null && r.leadMins > 0
          ? serveAt - r.leadMins * 60_000
          : null,
    )
    .filter((t): t is number => t != null);
  const startAt = starts.length ? Math.min(...starts) : null;

  let countdown: { label: string; value: string } | null = null;
  if (now != null && serveAt != null) {
    if (startAt != null && now < startAt)
      countdown = { label: "si inizia tra", value: formatSpan(startAt - now) };
    else if (serve?.hasTime && now < serveAt)
      countdown = {
        label: "al servizio tra",
        value: formatSpan(serveAt - now),
      };
    else if (!serve?.hasTime && now < serveAt)
      countdown = { label: "mancano", value: formatSpan(serveAt - now) };
  }

  const day = new Date(menu.date).toLocaleDateString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const keys = new Set(menu.shoppingKeys ?? []);
  const bought = checked.filter((k) => keys.has(k)).length;
  const cooked = menu.recipeIds.filter((id) => cook[id]?.cooked).length;

  // Contatori: solo per l'admin (per i visitatori ripeterebbero la riga sotto il titolo)
  const tiles: { label: string; value: string }[] = isAdmin
    ? [
        ...(menu.shoppingKeys
          ? [
              {
                label: "Spesa",
                value: keys.size ? `${bought} / ${keys.size}` : "—",
              },
            ]
          : []),
        {
          label: "Ricette pronte",
          value: `${cooked} / ${menu.recipeIds.length}`,
        },
        {
          label: "Recensioni",
          value: menu.reviews ? String(menu.reviews) : "—",
        },
      ]
    : [];

  const secondary =
    "inline-flex h-(--h-btn) items-center gap-[0.45em] rounded-ctl border border-white/25 bg-white/10 px-[1.05em] font-semibold text-white hover:bg-white/20 [&_svg]:size-[1.15em]";

  return (
    <section
      aria-label="Prossimo menù"
      className="grid gap-[0.8em] rounded-card bg-blu-800 px-[1.1em] py-[1em] text-white @min-[620px]:grid-cols-[1fr_auto] @min-[620px]:items-end"
    >
      <div className="min-w-0">
        <p className="text-[0.8125rem] text-nav-muted">
          Prossimo · {day}
          {menu.servingTime && ` · servizio alle ${menu.servingTime}`}
        </p>
        <h2 className="flex flex-wrap items-center gap-2 text-(length:--fs-page) leading-tight font-bold">
          {menu.name}
          {!menu.published && <HiddenTag label="Non pronto" />}
        </h2>
        <p className="text-[0.8125rem] text-nav-muted">
          {menu.people != null && `${menu.people} persone · `}
          {menu.recipes} {menu.recipes === 1 ? "ricetta" : "ricette"}
        </p>
      </div>
      {countdown && (
        <div className="@min-[620px]:text-right">
          <p className="text-[0.8125rem] text-nav-muted">{countdown.label}</p>
          <p className="tabular text-(length:--fs-timer) leading-none font-extrabold text-giallo-400">
            {countdown.value}
          </p>
        </div>
      )}
      {tiles.length > 0 && (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(6.5rem,1fr))] gap-2 @min-[620px]:col-span-2">
          {tiles.map((t) => (
            <div
              key={t.label}
              className="rounded-ctl bg-white/10 px-[0.7em] py-[0.5em] text-xs text-nav-ink"
            >
              {t.label}
              <b className="tabular block text-[1.0625rem] text-white">
                {t.value}
              </b>
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-2 @min-[620px]:col-span-2">
        {isAdmin && (
          <Link
            href={`/menu/${menu.id}/cucina`}
            className="inline-flex h-(--h-btn) items-center gap-[0.45em] rounded-ctl bg-arancio px-[1.05em] font-semibold text-white hover:bg-arancio-scuro [&_svg]:size-[1.15em]"
          >
            <PotIcon aria-hidden /> Modalità cucina
          </Link>
        )}
        {isAdmin && (
          <Link href={`/menu/${menu.id}#spesa`} className={secondary}>
            <GroceryBagIcon aria-hidden /> Lista spesa
          </Link>
        )}
        <Link href={`/menu/${menu.id}`} className={secondary}>
          Apri il menù <ArrowRight aria-hidden />
        </Link>
      </div>
    </section>
  );
}
