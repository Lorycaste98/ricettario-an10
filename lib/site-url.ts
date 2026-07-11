// URL base del sito: dominio di produzione Vercel (stabile) o override esplicito.
// Condiviso tra layout (OG/canonical) e link condivisibili (es. recensione menù).

export function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000")
  );
}
