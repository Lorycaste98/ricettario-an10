# Design · Ricettario AN10

> **Stato: in costruzione** (restyle avviato il 16/11/2026, branch `feat/restyle-frontend`).
> Questo file registra le **decisioni di design prese**: chi aggiunge una funzione deve seguirle, non reinventarle.
> Riferimenti visivi: `docs/design/struttura-ipad-iphone.png`, `docs/design/struttura-pc.png` (struttura scelta, «1A») `docs/design/elementi.html` (tavola degli elementi con i codici; foto in `elementi-iphone.png`, `elementi-ipad.png`, `elementi-pc.png`) e `docs/design/ricetta.html` (prototipo del layout fluido; foto `ricetta-*.png`). I due HTML si rigenerano da `*.src.html` con `node docs/design/build-elementi.mjs`.
> Contesto prodotto (utenti, scopo, principi): `PRODUCT.md`.

## Come usare i codici

Ogni elemento della tavola ha un codice (`3.2`, `8.7`…). Nelle richieste di modifica, nei commit e nei commenti del codice si cita il codice: «8.7 passo corrente». Quando un elemento cambia, si aggiornano **insieme** la tavola, questo file e il componente.

## Decisioni prese

### D1 · Struttura «Pass» (scelta del proprietario, 16/11/2026)
- **iPad / PC:** barra laterale di navigazione a sinistra (9.1); in alto la **fila delle ricette in corso** (8.4) sempre visibile mentre si cucina; sotto, la pagina. Ricetta = **ingredienti e procedura affiancati** (colonna ingredienti a sinistra, procedura a destra), il passo corrente (8.7) è una scheda evidenziata dentro la procedura.
- **iPhone:** barra in basso (9.2), mini-barra «Sto cucinando» (9.3) sopra la barra quando c'è qualcosa sul fuoco, ricetta divisa in **Ingredienti / Procedura** con le schede a segmenti (4.10).
- **PC = iPad con più spazio:** stesse zone, colonne più larghe, eventuale terza colonna (foto, voto, recensioni). Mai un layout diverso per il PC.
- **Layout fluido, non per dispositivo** (16/11/2026). C'è un solo punto di rottura legato allo schermo, per la **navigazione**: sotto i 700px barra in basso (9.2), sopra barra laterale (9.1). Tutto il resto decide in base allo **spazio del proprio contenitore** (container query di CSS):
  - pagina sotto i 620px: ingredienti e procedura in due schede (4.10); la fila «in corso» diventa la mini-barra (9.3);
  - pagina dai 620px in su: ingredienti e procedura affiancati, colonne con larghezze elastiche (`clamp`). Comprende **iPad in verticale** (`ricetta-ipad-verticale.png`);
  - pagina dai 1000px in su: terza colonna con foto, voto e recensioni (iPad in orizzontale, PC).

### D2 · Colori: il blu del logo in tre toni (variante 1A)
I colori si scrivono in **OKLCH** (stessi colori dei mockup, solo convertiti). I blu sono una **scala con la stessa tinta (228°)** in cui cambia solo la chiarezza (`--blu-950` … `--blu-50`, elemento 1.14): un tono intermedio si ottiene cambiando la prima cifra, e i toni con la stessa chiarezza hanno lo stesso contrasto. I valori esatti sono nel blocco `:root` di `docs/design/elementi.src.html`, da cui nasceranno i token di `app/globals.css`.

Il blu `#0A7EA4` del logo (`oklch(55.5% 0.107 228.5)`) è il colore principale, usato in **tre toni con ruoli fissi**:

| Tono | Codice | Ruolo | Non usarlo per |
|---|---|---|---|
| Blu scuro `#0B4F68` | 1.2 | cornice: navigazione, testate di gruppo (menù 8.5), chip filtro attivo | testo lungo su bianco |
| Blu del logo `#0A7EA4` | 1.3 | ciò che è **vivo**: fila «in corso», mini-barra, focus dei campi, link | sfondi grandi di pagina |
| Azzurri chiari `#E3F1F7` / `#D2E8F1` | 1.5 | zone e colonne (ingredienti, colonne laterali PC), ricerca, segmenti | testo |
| Bianco | 1.7 | schede **dove si legge** (passo, schede ricetta, finestre) | — |

