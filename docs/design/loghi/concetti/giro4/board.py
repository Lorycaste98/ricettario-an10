# Tavola del sistema: stesse forme in tutti i contesti d'uso
import re, sys
INK, BLUE, DARK = "#0B2530", "#0A7EA4", "#0B2530"
def load(n): return re.sub(r'^<svg[^>]*>|</svg>\s*$', '', open(n).read().strip()), re.search(r'viewBox="([^"]+)"', open(n).read()).group(1)
def paint(body, ink, bg): return body.replace('#fff', '@@BG@@').replace('#000', ink).replace('@@BG@@', bg)
def svg(body, vb, cls=""): return f'<svg viewBox="{vb}" class="{cls}">{body}</svg>'
def card(n, title, inner, note=""): return f'<div class="c"><div class="h"><span class="ref">{n}</span>{title}</div><div class="v">{inner}</div><p>{note}</p></div>'
out = ""
for key, name, line in (("g1", "G1 · Pieno", "Lettere piene, gli oggetti sono ritagliati"), ("g2", "G2 · Linea", "Tratto unico tondo, come le icone dell'app")):
    lk, lvb = load(f"{key}-lockup.svg"); sy, svb = load(f"{key}-symbol.svg"); st, stvb = load(f"{key}-stacked.svg")
    tile = lambda size, cls="": f'<svg viewBox="0 0 256 256" width="{size}" height="{size}" class="{cls}"><rect width="256" height="256" rx="58" fill="{BLUE}"/><g transform="translate(36 36) scale(.72)">{paint(sy, "#fff", BLUE)}</g></svg>'
    cards = [
      card("1", "Logo completo", svg(paint(lk, INK, "#fff"), lvb, "wide"), "Intestazioni, PDF, pagina di accesso"),
      card("2", "Impilato", svg(paint(st, INK, "#fff"), stvb, "stack"), "Spazi quadrati, stampa, timbro"),
      card("3", "Solo simbolo «10»", svg(paint(sy, INK, "#fff"), svb, "sym"), "Si legge 10 anche da solo"),
      card("4", "Icona dell'app", tile(120, "app") + '<span class="lab">Ricettario</span>', "Schermata Home iPhone e iPad"),
      card("5", "Favicon 32 · 16", tile(32) + tile(16) + '<span class="tab">' + tile(16) + ' Ricettario AN10</span>', "Scheda del browser"),
      card("6", "In negativo", f'<div class="dk">{svg(paint(lk, "#fff", DARK), lvb, "wide")}</div>', "Su fondo scuro (barra laterale)"),
      card("7", "Sul blu del logo", f'<div class="bl">{svg(paint(lk, "#fff", BLUE), lvb, "wide")}</div>', "Copertina, grembiule, adesivo"),
      card("8", "Stampa a un colore", svg(paint(lk, "#000", "#fff"), lvb, "wide") , "Nero su carta, fotocopia, timbro"),
    ]
    out += f'<section><h2>{name}<small>{line}</small></h2><div class="g">{"".join(cards)}</div></section>'
html = f'''<!doctype html><html lang="it"><head><meta charset="utf-8"><title>AN10 · sistema del logo</title><style>
*{{box-sizing:border-box;margin:0}}body{{width:1440px;background:#E2E8EB;font:14px/1.4 -apple-system,system-ui,sans-serif;color:#0B2530;padding:30px 36px}}
h1{{font-size:26px;margin-bottom:4px}}.sub{{color:#4F6B77;margin-bottom:18px}}
section{{background:#F4F9FB;border:1px solid #D3E4EB;border-radius:20px;padding:18px 20px;margin-bottom:20px}}
h2{{font-size:20px;margin-bottom:12px;display:flex;gap:12px;align-items:baseline}}h2 small{{font-size:13px;color:#4F6B77;font-weight:500}}
.g{{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:12px}}.c{{background:#fff;border:1px solid #D3E4EB;border-radius:14px;padding:12px 14px;display:flex;flex-direction:column;gap:8px}}
.c:nth-child(6),.c:nth-child(7),.c:nth-child(8){{grid-column:span 1}}.c:nth-child(1){{grid-row:span 1}}
.h{{display:flex;gap:8px;align-items:center;font-weight:700}}.ref{{font:700 11px ui-monospace,monospace;background:#E8590C;color:#fff;padding:3px 6px;border-radius:6px}}
.v{{flex:1;display:flex;align-items:center;justify-content:center;gap:12px;min-height:130px}}p{{font-size:12px;color:#4F6B77}}
svg.wide{{width:100%;max-height:110px}}svg.stack{{height:150px}}svg.sym{{height:130px}}svg.app{{border-radius:28px;box-shadow:0 6px 16px rgba(11,37,48,.2)}}
.v .lab{{font-size:12px;display:block}}.v:has(.app){{flex-direction:column;gap:6px}}
.tab{{display:flex;align-items:center;gap:6px;background:#E3EDF1;border-radius:8px 8px 0 0;padding:6px 10px;font-size:12px}}
.dk,.bl{{width:100%;border-radius:10px;padding:16px;display:flex}}.dk{{background:{DARK}}}.bl{{background:{BLUE}}}
</style></head><body><h1>AN10 · sistema del logo</h1><div class="sub">Due rese dello stesso carattere. Ogni lettera nasconde un oggetto: A = mattarello, N = forchetta, 1 = coltello, 0 = uovo.</div>{out}</body></html>'''
open("sistema.html", "w").write(html)
print("ok")
