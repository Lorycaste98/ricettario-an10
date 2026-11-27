import { Document, Page, View, Text, Image, StyleSheet, Svg, G, Path, Circle, Ellipse, Line, Polygon, Rect } from "@react-pdf/renderer";
import { SvgShapesContext, type SvgShapes } from "./guest-svg";
import type { GuestSheet } from "@/lib/menu-guest-card";
import type { MenuPdfMeta } from "./MenuPdfDocument";
import { Divider, SheetDecor, THEME, TopOrnament } from "./guest-themes";

/**
 * PDF «Per gli ospiti»: il cartoncino del menù da mettere in tavola o mandare ad amici e parenti.
 * Solo nome, data e ora, descrizione e i piatti divisi per portata (veloci e voci scritte a mano
 * comprese): niente ingredienti, passi, costi né note private.
 *
 * Il **tema** (`GuestSheet.theme`: Natale in cinque stili, Compleanno, Evento) sceglie colori, fondo e decori
 * (`guest-themes.tsx`, forme date da `PDF_SHAPES`). Solo **A4** (27/11/2026: A5 e Telefono tolti;
 * per il telefono ci sono immagine e link, `GuestMenuSheet`): cartoncino da stampare, tutto
 * centrato dentro una doppia cornice, decori lungo i bordi; in cima l'ornamento del tema e il logo
 * AN10 nel colore del titolo (una volta sola, niente piede); nomi dei piatti in Times (il carattere
 * «da carta del ristorante» che react-pdf ha già). Le misure si stringono se i piatti sono tanti.
 */

const TIMES = "Times-Roman";
const TIMES_I = "Times-Italic";
const SANS_B = "Helvetica-Bold";

function serveLine(date: string | null, servingTime: string | null): string | null {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  const day = d.toLocaleDateString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Rome",
  });
  const cap = day.charAt(0).toUpperCase() + day.slice(1);
  return servingTime ? `${cap} · ore ${servingTime}` : cap;
}

export function GuestMenuPdfDocument({
  menu,
  sheet,
  logo,
}: {
  menu: MenuPdfMeta;
  sheet: GuestSheet;
  /** logo orizzontale nel colore del tema */
  logo?: string;
}) {
  return (
    <SvgShapesContext value={PDF_SHAPES}>
    <Document title={menu.name} author="Ricettario AN10">
      <SheetPage menu={menu} sheet={sheet} logo={logo} />
    </Document>
    </SvgShapesContext>
  );
}

/** I decori (`guest-themes.tsx`) disegnati con le forme di react-pdf */
const PDF_SHAPES: SvgShapes = { Svg, G, Path, Circle, Ellipse, Line, Polygon, Rect };

/* ───────────── A4 ───────────── */

const PAGE = { w: 595.28, h: 841.89 } as const;

function SheetPage({ menu, sheet, logo }: { menu: MenuPdfMeta; sheet: GuestSheet; logo?: string }) {
  const { w: W, h: H } = PAGE;
  // scala delle misure (era < 1 per l'A5, tolto): i decori la ricevono ancora
  const k = 1;
  const t = THEME[sheet.theme];
  const when = serveLine(menu.date, menu.servingTime);
  // Il festone del compleanno occupa la fascia in alto, i palloncini gli angoli in basso
  const padTop = (t.padTop ?? 70) * k;
  const padBottom = (t.padBottom ?? 70) * k;

  // Altezza stimata (a scala 1) per stringere le portate se non ci stanno in una pagina
  const titleLines = Math.ceil(menu.name.length / 22);
  const descLines = menu.description ? Math.ceil(menu.description.length / 60) : 0;
  const header = 62 + 36 + 20 + titleLines * 38 + (when ? 26 : 0) + descLines * 17 + 52;
  const dishes = sheet.loose.length + sheet.courses.reduce((s, c) => s + c.dishes.length, 0);
  const body = dishes * 25 + sheet.courses.length * 52 + (sheet.loose.length ? 26 : 0);
  const avail = (H - padTop - padBottom) / k - 40;
  const s = Math.max(0.6, Math.min(1, (avail - header) / Math.max(body, 1)));

  const st = StyleSheet.create({
    page: {
      paddingTop: padTop,
      paddingBottom: padBottom,
      paddingHorizontal: 64 * k,
      fontFamily: TIMES,
      color: t.ink,
      backgroundColor: t.bg,
    },
    frame: { position: "absolute", top: 20 * k, left: 20 * k, right: 20 * k, bottom: 20 * k, borderWidth: 1.4 * k, borderColor: t.frame },
    frameIn: { position: "absolute", top: 25 * k, left: 25 * k, right: 25 * k, bottom: 25 * k, borderWidth: 0.6 * k, borderColor: t.frameIn },
    body: { flexGrow: 1, justifyContent: "center", alignItems: "center" },
    kicker: { fontFamily: SANS_B, fontSize: 8.5 * k, letterSpacing: 3.5 * k, color: t.soft, textTransform: "uppercase", marginBottom: 10 * k },
    title: { fontFamily: t.titleFont, fontSize: 32 * k * (t.titleScale ?? 1), lineHeight: 1.15, textAlign: "center", color: t.title, maxWidth: 420 * k },
    when: { fontFamily: TIMES_I, fontSize: 13 * k, color: t.ink, marginTop: 10 * k, textAlign: "center" },
    desc: { fontFamily: TIMES_I, fontSize: 11.5 * k, lineHeight: 1.45, color: t.soft, marginTop: 8 * k, textAlign: "center", maxWidth: 380 * k },
    course: { alignItems: "center", marginBottom: 22 * k * s },
    courseName: {
      fontFamily: SANS_B,
      fontSize: 9 * k * Math.max(s, 0.8),
      letterSpacing: 3 * k,
      textTransform: "uppercase",
      color: t.course,
      marginBottom: 8 * k * s,
    },
    dish: { fontFamily: TIMES, fontSize: 15.5 * k * s, lineHeight: 1.3, textAlign: "center", marginBottom: 5 * k * s, maxWidth: 360 * k },
    // logo orizzontale (720×236)
    logo: { width: 73 * k, height: 24 * k, marginBottom: 12 * k },
  });

  const allCourses = [...(sheet.loose.length ? [{ name: "", dishes: sheet.loose }] : []), ...sheet.courses];

  return (
    <Page size="A4" style={st.page}>
      <SheetDecor theme={sheet.theme} W={W} H={H} k={k} />
      <View style={st.frame} fixed />
      <View style={st.frameIn} fixed />
      <View style={st.body}>
        <TopOrnament theme={sheet.theme} k={k} />
        {/* eslint-disable-next-line jsx-a11y/alt-text -- componente PDF di react-pdf */}
        {logo && <Image src={logo} style={st.logo} />}
        <Text style={st.kicker}>Menù</Text>
        <Text style={st.title}>{menu.name}</Text>
        {when ? <Text style={st.when}>{when}</Text> : null}
        {menu.description ? <Text style={st.desc}>{menu.description}</Text> : null}
        <Divider theme={sheet.theme} k={k} color={t.frameIn} />
        {allCourses.map((c, i) => (
          <View key={i} style={st.course} wrap={false}>
            {c.name ? <Text style={st.courseName}>{c.name}</Text> : null}
            {c.dishes.map((d, j) => (
              <Text key={j} style={st.dish}>
                {d}
              </Text>
            ))}
          </View>
        ))}
      </View>
    </Page>
  );
}
