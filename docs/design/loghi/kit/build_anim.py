"""Animazione di composizione del logo AN10 (dimostrazione, ~1,7 s; ferma con prefers-reduced-motion).
Uso (dalla radice del progetto): python3 docs/design/loghi/kit/build_anim.py → docs/design/loghi/kit/logo-animato.html
Ogni oggetto ha la sua classe; anche i ritagli nelle maschere si muovono con l'oggetto a cui appartengono."""
import os

S = 26
EGG = ("M632 40 C672 40 694 96 694 146 C694 190 668 218 632 218 "
       "C596 218 570 190 570 146 C570 96 592 40 632 40 Z")
st = 'fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"'

svg = f"""<svg viewBox="0 10 720 236" class="logo" role="img" aria-label="AN10">
<defs>
 <mask id="m1" maskUnits="userSpaceOnUse" x="-400" y="-400" width="1600" height="1000">
  <rect x="-400" y="-400" width="1600" height="1000" fill="#fff"/>
  <g class="pin"><path d="M50 162 H190" stroke="#000" stroke-width="{S+12}" stroke-linecap="round"/></g>
  <g class="blade"><circle cx="512" cy="172" r="23" fill="#000"/></g>
 </mask>
 <mask id="m2" maskUnits="userSpaceOnUse" x="-400" y="-400" width="1600" height="1000">
  <rect x="-400" y="-400" width="1600" height="1000" fill="#fff"/>
  <g class="handle"><circle cx="512" cy="188" r="4" fill="#000"/><circle cx="512" cy="204" r="4" fill="#000"/></g>
 </mask>
</defs>
<g {st} mask="url(#m1)">
 <path class="draw d1" pathLength="1" d="M40 220 L120 36 L200 220" stroke-width="{S}"/>
 <path class="draw d2" pathLength="1" d="M270 220 V36 L400 220 V84" stroke-width="{S}"/>
 <g class="fork"><path d="M382 36 V84 M400 36 V70 M418 36 V84" stroke-width="12"/><path d="M382 84 Q400 100 418 84" stroke-width="12"/></g>
 <g class="blade"><path d="M470 82 L512 40 V172" stroke-width="28"/></g>
 <g class="egg"><path d="{EGG}" stroke-width="{S}"/></g>
 <circle class="yolk" cx="632" cy="140" r="17" fill="currentColor" stroke="none"/>
</g>
<g {st} mask="url(#m2)">
 <g class="pin"><path d="M60 162 H180" stroke-width="{S}"/><path d="M18 162 H36 M204 162 H222" stroke-width="14"/></g>
 <g class="handle"><path d="M512 172 V208" stroke-width="28"/></g>
</g>
</svg>"""

css = """
*{box-sizing:border-box;margin:0}
body{min-height:100vh;display:grid;place-items:center;gap:24px;background:#F4F9FB;font:14px -apple-system,system-ui,sans-serif;color:#0B2530;padding:24px}
.logo{width:min(90vw,820px);color:#0A7EA4;overflow:visible}
.dark{background:#0B2530;border-radius:20px;padding:28px 36px}.dark .logo{color:#fff;width:min(80vw,520px)}
button{font:600 14px inherit;padding:10px 16px;border-radius:12px;border:1px solid #BFD6E0;background:#fff;color:#0B2530;cursor:pointer}
.draw{stroke-dasharray:1;stroke-dashoffset:1;animation:draw .55s cubic-bezier(.6,0,.2,1) forwards}
.d1{animation-delay:0s}.d2{animation-delay:.18s}
@keyframes draw{to{stroke-dashoffset:0}}
.pin,.fork,.blade,.handle,.egg,.yolk{transform-box:view-box;animation:in .5s cubic-bezier(.2,.9,.25,1.2) both}
.pin{--f:translateX(-260px);animation-delay:.45s}
.fork{--f:translateY(-90px);animation-delay:.7s}
.blade{--f:translateY(-140px);animation-delay:.85s}
.handle{--f:translateY(120px);animation-delay:.85s}
.egg{--f:translateY(-220px);animation:drop .6s cubic-bezier(.3,0,.3,1) 1s both}
.yolk{transform-origin:632px 140px;--f:scale(0);animation-delay:1.45s}
@keyframes in{from{transform:var(--f);opacity:0}to{transform:none;opacity:1}}
@keyframes drop{0%{transform:translateY(-220px);opacity:0}55%{transform:translateY(0);opacity:1}72%{transform:translateY(-16px)}100%{transform:none}}
@media (prefers-reduced-motion:reduce){.draw,.pin,.fork,.blade,.handle,.egg,.yolk{animation:none;stroke-dashoffset:0}}
"""

html = f"""<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>AN10 · logo animato</title><style>{css}</style></head><body>
<div id="a">{svg}</div>
<div class="dark">{svg.replace('id="m1"', 'id="n1"').replace('id="m2"', 'id="n2"').replace('url(#m1)', 'url(#n1)').replace('url(#m2)', 'url(#n2)')}</div>
<button onclick="document.querySelectorAll('svg').forEach(s=>{{const c=s.cloneNode(true);s.replaceWith(c)}})">Rivedi l'animazione</button>
</body></html>"""

with open(os.path.join(os.path.dirname(__file__), "logo-animato.html"), "w") as fh:
    fh.write(html)
print("ok")
