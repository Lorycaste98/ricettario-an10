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

/**
 * PDF «Per la cucina» del menù: un unico documento del menù, non ricette messe in fila.
 * - Prima pagina: intestazione del menù e la **lista breve di tutti i piatti** su 2–3 colonne,
 *   le veloci distinte (numero su azzurro chiaro + «veloce»: non hanno procedimento).
 * - Poi una ricetta dopo l'altra (ognuna da pagina nuova) con ingredienti e passi.
 * - Su ogni pagina delle ricette l'**intestazione del menù** (logo · nome · data) e su tutte il
 *   **piè di pagina del menù** (nome · data · pagina n / N).
 */

const SKY = PDF.blu;
const GRAY = PDF.grigio;

export interface MenuPdfMeta {
  name: string;
  description: string | null;
  date: string | null;
  servingTime: string | null;
  people?: number | null;
}

/** Voce dell'elenco in copertina: le ricette veloci ci sono, ma senza pagina propria */
export interface MenuPdfTocItem {
  name: string;
  quick: boolean;
}

export interface MenuPdfRecipe {
  recipe: RecipePdfData;
  photoData?: string;
  /** Numero del piatto nell'elenco della prima pagina (veloci comprese) */
  number: number;
}

// Intestazione fissa delle pagine delle ricette: sta nello spazio sopra il contenuto
const HEADER_TOP = 22;
const RECIPE_PAGE_TOP = 62;

const styles = StyleSheet.create({
  coverTop: { flexDirection: "row", gap: 18, marginBottom: 20 },
  coverMain: { flex: 1 },
  coverPhoto: { width: 150, height: 110, borderRadius: 10, objectFit: "cover" },
  coverHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  // logo orizzontale (720×236)
  coverLogo: { width: 73, height: 24 },
  kicker: {
    fontSize: 9,
    letterSpacing: 2.5,
    color: GRAY,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    lineHeight: 1,
  },
  title: {
    fontSize: 30,
    fontFamily: "Helvetica-Bold",
    color: PDF.ink,
    lineHeight: 1.1,
    marginBottom: 10,
  },
  description: { fontSize: 10.5, color: GRAY, lineHeight: 1.45, marginBottom: 12 },
  metaLine: { flexDirection: "row", gap: 24 },
  metaItem: { flexDirection: "column", gap: 4 },
  metaItemLabel: { fontSize: 7.5, color: PDF.light, textTransform: "uppercase", letterSpacing: 0.5, lineHeight: 1 },
  metaItemValue: { fontSize: 11.5, fontFamily: "Helvetica-Bold", color: PDF.ink, lineHeight: 1 },

  listTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: PDF.line,
    paddingTop: 12,
    marginBottom: 10,
  },
  listTitle: { fontSize: 12, fontFamily: "Helvetica-Bold", color: PDF.ink },
  legend: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendText: { fontSize: 7.5, color: GRAY, lineHeight: 1 },
  legendDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: SKY },
  legendDotQuick: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: PDF.dot, marginLeft: 6 },
  // Colonne: i piatti scorrono dall'alto in basso, poi nella colonna accanto
  columns: { flexDirection: "row", gap: 14 },
  column: { flex: 1 },
  item: { flexDirection: "row", alignItems: "flex-start", marginBottom: 6 },
  num: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: SKY,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6,
  },
  // Ricetta veloce: niente pagina propria, numero su blu chiaro
  numQuick: { backgroundColor: PDF.dot },
  numText: { color: "#ffffff", fontSize: 7.5, fontFamily: "Helvetica-Bold", lineHeight: 1 },
  itemBody: { flex: 1, paddingTop: 2 },
  itemName: { fontSize: 9.5, color: PDF.ink, lineHeight: 1.25 },
  itemQuick: { fontSize: 7, color: GRAY, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 1 },

  // Intestazione del menù sulle pagine delle ricette
  runHeader: {
    position: "absolute",
    top: HEADER_TOP,
    left: 44,
    right: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderBottomWidth: 1,
    borderBottomColor: PDF.line,
    paddingBottom: 6,
  },
  runLogo: { width: 37, height: 12 },
  runName: { flex: 1, fontSize: 8, fontFamily: "Helvetica-Bold", color: PDF.ink, lineHeight: 1 },
  runDate: { fontSize: 8, color: GRAY, lineHeight: 1 },
});

