"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Riga di card recensione scorrevole: swipe orizzontale su mobile, frecce
 * (con snap) su desktop. Le frecce compaiono solo se il contenuto eccede la
 * larghezza; si disabilitano ai due estremi. Scrollbar sottile e scura.
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
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-1
          [scrollbar-width:thin] [scrollbar-color:#0c4a6e55_transparent]
          [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent
          [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-sky-900/30"
      >
        {children}
      </div>

      {/* Sfumature ai bordi: compaiono solo con overflow e non a quell'estremo,
          per far capire che ci sono altre recensioni oltre il bordo */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-sky-950/20 to-transparent transition-opacity duration-200 ${
          scrollable && !atStart ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-sky-950/20 to-transparent transition-opacity duration-200 ${
          scrollable && !atEnd ? "opacity-100" : "opacity-0"
        }`}
      />

      {scrollable && (
        <>
          <button
            type="button"
            onClick={() => scrollByView(-1)}
            disabled={atStart}
            aria-label="Recensioni precedenti"
            className="absolute left-0 top-1/2 hidden h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/60 bg-white/90 text-sky-700 shadow-md backdrop-blur-sm transition-opacity hover:bg-white disabled:opacity-0 sm:flex"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => scrollByView(1)}
            disabled={atEnd}
            aria-label="Recensioni successive"
            className="absolute right-0 top-1/2 hidden h-8 w-8 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/60 bg-white/90 text-sky-700 shadow-md backdrop-blur-sm transition-opacity hover:bg-white disabled:opacity-0 sm:flex"
          >
            <ChevronRight size={16} />
          </button>
        </>
      )}
    </div>
  );
}
