import { ImageResponse } from "next/og";

// Anteprima statica per la condivisione del link (OG + Twitter)
export const alt = "Ricettario AN10 — Il ricettario di famiglia";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
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
          background: "linear-gradient(135deg, #082f49 0%, #0c4a6e 55%, #075985 100%)",
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
          <div
            style={{
              width: 14,
              height: 64,
              borderRadius: 7,
              background: "#f97316",
              display: "flex",
            }}
          />
          Ricettario
        </div>
        <div style={{ fontSize: 128, fontWeight: 800, marginTop: 12, lineHeight: 1 }}>
          AN10
        </div>
        <div style={{ fontSize: 40, color: "#bae6fd", marginTop: 28, maxWidth: 900 }}>
          Il ricettario di famiglia: ricette, menù e tempi di preparazione.
        </div>
      </div>
    ),
    size
  );
}