function formatServeDate(date: string | null, servingTime: string | null): string | null {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  const day = d.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Rome" });
  return servingTime ? `${day} · ${servingTime}` : day;
}

/** Divide l'elenco in colonne da riempire dall'alto in basso */
function splitColumns<T>(items: T[]): T[][] {
  const n = items.length <= 4 ? 1 : items.length <= 10 ? 2 : 3;
  const per = Math.ceil(items.length / n);
  return Array.from({ length: n }, (_, i) => items.slice(i * per, (i + 1) * per));
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
  const footer = [menu.name, serveDate].filter(Boolean).join(" · ");
  const numbered = toc.map((item, i) => ({ ...item, n: i + 1 }));
  const hasQuick = toc.some((t) => t.quick);

  return (
    <Document title={menu.name} author="Ricettario AN10">
      {/* Prima pagina: il menù e la lista breve dei piatti */}
      <Page size="A4" style={pdfStyles.page}>
        <View style={styles.coverTop}>
          <View style={styles.coverMain}>
            <View style={styles.coverHeader}>
              {/* eslint-disable-next-line jsx-a11y/alt-text -- componente PDF di react-pdf */}
              {logoData && <Image src={logoData} style={styles.coverLogo} />}
              <Text style={styles.kicker}>Menù · per la cucina</Text>
            </View>
            <Text style={styles.title}>{menu.name}</Text>
            {menu.description ? <Text style={styles.description}>{menu.description}</Text> : null}
            <View style={styles.metaLine}>
              {serveDate ? (
                <View style={styles.metaItem}>
                  <Text style={styles.metaItemLabel}>Servizio</Text>
                  <Text style={styles.metaItemValue}>{serveDate}</Text>
                </View>
              ) : null}
              {menu.people ? (
                <View style={styles.metaItem}>
                  <Text style={styles.metaItemLabel}>Persone</Text>
                  <Text style={styles.metaItemValue}>{menu.people}</Text>
                </View>
              ) : null}
              <View style={styles.metaItem}>
                <Text style={styles.metaItemLabel}>Piatti</Text>
                <Text style={styles.metaItemValue}>{toc.length}</Text>
              </View>
            </View>
          </View>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- componente PDF di react-pdf */}
          {coverPhoto && <Image src={coverPhoto} style={styles.coverPhoto} />}
        </View>

        <View style={styles.listTitleRow}>
          <Text style={styles.listTitle}>I piatti del menù</Text>
          {hasQuick ? (
            <View style={styles.legend}>
              <View style={styles.legendDot} />
              <Text style={styles.legendText}>con procedimento</Text>
              <View style={styles.legendDotQuick} />
              <Text style={styles.legendText}>veloce, senza procedimento</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.columns}>
          {splitColumns(numbered).map((col, ci) => (
            <View key={ci} style={styles.column}>
              {col.map((item) => (
                <View key={item.n} style={styles.item} wrap={false}>
                  <View style={item.quick ? [styles.num, styles.numQuick] : styles.num}>
                    <Text style={styles.numText}>{item.n}</Text>
                  </View>
                  <View style={styles.itemBody}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    {item.quick ? <Text style={styles.itemQuick}>veloce</Text> : null}
                  </View>
                </View>
              ))}
            </View>
          ))}
        </View>
        <PdfFooter label={footer} />
      </Page>

      {/* Le ricette, ognuna da pagina nuova, con intestazione e piè di pagina del menù */}
      {recipes.map(({ recipe, photoData, number }, i) => (
        <Page key={i} size="A4" style={[pdfStyles.page, { paddingTop: RECIPE_PAGE_TOP }]}>
          <View style={styles.runHeader} fixed>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- componente PDF di react-pdf */}
            {logoData && <Image src={logoData} style={styles.runLogo} />}
            <Text style={styles.runName}>{menu.name}</Text>
            {serveDate ? <Text style={styles.runDate}>{serveDate}</Text> : null}
          </View>
          <RecipePdfContent recipe={recipe} photoData={photoData} kicker={`Piatto ${number} di ${toc.length}`} />
          <PdfFooter label={footer} />
        </Page>
      ))}
    </Document>
  );
}
