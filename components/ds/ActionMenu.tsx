"use client";
import { clsx } from "clsx";
import { MoreHorizontal } from "lucide-react";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

export type ActionMenuItem = {
  label: string;
  icon: ReactNode;
  onSelect: () => void;
  /** danger = rosa (elimina), separato dalle altre voci da un filetto */
  tone?: "neutral" | "danger";
  /** voce accesa (es. «Nei preferiti»): icona arancio */
  active?: boolean;
  disabled?: boolean;
};

/**
 * 3.14 · menù azioni «⋯»: bottone quadrato (3.10 `sq`) che apre una tendina bianca nel nostro stile
 * (non il menù nativo). Usato nelle testate dei dettagli quando lo spazio è stretto: lì resta in
 * vista solo l'azione che conta (l'occhio 4.8) e le altre stanno qui.
 *
 * Tendina in portale su `body`, posizione fissa calcolata dal bottone e allineata al suo bordo
 * destro (come `FilterPopover` 4.14); chiusura con tocco fuori, Esc (il focus torna al bottone) o
 * scelta di una voce. Frecce su/giù fra le voci. Compare con una scala breve dall'angolo in alto a
 * destra, ferma con «Riduci movimento».
 */
export function ActionMenu({ label = "Altre azioni", items, className }: { label?: string; items: ActionMenuItem[]; className?: string }) {
  const menuId = useId();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const place = useCallback(() => {
    const b = btnRef.current?.getBoundingClientRect();
    if (!b) return;
    if (b.width === 0 && b.height === 0) {
      setOpen(false);
      return;
    }
    const vw = document.documentElement.clientWidth;
    setPos({ top: b.bottom + 6, right: Math.max(8, vw - b.right) });
  }, []);

  const close = useCallback((refocus: boolean) => {
    setOpen(false);
    if (refocus) btnRef.current?.focus();
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || btnRef.current?.contains(t)) return;
      close(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close(true);
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  // all'apertura il focus va alla prima voce
  useEffect(() => {
    if (!open || !pos) return;
    panelRef.current?.querySelector<HTMLElement>("[role=menuitem]:not([disabled])")?.focus();
  }, [open, pos]);

  const onPanelKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const list = Array.from(panelRef.current?.querySelectorAll<HTMLElement>("[role=menuitem]:not([disabled])") ?? []);
    const i = list.indexOf(document.activeElement as HTMLElement);
    const next = e.key === "ArrowDown" ? (i + 1) % list.length : (i - 1 + list.length) % list.length;
    list[next]?.focus();
  };

  const normal = items.filter((i) => i.tone !== "danger");
  const danger = items.filter((i) => i.tone === "danger");

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-label={label}
        title={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => (open ? close(false) : setOpen(true))}
        className={clsx(
          "hit-44 inline-flex size-(--h-sm) shrink-0 items-center justify-center rounded-[0.625rem] border transition-colors [&_svg]:size-[1.15rem]",
          "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-blu-600/35",
          open ? "border-blu-800 bg-blu-800 text-white" : "border-blu-200 bg-white text-blu-800 hover:bg-blu-100",
          className
        )}
      >
        <MoreHorizontal aria-hidden />
      </button>
      {open &&
        pos &&
        createPortal(
          <div
            ref={panelRef}
            id={menuId}
            role="menu"
            aria-label={label}
            onKeyDown={onPanelKey}
            style={{ top: pos.top, right: pos.right }}
            className={clsx(
              "ds fixed z-50 flex min-w-[13.5rem] origin-top-right flex-col rounded-ctl border border-blu-150 bg-white p-1 text-blu-950",
              "shadow-[0_12px_32px_-8px_oklch(25%_0.038_228/.28),0_2px_6px_oklch(25%_0.038_228/.08)]",
              "animate-[menu-in_160ms_cubic-bezier(0.16,1,0.3,1)] motion-reduce:animate-none"
            )}
          >
            {normal.map((it) => (
              <MenuRow key={it.label} item={it} onDone={() => close(false)} />
            ))}
            {danger.length > 0 && normal.length > 0 && <div role="separator" className="mx-2 my-1 h-px bg-blu-150" />}
            {danger.map((it) => (
              <MenuRow key={it.label} item={it} onDone={() => close(false)} />
            ))}
          </div>,
          document.body
        )}
    </>
  );
}

function MenuRow({ item, onDone }: { item: ActionMenuItem; onDone: () => void }) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={item.disabled}
      onClick={() => {
        onDone();
        item.onSelect();
      }}
      className={clsx(
        "flex min-h-11 items-center gap-3 rounded-[0.5625rem] px-3 text-left text-[0.9375rem] font-semibold transition-colors",
        "focus-visible:bg-blu-100 focus-visible:outline-none disabled:text-grigio-chiaro [&_svg]:size-[1.15rem] [&_svg]:shrink-0",
        item.tone === "danger" ? "text-rosa hover:bg-rosa-50 focus-visible:bg-rosa-50" : "hover:bg-blu-100"
      )}
    >
      <span aria-hidden className={clsx("flex", item.tone !== "danger" && (item.active ? "text-arancio-pieno" : "text-blu-700"))}>
        {item.icon}
      </span>
      {item.label}
    </button>
  );
}
