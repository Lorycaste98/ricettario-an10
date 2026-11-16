# Giro 2 dei concept AN10 (fase 4-5 della skill logo-design). Nero su bianco.
def svg(vb, body, title):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" role="img"><title>{title}</title>{body}</svg>\n'
def save(name, vb, body, title): open(name, "w").write(svg(vb, body, title))

# ── Lettere piene, stesso peso della A (asta 46 su altezza 208, base y=232, cima y=24) ──
FLAME_A = ('M104 24 H152 L240 232 H170 L146 184 H110 L86 232 H16 Z '
           'M134 58 C146 84 156 102 156 126 A28 28 0 0 1 100 126 C100 112 104 102 112 92 C112 104 116 112 124 114 C120 96 124 76 134 58 Z')
def N_full(x): return f'<path transform="translate({x} 0)" d="M0 232 V24 H48 L132 150 V24 H178 V232 H132 L46 104 V232 Z"/>'
def ONE_full(x): return f'<path transform="translate({x} 0)" d="M0 62 L56 24 H104 V232 H56 V86 L0 112 Z"/>'
def ZERO_full(x): return f'<path transform="translate({x} 0)" fill-rule="evenodd" d="M80 20 C134 20 160 66 160 128 C160 190 134 236 80 236 C26 236 0 190 0 128 C0 66 26 20 80 20 Z M80 66 C58 66 48 92 48 128 C48 164 58 190 80 190 C102 190 112 164 112 128 C112 92 102 66 80 66 Z"/>'
GAPF = 28
def heavy_word(first):   # first = path della A (già in coordinate 0..256)
    x = 256 + GAPF
    body = f'<path fill-rule="evenodd" d="{first}"/>' + N_full(x)
    x += 178 + GAPF; body += ONE_full(x)
    x += 104 + GAPF; body += ZERO_full(x)
    return body, x + 160 + 12

# B1 · A con fiamma + N10 pieni, stesso peso
b1, w = heavy_word(FLAME_A)
save("b1-lockup.svg", f"0 0 {w} 256", f'<g fill="#000">{b1}</g>', "B1 AN10 pieno")
save("b1-symbol.svg", "0 0 256 256", f'<path fill="#000" fill-rule="evenodd" d="{FLAME_A}"/>', "B1 simbolo")

# B3 · la A è una fiamma: sagoma di fiamma con controforma e gambe della A ritagliate
FLAME_SHAPE_A = ('M128 8 C144 58 200 112 216 172 L234 240 H168 L152 202 H104 L88 240 H22 L40 172 '
                 'C46 150 56 132 72 116 C72 134 78 146 90 152 C90 100 106 52 128 8 Z '   # fiamma = sagoma della A
                 'M128 104 L150 168 H106 Z')                                              # controforma della A
save("b3-symbol.svg", "0 0 256 256", f'<path fill="#000" fill-rule="evenodd" d="{FLAME_SHAPE_A}"/>', "B3 A a forma di fiamma")
b3, w = heavy_word(FLAME_SHAPE_A)
save("b3-lockup.svg", f"0 0 {w} 256", f'<g fill="#000">{b3}</g>', "B3 lockup")

# B2 · simbolo nel quadrato + scritta leggera separata (la A si distingue dal resto)
S = 22
def light(d): return f'<path d="{d}" fill="none" stroke="#000" stroke-width="{S}" stroke-linecap="round" stroke-linejoin="round"/>'
def word_light(x, top=78, base=178):
    h = base - top; w = 64
    a = light(f"M{x} {base} L{x+w/2} {top} L{x+w} {base}") + light(f"M{x+w*0.18:.1f} {base-34} H{x+w*0.82:.1f}")
    x += w + 26; n = light(f"M{x} {base} V{top} L{x+58} {base} V{top}")
    x += 58 + 26; one = light(f"M{x} {top+18} L{x+20} {top} V{base}")
    x += 20 + 30; zero = f'<ellipse cx="{x+30}" cy="{(top+base)/2}" rx="30" ry="{h/2}" fill="none" stroke="#000" stroke-width="{S}"/>'
    return a + n + one + zero, x + 60
