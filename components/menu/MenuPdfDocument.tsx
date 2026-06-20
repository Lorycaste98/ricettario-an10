import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import {
  pdfStyles,
  PdfFooter,
  RecipePdfContent,
} from "@/components/recipe/RecipePdfDocument";
import type { RecipePdfData } from "@/components/recipe/RecipePdfButton";

const ORANGE = "#f97316";
const SKY = "#0c4a6e";
const GRAY = "#6b7280";

export interface MenuPdfMeta {
  name: string;
  description: string | null;
  date: string | null;
  servingTime: string | null;
}

export interface MenuPdfRecipe {
  recipe: RecipePdfData;
  photoData?: string;
}

const styles = StyleSheet.create({
  cover: { flex: 1, justifyContent: "center" },
  coverPhoto: {
    width: "100%",
    height: 180,
    borderRadius: 10,
    objectFit: "cover",
    marginBottom: 22,
  },
  kicker: {
    fontSize: 10,
    letterSpacing: 3,
    color: ORANGE,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  title: { fontSize: 32, fontFamily: "Helvetica-Bold", color: SKY, marginBottom: 12 },
  description: { fontSize: 11, color: GRAY, marginBottom: 18, lineHeight: 1.5 },
  metaLine: { flexDirection: "row", gap: 18, marginBottom: 26 },
  metaItem: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  metaItemLabel: { fontSize: 8, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5 },
  metaItemValue: { fontSize: 11, fontFamily: "Helvetica-Bold", color: SKY },
  tocTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: SKY,
    marginBottom: 10,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 14,
  },
  tocItem: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  tocNum: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: ORANGE,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 9,
  },
  tocNumText: { color: "#ffffff", fontSize: 9, fontFamily: "Helvetica-Bold", lineHeight: 1 },
  tocName: { fontSize: 11, color: "#1f2937" },
});

function formatServeDate(date: string | null, servingTime: string | null): string | null {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  const day = d.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
  return servingTime ? `${day} · ${servingTime}` : day;
}

export function MenuPdfDocument({
  menu,
  recipes,
  coverPhoto,
}: {
  menu: MenuPdfMeta;
  recipes: MenuPdfRecipe[];
  coverPhoto?: string;
}) {
  const serveDate = formatServeDate(menu.date, menu.servingTime);

  return (
    <Document title={menu.name} author="Ricettario AN10">
      {/* Copertina / intestazione menù */}
      <Page size="A4" style={pdfStyles.page}>
        <View style={styles.cover}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- componente PDF di react-pdf */}
          {coverPhoto && <Image src={coverPhoto} style={styles.coverPhoto} />}
          <Text style={styles.kicker}>Menù · Ricettario AN10</Text>
          <Text style={styles.title}>{menu.name}</Text>
          {menu.description ? <Text style={styles.description}>{menu.description}</Text> : null}

          <View style={styles.metaLine}>
            {serveDate ? (
              <View style={styles.metaItem}>
                <Text style={styles.metaItemLabel}>Servito il</Text>
                <Text style={styles.metaItemValue}>{serveDate}</Text>
              </View>
            ) : null}
            <View style={styles.metaItem}>
              <Text style={styles.metaItemLabel}>Ricette</Text>
              <Text style={styles.metaItemValue}>{recipes.length}</Text>
            </View>
          </View>

          <Text style={styles.tocTitle}>Le ricette del menù</Text>
          {recipes.map(({ recipe }, i) => (
            <View key={i} style={styles.tocItem}>
              <View style={styles.tocNum}>
                <Text style={styles.tocNumText}>{i + 1}</Text>
              </View>
              <Text style={styles.tocName}>{recipe.name}</Text>
            </View>
          ))}
        </View>
        <PdfFooter />
      </Page>

      {/* Una pagina per ricetta */}
      {recipes.map(({ recipe, photoData }, i) => (
        <Page key={i} size="A4" style={pdfStyles.page}>
          <RecipePdfContent
            recipe={recipe}
            photoData={photoData}
            kicker={`Menù: ${menu.name}`}
          />
          <PdfFooter />
        </Page>
      ))}
    </Document>
  );
}
