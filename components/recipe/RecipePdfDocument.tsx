import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import type { RecipePdfData } from "./RecipePdfButton";
import { formatMinutes } from "@/lib/types";
import { groupIngredientsBySection } from "@/lib/ingredient-sections";
import { resolveLinkQty, splitIngredientIds } from "@/lib/step-ingredients";

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
const ORANGE = PDF.arancio;
const SKY = PDF.blu;
const GRAY = PDF.grigio;
const LIGHT = PDF.light;

export const pdfStyles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 48,
    paddingHorizontal: 44,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: PDF.ink,
    lineHeight: 1.4,
  },
  headerRow: { flexDirection: "row", gap: 16, marginBottom: 18 },
  headerMain: { flex: 1 },
  photo: { width: 130, height: 100, borderRadius: 8, objectFit: "cover" },
  kickerRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 5 },
  // logo orizzontale (720×236): altezza 16 → larghezza 49
  headerLogo: { width: 49, height: 16 },
  kicker: {
    fontSize: 8,
    letterSpacing: 1.5,
    color: GRAY,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    lineHeight: 1,
  },
  title: { fontSize: 22, fontFamily: "Helvetica-Bold", color: PDF.ink, marginBottom: 12 },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginBottom: 6 },
  // Badge categoria: View contenitore + Text centrato (centratura affidabile in react-pdf)
  badge: {
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    fontSize: 7.5,
    color: "#ffffff",
    fontFamily: "Helvetica-Bold",
    lineHeight: 1,
    textAlign: "center",
  },
  tag: {
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 10,
    backgroundColor: PDF.blu100,
    justifyContent: "center",
    alignItems: "center",
  },
  tagText: { fontSize: 7.5, color: PDF.blu, lineHeight: 1, textAlign: "center" },
  metaRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  metaTile: {
    flex: 1,
    borderWidth: 1,
    borderColor: PDF.line,
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  metaTileAccent: {
    flex: 1,
    borderWidth: 1,
    borderColor: SKY,
    backgroundColor: SKY,
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  metaLabel: { fontSize: 7, color: LIGHT, textTransform: "uppercase", letterSpacing: 0.5 },
  metaLabelAccent: { fontSize: 7, color: PDF.muted, textTransform: "uppercase", letterSpacing: 0.5 },
  metaValue: { fontSize: 11, fontFamily: "Helvetica-Bold", color: PDF.ink, marginTop: 2 },
  metaValueAccent: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#ffffff", marginTop: 2 },
  notes: {
    backgroundColor: PDF.nota,
    borderWidth: 1,
    borderColor: PDF.nota,
    borderRadius: 8,
    padding: 9,
    fontSize: 9.5,
    color: PDF.notaInk,
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: PDF.ink,
    lineHeight: 1,
  },
  sectionBar: { width: 4, height: 13, backgroundColor: SKY, borderRadius: 2, marginRight: 7 },
  sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 9 },
  columns: { flexDirection: "row", gap: 22 },
  ingredientsCol: { width: "38%" },
  stepsCol: { flex: 1 },
  ingredientItem: { flexDirection: "row", marginBottom: 5, alignItems: "flex-start" },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: PDF.dot, marginTop: 4, marginRight: 6 },
  ingredientText: { flex: 1, fontSize: 9.5 },
  ingredientQty: { fontFamily: "Helvetica-Bold", color: ORANGE },
  ingredientDesc: { color: GRAY, fontSize: 8.5 },
  // Titolo di una sezione di ingredienti (es. "Per l'impasto")
  ingredientGroup: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: SKY,
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  step: { flexDirection: "row", marginBottom: 8, alignItems: "flex-start" },
  // Pallino numerato: View contenitore con numero centrato (flex)
  stepNum: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: SKY,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  stepNumText: {
    color: "#ffffff",
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    lineHeight: 1,
    textAlign: "center",
  },
  stepBody: { flex: 1 },
  stepText: { fontSize: 9.5 },
  stepMins: { fontSize: 8, color: PDF.ambra, marginTop: 1, fontFamily: "Helvetica-Bold" },
  // Ingredienti necessari al passo (solo se la ricetta li ha legati)
  stepIngredients: { fontSize: 8, color: GRAY, marginTop: 1 },
  // ⚠️ react-pdf 4.x: un elemento `fixed` ancorato con `bottom` che contiene un <Text render>
  // finisce fuori pagina (o non viene disegnato). Quindi il piè di pagina si ancora con `top`
  // (A4 = 841.89pt, sotto il paddingBottom del contenuto) e il numero di pagina è un Text a parte.
  footer: {
    position: "absolute",
    top: 800,
    left: 44,
    right: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: PDF.line,
    paddingTop: 8,
    fontSize: 7.5,
    color: LIGHT,
  },
  footerPage: { position: "absolute", top: 809, right: 44, fontSize: 7.5, color: LIGHT },
});

