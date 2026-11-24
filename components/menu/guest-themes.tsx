import { Svg, G, Path, Circle, Ellipse, Line, Polygon, Rect } from "@react-pdf/renderer";
import { PDF } from "@/components/recipe/RecipePdfDocument";
import { GUEST_THEME_INK, type GuestTheme } from "@/lib/menu-guest-card";

/**
 * Temi del cartoncino «Per gli ospiti» (`GuestMenuPdfDocument`): colori e decori disegnati.
 *
 * I decori sono forme SVG di react-pdf **calcolate** (foglie, aghi, bandierine, coriandoli…):
 * niente immagini da scaricare, nitidi a ogni misura, e cambiano con una costante. Le posizioni
 * «a caso» (fiocchi, coriandoli) vengono da un generatore con seme fisso: lo stesso menù dà
 * sempre lo stesso cartoncino.
 *
 * Questi colori valgono solo per la carta stampata: l'app resta sui token di design-tokens.css.
 */

export interface ThemeStyle {
  /** fondo del cartoncino */
  bg: string;
  ink: string;
  title: string;
  /** titoli delle portate */
  course: string;
  soft: string;
  muted: string;
  frame: string;
  frameIn: string;
  /** fascia in cima nel formato telefono */
  band: string;
  bandSoft: string;
  titleFont: string;
}

const XMAS = { green: "#1d5b3a", green2: "#2f7a4c", red: "#b3261e", gold: "#c39a4a", wood: "#6b4f35", snow: "#a9c1b6" };
const PARTY = ["#d1495b", "#edae49", "#2a9d8f", "#3d7cc9", "#8e6bbf"];
const GOLD = "#b8955a";

export const THEME: Record<GuestTheme, ThemeStyle> = {
  natale: {
    bg: "#fbf6ea",
    ink: "#26322b",
    title: GUEST_THEME_INK.natale,
    course: XMAS.red,
    soft: "#66756b",
    muted: "#8f9b92",
    frame: XMAS.green,
    frameIn: XMAS.gold,
    band: XMAS.green,
    bandSoft: "#f3dc9a",
    titleFont: "Times-BoldItalic",
  },
  compleanno: {
    bg: "#fffaf2",
    ink: "#2b2438",
    title: GUEST_THEME_INK.compleanno,
    course: "#1f8a7d",
    soft: "#6e6578",
    muted: "#a39cab",
    frame: "#1f8a7d",
    frameIn: "#edae49",
    band: "#c8344d",
    bandSoft: "#ffe1a6",
    titleFont: "Times-Bold",
  },
  evento: {
    bg: "#ffffff",
    ink: PDF.ink,
    title: GUEST_THEME_INK.evento,
    course: PDF.blu,
    soft: PDF.grigio,
    muted: PDF.light,
    frame: PDF.blu,
    frameIn: GOLD,
    band: PDF.blu,
    bandSoft: PDF.nota,
    titleFont: "Times-Bold",
  },
};

/* ───────────── geometria ───────────── */

const f = (n: number) => n.toFixed(1);
const rad = (deg: number) => (deg * Math.PI) / 180;

/** Generatore pseudo-casuale con seme (mulberry32): stesso seme, stessi decori */
function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Foglia d'agrifoglio lungo l'asse x (da 0 a `len`): bordo a punte alterne */
function hollyLeafPath(len: number, w: number): string {
  const n = 7;
  const up: string[] = [];
  const dn: string[] = [];
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const h = w * Math.pow(Math.sin(Math.PI * t), 0.7) * (i % 2 ? 1.2 : 0.7);
    up.push(`${f(t * len)},${f(-h)}`);
    dn.unshift(`${f(t * len)},${f(h)}`);
  }
  return `M0,0 L${up.join(" L")} L${f(len)},0 L${dn.join(" L")} Z`;
}

/** Foglia a mandorla (alloro) lungo l'asse x */
const leafPath = (len: number, w: number) => `M0,0 Q${f(len / 2)},${f(-w)} ${f(len)},0 Q${f(len / 2)},${f(w)} 0,0 Z`;

