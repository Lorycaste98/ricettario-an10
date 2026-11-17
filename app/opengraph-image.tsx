import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Anteprima per la condivisione del link (OG + Twitter), restyle fase 6: fondo blu-800 della
// cornice, logo AN10 orizzontale in bianco (stesso file di `public/brand/`), testo nei toni del
// restyle. Colori in esadecimale: il renderer di next/og non legge oklch.
export const alt = "Ricettario AN10 — Le ricette di casa, sempre a portata di mano";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BLU_800 = "#074f67";
const NAV_MUTED = "#9bc5d5";

export default async function OpengraphImage() {
  // Il logo ha i ritagli come maschere SVG: come <img> lo disegna resvg, che le supporta.
  // Se il file non è leggibile si ripiega sulla scritta.
  let logoSrc: string | null = null;
  try {
    const svg = await readFile(join(process.cwd(), "public/brand/an10-orizzontale-bianco.svg"));
    logoSrc = `data:image/svg+xml;base64,${svg.toString("base64")}`;
  } catch {
    logoSrc = null;
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 48,
          background: BLU_800,
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        {logoSrc ? (
          <img src={logoSrc} width={600} height={197} alt="" />
        ) : (
          <div style={{ fontSize: 180, fontWeight: 800, letterSpacing: 8, lineHeight: 1 }}>AN10</div>
        )}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <div style={{ fontSize: 60, fontWeight: 800, letterSpacing: -1 }}>Ricettario</div>
          <div style={{ fontSize: 34, color: NAV_MUTED }}>Le ricette di casa, sempre a portata di mano</div>
        </div>
      </div>
    ),
    size
  );
}
