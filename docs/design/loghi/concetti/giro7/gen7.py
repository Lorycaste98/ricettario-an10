# Giro 7 — K4 + uovo intero che si sta rompendo (quattro modi di disegnare la crepa).
import sys, os
here = os.getcwd(); os.chdir("../giro5"); sys.path.insert(0, "."); import gen5 as g; os.chdir(here)
sys.path.insert(0, "../giro6"); import importlib.util
spec = importlib.util.spec_from_file_location("g6", "../giro6/gen6.py"); g6 = importlib.util.module_from_spec(spec)
os.chdir("../giro6"); spec.loader.exec_module(g6); os.chdir(here)
for stray in ("../giro6/varianti.html",):
    if os.path.exists(stray): os.remove(stray)
S, BG, INK = 26, "#fff", "#000"
ln = g.ln

def shell(cx, ink=INK):
    d = (f"M{cx} 40 C{cx+40} 40 {cx+62} 96 {cx+62} 146 C{cx+62} 190 {cx+36} 218 {cx} 218 "
         f"C{cx-36} 218 {cx-62} 190 {cx-62} 146 C{cx-62} 96 {cx-40} 40 {cx} 40 Z")
    return f'<path d="{d}" fill="none" stroke="{ink}" stroke-width="{S}"/>'

def egg(x=570, kind="C1", ink=INK, bg=BG):
    cx = x + 62
    o = shell(cx, ink)
    if kind == "C1":   # crepa a zig-zag che taglia il guscio sul lato destro (guscio intero, linea spezzata)
        o += f'<path d="M{cx+34} 80 L{cx+56} 96 L{cx+42} 110 L{cx+68} 124 L{cx+56} 136 L{cx+80} 146" fill="none" stroke="{bg}" stroke-width="8" stroke-linejoin="miter"/>'
    if kind == "C2":   # crepa sottile dentro, sotto la cima, che parte dal guscio
        o += f'<path d="M{cx+30} 74 L{cx+16} 92 L{cx+30} 102 L{cx+14} 120" fill="none" stroke="{ink}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>'
    if kind == "C3":   # segni di rottura fuori dal guscio, in alto a destra (come un "crack")
        o += (f'<path d="M{cx+52} 54 L{cx+66} 40 M{cx+66} 74 L{cx+86} 68 M{cx+34} 34 L{cx+40} 16" fill="none" stroke="{ink}" stroke-width="9" stroke-linecap="round"/>')
    if kind == "C4":   # crepa che attraversa il guscio da parte a parte (zig-zag bianco orizzontale)
        z = f"M{cx-74} 104 L{cx-46} 92 L{cx-24} 108 L{cx} 92 L{cx+24} 108 L{cx+46} 92 L{cx+74} 104"
        o += f'<path d="{z}" fill="none" stroke="{bg}" stroke-width="8" stroke-linejoin="miter"/>'
        o += f'<path d="M{cx-36} 100 L{cx-24} 108 L{cx} 92 L{cx+24} 108 L{cx+36} 100" fill="none" stroke="{ink}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>'
    return o

def word(kind, ink=INK, bg=BG):
    b = g.A() + g.N("attuale") + g6.knife(gap=9, bg=bg) + egg(kind=kind, bg=bg)
    return b.replace(f'"{INK}"', f'"{ink}"') if ink != INK else b
def svg(body, vb="0 0 780 256"): return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}">{body}</svg>'
def sym(kind, ink=INK, bg=BG):
    b = g6.knife(gap=9, bg=bg) + egg(kind=kind, bg=bg)
    if ink != INK: b = b.replace(f'"{INK}"', f'"{ink}"')
    right = 724 if kind != "C3" else 742
    return svg(f'<g transform="translate(128 132) scale(.84) translate(-{(457+right)/2:.0f} -128)">{b}</g>', "0 0 256 256")

BLUE = "#0A7EA4"
names = [("C1", "crepa che spezza il guscio a destra"), ("C2", "crepa sottile dentro, sotto la cima"), ("C3", "segni di rottura fuori dal guscio"), ("C4", "crepa che fa il giro dell’uovo")]
cards = lambda items, cls="": "".join(f'<div class="c {cls}"><b><span class="ref">{c}</span>{t}</b>{s}</div>' for c, t, s in items)
html = f'''<!doctype html><html lang="it"><head><meta charset="utf-8"><title>G2 · uovo che si rompe</title><style>*{{box-sizing:border-box;margin:0}}body{{width:1440px;background:#E2E8EB;font:14px/1.4 -apple-system,system-ui,sans-serif;color:#0B2530;padding:28px 36px}}h1{{font-size:26px}}.sub{{color:#4F6B77;margin:4px 0 18px}}section{{background:#F4F9FB;border:1px solid #D3E4EB;border-radius:20px;padding:16px 18px;margin-bottom:18px}}h2{{font-size:19px;margin-bottom:10px}}.g{{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}}.g4{{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}}.c{{background:#fff;border:1px solid #D3E4EB;border-radius:14px;padding:12px 14px}}.c b{{display:flex;gap:8px;align-items:center;font-size:13px;margin-bottom:6px}}.ref{{font:700 11px ui-monospace,monospace;background:#E8590C;color:#fff;padding:3px 6px;border-radius:6px}}.c svg{{width:100%;height:auto}}.zoom svg{{width:200px;display:block;margin:auto}}.tile{{background:{BLUE};border-radius:30px;display:block;width:150px;margin:auto}}.tiny{{display:flex;gap:10px;align-items:center;justify-content:center;margin-top:8px}}.tiny span{{background:{BLUE};border-radius:7px;display:inline-block}}</style></head><body>
<h1>G2 · K4 e uovo che si rompe</h1><div class="sub">N attuale, coltello K4. L'uovo resta intero: c'è solo il segno della crepa.</div>
<section><h2>0 · la crepa (ingrandito)</h2><div class="g4">{cards([(k, t, svg(egg(kind=k), "540 0 190 240")) for k, t in names], "zoom")}</div></section>
<section><h2>Nel logo</h2><div class="g">{cards([(k, "", svg(word(k))) for k, _ in names])}</div></section>
<section><h2>Simbolo «10» · icona, 32 e 16 px</h2><div class="g4">{cards([(k, "", f'<span class="tile">{sym(k, "#fff", BLUE)}</span><div class="tiny"><span style="width:32px">{sym(k, "#fff", BLUE)}</span><span style="width:16px">{sym(k, "#fff", BLUE)}</span></div>') for k, _ in names])}</div></section>
</body></html>'''
open("uovo-crepa.html", "w").write(html)
print("ok")
