"""Suite del logo AN10 (versione definitiva G2: A-mattarello, N-forchetta, 1-coltello K4, 0-uovo col pallino).
Genera i master SVG in tutte le versioni e colori in public/brand/.
Uso (dalla radice del progetto): python3 docs/design/loghi/kit/build_kit.py
I tre ritagli (stacco del mattarello, incavo della lama, rivetti) sono maschere: restano trasparenti su
qualunque fondo. Per stampa/taglio a plotter far espandere tratti e maschere in un editor vettoriale."""
import os
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../.."))
OUT = os.path.join(ROOT, "public/brand")
os.makedirs(OUT, exist_ok=True)

COLORS = {"blu": "#0A7EA4", "scuro": "#0B2530", "bianco": "#FFFFFF", "nero": "#000000"}
S = 26          # tratto delle lettere
KW, GAP = 28, 9 # larghezza coltello e stacco manico/lama

def st(d, w=S): return f'<path d="{d}" stroke-width="{w}"/>'

def parts(s=S, kw=KW, gap=GAP, rivets=True, pin=True):
    """Restituisce (gruppo1, maschera1, gruppo2, maschera2) in coordinate di disegno (cap height 36→220)."""
    g1, m1, g2, m2 = [], [], [], []
    # A — gambe; il mattarello le attraversa con uno stacco
    g1.append(st("M40 220 L120 36 L200 220", s))
    if pin:
        m1.append(f'<path d="M50 162 H190" stroke-width="{s+12}"/>')
        g2.append(st("M60 162 H180", s))
        g2.append(st("M18 162 H36 M204 162 H222", 14))
    else:
        g1.append(st("M74 162 H166", s))
    # N — gamba destra con i rebbi della forchetta
    g1.append(st("M270 220 V36 L400 220 V84", s))
    g1.append(st("M382 36 V84 M400 36 V70 M418 36 V84", 12))
    g1.append(st("M382 84 Q400 100 418 84", 12))
    # 1 — coltello: lama sulla stessa linea del manico, fondo incavato concentrico alla testa del manico
    c, hy = 512, 172
    g1.append(st(f"M470 82 L{c} 40 V{hy}", kw))
    m1.append(f'<circle cx="{c}" cy="{hy}" r="{kw/2+gap}"/>')
    g2.append(st(f"M{c} {hy} V208", kw))
    if rivets:
        m2.append(f'<circle cx="{c}" cy="188" r="4"/><circle cx="{c}" cy="204" r="4"/>')
    # 0 — uovo con il pallino al centro
    cx = 632
    egg = (f"M{cx} 40 C{cx+40} 40 {cx+62} 96 {cx+62} 146 C{cx+62} 190 {cx+36} 218 {cx} 218 "
           f"C{cx-36} 218 {cx-62} 190 {cx-62} 146 C{cx-62} 96 {cx-40} 40 {cx} 40 Z")
    g1.append(st(egg, s))
    g1.append(f'<circle cx="{cx}" cy="140" r="{17 if s == S else 21}" stroke="none" data-fill="1"/>')
    return g1, m1, g2, m2

def render(color, uid, select=None, **kw):
    """select = 'AN' | '10' | None (tutto)."""
    g1, m1, g2, m2 = parts(**kw)
    def keep(el):
        if select is None: return True
        xs = [float(t) for t in __import__("re").findall(r'(?:M|cx=")(\d+)', el)]
        x = xs[0] if xs else 0
        return (x < 440) if select == "AN" else (x >= 440)
    g1 = [e for e in g1 if keep(e)]; g2 = [e for e in g2 if keep(e)]
    m1 = [e for e in m1 if keep(e)]; m2 = [e for e in m2 if keep(e)]
    paint = f'fill="none" stroke="{color}" stroke-linecap="round" stroke-linejoin="round"'
    body = lambda els: "".join(e.replace('data-fill="1"', f'fill="{color}"') for e in els)
    out = '<defs>'
    out += (f'<mask id="{uid}-a" maskUnits="userSpaceOnUse" x="-50" y="-50" width="900" height="400">'
            f'<rect x="-50" y="-50" width="900" height="400" fill="#fff"/><g fill="#000" stroke="#000" stroke-linecap="round">{"".join(m1)}</g></mask>')
    out += (f'<mask id="{uid}-b" maskUnits="userSpaceOnUse" x="-50" y="-50" width="900" height="400">'
            f'<rect x="-50" y="-50" width="900" height="400" fill="#fff"/><g fill="#000">{"".join(m2)}</g></mask></defs>')
    out += f'<g {paint} mask="url(#{uid}-a)">{body(g1)}</g>'
    if g2: out += f'<g {paint} mask="url(#{uid}-b)">{body(g2)}</g>'
    return out

def svg(vb, inner, title, w=None, h=None):
    size = f' width="{w}" height="{h}"' if w else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}"{size} role="img" aria-labelledby="t">'
            f'<title id="t">{title}</title>{inner}</svg>\n')

VB = {"orizzontale": "0 10 720 236", "simbolo": "450 -4 264 264", "impilato": "0 10 436 462"}
def lockup(kind, color, small=False):
    kw = dict(s=34, kw=34, gap=10, rivets=False) if small else {}
    if kind == "orizzontale": return render(color, "an10", **kw)
    if kind == "simbolo":     return render(color, "an10s", select="10", **kw)
    if kind == "impilato":
        return (render(color, "an10t", select="AN") +
                f'<g transform="translate(-364.5 226)">{render(color, "an10u", select="10")}</g>')

files = []
for kind in ("orizzontale", "impilato", "simbolo"):
    for name, col in COLORS.items():
        fn = f"an10-{kind}-{name}.svg"
        open(os.path.join(OUT, fn), "w").write(svg(VB[kind], lockup(kind, col), "AN10 · Ricettario"))
        files.append(fn)
# versione per le misure piccole (favicon): tratto più spesso, niente rivetti
open(os.path.join(OUT, "an10-simbolo-piccolo-bianco.svg"), "w").write(svg(VB["simbolo"], lockup("simbolo", "#FFFFFF", small=True), "AN10"))
open(os.path.join(OUT, "an10-simbolo-piccolo-blu.svg"), "w").write(svg(VB["simbolo"], lockup("simbolo", COLORS["blu"], small=True), "AN10"))
# icona dell'app (tessera blu) e favicon SVG
def tile(inner_vb, inner, size=256, scale=0.66, rx=0.225):
    p = size * (1 - scale) / 2
    return (f'<rect width="{size}" height="{size}" rx="{size*rx:.1f}" fill="{COLORS["blu"]}"/>'
            f'<svg x="{p:.1f}" y="{p:.1f}" width="{size*scale:.1f}" height="{size*scale:.1f}" viewBox="{inner_vb}">{inner}</svg>')
open(os.path.join(OUT, "an10-icona-app.svg"), "w").write(svg("0 0 256 256", tile(VB["simbolo"], lockup("simbolo", "#FFFFFF")), "AN10"))
open(os.path.join(OUT, "favicon.svg"), "w").write(svg("0 0 256 256", tile(VB["simbolo"], lockup("simbolo", "#FFFFFF", small=True), scale=0.74), "AN10"))
print("scritti", len(files) + 4, "file in public/brand")
