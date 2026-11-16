# Giro 3 — concept nuovi (fase 3-4 della skill logo-design). Nero su bianco.
def svg(vb, body, title):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" role="img"><title>{title}</title>{body}</svg>\n'
def save(n, vb, b, t): open(n, "w").write(svg(vb, b, t))
def st(d, w, col="#000", cap="butt", join="miter"):
    return f'<path d="{d}" fill="none" stroke="{col}" stroke-width="{w}" stroke-linecap="{cap}" stroke-linejoin="{join}"/>'

# ── Lettere con grazie squadrate (eredità della macchina da scrivere), altezza H, asta T ──
def slab(x, y, H, T, col="#000"):
    s = T*0.55; sw = T*0.9   # spessore e sporgenza delle grazie
    def serif(cx, cy, w): return f'<rect x="{cx-w/2:.1f}" y="{cy-s/2:.1f}" width="{w:.1f}" height="{s:.1f}" fill="{col}"/>'
    out = {}
    W = H*0.62
    # A
    a = st(f"M{x+T/2:.1f} {y+H} L{x+W/2:.1f} {y+T*0.2:.1f} L{x+W-T/2:.1f} {y+H}", T, col, join="miter")
    a += st(f"M{x+W*0.27:.1f} {y+H*0.66:.1f} H{x+W*0.73:.1f}", T*0.75, col)
    a += serif(x+T/2, y+H-s/2, sw*2.2) + serif(x+W-T/2, y+H-s/2, sw*2.2)
    out["A"] = (a, W)
    # N
    n = st(f"M{x+W+T*1.2:.1f} {y+H} V{y} L{x+2*W+T*0.2:.1f} {y+H} V{y}", T, col, join="miter")
    n += serif(x+W+T*1.2, y+H-s/2, sw*2.2) + serif(x+W+T*1.2, y+s/2, sw*1.6) + serif(x+2*W+T*0.2, y+s/2, sw*2.2)
    out["N"] = (n, W)
    return out

def word(x, y, H, T, col="#000"):
    """AN10 con grazie squadrate, costruita lettera per lettera (altezza 120 scalata su H, asta T)."""
    k = H/120; b = y + H; sh = 12*k
    def r(x0, y0, w, h): return f'<rect x="{x0:.1f}" y="{y0:.1f}" width="{w:.1f}" height="{h:.1f}" fill="{col}"/>'
    def line(d): return st(d, T, col, join="bevel")
    o = ""
    a = x                                                     # A
    o += line(f"M{a+12*k:.1f} {b-sh/2:.1f} L{a+50*k:.1f} {y+4*k:.1f} L{a+88*k:.1f} {b-sh/2:.1f}")
    o += st(f"M{a+30*k:.1f} {y+84*k:.1f} H{a+70*k:.1f}", T*0.8, col)
    o += r(a, b-sh, 34*k, sh) + r(a+66*k, b-sh, 34*k, sh)
    n = a + 116*k                                             # N
    o += r(n+12*k-T/2, y, T, H) + r(n+80*k-T/2, y, T, H)
    o += f'<path d="M{n+12*k-T/2:.1f} {y} H{n+12*k+T*0.6:.1f} L{n+80*k+T/2:.1f} {b} H{n+80*k-T*0.6:.1f} Z" fill="{col}"/>'
    o += r(n, y, 30*k, sh) + r(n, b-sh, 34*k, sh) + r(n+64*k, y, 34*k, sh)
    u = n + 114*k                                             # 1
    o += line(f"M{u+6*k:.1f} {y+26*k:.1f} L{u+32*k:.1f} {y} V{b}")
    o += r(u+8*k, b-sh, 48*k, sh)
    z = u + 72*k                                              # 0
    o += f'<ellipse cx="{z+36*k:.1f}" cy="{y+H/2:.1f}" rx="{36*k-T/2:.1f}" ry="{H/2-T/2:.1f}" fill="none" stroke="{col}" stroke-width="{T}"/>'
    return o, z + 72*k

# ── D · Tagliere ─────────────────────────────────────────────────────────────
BOARD = ("M40 52 H170 A28 28 0 0 1 196 70 V100 H222 A26 26 0 0 1 222 152 H196 V182 A28 28 0 0 1 170 204 "
         "H40 A28 28 0 0 1 12 176 V80 A28 28 0 0 1 40 52 Z M220 126 a10 10 0 1 0 0.1 0 Z")
