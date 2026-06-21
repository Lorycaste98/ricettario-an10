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
  cover: { flex: 1, paddingTop: 8 },
  coverPhoto: {
    width: "100%",
    height: 170,
    borderRadius: 10,
    objectFit: "cover",
    marginBottom: 32,
  },
  coverHeader: { flexDirection: "row", alignItems: "center", gap: 9, marginBottom: 14 },
  coverLogo: { width: 30, height: 30, borderRadius: 7 },
  kicker: {
    fontSize: 11,
    letterSpacing: 3,
    color: ORANGE,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
  },
  title: {
    fontSize: 40,
    fontFamily: "Helvetica-Bold",
    color: SKY,
    lineHeight: 1.1,
    marginBottom: 16,
  },
  description: {
    fontSize: 13,
    color: GRAY,
    lineHeight: 1.5,
    maxWidth: 620,
    marginBottom: 28,
  },
  metaLine: { flexDirection: "row", gap: 28, marginBottom: 34 },
  metaItem: { flexDirection: "column", gap: 4 },
  metaItemLabel: { fontSize: 8, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5, lineHeight: 1 },
  metaItemValue: { fontSize: 13, fontFamily: "Helvetica-Bold", color: SKY, lineHeight: 1 },
  tocTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: SKY,
    marginBottom: 14,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 16,
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
  logoData,
}: {
  menu: MenuPdfMeta;
  recipes: MenuPdfRecipe[];
  coverPhoto?: string;
  logoData?: string;
}) {
  const serveDate = formatServeDate(menu.date, menu.servingTime);

  return (
    <Document title={menu.name} author="Ricettario AN10">
      {/* Copertina / intestazione menù */}
      <Page size="A4" style={pdfStyles.page}>
        <View style={styles.cover}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- componente PDF di react-pdf */}
          {coverPhoto && <Image src={coverPhoto} style={styles.coverPhoto} />}
          <View style={styles.coverHeader}>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- componente PDF di react-pdf */}
            {logoData && <Image src={logoData} style={styles.coverLogo} />}
            <Text style={styles.kicker}>Menù · Ricettario AN10</Text>
          </View>
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
            logoData={logoData}
            kicker={`Menù: ${menu.name}`}
          />
          <PdfFooter />
        </Page>
      ))}
    </Document>
  );
}
