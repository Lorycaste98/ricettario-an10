"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { clsx } from "clsx";

const arrowCls =
  "absolute top-1/2 hidden size-8 -translate-y-1/2 items-center justify-center rounded-full border border-blu-200 bg-white text-blu-800 shadow-[0_4px_12px_oklch(25%_0.038_228/.14)] transition-opacity hover:bg-blu-100 disabled:opacity-0 [@media(hover:hover)]:flex [&_svg]:size-4";

/**
 * Riga di card recensione scorrevole (restyle fase 8): swipe su touch, frecce con snap dove c'è
 * il puntatore. Le frecce compaiono solo se il contenuto eccede la larghezza e spariscono ai due
 * estremi; le sfumature ai bordi (sul fondo `blu-50` del `Collapsible`) dicono che c'è altro.
 */
export function ReviewCarousel({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scrollable, setScrollable] = useState(false);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setScrollable(el.scrollWidth > el.clientWidth + 1);
    setAtStart(el.scrollLeft <= 1);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [update]);

  const scrollByView = (dir: 1 | -1) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <div className="relative">
      <div
        ref={ref}
        onScroll={update}
        className="flex snap-x snap-mandatory gap-2.5 overflow-x-auto overscroll-x-contain pb-1.5 [scrollbar-color:var(--color-blu-250)_transparent] [scrollbar-width:thin]"
      >
        {children}
      </div>

      <div
        aria-hidden
        className={clsx(
          "pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-blu-50 to-transparent transition-opacity duration-200",
          scrollable && !atStart ? "opacity-100" : "opacity-0"
        )}
      />
      <div
        aria-hidden
        className={clsx(
          "pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-blu-50 to-transparent transition-opacity duration-200",
          scrollable && !atEnd ? "opacity-100" : "opacity-0"
        )}
      />

      {scrollable && (
        <>
          <button type="button" onClick={() => scrollByView(-1)} disabled={atStart} aria-label="Recensioni precedenti" className={clsx(arrowCls, "left-1")}>
            <ChevronLeft />
          </button>
          <button type="button" onClick={() => scrollByView(1)} disabled={atEnd} aria-label="Recensioni successive" className={clsx(arrowCls, "right-1")}>
            <ChevronRight />
          </button>
        </>
      )}
    </div>
  );
}