**Colori di area** (16/11/2026, elemento 13.2): ricette = blu del logo, menù = prugna, ingredienti = oliva, categorie e tag = ocra (`--area-*` in `tokens.css`). Servono solo a riconoscere un'area: bordo superiore e icona delle scorciatoie, icone della dashboard e della sotto-navigazione di Gestione, filo laterale delle schede menù. **Mai** come sfondo pieno e mai per indicare uno stato.

Colori secondari, ereditati dallo stile originale, con un **solo significato ciascuno**:
- **Arancio** `#E8590C` (1.9) = l'azione principale della schermata e le quantità. Una sola azione arancio per zona.
- **Giallo** `#FFF3BF`/`#FFD43B` (1.10) = tempo: timer, attese. Su fondo chiaro il numero del timer è **ambra** `#9A5B00` (1.11).
- **Verde** `#2F7D4F` (1.12) = fatto / comprato / pronto.
- **Rosa** `#C2255C` (1.13) = elimina, errori, timer finiti.

Sfondo di pagina **pieno** `#F4F9FB` (1.6): niente più gradiente fisso (vedi problema di contrasto in `CLAUDE.md`), niente vetro/trasparenze per le schede con testo.

### D3 · Tipografia
- Font di sistema (`-apple-system`, SF Pro su iPhone/iPad). Courier solo nel marchio «AN10» (2.9).
- Ricette senza foto: al posto della foto il **logo AN10** su azzurro tinta (8.2), anche nelle miniature delle tabelle.
- Scala: 28 titolo pagina (2.1) · 20 titolo sezione (2.2) · 12 maiuscolo spaziato per le etichette di colonna (2.3) · **20 per il passo corrente** (2.4, leggibile a un braccio) · 16 testo (2.5) · 13 dettagli (2.6).
- Numeri che cambiano o si confrontano (timer, quantità, voti) con **cifre allineate** (`tabular-nums`).
- Gerarchia con peso e tinta (grigio-blu 1.8), **mai con l'opacità** del testo.

### D4 · Misure e tocco
- Le misure sono **fluide** e in **rem**: crescono con lo spazio disponibile, da 390px (iPhone) a 1440px (PC), con `clamp(min rem, rem + quota di larghezza, max rem)`, e seguono anche la dimensione del testo scelta dall'utente. **Dentro i componenti** padding, spazi e icone sono in **em**, così seguono il testo del componente; bordi, linee sottili e ombre restano in px. Token in `docs/design/tokens.css`. Valori di partenza: campi 34→40px (4.x, **sottili**), bottoni 38→44 (3.2–3.9), bottone di cucina 44→54 (3.1), bottoni piccoli 30→34, titolo pagina 22→30, passo corrente 17→22, timer 26→36. Al telefono il dito ha comunque un'area utile di almeno 44px: si allarga l'area toccabile, non il disegno.
- Angoli: 12px controlli, 14–16px schede, 20px finestre, pill per chip ed etichette.
- Campi a 16px su iPhone/iPad (niente zoom al focus); padding interno ridotto (9→12px).
- **Due interruttori diversi per due cose diverse**: la visibilità «pronta / non pronta» di ricette e menù è sempre l'**occhio** (4.8, con o senza testo), ovunque compaia (form 11.1, testata 9.5, tabella 12.1). L'interruttore a levetta (4.13) resta solo per le **impostazioni** (schermo acceso, sezioni negli ingredienti, ingrediente nelle statistiche 12.2).

