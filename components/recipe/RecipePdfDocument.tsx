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

const styles = StyleSheet.create({
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
  badge: {
    fontSize: 7.5,
    color: "#ffffff",
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 10,
    fontFamily: "Helvetica-Bold",
  },
  tag: {
    fontSize: 7.5,
    color: "#5b21b6",
    backgroundColor: "#ede9fe",
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
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
  metaLabel: { fontSize: 7, color: LIGHT, textTransform: "uppercase", letterSpacing: 0.5 },
  metaValue: { fontSize: 11, fontFamily: "Helvetica-Bold", color: SKY, marginTop: 2 },
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
  stepNum: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: ORANGE,
    color: "#ffffff",
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    paddingTop: 3,
    marginRight: 8,
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

export function RecipePdfDocument({
  recipe,
  photoData,
}: {
  recipe: RecipePdfData;
  photoData?: string;
}) {
  const total = (recipe.prep ?? 0) + (recipe.cook ?? 0);
  const today = new Date().toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Document title={recipe.name} author="Ricettario AN10">
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerMain}>
            <Text style={styles.kicker}>Ricettario AN10</Text>
            <Text style={styles.title}>{recipe.name}</Text>
            {recipe.categories.length > 0 && (
              <View style={styles.badgeRow}>
                {recipe.categories.map((c, i) => (
                  <Text key={i} style={[styles.badge, { backgroundColor: c.color || ORANGE }]}>
                    {c.name}
                  </Text>
                ))}
              </View>
            )}
            {recipe.tags.length > 0 && (
              <View style={styles.badgeRow}>
                {recipe.tags.map((t, i) => (
                  <Text key={i} style={styles.tag}>
                    {t.name}
                  </Text>
                ))}
              </View>
            )}
          </View>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- componente PDF di react-pdf, non un <img> HTML */}
          {photoData && <Image src={photoData} style={styles.photo} />}
        </View>

        {/* Meta */}
        <View style={styles.metaRow}>
          {recipe.prep ? (
            <View style={styles.metaTile}>
              <Text style={styles.metaLabel}>Preparazione</Text>
              <Text style={styles.metaValue}>{formatMinutes(recipe.prep)}</Text>
            </View>
          ) : null}
          {recipe.cook ? (
            <View style={styles.metaTile}>
              <Text style={styles.metaLabel}>Cottura</Text>
              <Text style={styles.metaValue}>{formatMinutes(recipe.cook)}</Text>
            </View>
          ) : null}
          {total > 0 ? (
            <View style={styles.metaTile}>
              <Text style={styles.metaLabel}>Totale</Text>
              <Text style={styles.metaValue}>{formatMinutes(total)}</Text>
            </View>
          ) : null}
          {recipe.servings ? (
            <View style={styles.metaTile}>
              <Text style={styles.metaLabel}>Porzioni</Text>
              <Text style={styles.metaValue}>{recipe.servings} pers.</Text>
            </View>
          ) : null}
        </View>

        {recipe.notes ? <Text style={styles.notes}>{recipe.notes}</Text> : null}

        {/* Ingredienti + Procedura */}
        <View style={styles.columns}>
          <View style={styles.ingredientsCol}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionBar} />
              <Text style={styles.sectionTitle}>Ingredienti</Text>
            </View>
            {recipe.ingredients.length === 0 ? (
              <Text style={{ color: LIGHT }}>—</Text>
            ) : (
              recipe.ingredients.map((ing, i) => {
                const qty = fmtQty(ing.qty, ing.unit);
                return (
                  <View key={i} style={styles.ingredientItem}>
                    <View style={styles.dot} />
                    <Text style={styles.ingredientText}>
                      {qty ? <Text style={styles.ingredientQty}>{qty} </Text> : null}
                      {ing.name}
                      {ing.description ? (
                        <Text style={styles.ingredientDesc}> — {ing.description}</Text>
                      ) : null}
                    </Text>
                  </View>
                );
              })
            )}
          </View>

          <View style={styles.stepsCol}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionBar} />
              <Text style={styles.sectionTitle}>Procedimento</Text>
            </View>
            {recipe.steps.length === 0 ? (
              <Text style={{ color: LIGHT }}>—</Text>
            ) : (
              recipe.steps.map((s, i) => (
                <View key={i} style={styles.step}>
                  <Text style={styles.stepNum}>{i + 1}</Text>
                  <View style={styles.stepBody}>
                    <Text style={styles.stepText}>{s.text}</Text>
                    {s.mins ? (
                      <Text style={styles.stepMins}>{formatMinutes(s.mins)}</Text>
                    ) : null}
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>Ricettario AN10 · {today}</Text>
          <Text
            render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
