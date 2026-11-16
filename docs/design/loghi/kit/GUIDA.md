# AN10 · guida d'uso del logo

## 1. Il logo
- **Idea:** «AN10» scritto con un tratto unico e tondo, in cui ogni lettera nasconde un oggetto della cucina: la **A** ha un **mattarello** come traversa, la **N** finisce nei rebbi di una **forchetta**, l'**1** è un **coltello** (manico con la testa tonda e i rivetti, lama sulla stessa linea con il fondo incavato), lo **0** è un **uovo** con il pallino al centro.
- **Regola d'oro:** da fermo si legge sempre AN10; gli oggetti si scoprono guardando meglio. Il simbolo da solo si legge «10».
- **Versioni:**
  - **orizzontale**: versione principale, per intestazioni, PDF e pagina di accesso;
  - **impilata** (AN sopra, 10 sotto): per spazi quadrati e per la stampa;
  - **simbolo «10»**: icone, avatar, timbro;
  - **simbolo per misure piccole**: tratto più spesso, senza rivetti, solo per favicon e icone sotto i 48px.

## 2. File (`public/brand/`)
| File | Uso |
|---|---|
| `an10-orizzontale-{blu,scuro,bianco,nero}.svg` | logo completo |
| `an10-impilato-{blu,scuro,bianco,nero}.svg` | logo impilato |
| `an10-simbolo-{blu,scuro,bianco,nero}.svg` | solo «10» |
| `an10-simbolo-piccolo-{blu,bianco}.svg` | «10» semplificato per le misure piccole |
| `an10-icona-app.svg` | tessera blu con il «10» bianco |
| `favicon.svg` | favicon vettoriale (tessera blu, versione piccola) |
| `web/` | `favicon.ico` (16/32/48), `favicon-16/32/48.png`, `apple-touch-icon.png` (180), `icon-192.png`, `icon-512.png`, `maskable-512.png`, `site.webmanifest`, `head-snippet.html` |

Nel codice si usa il componente **`<An10Logo variant="orizzontale|impilato|simbolo" />`** (`components/brand/An10Logo.tsx`): prende il colore del testo (`text-…`), quindi un solo componente vale per tutti i fondi.

Tutti i file si rigenerano da `docs/design/loghi/kit/build_kit.py`, poi `build_board.py` (tavola di controllo) e `build_anim.py` (animazione). Le icone web si generano con lo script della skill `logo-design` (`export_variants.py --web-icons`).

## 3. Spazio di rispetto
Intorno al logo va lasciato libero, su tutti i lati, almeno **un diametro dell'uovo** (lo «0»). È una misura proporzionale e cresce con il logo, non una distanza fissa.

## 4. Misure minime
| Versione | Schermo | Stampa |
|---|---|---|
| Orizzontale | 96px di larghezza | 25mm di larghezza |
| Impilata | 48px di larghezza | 14mm |
| Simbolo «10» | 32px; sotto si usa la versione piccola | 8mm |
| Simbolo piccolo | 16px | 5mm |

## 5. Colori
| Nome | HEX | OKLCH | Uso |
|---|---|---|---|
| Blu del logo | `#0A7EA4` | `oklch(55.5% 0.107 228.5)` | versione principale, tessera dell'icona |
| Blu notte | `#0B2530` | `oklch(25% 0.038 228)` | testo e fondi scuri |
| Bianco | `#FFFFFF` | — | su blu, su fondi scuri e su foto |
| Nero | `#000000` | — | stampa a un colore, fotocopie, timbri |

**Abbinamenti consentiti:**
- blu su bianco;
- blu notte su bianco o su azzurro chiaro;
- bianco su blu, su blu notte o su una zona calma di una foto;
- nero su bianco.

Il logo è sempre **a un solo colore**: niente oggetti colorati diversamente dalle lettere.

## 6. Da non fare
- deformare, ruotare, inclinare;
- cambiare lo spessore del tratto o ridisegnare le lettere con un carattere qualsiasi;
- colorare gli oggetti in modo diverso dalle lettere;
- aggiungere ombre, contorni o sfumature;
- spostare le parti (per esempio l'1 staccato dallo 0);
- usare la versione con i rivetti sotto i 32px;
- appoggiarlo su fondi pieni di dettagli senza la tessera.

## 7. Animazione
`logo-animato.html`, circa 1,7 secondi:
1. si disegnano le gambe della A e la N;
2. il mattarello arriva da sinistra;
3. i rebbi della forchetta scendono;
4. lama e manico del coltello si incastrano;
5. l'uovo cade con un piccolo rimbalzo;
6. compare il pallino.

Con «riduci movimento» attivo si vede direttamente il logo fermo. È da usare solo in momenti speciali (avvio dell'app, pagina di accesso), mai in loop.

## 8. Note tecniche
- I tre ritagli (stacco del mattarello, incavo della lama, rivetti) sono **maschere SVG**: sullo schermo restano trasparenti su qualunque fondo. Per la stampa professionale o il taglio a plotter vanno fatti espandere (tratti e maschere in tracciati) in un editor vettoriale.
- Il logo è stato disegnato in proprio, senza caratteri tipografici esterni, quindi non ci sono licenze di font da gestire. Prima di registrarlo come marchio serve una ricerca di anteriorità fatta da un professionista.
