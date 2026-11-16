# Giro 6 — G2 con N attuale, coltello «a incastro», uovo con tuorlo.
import math, sys
sys.path.insert(0, "../giro5"); import gen5 as g   # riusa A, N e le funzioni di tratto
S, BG, INK = 26, "#fff", "#000"
ln = g.ln
def dot(cx, cy, r=4, col=BG): return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{col}"/>'

def knife(x=470, gap=8, w=28, bg=BG):
    """1 = coltello: manico con testa tonda; la lama continua sulla stessa linea e ha il fondo
    incavato che segue la testa del manico a distanza costante (gap): due punte e il tondo in mezzo."""
    c, r = x + 42, w / 2
    hy = 172                        # centro della testa tonda del manico
    blade = ln(f"M{x} 82 L{c} 40 V{hy}", w)                                  # bandierina + lama (stessa linea)
    cut = f'<circle cx="{c}" cy="{hy}" r="{r+gap}" fill="{bg}"/>'           # incavo concentrico alla testa del manico
    handle = ln(f"M{c} {hy} V{208}", w) + dot(c, 188, 4, bg) + dot(c, 204, 4, bg)
    return blade + cut + handle

def egg(x=570, kind="E1", ink=INK, bg=BG):
    cx = x + 62
    # uovo: cima piena e arrotondata (non a pera), massima larghezza a metà-bassa
    shell = (f"M{cx} 40 C{cx+40} 40 {cx+62} 96 {cx+62} 146 C{cx+62} 190 {cx+36} 218 {cx} 218 "
             f"C{cx-36} 218 {cx-62} 190 {cx-62} 146 C{cx-62} 96 {cx-40} 40 {cx} 40 Z")
    o = f'<path d="{shell}" fill="none" stroke="{ink}" stroke-width="{S}"/>'
    if kind == "E1": o += f'<circle cx="{cx}" cy="140" r="17" fill="{ink}"/>'                                   # tuorlo piccolo al centro
    if kind == "E2": o += f'<ellipse cx="{cx}" cy="150" rx="22" ry="19" fill="{ink}"/>'                          # tuorlo più largo che alto, basso
    if kind == "E3": o += f'<circle cx="{cx}" cy="142" r="21" fill="none" stroke="{ink}" stroke-width="9"/>'      # tuorlo ad anello
    if kind == "E4": o += f'<circle cx="{cx+8}" cy="146" r="18" fill="{ink}"/><circle cx="{cx+14}" cy="140" r="5" fill="{bg}"/>'  # tuorlo con riflesso
    return o

def word(gap=8, e="E1", ink=INK, bg=BG):
    body = g.A() + g.N("attuale") + knife(gap=gap, bg=bg) + egg(kind=e, bg=bg)
    if ink != INK: body = body.replace(f'"{INK}"', f'"{ink}"')
    return body
def svg(body, vb="0 0 760 256"): return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}">{body}</svg>'
def sym(gap, e, ink=INK, bg=BG):
    b = knife(gap=gap, bg=bg) + egg(kind=e, bg=bg)
    if ink != INK: b = b.replace(f'"{INK}"', f'"{ink}"')
    return svg(f'<g transform="translate(128 128) scale(.86) translate(-{(457+707)/2} -129)">{b}</g>', "0 0 256 256")

# file per il giro successivo (combinazione raccomandata)
open("an10-lockup.svg", "w").write(svg(word(8, "E1")))
open("an10-symbol.svg", "w").write(sym(8, "E1"))

cards = lambda items: "".join(f'<div class="c"><b><span class="ref">{c}</span>{t}</b>{s}</div>' for c, t, s in items)
BLUE = "#0A7EA4"
html = f'''<!doctype html><html lang="it"><head><meta charset="utf-8"><title>G2 · coltello e uovo</title><style>*{{box-sizing:border-box;margin:0}}body{{width:1440px;background:#E2E8EB;font:14px/1.4 -apple-system,system-ui,sans-serif;color:#0B2530;padding:28px 36px}}h1{{font-size:26px}}.sub{{color:#4F6B77;margin:4px 0 18px}}section{{background:#F4F9FB;border:1px solid #D3E4EB;border-radius:20px;padding:16px 18px;margin-bottom:18px}}h2{{font-size:19px;margin-bottom:10px}}.g{{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}}.g4{{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}}.c{{background:#fff;border:1px solid #D3E4EB;border-radius:14px;padding:12px 14px}}.c b{{display:flex;gap:8px;align-items:center;font-size:13px;margin-bottom:6px}}.ref{{font:700 11px ui-monospace,monospace;background:#E8590C;color:#fff;padding:3px 6px;border-radius:6px}}.c svg{{width:100%;height:auto}}.zoom svg{{width:220px;display:block;margin:auto}}.tile{{background:{BLUE};border-radius:30px;display:block;width:150px;margin:auto}}.tiny{{display:flex;gap:10px;align-items:center;justify-content:center}}.tiny span{{background:{BLUE};border-radius:7px;display:inline-block}}</style></head><body>
<h1>G2 · coltello e uovo</h1><div class="sub">N attuale. Coltello: manico con la testa tonda, la lama riparte sulla stessa linea con due punte e l'incavo che segue il manico.</div>
<section><h2>1 · coltello a incastro</h2><div class="g4 zoom">{cards([
  ("K3", "stacco 6 (ingrandito)", svg(knife(gap=6), "440 20 120 220")),
  ("K4", "stacco 9 (ingrandito)", svg(knife(gap=9), "440 20 120 220"))])}</div>
<div class="g" style="margin-top:12px">{cards([("K3", "nel logo", svg(word(6, "E1"))), ("K4", "nel logo", svg(word(9, "E1")))])}</div></section>
<section><h2>0 · uovo con tuorlo (più uovo, meno avocado)</h2><div class="g4 zoom">{cards([(e, t, svg(egg(kind=e), "550 20 170 220")) for e, t in [("E1","tuorlo piccolo al centro"),("E2","tuorlo basso, schiacciato"),("E3","tuorlo ad anello"),("E4","tuorlo con riflesso")]])}</div>
<div class="g" style="margin-top:12px">{cards([(e, "nel logo", svg(word(8, e))) for e in ["E1","E2","E3","E4"]])}</div></section>
<section><h2>Simbolo «10» · icona e misure piccole</h2><div class="g4">{cards([(e, "icona · 32 · 16 px", f'<span class="tile">{sym(8, e, "#fff", BLUE)}</span><div class="tiny" style="margin-top:8px"><span style="width:32px">{sym(8, e, "#fff", BLUE)}</span><span style="width:16px">{sym(8, e, "#fff", BLUE)}</span></div>') for e in ["E1","E2","E3","E4"]])}</div></section>
</body></html>'''
open("coltello-uovo.html", "w").write(html)
print("ok")
