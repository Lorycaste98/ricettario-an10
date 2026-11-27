"use client";

import type { CSSProperties, Ref } from "react";
import type { GuestSheet } from "@/lib/menu-guest-card";
import { An10Logo } from "@/components/brand/An10Logo";
import { BAND_TEXT_RIGHT, BandDecor, BottomOrnament, THEME } from "./guest-themes";

/**
 * Menù «per gli ospiti» **sul web** (scelta del 27/11/2026: «Esporta» → PDF A4, Immagine, Link).
 * Lo stesso disegno del vecchio formato «Telefono» del PDF, in HTML: fascia colorata col logo bianco
 * e i decori del tema (`guest-themes.tsx`, forme SVG del browser), foto del menù, piatti per portata,
 * ornamento in fondo. Lo usano:
 * - la pagina pubblica `/ospiti/[token]` (il link da mandare: sempre aggiornato);
 * - l'immagine PNG, fotografata da questo stesso componente (`html-to-image` in `MenuPdfButton`).
 *
 * Colori e caratteri sono quelli del cartoncino (esadecimali di `THEME`), non i token dell'app.
 */

export const GUEST_SHEET_W = 400;
const BAND_DECOR_H = 170;

const SERIF = '"Times New Roman", Times, Georgia, serif';
const SANS = 'system-ui, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif';
const fontFor = (pdfFont: string) => (pdfFont.startsWith("Courier") ? '"Courier New", Courier, monospace' : SERIF);

export interface GuestMenuInfo {
  name: string;
  description: string | null;
  date: string | null;
  servingTime: string | null;
  photo: string | null;
}

export function serveLine(date: string | null, servingTime: string | null): string | null {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  const day = d.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Rome" });
  const cap = day.charAt(0).toUpperCase() + day.slice(1);
  return servingTime ? `${cap} · ore ${servingTime}` : cap;
}

export function GuestMenuSheet({
  menu,
  sheet,
  footer,
  ref,
  style,
}: {
  menu: GuestMenuInfo;
  sheet: GuestSheet;
  /** in fondo, sotto l'ornamento (es. «Vota i piatti» sulla pagina pubblica) */
  footer?: React.ReactNode;
  ref?: Ref<HTMLDivElement>;
  style?: CSSProperties;
}) {
  const t = THEME[sheet.theme];
  const when = serveLine(menu.date, menu.servingTime);
  const kicker: CSSProperties = { fontFamily: SANS, fontWeight: 700, fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase" };

  return (
    <div
      ref={ref}
      style={{ width: GUEST_SHEET_W, maxWidth: "100%", background: t.bg, color: t.ink, fontFamily: SERIF, paddingBottom: 30, overflow: "hidden", ...style }}
    >
      <div style={{ position: "relative", background: t.band, padding: `${t.bandTop ?? 32}px 28px 26px`, minHeight: BAND_DECOR_H }}>
        <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
          <BandDecor theme={sheet.theme} W={GUEST_SHEET_W} H={BAND_DECOR_H} />
        </div>
        <div style={{ position: "relative", maxWidth: BAND_TEXT_RIGHT - 28 }}>
          <An10Logo variant="orizzontale" title="AN10" className="h-6 w-auto text-white" />
          <p style={{ ...kicker, color: t.bandSoft, margin: "18px 0 6px" }}>Menù</p>
          <h1
            style={{
              fontFamily: fontFor(t.titleFont),
              fontWeight: 700,
              fontSize: 30 * (t.titleScale ?? 1),
              lineHeight: 1.12,
              color: "#ffffff",
              margin: 0,
              overflowWrap: "anywhere",
            }}
          >
            {menu.name}
          </h1>
          {when && <p style={{ fontStyle: "italic", fontSize: 15, color: t.bandSoft, margin: "10px 0 0" }}>{when}</p>}
        </div>
      </div>
      {menu.photo && (
        // eslint-disable-next-line @next/next/no-img-element -- deve finire anche nell'immagine PNG (html-to-image)
        <img src={menu.photo} alt="" crossOrigin="anonymous" style={{ display: "block", width: "100%", height: 220, objectFit: "cover" }} />
      )}
      <div style={{ padding: "24px 28px 0" }}>
        {menu.description && <p style={{ fontStyle: "italic", fontSize: 14, lineHeight: 1.45, color: t.soft, margin: "0 0 20px" }}>{menu.description}</p>}
        {sheet.loose.length > 0 && (
          <div style={{ marginBottom: 22 }}>
            {sheet.loose.map((d, j) => (
              <p key={j} style={{ fontSize: 18, lineHeight: 1.3, margin: "0 0 6px" }}>
                {d}
              </p>
            ))}
          </div>
        )}
        {sheet.courses.map((c, i) => (
          <section key={i} style={{ marginBottom: 22 }}>
            {c.name && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9 }}>
                <h2 style={{ ...kicker, fontSize: 11, letterSpacing: "0.22em", color: t.course, margin: 0 }}>{c.name}</h2>
                <span style={{ flex: 1, height: 1, background: t.frameIn }} />
              </div>
            )}
            {c.dishes.map((d, j) => (
              <p key={j} style={{ fontSize: 18, lineHeight: 1.3, margin: "0 0 6px" }}>
                {d}
              </p>
            ))}
          </section>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 6 }}>
        <BottomOrnament theme={sheet.theme} />
        {footer}
      </div>
    </div>
  );
}
