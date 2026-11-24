/**
 * PDF «Per gli ospiti» di un menù: tema del cartoncino e come sono organizzati i piatti (portate, voci scritte a mano,
 * ricette nascoste) e in che formato si stampa. Salvato per menù in `MenuGuestCard.data`
 * (GET/PUT `/api/menus/[id]/guest-card`), così al secondo invio non si rifà tutto.
 *
 * Le ricette sono riferite per id: il menù può cambiare dopo il salvataggio, quindi ogni lettura
 * passa da `resolveGuestCard`, che toglie le ricette uscite dal menù e mette quelle nuove fra
 * le «da sistemare» (stampate in cima, senza titolo di portata).
 *
 * Modulo senza "use client": lo usano sia l'API sia la finestra del PDF.
 */

export type GuestFormat = "a4" | "a5" | "phone";

export const GUEST_FORMATS: { value: GuestFormat; label: string; hint: string }[] = [
  { value: "a4", label: "A4", hint: "Foglio intero, da stampare o appendere" },
  { value: "a5", label: "A5", hint: "Mezzo foglio, un cartoncino da mettere in tavola" },
  { value: "phone", label: "Telefono", hint: "Una pagina lunga, da mandare in chat" },
];

/** Tema del cartoncino: decori, colori e sfondo del PDF (components/menu/guest-themes.tsx) */
export type GuestTheme =
  | "natale"
  | "natale-nordico"
  | "natale-notte"
  | "natale-cartolina"
  | "natale-ghirlanda"
  | "compleanno"
  | "evento";

/** Famiglia del tema: la finestra sceglie prima l'occasione, poi (per Natale) lo stile */
export type GuestThemeFamily = "natale" | "compleanno" | "evento";

export const GUEST_THEMES: { value: GuestTheme; label: string; hint: string; family: GuestThemeFamily }[] = [
  { value: "natale", family: "natale", label: "Classico", hint: "Agrifoglio, rami di pino e fiocchi di neve, rosso e verde su cartoncino panna" },
  { value: "natale-nordico", family: "natale", label: "Nordico", hint: "Punto croce, alberelli geometrici e stella scandinava, rosso e verde su lino" },
  { value: "natale-notte", family: "natale", label: "Notte", hint: "Cielo stellato e stella cometa in oro su fondo blu notte, per una cena elegante" },
  { value: "natale-cartolina", family: "natale", label: "Cartolina", hint: "Cartolina d'altri tempi: bordo a righe bastoncino di zucchero, sigillo di ceralacca, carta kraft" },
  { value: "natale-ghirlanda", family: "natale", label: "Ghirlanda", hint: "Festone e ghirlanda di eucalipto, olivo e bacche rosse su carta bianca, verde salvia" },
  { value: "compleanno", family: "compleanno", label: "Compleanno", hint: "Festone di bandierine, palloncini e coriandoli" },
  { value: "evento", family: "evento", label: "Evento", hint: "Rami d'alloro e cornici d'angolo dorate, per ogni altra occasione" },
];

export const themeFamily = (t: GuestTheme): GuestThemeFamily => GUEST_THEMES.find((x) => x.value === t)?.family ?? "evento";

/**
 * Colore del titolo per tema, usato anche per il logo in cima al cartoncino (ricolorato dal
 * browser prima di disegnarlo: `logoPngDataUrl(…, tint)`). Esadecimale: è per la carta stampata.
 */
export const GUEST_THEME_INK: Record<GuestTheme, string> = {
  natale: "#1d5b3a",
  "natale-nordico": "#a3242b",
  "natale-notte": "#d9b46a",
  "natale-cartolina": "#9e2a2b",
  "natale-ghirlanda": "#3f5d4a",
  compleanno: "#c8344d",
  evento: "#074f67",
};

/**
 * Tema proposto quando il menù non ne ha uno salvato: dal nome («Cena di Natale»,
 * «Compleanno Andrea») o, in mancanza, dalla data (dall'8 dicembre al 6 gennaio = Natale).
 */
export function suggestTheme(name: string, date: string | Date | null): GuestTheme {
  const n = norm(name);
  if (/\b(natal\w*|vigilia|capodanno|epifania|befana|xmas|christmas)\b/.test(n)) return "natale";
  if (/\b(compleann\w*|birthday|anni)\b/.test(n)) return "compleanno";
  if (date) {
    const d = new Date(date);
    if (!isNaN(d.getTime())) {
      const m = d.getUTCMonth();
      const day = d.getUTCDate();
      if ((m === 11 && day >= 8) || (m === 0 && day <= 6)) return "natale";
    }
  }
  return "evento";
}

export type GuestItem = { type: "recipe"; recipeId: number } | { type: "text"; text: string };

export interface GuestCourse {
  name: string;
  items: GuestItem[];
}

export interface GuestCard {
  theme: GuestTheme;
  format: GuestFormat;
  courses: GuestCourse[];
  /** Ricette del menù che non compaiono nel foglio degli ospiti (es. una salsa) */
  hidden: number[];
}

/** Portate proposte come chip «+ Primi»… nella finestra */
export const COURSE_PRESETS = ["Antipasti", "Primi", "Secondi", "Contorni", "Dolci", "Vini", "Bevande"] as const;

/**
 * Parole di categoria che fanno pensare a una portata (minuscolo, senza accenti), cercate come
 * parole intere: «Dolci e dessert», «Primi piatti», «Secondi di pesce» vanno bene così.
 */