import re
def tf(d, tx, ty, k):   # applica translate+scale ai comandi assoluti M L H V C A Z (la A diventa un foro vero)
    out, cmd = [], None
    for tok in re.findall(r"[MLHVCAZ]|-?[\d.]+", d):
        if tok.isalpha(): cmd = tok; out.append(tok); buf = []; continue
        out.append(tok)
    # seconda passata con indici per comando
    res, i, toks = [], 0, re.findall(r"[MLHVCAZ]|-?[\d.]+", d)
    while i < len(toks):
        t = toks[i]
        if t.isalpha():
            cmd = t; res.append(t); i += 1; n = 0; continue
        v = float(t)
        if cmd in "ML C":  v = (tx + v*k) if n % 2 == 0 else (ty + v*k)
        elif cmd == "H": v = tx + v*k
        elif cmd == "V": v = ty + v*k
        elif cmd == "A":
            p = n % 7
            v = v*k if p in (0, 1) else (v if p in (2, 3, 4) else (tx + v*k if p == 5 else ty + v*k))
        res.append(f"{v:.1f}".rstrip("0").rstrip(".")); n += 1; i += 1
    return " ".join(res)
tile = f'<path fill="#000" fill-rule="evenodd" d="M56 0 H200 A56 56 0 0 1 256 56 V200 A56 56 0 0 1 200 256 H56 A56 56 0 0 1 0 200 V56 A56 56 0 0 1 56 0 Z {tf(FLAME_A, 36, 36, .72)}"/>'
wl, w = word_light(300)
save("b2-symbol.svg", "0 0 256 256", tile, "B2 simbolo nel quadrato")
save("b2-lockup.svg", f"0 0 {w+16} 256", tile + wl, "B2 lockup")

# ── C2 · AN10 fatta di utensili ─────────────────────────────────────────────
# Ogni utensile è un gruppo <g class="u"> (serve all'animazione). Dove due utensili si
# sovrappongono, quello sopra ha un contorno del colore di fondo (stroke bianco) che li stacca.
K = 'stroke="#fff" stroke-width="7" paint-order="stroke"'
def g(cls, body, tr=""): return f'<g class="fly {cls}"><g{f" transform=\"{tr}\"" if tr else ""}>{body}</g></g>'
# utensili disegnati in verticale, punta in alto, asse x=0, da y=0 a y=L
def spatula(L):   # spatola di legno: manico + paletta piatta in basso
    return f'<rect x="-8" y="0" width="16" height="{L-62}" rx="8"/><path d="M-9 {L-70} H9 L17 {L-56} V{L-6} a6 6 0 0 1-6 6 H-11 a6 6 0 0 1-6-6 V{L-56} Z"/>'
def spoon(L):     # cucchiaio di legno: manico + paletta ovale in basso
    return f'<rect x="-8" y="0" width="16" height="{L-56}" rx="8"/><path d="M-6 {L-66} C10 {L-66} 20 {L-46} 20 {L-26} A20 26 0 0 1 -20 {L-26} C-20 {L-46} -10 {L-66} -6 {L-66} Z"/>'
def rolling_pin(W):  # mattarello orizzontale centrato in 0
    b = W/2 - 26
    return (f'<rect x="{-b}" y="-12" width="{2*b}" height="24" rx="10"/>'
            f'<rect x="{-b-26}" y="-6" width="30" height="12" rx="6"/><rect x="{b-4}" y="-6" width="30" height="12" rx="6"/>')
def fork(L):      # forchetta: rebbi in alto
    return (f'<path d="M-20 0 a4 4 0 0 1 8 0 V30 H-4 V0 a4 4 0 0 1 8 0 V30 H12 V0 a4 4 0 0 1 8 0 V40 C20 56 10 62 8 66 V{L-6} a8 8 0 0 1 -16 0 V66 C-10 62 -20 56 -20 40 Z"/>')
def knife(L):     # coltello: lama in alto con punta, manico in basso
    return (f'<path d="M14 {L*0.52} V0 C0 12 -14 40 -14 {L*0.52} Z"/>'
            f'<rect x="-11" y="{L*0.52+8}" width="22" height="{L*0.48-8}" rx="8"/>')
