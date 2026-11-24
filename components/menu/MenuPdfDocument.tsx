import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import {
  PDF,
  pdfStyles,
  PdfFooter,
  RecipePdfContent,
} from "@/components/recipe/RecipePdfDocument";
import type { RecipePdfData } from "@/components/recipe/RecipePdfButton";

const SKY = PDF.blu;
const GRAY = PDF.grigio;

export interface MenuPdfMeta {
  name: string;
  description: string | null;
  date: string | null;
  servingTime: string | null;
}

/** Voce dell'elenco in copertina: le ricette veloci ci sono, ma senza pagina propria */
export interface MenuPdfTocItem {
  name: string;
  quick: boolean;
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
  // logo orizzontale (720×236)
  coverLogo: { width: 92, height: 30 },
  kicker: {
    fontSize: 11,
    letterSpacing: 3,
    color: GRAY,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
  },
  title: {
    fontSize: 40,
    fontFamily: "Helvetica-Bold",
    color: PDF.ink,
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
  metaItemLabel: { fontSize: 8, color: PDF.light, textTransform: "uppercase", letterSpacing: 0.5, lineHeight: 1 },
  metaItemValue: { fontSize: 13, fontFamily: "Helvetica-Bold", color: PDF.ink, lineHeight: 1 },
  tocTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: PDF.ink,
    marginBottom: 14,
    borderTopWidth: 1,
    borderTopColor: PDF.line,
    paddingTop: 16,
  },
  tocItem: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  tocNum: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: SKY,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 9,
  },
  // Ricetta veloce: niente pagina propria, numero su blu chiaro
  tocNumQuick: { backgroundColor: PDF.dot },
  tocNumText: { color: "#ffffff", fontSize: 9, fontFamily: "Helvetica-Bold", lineHeight: 1 },
  tocName: { fontSize: 11, color: PDF.ink },
  tocQuick: { fontSize: 8, color: GRAY, marginLeft: 6, textTransform: "uppercase", letterSpacing: 0.5 },
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
  toc,
  coverPhoto,
  logoData,
}: {
  menu: MenuPdfMeta;
  /** Ricette con una pagina propria */
  recipes: MenuPdfRecipe[];
  /** Elenco in copertina (tutte le ricette del menù, veloci comprese) */
  toc: MenuPdfTocItem[];
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
            <Text style={styles.kicker}>Menù · Ricettario</Text>
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
              <Text style={styles.metaItemValue}>{toc.length}</Text>
            </View>
          </View>

          <Text style={styles.tocTitle}>Le ricette del menù</Text>
          {toc.map((item, i) => (
            <View key={i} style={styles.tocItem}>
              <View style={item.quick ? [styles.tocNum, styles.tocNumQuick] : styles.tocNum}>
                <Text style={styles.tocNumText}>{i + 1}</Text>
              </View>
              <Text style={styles.tocName}>{item.name}</Text>
              {item.quick ? <Text style={styles.tocQuick}>veloce</Text> : null}
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
