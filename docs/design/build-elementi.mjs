// Genera le pagine di design da *.src.html.
// Uso (dalla radice del progetto): node docs/design/build-elementi.mjs
// Segnaposto: /*TOKENS*/ (tokens.css) · /*APP*/ (app.css) · {{l:nome}} icona lucide ·
// {{c:nome}} icona del progetto · {{s:...}} versione piccola · {{logo}} logo AN10 ·
// {{rail:voce}} {{tabs:voce}} {{pass}} {{mini}} {{subnav:voce}} pezzi di interfaccia comuni.
import fs from "node:fs";
import path from "node:path";

const root = process.argv[2] ?? process.cwd();
const dir = path.join(root, "docs/design");
const lucideDir = path.join(root, "node_modules/lucide-react/dist/esm/icons");

// Icone del progetto: griglia 24, tratto 2, estremi tondi — stessa grammatica di lucide.
export const CUSTOM = {
  pot: `<path d="M4 11h16"/><path d="M5 11v6a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-6"/><path d="M2 13h3M19 13h3"/><path d="M7 11a5 3 0 0 1 10 0"/><path d="M12 8V7"/><path d="M9 4.5c0-.8.8-.8.8-1.6M14.2 4.5c0-.8.8-.8.8-1.6"/>`,
  board: `<rect x="3" y="12" width="18" height="8" rx="2"/><circle cx="17.5" cy="16" r="1"/><path d="M4 9 15.5 4.2a1.6 1.6 0 0 1 2.1.9L18 6 5.6 9.9Z"/>`,
  stove: `<path d="M5 6h14v5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4Z"/><path d="M3 8h2M19 8h2"/><path d="M8 21c0-1.2 1.2-1.6 1.2-2.8M12 21c0-1.2 1.2-1.6 1.2-2.8M16 21c0-1.2 1.2-1.6 1.2-2.8"/>`,
  rise: `<path d="M3 13h18a9 7 0 0 1-18 0Z"/><path d="M6.5 13a5.5 5 0 0 1 11 0"/><path d="M12 7V2.5M10 4.5l2-2 2 2"/>`,
  cloche: `<path d="M3 18h18"/><path d="M5 18a7 7 0 0 1 14 0"/><path d="M12 11V9M10.5 9h3"/><path d="M4 21h16"/>`,
  bag: `<path d="M5 10h14l-1.2 9.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8Z"/><path d="M9 10V8a3 3 0 0 1 6 0v2"/><path d="m15.5 6.5 4-4.5"/>`,
  plate: `<circle cx="14" cy="12" r="7"/><circle cx="14" cy="12" r="3.5"/><path d="M4 3v18M2.5 3v4a1.5 1.5 0 0 0 3 0V3"/>`,
  cutlery: `<path d="M8.5 3v4a1.5 1.5 0 0 0 3 0V3"/><path d="M10 3v18"/><path d="M15.5 3v18"/><path d="M15.5 3c2.6 1.8 2.6 5.4 0 7.5"/>`,
  ladle: `<path d="M18 3 11.5 13"/><path d="M4 14h11a5.5 5.5 0 0 1-11 0Z"/>`,
};

const LOGO = `<svg class="an" viewBox="0 0 512 512" aria-label="AN10"><rect width="512" height="512" rx="80" fill="#0A7EA4"/><line x1="228" y1="100" x2="228" y2="280" stroke="#fff" stroke-width="28" stroke-linecap="round"/><line x1="200" y1="100" x2="200" y2="164" stroke="#fff" stroke-width="22" stroke-linecap="round"/><line x1="256" y1="100" x2="256" y2="164" stroke="#fff" stroke-width="22" stroke-linecap="round"/><path d="M200 164 Q228 196 256 164" fill="#fff"/><line x1="284" y1="100" x2="284" y2="280" stroke="#fff" stroke-width="28" stroke-linecap="round"/><path d="M284 100 Q336 140 284 200" fill="#fff"/><text x="256" y="390" font-family="Courier New,Courier,monospace" font-size="120" font-weight="700" fill="#fff" text-anchor="middle" letter-spacing="8">AN10</text></svg>`;