def whisk(L):     # frusta: manico + gabbia di fili
    hl = L*0.42
    loops = "".join(f'<path d="M0 {hl} C{-wv} {hl+30} {-wv} {L-10} 0 {L} C{wv} {L-10} {wv} {hl+30} 0 {hl}" fill="none" stroke="#000" stroke-width="7"/>' for wv in (22, 10))
    return f'<rect x="-8" y="0" width="16" height="{hl+6}" rx="8"/>' + loops + f'<path d="M0 {hl} V{L}" stroke="#000" stroke-width="7"/>'
def ladle(L):     # mestolo: gancio in alto (la bandierina dell'1) + coppa in basso
    return (f'<path d="M0 {L-40} V28 C0 4 -26 2 -34 22" fill="none" stroke="#000" stroke-width="17" stroke-linecap="round"/>'
            f'<path d="M-30 {L-44} H30 A30 32 0 0 1 -30 {L-44} Z"/>')
def pan(cx, cy, r):  # padella vista dall'alto: anello + manico con foro
    return (f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="#000" stroke-width="20"/>'
            f'<path fill-rule="evenodd" d="M{cx+r+6} {cy-11} H{cx+r+86} A11 11 0 0 1 {cx+r+86} {cy+11} H{cx+r+6} Z M{cx+r+70} {cy} a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0 Z"/>')

TOP, BASE = 30, 226
L = 210
# A: spatola (gamba sinistra) + cucchiaio (gamba destra) incrociati in cima + mattarello come traversa
A = (g("a1", spatula(L), "translate(80 18) rotate(20)") +
     g("a2", spoon(L), "translate(70 18) rotate(-20)") +
     g("a3", f'<g {K}>{rolling_pin(150)}</g>', "translate(75 158)"))
# N: forchetta (asta sinistra) + coltello (asta destra) + frusta in diagonale
N = (g("n1", fork(196), "translate(196 30)") +
     g("n2", knife(196), "translate(306 30)") +
     g("n3", f'<g {K}>{whisk(188)}</g>', "translate(208 40) rotate(-21)"))
ONE = g("o1", ladle(196), "translate(398 30)")
ZERO = g("z1", pan(522, 140, 64), "")
c2 = A + N + ONE + ZERO
save("c2-lockup.svg", "-6 0 700 256", f'<g fill="#000">{c2}</g>', "C2 AN10 di utensili")
# simbolo per l'icona: «10» (mestolo + padella), scalato nel quadrato
save("c2-symbol.svg", "0 0 256 256", f'<g fill="#000" transform="translate(-247 36) scale(.72)">{ONE}{ZERO}</g>', "C2 simbolo 10")
anim = """<!doctype html><html lang="it"><head><meta charset="utf-8"><title>C2 · animazione</title><style>
body{margin:0;height:100vh;display:flex;align-items:center;justify-content:center;background:#fff}
svg{width:min(90vw,900px)}
.fly{transform-box:fill-box;transform-origin:center;animation:in .9s cubic-bezier(.2,.9,.25,1.15) both}
@keyframes in{from{transform:translate(var(--x),var(--y)) rotate(var(--r));opacity:0}to{transform:none;opacity:1}}
.a1{--x:-160px;--y:-120px;--r:-80deg;animation-delay:0s}.a2{--x:-40px;--y:-200px;--r:70deg;animation-delay:.1s}.a3{--x:-220px;--y:60px;--r:-30deg;animation-delay:.25s}
.n1{--x:-20px;--y:220px;--r:40deg;animation-delay:.35s}.n2{--x:60px;--y:-220px;--r:-60deg;animation-delay:.45s}.n3{--x:120px;--y:180px;--r:120deg;animation-delay:.55s}
.o1{--x:80px;--y:-200px;--r:-90deg;animation-delay:.65s}.z1{--x:260px;--y:40px;--r:180deg;animation-delay:.75s}
@media (prefers-reduced-motion:reduce){.fly{animation:none}}
</style></head><body>""" + svg("-6 0 700 256", f'<g fill="#000">{c2}</g>', "AN10") + "</body></html>"
open("c2-animazione.html", "w").write(anim)
print("ok")
