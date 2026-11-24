import { clsx } from "clsx";

/** Parti della data nel fuso di Roma: server (UTC) e browser scrivono lo stesso giorno. */
function dateParts(iso: string) {
  const d = new Date(iso);
  const f = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("it-IT", { timeZone: "Europe/Rome", ...o }).format(d);
  return {
    weekday: f({ weekday: "short" }).replace(".", ""),
    day: f({ day: "numeric" }),
    month: f({ month: "short" }).replace(".", ""),
    year: f({ year: "numeric" }),
  };
}

/**
 * 8.12 · biglietto del calendario: la data di un menù come un foglietto del calendario da tavolo,
 * testata nel colore di area menù (prugna) con il giorno della settimana, sotto il giorno grande e
 * il mese. Sostituisce il filo laterale prugna della vecchia scheda menù (riconosce l'area ed è
 * un'informazione). Anno solo se diverso da quello corrente. Senza data: «—».
 * La misura la decide il chiamante (`className`, larghezza; il resto è in `em` del font-size dato).
 */
export function DateTicket({ date, muted = false, className }: { date: string | null; muted?: boolean; className?: string }) {
  const p = date ? dateParts(date) : null;
  const otherYear = p && p.year !== String(new Date().getFullYear());
  return (
    <span
      className={clsx(
        "tabular flex flex-col overflow-hidden rounded-[0.5em] bg-white text-center leading-none shadow-[0_0_0_2px_white,0_4px_10px_-3px_oklch(25%_0.038_228/.3)]",
        className
      )}
      aria-label={p ? `${p.weekday} ${p.day} ${p.month} ${p.year}` : "senza data"}
    >
      <span className={clsx("py-[0.3em] text-[0.62em] font-bold tracking-[0.08em] uppercase text-white", muted ? "bg-grigio-chiaro" : "bg-area-menu")}>
        {p ? p.weekday : "data"}
      </span>
      <span className={clsx("pt-[0.18em] text-[1.45em] font-extrabold", muted ? "text-grigio" : "text-blu-950")}>{p ? p.day : "—"}</span>
      <span className={clsx("pt-[0.15em] pb-[0.4em] text-[0.62em] font-bold uppercase", muted ? "text-grigio-chiaro" : "text-grigio")}>
        {p ? `${p.month}${otherYear ? ` ${p.year.slice(2)}` : ""}` : ""}
      </span>
    </span>
  );
}
