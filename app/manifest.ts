import type { MetadataRoute } from "next";

/**
 * Manifest dell'app installabile («Aggiungi alla schermata Home»). Icone generate dalla suite
 * del logo (`public/brand/web/`, vedi `docs/design/loghi/kit/GUIDA.md`). Colori = blu del logo.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ricettario AN10",
    short_name: "AN10",
    description: "Il mio personale ricettario: ricette, menù e tempi di preparazione.",
    lang: "it",
    start_url: "/",
    display: "standalone",
    background_color: "#0A7EA4",
    theme_color: "#0A7EA4",
    icons: [
      { src: "/brand/web/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/web/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/brand/web/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
