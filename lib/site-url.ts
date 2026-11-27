// URL base del sito, condiviso tra layout (OG/canonical) e link condivisibili (es. recensione menù).
// - Produzione: dominio di produzione Vercel (stabile) o override esplicito `NEXT_PUBLIC_SITE_URL`.
// - Anteprima (VERCEL_ENV=preview): l'indirizzo **fisso del branch** (`VERCEL_BRANCH_URL`), così il
//   link e il QR delle recensioni aperti da un'anteprima portano all'anteprima stessa e non alla
//   produzione (che ha un'altra versione del sito). Prima puntavano sempre alla produzione.
// - In locale: localhost.

export function getSiteUrl(): string {
  if (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_BRANCH_URL) {
    return `https://${process.env.VERCEL_BRANCH_URL}`;
  }
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000")
  );
}