function starPoints(cx: number, cy: number, r: number): string {
  return Array.from({ length: 10 }, (_, i) => {
    const a = rad(-90 + i * 36);
    const rr = i % 2 ? r * 0.45 : r;
    return `${f(cx + rr * Math.cos(a))},${f(cy + rr * Math.sin(a))}`;
  }).join(" ");
}

/* ───────────── pezzi di Natale ───────────── */

/** Rametto d'agrifoglio: due foglie e tre bacche, centrato in (x, y) */
export function Holly({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <G transform={`translate(${f(x)},${f(y)}) scale(${s})`}>
      {[
        { rot: -158, fill: XMAS.green },
        { rot: -22, fill: XMAS.green2 },
        { rot: 148, fill: XMAS.green2 },
      ].map((l, i) => (
        <G key={i} transform={`rotate(${l.rot})`}>
          <Path d={hollyLeafPath(i === 2 ? 24 : 34, i === 2 ? 7 : 9.5)} fill={l.fill} />
          <Line x1={2} y1={0} x2={i === 2 ? 21 : 30} y2={0} stroke="#16452c" strokeWidth={0.7} />
        </G>
      ))}
      {[
        [-4.2, 2.5],
        [4.2, 2.5],
        [0, -3.6],
      ].map(([cx, cy], i) => (
        <G key={i}>
          <Circle cx={cx} cy={cy} r={4.3} fill={XMAS.red} />
          <Circle cx={cx - 1.4} cy={cy - 1.4} r={1.2} fill="#ffffff" opacity={0.65} />
        </G>
      ))}
    </G>
  );
}

/** Ramo di pino con aghi, da (0,0) lungo l'asse x ruotato di `angle`; `bauble` = pallina appesa */
function PineBranch({
  x,
  y,
  angle,
  len,
  bauble,
  outer = 0,
}: {
  x: number;
  y: number;
  angle: number;
  len: number;
  bauble?: string;
  /** rotazione del gruppo che contiene il ramo: serve a far pendere la pallina sempre in giù */
  outer?: number;
}) {
  const sag = -len * 0.06;
  const yAt = (d: number) => {
    const t = d / len;
    return 2 * t * (1 - t) * sag;
  };
  const needles = [];
  // Aghi radi e un po' curvi, in due toni, che si accorciano verso la punta
  for (let d = 6, i = 0; d < len - 2; d += 5.2, i++) {
    const nl = 19 * (1 - (d / len) * 0.55);
    const yy = yAt(d);
    for (const side of [-1, 1]) {
      const a = rad(48 + (i % 3) * 6);
      const ex = d + nl * Math.cos(a);
      const ey = yy + side * nl * Math.sin(a);
      const cx = d + nl * 0.35 * Math.cos(a);
      const cy = yy + side * nl * 0.65 * Math.sin(a);
      needles.push(
        <Path
          key={`${i}${side}`}
          d={`M${f(d)},${f(yy)} Q${f(cx)},${f(cy)} ${f(ex)},${f(ey)}`}
          stroke={(i + (side > 0 ? 1 : 0)) % 2 ? XMAS.green : XMAS.green2}
          strokeWidth={1.7}
          strokeLinecap="round"
          fill="none"
        />
      );
    }
  }
  const bd = len * 0.5;
  const by = yAt(bd);
  return (
    <G transform={`translate(${f(x)},${f(y)}) rotate(${angle})`}>
      <Path d={`M0,0 Q${f(len / 2)},${f(sag)} ${f(len)},0`} stroke={XMAS.wood} strokeWidth={1.5} fill="none" strokeLinecap="round" />
      {needles}
      {bauble ? (
        // la pallina pende in verticale anche se il ramo è inclinato
        <G transform={`translate(${f(bd)},${f(by)}) rotate(${-angle - outer})`}>
          <Line x1={0} y1={0} x2={0} y2={13} stroke={XMAS.gold} strokeWidth={0.7} />
          <Rect x={-2.6} y={12} width={5.2} height={3.4} fill={XMAS.gold} />
          <Circle cx={0} cy={22.5} r={7.5} fill={bauble} />
          <Circle cx={-2.6} cy={19.8} r={2} fill="#ffffff" opacity={0.55} />
        </G>
      ) : null}
    </G>
  );
}

