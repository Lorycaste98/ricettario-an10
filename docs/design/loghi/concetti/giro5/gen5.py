# Giro 5 — varianti di G2 (linea): N con due posate, 1 coltello con stacco, alternative allo 0.
S, BG, INK = 26, "#fff", "#000"
def ln(d, w=S): return f'<path d="{d}" fill="none" stroke="{INK}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>'
def dot(cx, cy, r=4): return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{BG}"/>'

def A(x=40):
    return (ln(f"M{x} 220 L{x+80} 36 L{x+160} 220")
            + f'<path d="M{x+10} 162 H{x+150}" stroke="{BG}" stroke-width="{S+12}" stroke-linecap="round"/>'
            + ln(f"M{x+20} 162 H{x+140}") + ln(f"M{x-22} 162 H{x-4} M{x+164} 162 H{x+182}", 14))
def fork_up(cx, top=36, base=84):     # rebbi verso l'alto
    return ln(f"M{cx-18} {top} V{base} M{cx} {top} V{base-14} M{cx+18} {top} V{base}", 12) + ln(f"M{cx-18} {base} Q{cx} {base+16} {cx+18} {base}", 12)
def fork_down(cx, top=172, bot=220):  # rebbi verso il basso
    return ln(f"M{cx-18} {bot} V{top} M{cx} {bot} V{top+14} M{cx+18} {bot} V{top}", 12) + ln(f"M{cx-18} {top} Q{cx} {top-16} {cx+18} {top}", 12)
def spoon_down(cx, cy=192): return f'<ellipse cx="{cx}" cy="{cy}" rx="21" ry="29" fill="{INK}"/>'
def spoon_up(cx, cy=62):    return f'<ellipse cx="{cx}" cy="{cy}" rx="21" ry="29" fill="{INK}"/>'

def N(kind, x=270):
    if kind == "attuale":   return ln(f"M{x} 220 V36 L{x+130} 220 V84") + fork_up(x+130)
    if kind == "N1":        return ln(f"M{x} 172 V36 L{x+130} 220 V84") + fork_up(x+130) + spoon_down(x)          # forchetta in alto, cucchiaio in basso
    if kind == "N2":        return ln(f"M{x} 172 V36 L{x+130} 220 V88") + spoon_up(x+130) + fork_down(x)          # cucchiaio in alto, forchetta in basso

def ONE(kind, x=470):
    if kind == "attuale":
        return ln(f"M{x} 82 L{x+42} 40 V142") + ln(f"M{x+42} 164 V220", S+6) + dot(x+42, 184) + dot(x+42, 204)
    if kind == "K1":   # stacco netto: lama spostata a destra rispetto al manico (scalino)
        return (ln(f"M{x+10} 80 L{x+52} 40 V138")
                + ln(f"M{x+40} 170 V220", S+8) + dot(x+40, 188) + dot(x+40, 206))
    if kind == "K2":   # lama piena da cuoco: dorso dritto, filo curvo; manico staccato e rientrato
        return (f'<path d="M{x+56} 40 C{x+36} 52 {x+6} 78 {x+6} 110 V136 H{x+56} Z" fill="{INK}" stroke="{INK}" stroke-width="8" stroke-linejoin="round"/>'
                + ln(f"M{x+38} 168 V220", S+8) + dot(x+38, 186) + dot(x+38, 204))

def ZERO(kind, x=570):
    egg = f"M{x+64} 40 C{x+104} 40 {x+128} 112 {x+128} 156 C{x+128} 196 {x+100} 218 {x+64} 218 C{x+28} 218 {x} 196 {x} 156 C{x} 112 {x+24} 40 {x+64} 40 Z"
    ring = f'<ellipse cx="{x+64}" cy="129" rx="{64}" ry="{89}" fill="none" stroke="{INK}" stroke-width="{S}"/>'
    if kind == "Z1": return f'<path d="{egg}" fill="none" stroke="{INK}" stroke-width="{S}"/>'                               # uovo
    if kind == "Z2": return f'<path d="{egg}" fill="none" stroke="{INK}" stroke-width="{S}"/><circle cx="{x+64}" cy="158" r="22" fill="{INK}"/>'  # uovo col tuorlo
    if kind == "Z3": return ring + f'<ellipse cx="{x+64}" cy="129" rx="34" ry="56" fill="none" stroke="{INK}" stroke-width="8"/>'  # piatto
    if kind == "Z4": return ring + ln(f"M{x+136} 129 H{x+186}", 18) + dot(x+176, 129, 5)                                # padella
    if kind == "Z5": return ring + ln(f"M{x-22} 129 H{x-6} M{x+134} 129 H{x+150}", 16)                                 # pentola dall'alto
    if kind == "Z6": return (ring + f'<path d="M{x+64} 44 V214 M{x+6} 129 H{x+122}" stroke="{INK}" stroke-width="7"/>'
                             f'<path d="M{x+20} 66 L{x+108} 192 M{x+108} 66 L{x+20} 192" stroke="{INK}" stroke-width="7"/>')  # fetta di limone/arancia

