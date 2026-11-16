# Concept logo AN10 — costruzione geometrica (nero su bianco, fase 4 della skill logo-design)
S = 28            # tratto delle lettere (cap height 168 → 16,7 %)
TOP, BASE = 44, 212
W, GAP = 108, 34  # larghezza cella e spazio fra lettere

def svg(vb, body, title):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" role="img"><title>{title}</title>{body}</svg>\n'

def stroke(d, w=S):
    return f'<path d="{d}" fill="none" stroke="#000" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>'

def A(x):   # diagonali a 75° esatti: semi-larghezza = 168 / tan 75° = 45
    w, x = 90, x + 9
    t = (BASE - 156) / (BASE - TOP)
    return stroke(f"M{x} {BASE} L{x+w/2} {TOP} L{x+w} {BASE}") + stroke(f"M{x+t*w/2:.1f} 156 H{x+w-t*w/2:.1f}")
def N(x):   # diagonale a 60° esatti: larghezza = 168 / tan 60° = 97
    w, x = 97, x + 5.5
    return stroke(f"M{x} {BASE} V{TOP} L{x+w} {BASE} V{TOP}")
def ONE(x): return stroke(f"M{x+W*0.22:.1f} {TOP+30} L{x+W*0.58:.1f} {TOP} V{BASE}")
def ZERO(x):
    cx, rx, ry = x+W/2, W/2, (BASE-TOP)/2
    return f'<ellipse cx="{cx}" cy="{(TOP+BASE)/2}" rx="{rx}" ry="{ry}" fill="none" stroke="#000" stroke-width="{S}"/>'
def PAN(x):   # lo zero diventa una padella vista dall'alto: anello + manico a 45° verso il basso a destra
    cx, cy, r = x+W/2, (TOP+BASE)/2+10, W/2+4
    hx = cx + r + S/2
    h = S/2 + 1
    handle = (f'<path fill="#000" fill-rule="evenodd" d="M{hx-6} {cy-h} H{hx+80} A{h} {h} 0 0 1 {hx+80} {cy+h} H{hx-6} Z '
              f'M{hx+64} {cy} a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0 Z"/>')
    return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="#000" stroke-width="{S}"/>' + handle

# ---------- A · «10» = cucchiaio di legno + pentola dall'alto ----------
spoon = ('<path transform="translate(-4 0)" d="M42 42 a12 12 0 0 1 24 0 V138 C66 146 84 158 84 190 A30 32 0 0 1 24 190 C24 158 42 146 42 138 Z"/>')  # cucchiaio di legno: l'«1»                            # paletta del cucchiaio
pot = ('<path fill-rule="evenodd" d="M162 54 a74 74 0 1 1 -0.1 0 Z M166 80 a48 48 0 1 0 0.1 0 Z"/>'   # bordo della pentola: lo «0»
       '<circle cx="162" cy="128" r="18"/>')                                        # il cibo al centro, punto focale
symA = svg("0 0 256 256", f'<g fill="#000">{spoon}{pot}</g>', "AN10 · cucchiaio e pentola")
open("a-symbol.svg", "w").write(symA)
x0 = 300
wordA = A(x0) + N(x0+W+GAP) + ONE(x0+2*(W+GAP)) + ZERO(x0+3*(W+GAP))
open("a-lockup.svg", "w").write(svg(f"0 0 {x0+4*W+3*GAP+20} 256", f'<g fill="#000">{spoon}{pot}</g>{wordA}', "AN10 lockup A"))

# ---------- B · «A» con la fiamma come controforma ----------
flameA = ('<path fill="#000" fill-rule="evenodd" d="'
          'M104 24 H152 L240 232 H170 L146 184 H110 L86 232 H16 Z '              # A piena con varco fra le gambe
          'M134 58 C146 84 156 102 156 126 A28 28 0 0 1 100 126 C100 112 104 102 112 92 C112 104 116 112 124 114 C120 96 124 76 134 58 Z"/>')  # fiamma ritagliata
open("b-symbol.svg", "w").write(svg("0 0 256 256", flameA, "AN10 · A con fiamma"))
# lockup: la A-fiamma scalata alla cap height, poi N 1 0
k = (BASE-TOP+8)/208
wordB = f'<g transform="translate(0 {TOP-4-24*k:.1f}) scale({k:.3f})">{flameA}</g>' + N(260*k+GAP) + ONE(260*k+GAP+W+GAP) + ZERO(260*k+GAP+2*(W+GAP))
open("b-lockup.svg", "w").write(svg(f"-10 0 {260*k+GAP+3*W+2*GAP+40} 256", wordB, "AN10 lockup B"))

# ---------- C · AN10 a larghezza fissa, lo zero è una padella ----------
# simbolo: 2×2 impilato (AN / 1 padella) in un quadrato
def scaled(fn, x, y, s):
    return f'<g transform="translate({x} {y}) scale({s})">{fn(0)}</g>'
s = 0.56
x1 = 46; x2 = x1 + (W+GAP)*s
symC = (scaled(A, x1, -9, s) + scaled(N, x2, -9, s) + scaled(ONE, x1, 111, s) + scaled(PAN, x2, 111, s))  # il manico esce dal bordo
open("c-symbol.svg", "w").write(svg("0 0 256 256", symC, "AN10 · impilato con padella"))
wordC = A(20) + N(20+W+GAP) + ONE(20+2*(W+GAP)) + PAN(20+3*(W+GAP))
open("c-lockup.svg", "w").write(svg(f"0 0 {20+4*W+3*GAP+130} 256", wordC, "AN10 lockup C"))
print("ok")