### D5 · Icone
- Azioni generiche: **lucide** (5.1–5.18).
- Concetti del ricettario: **icone fatte apposta** (5.19–5.27: sto cucinando, tipi di passo, menù, spesa, dosi, posate AN10, veloce), disegnate sulla **stessa griglia 24 e tratto 2 con estremi tondi** di lucide, così si mescolano. Vivranno in `components/icons/` come componenti con la stessa interfaccia di lucide (`size`, `className`, `strokeWidth`).
- Un concetto = una sola icona in tutta l'app (es. «Menù» è sempre la cloche 5.23).

### D6 · Elementi gemelli
Stessa funzione → stesso componente, in ricette, menù e admin (principio 3 di `PRODUCT.md`):
- un solo bottone (3.x), un solo campo (4.x), una sola etichetta (6.x) per tipo;
- tipi di passo sempre con 6.1 (azzurro preparazione, arancio chiaro cottura, giallo attesa);
- spunte (4.9) uguali per ingredienti, lista spesa e passi;
- voto sempre 4.12 in inserimento, 6.2 (ospiti, oro) e 6.3 (mio, indaco) in lettura;
- conferme distruttive sempre con 10.1.

### D7 · Admin
- **Stessi componenti della parte pubblica, cornice diversa** (16/11/2026): nell'area Gestione la barra laterale passa dal blu scuro all'**inchiostro-indaco** (`--adm-900`) e i fondi si raffreddano (`--adm-50/100/150`); accanto al titolo c'è l'etichetta «admin». Bottoni, campi, tabelle, colori di stato e azione arancio restano identici.
- **Creare è separato dal consultare**, come nella dashboard di produzione: in cima il gruppo **«Crea»** (Nuova ricetta, Nuovo menù, Importa ricette), con schede-azione che hanno il **+ arancio**; sotto **«Consulta e gestisci»** (Ricette, Menù, Ingredienti, Categorie e tag, Recensioni, Utenti), con tessere-numero e freccia, senza +. Nella colonna di navigazione le creazioni stanno sopra, come bottoni, separate da una linea.
Gestione ha una **sotto-navigazione** a colonna (Panoramica, Contenuti, Persone, Strumenti) quando lo spazio della pagina supera i 900px; su iPhone diventa una lista con «torna a Gestione». Schermate prototipo in `docs/design/schermate/` (libreria, menù, dashboard, gestione ricette, catalogo ingredienti, form ricetta; foto `*-iphone.png` e `*-ipad.png`).
L'admin usa gli stessi elementi del resto dell'app più quelli delle sezioni 11–13 della tavola: form di ricetta e menù (11.x), gestione di ricette, ingredienti, categorie, utenti, recensioni e import (12.x), dashboard, costi, link recensioni e timeline di cucina (13.x). Le azioni di riga sono icone piccole (3.12); le azioni su più righe selezionate vanno in una barra scura (12.3).

### D8 · Logo (16/11/2026, scelto dal proprietario)
«AN10» con il tratto unico tondo delle icone; ogni lettera nasconde un oggetto: **A** = mattarello, **N** = forchetta, **1** = coltello (manico tondo, lama incavata), **0** = uovo con il pallino. Il simbolo da solo è «10». Sempre a un colore (blu del logo, blu notte, bianco o nero). File in `public/brand/`, componente `components/brand/An10Logo.tsx` (colore = `currentColor`), guida d'uso in `docs/design/loghi/kit/GUIDA.md`, tavola `docs/design/loghi/kit/suite.png`, animazione `docs/design/loghi/kit/logo-animato.html`. Le esplorazioni scartate sono in `docs/design/loghi/concetti/` (giri 1-7).

## Da decidere / da completare
- Elenco delle schermate e dei flussi (piano d'azione e TODO del restyle).
- Token in `app/globals.css` (`@theme` di Tailwind v4) con i nomi della tabella D2.
- Movimento e transizioni.
- A fine restyle questo file viene rigenerato dal codice rilasciato (Impeccable `document`), mantenendo le decisioni sopra.