function Snowflake({ x, y, r, color, opacity = 1 }: { x: number; y: number; r: number; color: string; opacity?: number }) {
  const arms = [];
  for (let i = 0; i < 6; i++) {
    const a = rad(i * 60);
    const px = r * 0.58 * Math.cos(a);
    const py = r * 0.58 * Math.sin(a);
    arms.push(
      <Line key={`a${i}`} x1={0} y1={0} x2={f(r * Math.cos(a))} y2={f(r * Math.sin(a))} stroke={color} strokeWidth={r / 9} strokeLinecap="round" />
    );
    for (const side of [-1, 1]) {
      const b = a + side * rad(42);
      arms.push(
        <Line
          key={`t${i}${side}`}
          x1={f(px)}
          y1={f(py)}
          x2={f(px + r * 0.32 * Math.cos(b))}
          y2={f(py + r * 0.32 * Math.sin(b))}
          stroke={color}
          strokeWidth={r / 11}
          strokeLinecap="round"
        />
      );
    }
  }
  return (
    <G transform={`translate(${f(x)},${f(y)})`} opacity={opacity}>
      {arms}
    </G>
  );
}

/* ───────────── pezzi di compleanno ───────────── */

/** Festone di bandierine da (x0, y) a (x1, y) con abbassamento `sag` */
function Bunting({
  x0,
  x1,
  y,
  sag,
  n,
  h,
  colors = PARTY,
}: {
  x0: number;
  x1: number;
  y: number;
  sag: number;
  n: number;
  h: number;
  colors?: string[];
}) {
  const mx = (x0 + x1) / 2;
  const at = (t: number) => ({
    x: (1 - t) * (1 - t) * x0 + 2 * t * (1 - t) * mx + t * t * x1,
    y: y + 2 * t * (1 - t) * sag * 2,
  });
  const w = ((x1 - x0) / n) * 0.78;
  return (
    <G>
      <Path d={`M${f(x0)},${f(y)} Q${f(mx)},${f(y + sag * 2)} ${f(x1)},${f(y)}`} stroke="#8a7f73" strokeWidth={0.8} fill="none" />
      {Array.from({ length: n }, (_, i) => {
        const p = at((i + 0.5) / n);
        return (
          <Polygon
            key={i}
            points={`${f(p.x - w / 2)},${f(p.y)} ${f(p.x + w / 2)},${f(p.y)} ${f(p.x)},${f(p.y + h)}`}
            fill={colors[i % colors.length]}
          />
        );
      })}
    </G>
  );
}

/** Palloncino: centro (x, y), filo che scende fino a (tx, ty) */
function Balloon({ x, y, r, color, tx, ty }: { x: number; y: number; r: number; color: string; tx: number; ty: number }) {
  const by = y + r * 1.18;
  const midY = (by + ty) / 2;
  return (
    <G>
      <Path
        d={`M${f(x)},${f(by + 3)} Q${f(x + r * 0.5)},${f(midY - 10)} ${f((x + tx) / 2)},${f(midY)} T${f(tx)},${f(ty)}`}
        stroke="#8a7f73"
        strokeWidth={0.7}
        fill="none"
      />
      <Ellipse cx={x} cy={y} rx={r} ry={r * 1.2} fill={color} />
      <Polygon points={`${f(x - 2.6)},${f(by + 3)} ${f(x + 2.6)},${f(by + 3)} ${f(x)},${f(by - 0.5)}`} fill={color} />
      <Ellipse cx={x - r * 0.35} cy={y - r * 0.45} rx={r * 0.2} ry={r * 0.32} fill="#ffffff" opacity={0.45} />
    </G>
  );
}

function Confetti({ count, seed, areas, scale = 1 }: { count: number; seed: number; areas: [number, number, number, number][]; scale?: number }) {
  const rand = rng(seed);
  return (
    <G>
      {Array.from({ length: count }, (_, i) => {
        const [ax, ay, aw, ah] = areas[i % areas.length];
        const x = ax + rand() * aw;
        const y = ay + rand() * ah;
        const color = PARTY[Math.floor(rand() * PARTY.length)];
        const rot = Math.round(rand() * 180);
        return rand() < 0.35 ? (
          <Circle key={i} cx={f(x)} cy={f(y)} r={f(1.8 * scale)} fill={color} />
        ) : (
          <Rect
            key={i}
            x={f(x)}
            y={f(y)}
            width={f(2.8 * scale)}
            height={f(7 * scale)}
            fill={color}
            transform={`rotate(${rot} ${f(x)} ${f(y)})`}
          />
        );
      })}
    </G>
  );
}

