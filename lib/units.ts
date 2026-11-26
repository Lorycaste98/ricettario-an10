/**
 * Unità di misura **a schermo** (la ricetta salvata non cambia): l'unità è testo libero scritto a
 * mano, quindi a DB convivono «gr» e «g», «qb» e «q.b.», «Cucchiaio» e «cucchiaio».
 * `displayUnit` le uniforma solo per la lettura; `isLongUnit` dice se l'unità è una parola
 * («cucchiaino», «spicchi», «bicchiere») che nella colonna stretta delle quantità va a capo sotto
 * il numero invece di accanto.
 */
const ALIASES: Record<string, string> = {
  gr: "g",
  grammi: "g",
  qb: "q.b.",
  "q.b": "q.b.",
  qp: "q.b.",
  lt: "l",
  litri: "l",
  litro: "l",
  pizzicol: "pizzico",
  cucchiani: "cucchiai",
};

export function displayUnit(unit: string | null | undefined): string | null {
  const u = unit?.trim();
  if (!u) return null;
  const low = u.toLowerCase();
  return ALIASES[low] ?? low;
}

/** Oltre i 5 caratteri («q.b.», «kg», «ml» restano accanto al numero) l'unità è una parola. */
export function isLongUnit(unit: string | null | undefined): boolean {
  const u = displayUnit(unit);
  return !!u && u.length > 5;
}
