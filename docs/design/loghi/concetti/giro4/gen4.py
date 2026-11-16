# Giro 4 — un solo carattere AN10, ogni lettera nasconde un utensile/ingrediente con un dettaglio.
# Prima la lettera, poi l'oggetto: da fermo si legge sempre AN10.
def svg(vb, body, title):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" role="img"><title>{title}</title>{body}</svg>\n'
def save(n, vb, b, t): open(n, "w").write(svg(vb, b, t))
BG = "#fff"   # colore dello stacco fra oggetti sovrapposti (= fondo)

# ── G1 · PIENO (cap height 192: y 32→224, asta 44) ─────────────────────────────
def A_full(x, bg=BG, ink="#000"):
    legs = f'<path fill="{ink}" d="M{x+64} 32 H{x+104} L{x+168} 224 H{x+122} L{x+84} 96 L{x+46} 224 H{x} Z"/>'
    # mattarello: corpo + maniglie, staccato dalle gambe con un contorno del colore di fondo
    pin = (f'<g fill="{ink}" stroke="{bg}" stroke-width="7" paint-order="stroke">'
           f'<rect x="{x-6}" y="150" width="{180}" height="32" rx="12"/>'
           f'<rect x="{x-36}" y="158" width="34" height="16" rx="8"/><rect x="{x+170}" y="158" width="34" height="16" rx="8"/></g>')
    return legs + pin, 168
def N_full(x, ink="#000"):
    # gamba destra con tre rebbi in cima (due tagli)
    return (f'<path fill="{ink}" fill-rule="evenodd" d="M{x} 224 V32 H{x+46} L{x+114} 148 V32 H{x+160} V224 H{x+114} L{x+46} 108 V224 Z '
            f'M{x+124} 32 H{x+133} V80 A4.5 4.5 0 0 1 {x+124} 80 Z M{x+141} 32 H{x+150} V80 A4.5 4.5 0 0 1 {x+141} 80 Z"/>'), 160
def ONE_full(x, ink="#000"):
    # coltello: lama (bandierina + parte alta) / stacco / manico con due rivetti
    return (f'<path fill="{ink}" d="M{x} 74 L{x+60} 32 H{x+100} V146 H{x+56} V96 L{x} 118 Z"/>'
            f'<path fill="{ink}" fill-rule="evenodd" d="M{x+56} 156 H{x+100} V212 A12 12 0 0 1 {x+88} 224 H{x+68} A12 12 0 0 1 {x+56} 212 Z '
            f'M{x+78} 176 a5 5 0 1 0 0.1 0 Z M{x+78} 202 a5 5 0 1 0 0.1 0 Z"/>'), 100
def ZERO_full(x, ink="#000"):
    # uovo: lo 0 con la punta in alto
    return (f'<path fill="{ink}" fill-rule="evenodd" d="M{x+76} 28 C{x+124} 28 {x+152} 112 {x+152} 160 C{x+152} 202 {x+120} 228 {x+76} 228 '
            f'C{x+32} 228 {x} 202 {x} 160 C{x} 112 {x+28} 28 {x+76} 28 Z '
            f'M{x+76} 74 C{x+96} 74 {x+108} 120 {x+108} 156 C{x+108} 176 {x+96} 184 {x+76} 184 C{x+56} 184 {x+44} 176 {x+44} 156 C{x+44} 120 {x+56} 74 {x+76} 74 Z"/>'), 152

def word_full(x0=40, gap=30, bg=BG, ink="#000"):
    out, x = "", x0
    a, w = A_full(x, bg, ink); out += a; x += w + gap + 12
    n, w = N_full(x, ink); out += n; x += w + gap
    o, w = ONE_full(x, ink); out += o; x += w + gap
    z, w = ZERO_full(x, ink); out += z; x += w
    return out, x + 40
w, W = word_full()
save("g1-lockup.svg", f"0 0 {W} 256", w, "AN10 · pieno")
one, _ = ONE_full(0); zero, _ = ZERO_full(126)
TEN = one + zero   # larghezza 278
save("g1-symbol.svg", "0 0 256 256", f'<g transform="translate(18 26) scale(.79)">{TEN}</g>', "10 · coltello e uovo")
# impilato: AN sopra, 10 sotto
a, _ = A_full(36); n, _ = N_full(246)
save("g1-stacked.svg", "0 0 460 500", f'{a}{n}<g transform="translate(80 236)">{TEN}</g>', "AN10 impilato")

# ── G2 · LINEA (stesso schema, tratto unico tondo come le icone dell'app) ─────
S = 26
def ln(d, w=S, col="#000"): return f'<path d="{d}" fill="none" stroke="{col}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>'
def ten_line(x):
    o = ln(f"M{x} 82 L{x+42} 40 V142") + ln(f"M{x+42} 164 V220", S+6) + f'<circle cx="{x+42}" cy="184" r="4" fill="{BG}"/><circle cx="{x+42}" cy="204" r="4" fill="{BG}"/>'  # 1 coltello (diagonale a 45°)
    x += 100
    o += f'<path d="M{x+64} 40 C{x+104} 40 {x+128} 112 {x+128} 156 C{x+128} 196 {x+100} 218 {x+64} 218 C{x+28} 218 {x} 196 {x} 156 C{x} 112 {x+24} 40 {x+64} 40 Z" fill="none" stroke="#000" stroke-width="{S}"/>'  # 0 uovo
    return o
def word_line(x=40):
    o = ln(f"M{x} 220 L{x+80} 36 L{x+160} 220")                                   # A
    o += f'<g stroke="{BG}" stroke-width="{S+12}" stroke-linecap="round"><path d="M{x+10} 162 H{x+150}"/></g>'
    o += ln(f"M{x+20} 162 H{x+140}") + ln(f"M{x-22} 162 H{x-4} M{x+164} 162 H{x+182}", 14)   # mattarello + maniglie
    x += 230
    o += ln(f"M{x} 220 V36 L{x+130} 220 V84") + ln(f"M{x+112} 36 V84 M{x+130} 36 V70 M{x+148} 36 V84", 12) + ln(f"M{x+112} 84 Q{x+130} 100 {x+148} 84", 12)  # N + forchetta
    x += 200
    o += ten_line(x)
    return o, x + 268
w2, W2 = word_line()
save("g2-lockup.svg", f"0 0 {W2} 256", w2, "AN10 · linea")
save("g2-symbol.svg", "0 0 256 256", f'<g transform="translate(128 128) scale(.95) translate(-114 -128)">{ten_line(0)}</g>', "10 · linea")
# impilato G2
save("g2-stacked.svg", "0 0 470 500", f'<defs><clipPath id="an"><rect x="0" y="0" width="440" height="256"/></clipPath><clipPath id="ten"><rect x="440" y="0" width="300" height="256"/></clipPath></defs>'
     f'<g transform="translate(30 0)" clip-path="url(#an)">{w2}</g><g transform="translate(-307 236)" clip-path="url(#ten)">{w2}</g>', "AN10 linea impilato")
print("ok")
