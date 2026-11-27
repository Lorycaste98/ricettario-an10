/* Modulo senza react-pdf: lo usano anche la pagina web del menù per gli ospiti e i suoi decori. */
// Colori del restyle (app/design-tokens.css) in esadecimale: react-pdf non legge oklch.
// Arancio solo per le quantità, ambra per i tempi, blu per titoli e numeri (DESIGN.md D2).
export const PDF = {
  ink: "#0a2530", //        blu-950 · testo
  blu: "#074f67", //        blu-800 · titoli, numeri, totale
  blu100: "#e3f1f7", //     blu-100 · fondi chiari
  line: "#d3e5ec", //       blu-150 · bordi e filetti
  dot: "#9dd3e6", //        blu-300
  muted: "#9bc5d5", //      nav-muted · testo chiaro su blu-800
  grigio: "#4f6b77", //     testo secondario
  light: "#7a949f", //      grigio-chiaro · etichette
  arancio: "#e8590b", //    quantità
  ambra: "#9a5b00", //      tempi
  nota: "#fff3bf", //       giallo-100 · note
  notaInk: "#7a5b01", //    giallo-ink
} as const;