const NAV = [["ricette", "l:book-open", "Ricette"], ["menu", "c:cloche", "Menù"], ["preferiti", "l:heart", "Preferiti"], ["cerca", "l:search", "Cerca"]];
const on = (a, b) => (a === b ? ' class="on"' : "");
const MACROS = {
  rail: (v) => `<nav class="rail"><div class="logo">{{logo}}</div>${NAV.map(([k, ic, t]) => `<div${on(k, v)}><span>{{${ic}}}</span>${t}</div>`).join("")}<div class="end${v === "gestione" ? " on" : ""}"><span>{{l:settings}}</span>Gestione</div></nav>`,
  tabs: (v) => `<nav class="tabs">${NAV.map(([k, ic, t]) => `<div${on(k, v)}>{{${ic}}}${t}</div>`).join("")}<div${on("gestione", v)}>{{l:settings}}Gestione</div></nav>`,
  pass: () => `<div class="pass"><div class="tk w"><div><small>Focaccia · 3 di 6</small>Lievitazione</div><span class="t">1:03:00</span></div><div class="tk"><div><small>Ragù · 5 di 5</small>Sobbollire</div><span class="t">2:18:40</span></div></div>`,
  mini: () => `<div class="mini">{{c:pot}}<div><small>Sto cucinando · 2 ricette</small>Ragù · sobbollire</div><div class="t">2:18:40</div></div>`,
  subnav: (v) => {
    const items = [
      ["", "Consulta e gestisci"],
      ["dashboard", "l:layout-dashboard", "Panoramica", "", ""],
      ["ricette", "l:book-open", "Ricette", "224", "--area-ricette"],
      ["menu", "c:cloche", "Menù", "6", "--area-menu"],
      ["ingredienti", "c:bag", "Ingredienti", "1154", "--area-ingredienti"],
      ["vocabolario", "l:tags", "Categorie e tag", "115", "--area-vocabolario"],
      ["", "Persone"],
      ["recensioni", "l:star", "Recensioni", "48", ""],
      ["utenti", "l:users", "Utenti", "2", ""],
      ["", "Account"],
      ["profilo", "l:user", "Profilo", "", ""],
    ];
    const create = `<div class="create"><h4 style="margin-top:0">Crea</h4>${[["l:book-open","Nuova ricetta","--area-ricette"],["c:cloche","Nuovo menù","--area-menu"],["l:upload","Importa ricette",""]].map(([ic,t,c])=>`<a${c?` style="--c:var(${c})"`:""}>{{s:${ic}}}${t}<span class="plus">{{s:plus}}</span></a>`).join("")}</div>`;
    return `<nav class="subnav">${create}${items.map((it) => it.length === 2 ? `<h4>${it[1]}</h4>` : `<a${on(it[0], v)}${it[4] ? ` style="--c:var(${it[4]})"` : ""}>{{s:${it[1]}}}${it[2]}${it[3] ? `<span>${it[3]}</span>` : ""}</a>`).join("")}</nav>`;
  },
};

const lucideCache = {};
async function lucide(name) {
  if (lucideCache[name]) return lucideCache[name];
  const file = path.join(lucideDir, `${name}.mjs`);
  if (!fs.existsSync(file)) throw new Error("icona lucide mancante: " + name);
  const mod = await import(file);
  return (lucideCache[name] = mod.__iconNode.map(([tag, attrs]) =>
    `<${tag} ${Object.entries(attrs).filter(([k]) => k !== "key").map(([k, v]) => `${k}="${v}"`).join(" ")}/>`).join(""));
}

const tokens = fs.readFileSync(path.join(dir, "tokens.css"), "utf8");
const app = fs.readFileSync(path.join(dir, "app.css"), "utf8");
const pages = ["elementi.src.html", "ricetta.src.html"];
if (fs.existsSync(path.join(dir, "schermate"))) {
  for (const f of fs.readdirSync(path.join(dir, "schermate"))) if (f.endsWith(".src.html")) pages.push(`schermate/${f}`);
}
let total = 0;
for (const page of pages) {
  let html = fs.readFileSync(path.join(dir, page), "utf8").replace("/*TOKENS*/", tokens).replace("/*APP*/", app);
  html = html.replace(/\{\{(rail|tabs|pass|mini|subnav)(?::([a-z]+))?\}\}/g, (_, m, v) => MACROS[m](v));
  html = html.replaceAll("{{logo}}", LOGO);
  const jobs = [...html.matchAll(/\{\{(s:)?(?:(l|c):)?([a-z0-9-]+)\}\}/g)];
  for (const [all, small, kind = "l", name] of jobs) {
    let inner;
    if (kind === "c") { inner = CUSTOM[name]; if (!inner) throw new Error("icona del progetto mancante: " + name); }
    else inner = await lucide(name);
    html = html.replace(all, `<svg class="i${small ? " s" : ""}" viewBox="0 0 24 24">${inner}</svg>`);
  }
  fs.writeFileSync(path.join(dir, page.replace(".src.html", ".html")), html);
  total += jobs.length;
}
console.log("ok", pages.length, "pagine,", total, "icone");