def word(n="attuale", one="attuale", zero="Z1"):
    return A() + N(n) + ONE(one) + ZERO(zero)
def svg(body, vb="0 0 790 256"): return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}">{body}</svg>'
def sym(one, zero):
    right = {"Z4": 766, "Z5": 729}.get(zero, 711); left = 467
    k = min(.92, 200 / (right - left))
    return svg(f'<g transform="translate(128 128) scale({k:.3f}) translate(-{(left+right)/2:.0f} -129)">{ONE(one)}{ZERO(zero)}</g>', "0 0 256 256")

rows = [
  ("N con due posate", [("attuale", "N attuale: solo forchetta", word()), ("N1", "N1 · forchetta in alto, cucchiaio in basso", word(n="N1")), ("N2", "N2 · cucchiaio in alto, forchetta in basso", word(n="N2"))]),
  ("1 · coltello", [("attuale", "1 attuale", word()), ("K1", "K1 · stacco netto, lama spostata di lato", word(one="K1")), ("K2", "K2 · lama piena da cuoco, manico rientrato", word(one="K2"))]),
  ("0 · alternative all'uovo", [(z, t, word(zero=z)) for z, t in [("Z1", "Z1 · uovo"), ("Z2", "Z2 · uovo con tuorlo"), ("Z3", "Z3 · piatto"), ("Z4", "Z4 · padella"), ("Z5", "Z5 · pentola vista dall'alto"), ("Z6", "Z6 · fetta di limone")]]),
]
html = ['<!doctype html><html lang="it"><head><meta charset="utf-8"><title>G2 · varianti</title><style>*{box-sizing:border-box;margin:0}body{width:1440px;background:#E2E8EB;font:14px/1.4 -apple-system,system-ui,sans-serif;color:#0B2530;padding:28px 36px}h1{font-size:26px}.sub{color:#4F6B77;margin:4px 0 18px}section{background:#F4F9FB;border:1px solid #D3E4EB;border-radius:20px;padding:16px 18px;margin-bottom:18px}h2{font-size:19px;margin-bottom:10px}.g{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.c{background:#fff;border:1px solid #D3E4EB;border-radius:14px;padding:12px 14px}.c b{display:flex;gap:8px;align-items:center;font-size:13px;margin-bottom:6px}.ref{font:700 11px ui-monospace,monospace;background:#E8590C;color:#fff;padding:3px 6px;border-radius:6px}.c svg{width:100%;height:auto}.syms{display:flex;gap:12px;flex-wrap:wrap}.syms .c{width:200px;text-align:center}.syms svg{width:150px}.tile{background:#0A7EA4;border-radius:28px;padding:10px;display:inline-block}</style></head><body><h1>G2 · varianti</h1><div class="sub">Ogni variante è mostrata dentro il logo completo; il resto resta com\'era. Dite i codici che preferite (es. N1 + K1 + Z3).</div>']
for title, items in rows:
    html.append(f'<section><h2>{title}</h2><div class="g">')
    for code, label, body in items:
        html.append(f'<div class="c"><b><span class="ref">{code}</span>{label.split(" · ",1)[-1]}</b>{svg(body)}</div>')
    html.append('</div></section>')
# simboli «10» con il coltello K1 e ogni zero, sul blu
html.append('<section><h2>Simbolo «10» con K1 e ogni zero (icona dell\'app)</h2><div class="syms">')
for z in ["Z1", "Z2", "Z3", "Z4", "Z5", "Z6"]:
    s = sym("K1", z).replace('stroke="#000"', 'stroke="#fff"').replace('fill="#000"', 'fill="#fff"').replace('fill="#fff"/>', 'fill="#fff"/>')
    s = s.replace(f'r="4" fill="#fff"', 'r="4" fill="#0A7EA4"').replace(f'r="5" fill="#fff"', 'r="5" fill="#0A7EA4"')
    html.append(f'<div class="c"><b><span class="ref">K1+{z}</span></b><span class="tile">{s}</span></div>')
html.append('</div></section></body></html>')
open("varianti.html", "w").write("".join(html))
print("ok")
