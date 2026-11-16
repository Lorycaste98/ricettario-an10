"""Tavola di controllo della suite AN10: incorpora gli SVG di public/brand in una pagina autonoma.
Uso (dalla radice del progetto): python3 docs/design/loghi/kit/build_board.py"""
import base64, os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../.."))
BRAND = os.path.join(ROOT, "public/brand")


def src(fn: str) -> str:
    with open(os.path.join(BRAND, fn), "rb") as fh:
        return "data:image/svg+xml;base64," + base64.b64encode(fh.read()).decode()


def cell(cls: str, fn: str, label: str = "") -> str:
    return f'<div class="c {cls}"><small>{label or fn}</small><img src="{src(fn)}"></div>'


icon, fav = src("an10-icona-app.svg"), src("favicon.svg")
html = f"""<!doctype html><html lang="it"><head><meta charset="utf-8"><title>AN10 · suite del logo</title><style>
*{{box-sizing:border-box;margin:0}}body{{width:1440px;background:#E2E8EB;font:14px/1.4 -apple-system,system-ui,sans-serif;color:#0B2530;padding:28px 36px}}
h1{{font-size:26px}}.sub{{color:#4F6B77;margin:4px 0 18px}}h2{{font-size:18px;margin:4px 0 10px}}
section{{background:#F4F9FB;border:1px solid #D3E4EB;border-radius:20px;padding:16px 18px;margin-bottom:18px}}
.g{{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}}.c{{border-radius:14px;padding:14px;display:flex;flex-direction:column;gap:8px;border:1px solid #D3E4EB}}
.c small{{font:600 11px ui-monospace,monospace;opacity:.75}}.c img{{display:block;margin:auto}}
.w{{background:#fff}}.b{{background:#0A7EA4;color:#fff}}.d{{background:#0B2530;color:#fff}}
.oriz img{{width:100%;height:90px;object-fit:contain}}.stack img{{height:150px}}.sym img{{height:120px}}
.row{{display:flex;gap:22px;align-items:end;flex-wrap:wrap}}.row figure{{display:flex;flex-direction:column;align-items:center;gap:6px;font-size:11px;color:#4F6B77}}
.tab{{display:flex;align-items:center;gap:8px;background:#DEE6EA;border-radius:9px 9px 0 0;padding:7px 12px;font-size:13px;width:240px;color:#0B2530}}
.home{{background:linear-gradient(160deg,#355c7d,#6c5b7b);border-radius:24px;padding:22px;display:grid;grid-template-columns:repeat(4,72px);gap:18px;color:#fff;font-size:11px;text-align:center}}
.home span{{display:block;width:72px;height:72px;border-radius:17px;background:rgba(255,255,255,.25);margin-bottom:5px}}.home img{{width:72px;height:72px;border-radius:17px;margin-bottom:5px;display:block}}
.photo{{background:linear-gradient(135deg,#c9b48a,#8a6a3e);border-radius:14px;padding:16px;height:140px;display:flex;align-items:end}}
</style></head><body>
<h1>AN10 · suite del logo</h1><div class="sub">File in <code>public/brand/</code>. Stessa geometria in tutte le versioni; i ritagli sono trasparenti su qualunque fondo.</div>
<section><h2>Orizzontale</h2><div class="g oriz">
{cell("w", "an10-orizzontale-blu.svg")}{cell("w", "an10-orizzontale-scuro.svg")}{cell("b", "an10-orizzontale-bianco.svg")}{cell("d", "an10-orizzontale-bianco.svg", "an10-orizzontale-bianco.svg (fondo scuro)")}</div></section>
<section><h2>Impilato e simbolo</h2><div class="g">
<div class="c w stack"><small>an10-impilato-blu.svg</small><img src="{src('an10-impilato-blu.svg')}"></div>
<div class="c d stack"><small>an10-impilato-bianco.svg</small><img src="{src('an10-impilato-bianco.svg')}"></div>
<div class="c w sym"><small>an10-simbolo-blu.svg</small><img src="{src('an10-simbolo-blu.svg')}"></div>
<div class="c w sym"><small>an10-simbolo-nero.svg (stampa)</small><img src="{src('an10-simbolo-nero.svg')}"></div></div></section>
<section><h2>Su una foto: i ritagli restano trasparenti</h2><div class="g">
<div class="photo"><img src="{src('an10-orizzontale-bianco.svg')}" style="height:60px"></div>
<div class="photo"><img src="{src('an10-simbolo-bianco.svg')}" style="height:100px"></div></div></section>
<section><h2>Icone e misure piccole</h2><div class="row">
<figure><img src="{icon}" width="120">icona app</figure><figure><img src="{icon}" width="64">64 px</figure>
<figure><img src="{fav}" width="32">favicon 32</figure><figure><img src="{fav}" width="16">16</figure>
<figure><div class="tab"><img src="{fav}" width="16"> Ricettario AN10</div>scheda del browser</figure>
<figure><div class="home"><div><span></span>Note</div><div><span></span>Foto</div><div><img src="{icon}">Ricettario</div><div><span></span>Meteo</div></div>schermata Home</figure>
</div></section></body></html>"""

with open(os.path.join(os.path.dirname(__file__), "suite.html"), "w") as fh:
    fh.write(html)
print("ok")