/** Torta con tre candeline, angolo in alto a sinistra in (x, y), larga 70 */
function Cake({ x, y }: { x: number; y: number }) {
  return (
    <G transform={`translate(${f(x)},${f(y)})`}>
      {[17, 35, 53].map((cx, i) => (
        <G key={i}>
          <Ellipse cx={cx} cy={4} rx={2.4} ry={4} fill="#f29e3d" />
          <Rect x={cx - 1.6} y={8} width={3.2} height={11} fill={PARTY[(i * 2 + 2) % PARTY.length]} />
        </G>
      ))}
      <Rect x={9} y={19} width={52} height={14} rx={2} fill="#ffe1a6" />
      <Path d="M9,22 q4.3,6 8.7,0 t8.7,0 t8.7,0 t8.7,0 t8.7,0 t8.7,0 V19 H9 Z" fill="#ffffff" />
      <Rect x={2} y={33} width={66} height={17} rx={2.5} fill="#d1495b" />
      <Path d="M2,36 q5.5,6 11,0 t11,0 t11,0 t11,0 t11,0 t11,0 V33 H2 Z" fill="#ffe1a6" />
      {[12, 26, 40, 54].map((cx, i) => (
        <Circle key={i} cx={cx} cy={44} r={1.6} fill="#ffffff" />
      ))}
    </G>
  );
}

/* ───────────── pezzi di evento ───────────── */

