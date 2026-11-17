import { ChevronDown, MessageSquareHeart } from "lucide-react";
import { clsx } from "clsx";
import { GuestRatingTag } from "@/components/ds/Tag";

/**
 * Testata delle schede «Recensioni» (dettaglio ricetta `ReviewSection` e dettaglio menù
 * `MenuReceivedReviews`, restyle fase 8): stesso titolo 2.3 di `Panel`, media degli ospiti 6.2 con
 * il numero di recensioni, chevron. Tutta la riga apre e chiude la scheda.
 */
export function ReviewsHeader({
  open,
  onToggle,
  avg,
  count,
}: {
  open: boolean;
  onToggle: () => void;
  avg: number | null;
  count: number;
}) {
  return (
    <button type="button" onClick={onToggle} aria-expanded={open} className="flex min-h-11 w-full items-center gap-3 text-left">
      <MessageSquareHeart className="size-[1.25em] shrink-0 text-blu-700" aria-hidden />
      <h2 className="min-w-0 flex-1 truncate text-(length:--fs-sec) leading-tight font-bold">Recensioni</h2>
      {avg != null && count > 0 && <GuestRatingTag value={avg} count={count} />}
      <ChevronDown
        aria-hidden
        className={clsx("size-[1.125rem] shrink-0 text-blu-600 transition-transform duration-300 motion-reduce:transition-none", open && "rotate-180")}
      />
    </button>
  );
}
