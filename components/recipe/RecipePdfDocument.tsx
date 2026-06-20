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

const ORANGE = "#f97316";
const SKY = "#0c4a6e";
const GRAY = "#6b7280";
const LIGHT = "#9ca3af";

export const pdfStyles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 48,
    paddingHorizontal: 44,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1f2937",
    lineHeight: 1.4,
  },
  headerRow: { flexDirection: "row", gap: 16, marginBottom: 18 },
  headerMain: { flex: 1 },
  photo: { width: 130, height: 100, borderRadius: 8, objectFit: "cover" },
  kicker: {
    fontSize: 8,
    letterSpacing: 1.5,
    color: ORANGE,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  title: { fontSize: 22, fontFamily: "Helvetica-Bold", color: SKY, marginBottom: 8 },
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
    backgroundColor: "#ede9fe",
    justifyContent: "center",
    alignItems: "center",
  },
  tagText: { fontSize: 7.5, color: "#5b21b6", lineHeight: 1, textAlign: "center" },
  metaRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  metaTile: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  metaTileAccent: {
    flex: 1,
    borderWidth: 1,
    borderColor: ORANGE,
    backgroundColor: ORANGE,
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  metaLabel: { fontSize: 7, color: LIGHT, textTransform: "uppercase", letterSpacing: 0.5 },
  metaLabelAccent: { fontSize: 7, color: "#ffedd5", textTransform: "uppercase", letterSpacing: 0.5 },
  metaValue: { fontSize: 11, fontFamily: "Helvetica-Bold", color: SKY, marginTop: 2 },
  metaValueAccent: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#ffffff", marginTop: 2 },
  notes: {
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fde68a",
    borderRadius: 8,
    padding: 9,
    fontSize: 9.5,
    color: "#92400e",
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: SKY,
    marginBottom: 8,
  },
  sectionBar: { width: 4, height: 14, backgroundColor: ORANGE, borderRadius: 2, marginRight: 7 },
  sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 9 },
  columns: { flexDirection: "row", gap: 22 },
  ingredientsCol: { width: "38%" },
  stepsCol: { flex: 1 },
  ingredientItem: { flexDirection: "row", marginBottom: 5, alignItems: "flex-start" },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: ORANGE, marginTop: 4, marginRight: 6 },
  ingredientText: { flex: 1, fontSize: 9.5 },
  ingredientQty: { fontFamily: "Helvetica-Bold", color: SKY },
  ingredientDesc: { color: GRAY, fontSize: 8.5 },
  step: { flexDirection: "row", marginBottom: 8, alignItems: "flex-start" },
  // Pallino numerato: View contenitore con numero centrato (flex)
  stepNum: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: ORANGE,
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
  stepMins: { fontSize: 8, color: ORANGE, marginTop: 1, fontFamily: "Helvetica-Bold" },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 44,
    right: 44,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 8,
    fontSize: 7.5,
    color: LIGHT,
  },
});

function fmtQty(qty: number | null, unit: string | null): string {
  if (qty == null) return unit ?? "";
  const num = Number.isInteger(qty) ? String(qty) : String(qty).replace(/\.?0+$/, "");
  return unit ? `${num} ${unit}` : num;
}

/** Footer fisso condiviso (Ricettario AN10 · data · pagina). */
export function PdfFooter() {
  const today = new Date().toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return (
    <View style={pdfStyles.footer} fixed>
      <Text>Ricettario AN10 · {today}</Text>
      <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  );
}

/**
 * Contenuto di una ricetta (header + meta + note + ingredienti/procedura),
 * senza Page/Document. Riusato dal PDF ricetta singola e dal PDF menù.
 */
export function RecipePdfContent({
  recipe,
  photoData,
  kicker = "Ricettario AN10",
}: {
  recipe: RecipePdfData;
  photoData?: string;
  kicker?: string;
}) {
  const wait = (recipe.steps ?? []).reduce(
    (s, st) => (st.kind === "WAIT" ? s + (st.mins ?? 0) : s),
    0
  );
  const total = (recipe.prep ?? 0) + (recipe.cook ?? 0) + wait;

  return (
    <>
      {/* Header */}
      <View style={pdfStyles.headerRow}>
        <View style={pdfStyles.headerMain}>
          <Text style={pdfStyles.kicker}>{kicker}</Text>
          <Text style={pdfStyles.title}>{recipe.name}</Text>
          {recipe.categories.length > 0 && (
            <View style={pdfStyles.badgeRow}>
              {recipe.categories.map((c, i) => (
                <View key={i} style={[pdfStyles.badge, { backgroundColor: c.color || ORANGE }]}>
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
            <Text style={pdfStyles.metaValue}>{recipe.servings} pers.</Text>
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
            recipe.ingredients.map((ing, i) => {
              const qty = fmtQty(ing.qty, ing.unit);
              return (
                <View key={i} style={pdfStyles.ingredientItem}>
                  <View style={pdfStyles.dot} />
                  <Text style={pdfStyles.ingredientText}>
                    {qty ? <Text style={pdfStyles.ingredientQty}>{qty} </Text> : null}
                    {ing.name}
                    {ing.description ? (
                      <Text style={pdfStyles.ingredientDesc}> — {ing.description}</Text>
                    ) : null}
                  </Text>
                </View>
              );
            })
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
            recipe.steps.map((s, i) => (
              <View key={i} style={pdfStyles.step}>
                <View style={pdfStyles.stepNum}>
                  <Text style={pdfStyles.stepNumText}>{i + 1}</Text>
                </View>
                <View style={pdfStyles.stepBody}>
                  <Text style={pdfStyles.stepText}>{s.text}</Text>
                  {s.mins ? (
                    <Text style={pdfStyles.stepMins}>{formatMinutes(s.mins)}</Text>
                  ) : null}
                </View>
              </View>
            ))
          )}
        </View>
      </View>
    </>
  );
}

export function RecipePdfDocument({
  recipe,
  photoData,
}: {
  recipe: RecipePdfData;
  photoData?: string;
}) {
  return (
    <Document title={recipe.name} author="Ricettario AN10">
      <Page size="A4" style={pdfStyles.page}>
        <RecipePdfContent recipe={recipe} photoData={photoData} />
        <PdfFooter />
      </Page>
    </Document>
  );
}
