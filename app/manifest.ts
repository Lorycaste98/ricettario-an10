import type { MetadataRoute } from "next";

/**
 * Manifest dell'app installabile («Aggiungi alla schermata Home», restyle fase 7). Icone dalla
 * suite del logo (`public/brand/web/`, vedi `docs/design/loghi/kit/GUIDA.md`).
 * Colori: barra = blu-800 della cornice (come `viewport.themeColor` in app/layout.tsx), fondo
 * dell'avvio su Android = blu-50 delle pagine. Esadecimali: il manifest non accetta oklch.
 * Su iPhone e iPad contano invece i metadati `appleWebApp` del layout e `app/apple-icon.png`.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Ricettario AN10",
    short_name: "AN10",
    description: "Il mio personale ricettario: ricette, menù e tempi di preparazione.",
    lang: "it",
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f4f9fb",
    theme_color: "#074f67",
    categories: ["food", "lifestyle"],
    icons: [
      { src: "/brand/web/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/brand/web/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/brand/web/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    // Pressione lunga sull'icona (Android, Chrome sul PC): le tre voci principali della navigazione
    shortcuts: [
      { name: "Ricette", url: "/ricette", icons: [{ src: "/brand/web/icon-192.png", sizes: "192x192" }] },
      { name: "Menù", url: "/menu", icons: [{ src: "/brand/web/icon-192.png", sizes: "192x192" }] },
      { name: "Preferiti", url: "/preferiti", icons: [{ src: "/brand/web/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