const COURSE_MATCH: Record<(typeof COURSE_PRESETS)[number], RegExp> = {
  Antipasti: /\bantipast[oi]\b/,
  Primi: /\bprim[oi]\b/,
  Secondi: /\bsecond[oi]\b/,
  Contorni: /\bcontorn[oi]\b/,
  Dolci: /\b(dolc[ei]|dessert)\b/,
  Vini: /\bvin[oi]\b/,
  Bevande: /\b(bevand[ae]|bibit[ae]|cocktail)\b/,
};

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase();

/** Ricetta del menù come la vede la finestra (in ordine di menù) */
export interface GuestRecipe {
  id: number;
  name: string;
  quick: boolean;
  categories: string[];
}

/**
 * Proposta di partenza quando il menù non ha ancora un foglio salvato: una portata per ogni
 * categoria delle ricette che somiglia a una portata (Antipasti, Primi…), nell'ordine classico.
 * Le ricette senza corrispondenza restano «da sistemare».
 */
export function defaultGuestCard(recipes: GuestRecipe[], theme: GuestTheme = "evento"): GuestCard {
  // Ogni ricetta va nella portata della sua **prima** categoria che ne somiglia a una
  // (l'ordine delle categorie è quello scelto nella ricetta): un roastbeef «Secondi, Antipasti»
  // finisce fra i secondi.
  const byCourse = new Map<string, GuestItem[]>();
  for (const r of recipes) {
    let course: string | undefined;
    for (const c of r.categories) {
      course = COURSE_PRESETS.find((p) => COURSE_MATCH[p].test(norm(c)));
      if (course) break;
    }
    if (!course) continue;
    byCourse.set(course, [...(byCourse.get(course) ?? []), { type: "recipe", recipeId: r.id }]);
  }
  const courses = COURSE_PRESETS.filter((p) => byCourse.has(p)).map((p) => ({ name: p, items: byCourse.get(p)! }));
  return { theme, format: "a4", courses, hidden: [] };
}

/**
 * Valida un valore arrivato dal client o letto dal database. Niente eccezioni: quello che non
 * torna si scarta. `recipeIds` = ricette che fanno parte del menù adesso.
 */
export function normalizeGuestCard(
  raw: unknown,
  recipeIds: Set<number>,
  fallbackTheme: GuestTheme = "evento"
): GuestCard | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as { theme?: unknown; format?: unknown; courses?: unknown; hidden?: unknown };
  const theme: GuestTheme = GUEST_THEMES.some((t) => t.value === r.theme) ? (r.theme as GuestTheme) : fallbackTheme;
  const format: GuestFormat = GUEST_FORMATS.some((f) => f.value === r.format) ? (r.format as GuestFormat) : "a4";
  const seen = new Set<number>();
  const courses: GuestCourse[] = [];
  for (const c of Array.isArray(r.courses) ? r.courses : []) {
    if (!c || typeof c !== "object") continue;
    const { name, items } = c as { name?: unknown; items?: unknown };
    const course: GuestCourse = { name: typeof name === "string" ? name.trim().slice(0, 60) : "", items: [] };
    for (const it of Array.isArray(items) ? items : []) {
      if (!it || typeof it !== "object") continue;
      const item = it as { type?: unknown; recipeId?: unknown; text?: unknown };
      if (item.type === "recipe" && typeof item.recipeId === "number" && recipeIds.has(item.recipeId) && !seen.has(item.recipeId)) {
        seen.add(item.recipeId);
        course.items.push({ type: "recipe", recipeId: item.recipeId });
      } else if (item.type === "text" && typeof item.text === "string" && item.text.trim()) {
        course.items.push({ type: "text", text: item.text.trim().slice(0, 120) });
      }
    }
    courses.push(course);
  }
  const hidden = (Array.isArray(r.hidden) ? r.hidden : []).filter(
    (id): id is number => typeof id === "number" && recipeIds.has(id) && !seen.has(id)
  );
  return { theme, format, courses: courses.slice(0, 20), hidden: [...new Set(hidden)] };
}

/** Ricette del menù che non stanno in nessuna portata e non sono nascoste */
export function unassignedRecipes(card: GuestCard, recipes: GuestRecipe[]): GuestRecipe[] {
  const placed = new Set<number>(card.hidden);
  for (const c of card.courses) for (const i of c.items) if (i.type === "recipe") placed.add(i.recipeId);
  return recipes.filter((r) => !placed.has(r.id));
}

/** Foglio pronto per il PDF: nomi al posto degli id, portate vuote tolte */
export interface GuestSheet {
  theme: GuestTheme;
  format: GuestFormat;
  /** Piatti «da sistemare»: in cima, senza titolo di portata */
  loose: string[];
  courses: { name: string; dishes: string[] }[];
}

export function guestSheet(card: GuestCard, recipes: GuestRecipe[]): GuestSheet {
  const byId = new Map(recipes.map((r) => [r.id, r.name]));
  const courses = card.courses
    .map((c) => ({
      name: c.name.trim(),
      dishes: c.items
        .map((i) => (i.type === "recipe" ? byId.get(i.recipeId) : i.text.trim()))
        .filter((d): d is string => !!d),
    }))
    .filter((c) => c.dishes.length > 0);
  return { theme: card.theme, format: card.format, loose: unassignedRecipes(card, recipes).map((r) => r.name), courses };
}