/** Mezza corona d'alloro: ramo da (0,0) che sale a sinistra, foglie a coppie */
function LaurelHalf({ color }: { color: string }) {
  const p0 = { x: 0, y: 0 };
  const p1 = { x: -42, y: -2 };
  const p2 = { x: -50, y: -40 };
  const at = (t: number) => ({
    x: (1 - t) ** 2 * p0.x + 2 * t * (1 - t) * p1.x + t * t * p2.x,
    y: (1 - t) ** 2 * p0.y + 2 * t * (1 - t) * p1.y + t * t * p2.y,
  });
  const leaves = [];
  for (let i = 1; i <= 7; i++) {
    const t = i / 8;
    const p = at(t);
    const q = at(t + 0.01);
    const ang = (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI;
    const len = 12 - i * 0.6;
    for (const side of [-1, 1])
      leaves.push(
        <G key={`${i}${side}`} transform={`translate(${f(p.x)},${f(p.y)}) rotate(${f(ang + side * 38)})`}>
          <Path d={leafPath(len, 3.6)} fill={color} />
        </G>
      );
  }
  const tip = at(1);
  return (
    <G>
      <Path d={`M0,0 Q${p1.x},${p1.y} ${p2.x},${p2.y}`} stroke={color} strokeWidth={1} fill="none" />
      {leaves}
      <G transform={`translate(${f(tip.x)},${f(tip.y)}) rotate(-80)`}>
        <Path d={leafPath(10, 3.4)} fill={color} />
      </G>
    </G>
  );
}

/** Corona d'alloro aperta in alto, centrata in (x, y) = punto più basso */
export function Laurel({ x, y, s = 1, color = GOLD }: { x: number; y: number; s?: number; color?: string }) {
  return (
    <G transform={`translate(${f(x)},${f(y)}) scale(${s})`}>
      <G transform="translate(-3,0)">
        <LaurelHalf color={color} />
      </G>
      <G transform="translate(3,0) scale(-1,1)">
        <LaurelHalf color={color} />
      </G>
      <Circle cx={0} cy={1} r={2.4} fill={color} />
    </G>
  );
}

/** Ornamento d'angolo: doppia squadra e rombo. Disegnato per l'angolo in alto a sinistra */
function Corner({ len, color }: { len: number; color: string }) {
  const d = 5;
  return (
    <G>
      <Path d={`M0,${f(len)} L0,0 L${f(len)},0`} stroke={color} strokeWidth={1.1} fill="none" />
      <Path d={`M${d},${f(len * 0.62)} L${d},${d} L${f(len * 0.62)},${d}`} stroke={color} strokeWidth={0.6} fill="none" />
      <Polygon points={`${d + 6},${d + 2} ${d + 10},${d + 6} ${d + 6},${d + 10} ${d + 2},${d + 6}`} fill={color} />
    </G>
  );
}

/* ───────────── composizioni ───────────── */

/**
 * Decori del foglio A4/A5, disegnati dietro al testo su tutta la pagina. `k` = scala del foglio
 * (A5 = 0.71). Restano lungo i bordi: il centro, dove sta il menù, è libero.
 */
export function SheetDecor({ theme, W, H, k }: { theme: GuestTheme; W: number; H: number; k: number }) {
  const inner = 34 * k;
  return (
    <Svg width={W} height={H} viewBox={`0 0 ${f(W)} ${f(H)}`} style={{ position: "absolute", top: 0, left: 0 }} fixed>
      {theme === "natale" && (
        <G>
          {[0, 1].map((corner) => (
            <G key={corner} transform={corner ? `translate(${f(W)},${f(H)}) rotate(180)` : undefined}>
              <PineBranch x={inner - 6 * k} y={inner - 4 * k} angle={24} len={150 * k} bauble={corner ? undefined : XMAS.red} />
              <PineBranch x={inner - 4 * k} y={inner - 6 * k} angle={64} len={105 * k} />
              <Holly x={inner + 14 * k} y={inner + 14 * k} s={0.8 * k} />
            </G>
          ))}
          {[
            [W - 78 * k, 78 * k, 11],
            [W - 128 * k, 46 * k, 6],
            [W - 50 * k, 140 * k, 5],
            [W - 96 * k, 128 * k, 4],
            [78 * k, H - 78 * k, 11],
            [128 * k, H - 46 * k, 6],
            [50 * k, H - 140 * k, 5],
            [96 * k, H - 128 * k, 4],
          ].map(([x, y, r], i) => (
            <Snowflake key={i} x={x} y={y} r={r * k} color={XMAS.snow} />
          ))}
        </G>
      )}
      {theme === "compleanno" && (
        <G>
          <Bunting x0={inner} x1={W - inner} y={inner} sag={14 * k} n={15} h={24 * k} />
          <Confetti
            count={44}
            seed={7}
            scale={k}
            areas={[
              [inner, 110 * k, 56 * k, H - 330 * k],
              [W - inner - 56 * k, 110 * k, 56 * k, H - 330 * k],
            ]}
          />
          {[
            { x: 66, y: H / k - 168, r: 17, c: PARTY[0] },
            { x: 98, y: H / k - 192, r: 15, c: PARTY[2] },
            { x: 88, y: H / k - 146, r: 13, c: PARTY[1] },
          ].map((b, i) => (
            <G key={i}>
              <Balloon x={b.x * k} y={b.y * k} r={b.r * k} color={b.c} tx={74 * k} ty={H - inner - 8 * k} />
              <Balloon x={W - b.x * k} y={b.y * k} r={b.r * k} color={PARTY[(i + 3) % PARTY.length]} tx={W - 74 * k} ty={H - inner - 8 * k} />
            </G>
          ))}
        </G>
      )}
      {theme === "evento" &&
        [
          undefined,
          `translate(${f(W)},0) scale(-1,1)`,
          `translate(0,${f(H)}) scale(1,-1)`,
          `translate(${f(W)},${f(H)}) scale(-1,-1)`,
        ].map((t, i) => (
          <G key={i} transform={t}>
            <G transform={`translate(${f(inner)},${f(inner)})`}>
              <Corner len={58 * k} color={GOLD} />
            </G>
          </G>
        ))}
    </Svg>
  );
}

/** Ornamento in cima, sopra il logo: agrifoglio, torta, corona d'alloro */
export function TopOrnament({ theme, k }: { theme: GuestTheme; k: number }) {
  const w = 110 * k;
  const h = 56 * k;
  return (
    <Svg width={w} height={h} viewBox="0 0 110 56" style={{ marginBottom: 6 * k }}>
      {theme === "natale" && <Holly x={55} y={30} s={1.05} />}
      {theme === "compleanno" && <Cake x={20} y={3} />}
      {theme === "evento" && <Laurel x={55} y={50} s={1} />}
    </Svg>
  );
}

/** Separatore fra intestazione e piatti */
export function Divider({ theme, k, color }: { theme: GuestTheme; k: number; color: string }) {
  return (
    <Svg width={130 * k} height={14 * k} viewBox="0 0 130 14" style={{ marginTop: 20 * k, marginBottom: 18 * k }}>
      <Line x1={0} y1={7} x2={50} y2={7} stroke={color} strokeWidth={0.7} />
      <Line x1={80} y1={7} x2={130} y2={7} stroke={color} strokeWidth={0.7} />
      {theme === "natale" && <Polygon points={starPoints(65, 7, 6.5)} fill={XMAS.gold} />}
      {theme === "compleanno" &&
        [56, 65, 74].map((cx, i) => <Circle key={i} cx={cx} cy={7} r={2.6} fill={PARTY[(i * 2) % PARTY.length]} />)}
      {theme === "evento" && <Polygon points="65,1 71,7 65,13 59,7" fill={GOLD} />}
    </Svg>
  );
}

/**
 * Decori della fascia in cima del formato telefono (larga `W`, alta `H`). Il titolo occupa la
 * parte sinistra (fino a `BAND_TEXT_RIGHT`): fiocchi e coriandoli stanno nella striscia a destra.
 */
export const BAND_TEXT_RIGHT = 300;

export function BandDecor({ theme, W, H }: { theme: GuestTheme; W: number; H: number }) {
  const x0 = BAND_TEXT_RIGHT + 8;
  const sw = W - x0 - 8;
  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", top: 0, left: 0 }}>
      {theme === "natale" &&
        [
          [x0 + sw * 0.62, 34, 10],
          [x0 + sw * 0.18, 22, 5],
          [x0 + sw * 0.35, 74, 6.5],
          [x0 + sw * 0.85, 92, 4.5],
          [x0 + sw * 0.6, 128, 5.5],
          [x0 + sw * 0.15, 140, 3.5],
          [x0 + sw * 0.9, 156, 3.5],
        ].map(([x, y, r], i) => <Snowflake key={i} x={x} y={y} r={r} color="#ffffff" opacity={0.5} />)}
      {theme === "compleanno" && (
        <G>
          {/* sulla fascia rossa niente bandierine rosse */}
          <Bunting x0={-6} x1={W + 6} y={-2} sag={10} n={12} h={20} colors={PARTY.slice(1)} />
          <Confetti count={16} seed={11} areas={[[x0, 50, sw, H - 64]]} />
        </G>
      )}
      {theme === "evento" && (
        <G>
          <G transform="translate(14,14)">
            <Corner len={34} color={GOLD} />
          </G>
          <G transform={`translate(${W - 14},14) scale(-1,1)`}>
            <Corner len={34} color={GOLD} />
          </G>
        </G>
      )}
    </Svg>
  );
}

/** Ornamento in fondo al formato telefono */
export function BottomOrnament({ theme }: { theme: GuestTheme }) {
  return (
    <Svg width={140} height={74} viewBox="0 0 140 74" style={{ marginBottom: 6 }}>
      {theme === "natale" && (
        <G>
          <PineBranch x={70} y={30} angle={180} len={64} />
          <PineBranch x={70} y={30} angle={0} len={64} />
          <Holly x={70} y={30} s={0.9} />
        </G>
      )}
      {theme === "compleanno" && (
        <G>
          <Balloon x={52} y={24} r={13} color={PARTY[0]} tx={70} ty={72} />
          <Balloon x={88} y={22} r={12} color={PARTY[2]} tx={70} ty={72} />
          <Balloon x={70} y={16} r={12} color={PARTY[1]} tx={70} ty={72} />
        </G>
      )}
      {theme === "evento" && <Laurel x={70} y={66} s={1.1} />}
    </Svg>
  );
}
