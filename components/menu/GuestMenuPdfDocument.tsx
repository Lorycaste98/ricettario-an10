import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import type { GuestSheet } from "@/lib/menu-guest-card";
import type { MenuPdfMeta } from "./MenuPdfDocument";
import { BAND_TEXT_RIGHT, BandDecor, BottomOrnament, Divider, SheetDecor, THEME, TopOrnament } from "./guest-themes";

/**
 * PDF «Per gli ospiti»: il cartoncino del menù da mettere in tavola o mandare ad amici e parenti.
 * Solo nome, data e ora, descrizione e i piatti divisi per portata (veloci e voci scritte a mano
 * comprese): niente ingredienti, passi, costi né note private.
 *
 * Il **tema** (`GuestSheet.theme`: Natale in cinque stili, Compleanno, Evento) sceglie colori, fondo e decori
 * (`guest-themes.tsx`). Tre impaginazioni (`GuestSheet.format`):
 * - **A4 / A5**: cartoncino da stampare, tutto centrato dentro una doppia cornice, decori lungo i
 *   bordi; in cima l'ornamento del tema e il logo AN10 nel colore del titolo (una volta sola,
 *   niente piede); nomi dei piatti in Times (il carattere «da carta del
 *   ristorante» che react-pdf ha già). Le misure si stringono se i piatti sono tanti.
 * - **Telefono**: una pagina larga come uno schermo e alta quanto serve (react-pdf accetta una
 *   pagina senza altezza), fascia colorata col logo bianco e i decori, foto del menù se c'è,
 *   ornamento in fondo e nessun piede.
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
  logoBianco,
  photo,
}: {
  menu: MenuPdfMeta;
  sheet: GuestSheet;
  /** logo orizzontale nel colore del tema (A4/A5) */
  logo?: string;
  /** logo bianco per la fascia del telefono */
  logoBianco?: string;
  photo?: string;
}) {
  return (
    <Document title={menu.name} author="Ricettario AN10">
      {sheet.format === "phone" ? (
        <PhonePage menu={menu} sheet={sheet} logoBianco={logoBianco} photo={photo} />
      ) : (
        <SheetPage menu={menu} sheet={sheet} logo={logo} />
      )}
    </Document>
  );
}

/* ───────────── A4 · A5 ───────────── */

const PAGE = { a4: { w: 595.28, h: 841.89 }, a5: { w: 419.53, h: 595.28 } } as const;

function SheetPage({ menu, sheet, logo }: { menu: MenuPdfMeta; sheet: GuestSheet; logo?: string }) {
  const format = sheet.format === "a5" ? "a5" : "a4";
  const { w: W, h: H } = PAGE[format];
  // A5 = A4 ridotto di √2
  const k = format === "a5" ? 0.705 : 1;
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
    <Page size={format === "a5" ? "A5" : "A4"} style={st.page}>
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

/* ───────────── Telefono ───────────── */

const PHONE_W = 400;
const BAND_DECOR_H = 170;

function PhonePage({
  menu,
  sheet,
  logoBianco,
  photo,
}: {
  menu: MenuPdfMeta;
  sheet: GuestSheet;
  logoBianco?: string;
  photo?: string;
}) {
  const t = THEME[sheet.theme];
  const when = serveLine(menu.date, menu.servingTime);
  const ph = StyleSheet.create({
    page: { width: PHONE_W, fontFamily: TIMES, color: t.ink, backgroundColor: t.bg, paddingBottom: 30 },
    band: {
      backgroundColor: t.band,
      paddingHorizontal: 28,
      paddingTop: t.bandTop ?? 32,
      paddingBottom: 26,
      minHeight: BAND_DECOR_H,
    },
    logo: { width: 73, height: 24, marginBottom: 18 },
    kicker: { fontFamily: SANS_B, fontSize: 8.5, letterSpacing: 3, color: t.bandSoft, textTransform: "uppercase", marginBottom: 6 },
    title: { fontFamily: t.titleFont, fontSize: 30 * (t.titleScale ?? 1), lineHeight: 1.12, color: "#ffffff", maxWidth: BAND_TEXT_RIGHT - 28 },
    when: { fontFamily: TIMES_I, fontSize: 14, color: t.bandSoft, marginTop: 10, maxWidth: BAND_TEXT_RIGHT - 28 },
    photo: { width: PHONE_W, height: 220, objectFit: "cover" },
    body: { paddingHorizontal: 28, paddingTop: 24 },
    desc: { fontFamily: TIMES_I, fontSize: 13, lineHeight: 1.45, color: t.soft, marginBottom: 20 },
    course: { marginBottom: 22 },
    courseHead: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 9 },
    courseName: { fontFamily: SANS_B, fontSize: 9.5, letterSpacing: 2.5, color: t.course, textTransform: "uppercase" },
    courseLine: { flex: 1, height: 0.8, backgroundColor: t.frameIn },
    dish: { fontSize: 17, lineHeight: 1.3, marginBottom: 6 },
    end: { alignItems: "center", marginTop: 6 },
  });

  return (
    // Solo la larghezza: l'altezza la decide il contenuto (una pagina sola, da scorrere)
    <Page size={{ width: PHONE_W }} style={ph.page}>
      <View style={ph.band}>
        <BandDecor theme={sheet.theme} W={PHONE_W} H={BAND_DECOR_H} />
        {/* eslint-disable-next-line jsx-a11y/alt-text -- componente PDF di react-pdf */}
        {logoBianco && <Image src={logoBianco} style={ph.logo} />}
        <Text style={ph.kicker}>Menù</Text>
        <Text style={ph.title}>{menu.name}</Text>
        {when ? <Text style={ph.when}>{when}</Text> : null}
      </View>
      {/* eslint-disable-next-line jsx-a11y/alt-text -- componente PDF di react-pdf */}
      {photo && <Image src={photo} style={ph.photo} />}
      <View style={ph.body}>
        {menu.description ? <Text style={ph.desc}>{menu.description}</Text> : null}
        {sheet.loose.length > 0 && (
          <View style={ph.course}>
            {sheet.loose.map((d, j) => (
              <Text key={j} style={ph.dish}>
                {d}
              </Text>
            ))}
          </View>
        )}
        {sheet.courses.map((c, i) => (
          <View key={i} style={ph.course} wrap={false}>
            {c.name ? (
              <View style={ph.courseHead}>
                <Text style={ph.courseName}>{c.name}</Text>
                <View style={ph.courseLine} />
              </View>
            ) : null}
            {c.dishes.map((d, j) => (
              <Text key={j} style={ph.dish}>
                {d}
              </Text>
            ))}
          </View>
        ))}
      </View>
      <View style={ph.end}>
        <BottomOrnament theme={sheet.theme} />
      </View>
    </Page>
  );
}