# «10» inciso: tolto dal tagliere (bianco), con grazie squadrate
ten = (st("M44 104 L74 80 V178", 24, "#fff", join="bevel") + '<rect x="46" y="166" width="58" height="13" fill="#fff"/>'
       + '<ellipse cx="140" cy="128" rx="24" ry="40" fill="none" stroke="#fff" stroke-width="24"/>')
save("d-symbol.svg", "0 0 256 256", f'<path fill="#000" fill-rule="evenodd" d="{BOARD}"/>{ten}', "D tagliere")
w, end = word(300, 70, 120, 24)
save("d-lockup.svg", f"0 0 {end+20:.0f} 256", f'<path fill="#000" fill-rule="evenodd" d="{BOARD}"/>{ten}{w}', "D lockup")

# ── E · Spaghetti: AN scritta col filo, la forchetta è l'1, il nido è lo 0 ──
SP = 13
NEST = ("C252 214 270 214 286 200 "                                     # il filo passa sotto la forchetta
        "C292 150 300 108 322 96 C350 82 372 116 370 150 C368 190 344 212 320 208 C296 204 288 176 298 150 "
        "C306 128 332 122 344 142 C354 162 340 184 322 180 C308 176 308 158 320 152")
spag = ("M18 206 C30 160 52 96 70 64 C84 96 104 160 116 206 "        # A
        "C120 214 126 214 128 200 C132 160 132 110 134 70 "             # risale nella N
        "C152 110 172 160 192 200 C196 208 202 206 202 196 C204 150 204 110 206 66 "  # N
        "C210 120 214 200 236 212 " + NEST)
crossA = st("M44 150 C60 144 82 144 98 150", SP, cap="round")
FORK1 = ('<path d="M234 64 a4 4 0 0 1 8 0 V92 H248 V64 a4 4 0 0 1 8 0 V92 H262 V64 a4 4 0 0 1 8 0 V100 '
         'C270 114 260 118 258 122 V208 a7 7 0 0 1 -14 0 V122 C242 118 234 114 234 100 Z" fill="#000" stroke="#fff" stroke-width="6" paint-order="stroke"/>')
save("e-lockup.svg", "0 30 390 200", st(spag, SP, cap="round", join="round") + crossA + FORK1, "E spaghetti")
e_sym = st("M186 96 C214 82 236 116 234 150 C232 190 208 212 184 208 C160 204 152 176 162 150 "
           "C170 128 196 122 208 142 C218 162 204 184 186 180 C172 176 172 158 184 152", SP+5, cap="round", join="round")
e_sym += '<g transform="translate(-158 0)">' + FORK1.replace('stroke-width="6"', 'stroke-width="8"') + '</g>'
save("e-symbol.svg", "0 0 256 256", f'<g transform="translate(-55 -34) scale(1.18)">{e_sym}</g>', "E simbolo 10")

# ── F · Grembiule con monogramma ─────────────────────────────────────────────
APRON = ("M92 54 H164 L172 112 H176 L192 236 A12 12 0 0 1 180 248 H76 A12 12 0 0 1 64 236 L80 112 H84 Z")
ties = (st("M176 118 C200 118 214 132 218 160 M80 118 C56 118 42 132 38 160", 7, cap="round")
        + st("M218 160 C226 168 230 178 222 184 C214 186 212 172 218 160 M38 160 C30 168 26 178 34 184 C42 186 44 172 38 160", 6, cap="round", join="round"))
neck = st("M96 56 C96 6 160 6 160 56", 12, cap="round")
mono = (st("M106 104 L118 72 L130 104 M110 94 H126", 6, "#fff", cap="round", join="round")
        + st("M134 104 V72 L150 104 V72", 6, "#fff", cap="round", join="round"))
stitch = ('<rect x="94" y="152" width="68" height="56" rx="8" fill="none" stroke="#fff" stroke-width="4" stroke-dasharray="6 5"/>'
          + st("M110 172 L120 164 V196", 6, "#fff", cap="round", join="round")
          + '<ellipse cx="141" cy="180" rx="9" ry="15" fill="none" stroke="#fff" stroke-width="6"/>')
ties = st("M176 116 C200 114 214 118 222 128 C230 138 226 150 236 160 M80 116 C56 114 42 118 34 128 C26 138 30 150 20 160", 5, cap="round")
save("f-symbol.svg", "0 0 256 256", f'<g transform="translate(0 -5)"><path fill="#000" d="{APRON}"/>{ties}{neck}{mono}{stitch}</g>', "F grembiule")
w, end = word(290, 70, 120, 20)
save("f-lockup.svg", f"0 0 {end+20:.0f} 256", f'<path fill="#000" d="{APRON}"/>{ties}{neck}{mono}{stitch}{w}', "F lockup")
print("ok")