function fmtQty(qty: number | null, unit: string | null): string {
  // 0 = vecchie righe «0 q.b.»: come nel dettaglio, solo l'unità
  if (qty == null || qty === 0) return unit ?? "";
  const num = Number.isInteger(qty) ? String(qty) : String(qty).replace(/\.?0+$/, "");
  return unit ? `${num} ${unit}` : num;
}

/**
 * Footer fisso condiviso (Ricettario AN10 · data · pagina). `label` lo sostituisce a sinistra
 * (il PDF del menù ci scrive nome e data del menù); il numero di pagina resta.
 */
export function PdfFooter({ label }: { label?: string } = {}) {
  const today = new Date().toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return (
    <>
      <View style={pdfStyles.footer} fixed>
        <Text>{label ?? `Ricettario AN10 · ${today}`}</Text>
      </View>
      <Text style={pdfStyles.footerPage} fixed render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </>
  );
}

/**
 * Contenuto di una ricetta (header + meta + note + ingredienti/procedura),
 * senza Page/Document. Riusato dal PDF ricetta singola e dal PDF menù.
 */
export function RecipePdfContent({
  recipe,
  photoData,
  logoData,
  kicker = "Ricettario",
}: {
  recipe: RecipePdfData;
  photoData?: string;
  logoData?: string;
  kicker?: string;
}) {
  const wait = (recipe.steps ?? []).reduce(
    (s, st) => (st.kind === "WAIT" ? s + (st.mins ?? 0) : s),
    0
  );
  const total = (recipe.prep ?? 0) + (recipe.cook ?? 0) + wait;
  // Ingredienti ripartiti fra più passi: un legame senza quantità vale "il resto",
  // non il totale (vedi lib/step-ingredients)
  const splitIds = splitIngredientIds(recipe.steps ?? []);

  return (
    <>
      {/* Header */}
      <View style={pdfStyles.headerRow}>
        <View style={pdfStyles.headerMain}>
          <View style={pdfStyles.kickerRow}>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- componente PDF di react-pdf */}
            {logoData && <Image src={logoData} style={pdfStyles.headerLogo} />}
            <Text style={pdfStyles.kicker}>{kicker}</Text>
          </View>
          <Text style={pdfStyles.title}>{recipe.name}</Text>
          {recipe.categories.length > 0 && (
            <View style={pdfStyles.badgeRow}>
              {recipe.categories.map((c, i) => (
                <View key={i} style={[pdfStyles.badge, { backgroundColor: c.color || SKY }]}>
                  <Text style={pdfStyles.badgeText}>{c.name}</Text>
                </View>
              ))}
            </View>
          )}
          {recipe.tags.length > 0 && (
            <View style={pdfStyles.badgeRow}>
              {recipe.tags.map((t, i) => (
                <View key={i} style={pdfStyles.tag}>
                  <Text style={pdfStyles.tagText}>{t.name}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
        {/* eslint-disable-next-line jsx-a11y/alt-text -- componente PDF di react-pdf, non un <img> HTML */}
        {photoData && <Image src={photoData} style={pdfStyles.photo} />}
      </View>

      {/* Meta */}
      <View style={pdfStyles.metaRow}>
        {recipe.prep ? (
          <View style={pdfStyles.metaTile}>
            <Text style={pdfStyles.metaLabel}>Preparazione</Text>
            <Text style={pdfStyles.metaValue}>{formatMinutes(recipe.prep)}</Text>
          </View>
        ) : null}
        {recipe.cook ? (
          <View style={pdfStyles.metaTile}>
            <Text style={pdfStyles.metaLabel}>Cottura</Text>
            <Text style={pdfStyles.metaValue}>{formatMinutes(recipe.cook)}</Text>
          </View>
        ) : null}
        {wait > 0 ? (
          <View style={pdfStyles.metaTile}>
            <Text style={pdfStyles.metaLabel}>Attesa</Text>
            <Text style={pdfStyles.metaValue}>{formatMinutes(wait)}</Text>
          </View>
        ) : null}
        {total > 0 ? (
          <View style={pdfStyles.metaTileAccent}>
            <Text style={pdfStyles.metaLabelAccent}>Totale</Text>
            <Text style={pdfStyles.metaValueAccent}>{formatMinutes(total)}</Text>
          </View>
        ) : null}
        {recipe.servings ? (
          <View style={pdfStyles.metaTile}>
            <Text style={pdfStyles.metaLabel}>Porzioni</Text>
            <Text style={pdfStyles.metaValue}>{recipe.servings} {recipe.servingsUnit?.trim() || "pers."}</Text>
          </View>
        ) : null}
      </View>

      {recipe.notes ? <Text style={pdfStyles.notes}>{recipe.notes}</Text> : null}

      {/* Ingredienti + Procedura */}
      <View style={pdfStyles.columns}>
        <View style={pdfStyles.ingredientsCol}>
          <View style={pdfStyles.sectionHeader}>
            <View style={pdfStyles.sectionBar} />
            <Text style={pdfStyles.sectionTitle}>Ingredienti</Text>
          </View>
          {recipe.ingredients.length === 0 ? (
            <Text style={{ color: LIGHT }}>—</Text>
          ) : (
            // Gruppi per sezione/preparazione: senza sezioni è un gruppo solo (titolo omesso)
            groupIngredientsBySection(recipe.ingredients).map((group, gi) => (
              <View key={gi}>
                {group.section ? (
                  <Text style={[pdfStyles.ingredientGroup, gi > 0 ? { marginTop: 6 } : {}]}>
                    {group.section}
                  </Text>
                ) : null}
                {group.items.map((ing, i) => {
                  const qty = fmtQty(ing.qty, ing.unit);
                  return (
                    <View key={i} style={pdfStyles.ingredientItem}>
                      <View style={pdfStyles.dot} />
                      <Text style={pdfStyles.ingredientText}>
                        {qty ? <Text style={pdfStyles.ingredientQty}>{qty} </Text> : null}
                        {ing.name}
                        {ing.optional ? (
                          <Text style={pdfStyles.ingredientDesc}> (opz.)</Text>
                        ) : null}
                        {ing.description ? (
                          <Text style={pdfStyles.ingredientDesc}> — {ing.description}</Text>
                        ) : null}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ))
          )}
        </View>

        <View style={pdfStyles.stepsCol}>
          <View style={pdfStyles.sectionHeader}>
            <View style={pdfStyles.sectionBar} />
            <Text style={pdfStyles.sectionTitle}>Procedimento</Text>
          </View>
          {recipe.steps.length === 0 ? (
            <Text style={{ color: LIGHT }}>—</Text>
          ) : (
            recipe.steps.map((s, i) => {
              // Ingredienti legati al passo, nell'ordine della lista ricetta, con la
              // quantità usata in quel passo (o quella piena se non è ripartita)
              const links = s.stepIngredients ?? [];
              const stepIngredients = links.length
                ? recipe.ingredients
                    .map((ing) => {
                      const link = links.find((l) => ing.id != null && l.ingredientId === ing.id);
                      if (!link) return null;
                      const qty = resolveLinkQty(link.qty, ing.qty, splitIds.has(link.ingredientId));
                      const amount = qty != null
                        ? fmtQty(qty, ing.unit)
                        : ing.qty != null
                        ? "il resto"
                        : ing.unit ?? "";
                      return [amount, ing.name].filter(Boolean).join(" ");
                    })
                    .filter((label): label is string => !!label)
                : [];
              return (
                <View key={i} style={pdfStyles.step} wrap={false}>
                  <View style={pdfStyles.stepNum}>
                    <Text style={pdfStyles.stepNumText}>{i + 1}</Text>
                  </View>
                  <View style={pdfStyles.stepBody}>
                    <Text style={pdfStyles.stepText}>{s.text}</Text>
                    {stepIngredients.length > 0 ? (
                      <Text style={pdfStyles.stepIngredients}>{stepIngredients.join(" · ")}</Text>
                    ) : null}
                    {s.mins ? (
                      <Text style={pdfStyles.stepMins}>{formatMinutes(s.mins)}</Text>
                    ) : null}
                  </View>
                </View>
              );
            })
          )}
        </View>
      </View>
    </>
  );
}

export function RecipePdfDocument({
  recipe,
  photoData,
  logoData,
}: {
  recipe: RecipePdfData;
  photoData?: string;
  logoData?: string;
}) {
  return (
    <Document title={recipe.name} author="Ricettario AN10">
      <Page size="A4" style={pdfStyles.page}>
        <RecipePdfContent recipe={recipe} photoData={photoData} logoData={logoData} />
        <PdfFooter />
      </Page>
    </Document>
  );
}
