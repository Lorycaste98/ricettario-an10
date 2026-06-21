import { ImageResponse } from "next/og";

// Anteprima per la condivisione del link (OG + Twitter)
export const alt = "Ricettario AN10 — Il mio ricettario";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BG = "linear-gradient(135deg, #082f49 0%, #0c4a6e 55%, #075985 100%)";

export default async function OpengraphImage() {
  // Primario: il logo come anteprima. Fallback: layout testuale custom.
  try {
    const buf = await fetch(new URL("./apple-icon.png", import.meta.url)).then((r) => {
      if (!r.ok) throw new Error("logo non disponibile");
      return r.arrayBuffer();
    });
    const logoSrc = `data:image/png;base64,${Buffer.from(buf).toString("base64")}`;

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
            gap: 44,
            background: BG,
            color: "#ffffff",
            fontFamily: "sans-serif",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} width={260} height={260} style={{ borderRadius: 56 }} alt="" />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <div style={{ fontSize: 76, fontWeight: 800, letterSpacing: -1 }}>Ricettario AN10</div>
            <div style={{ fontSize: 32, color: "#bae6fd" }}>
              Ricette, menù e tempi di preparazione.
            </div>
          </div>
        </div>
      ),
      size
    );
  } catch {
    // Fallback testuale (se il logo non è leggibile)
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "80px",
            background: BG,
            color: "#ffffff",
            fontFamily: "sans-serif",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
              fontSize: 30,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: "#fb923c",
              fontWeight: 700,
            }}
          >
            <div style={{ width: 14, height: 64, borderRadius: 7, background: "#f97316", display: "flex" }} />
            Ricettario
          </div>
          <div style={{ fontSize: 128, fontWeight: 800, marginTop: 12, lineHeight: 1 }}>AN10</div>
          <div style={{ fontSize: 40, color: "#bae6fd", marginTop: 28, maxWidth: 900 }}>Il mio ricettario:</div>
          <div style={{ fontSize: 30, color: "#bae6fd", marginTop: 28, maxWidth: 900 }}>
            Ricette, menù e tempi di preparazione.
          </div>
        </div>
      ),
      size
    );
  }
}
