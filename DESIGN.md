---
name: Ricettario AN10
description: Il ricettario personale del cuoco, da usare in cucina su iPhone e iPad.
colors:
  blu-notte: "oklch(25% 0.038 228)"
  blu-cornice: "oklch(40% 0.075 228)"
  blu-medio: "oklch(52% 0.091 228)"
  blu-logo: "oklch(55.5% 0.107 228.5)"
  blu-vivo-chiaro: "oklch(83.5% 0.062 222)"
  bordo-forte: "oklch(78.8% 0.041 226)"
  bordo-campo: "oklch(86% 0.028 226)"
  bordo-scheda: "oklch(91% 0.021 224)"
  azzurro-segmento: "oklch(91.7% 0.026 224)"
  azzurro-zona: "oklch(95% 0.017 225)"
  fondo-pagina: "oklch(98% 0.006 224)"
  bianco: "#ffffff"
  grigio-testo: "oklch(51% 0.038 226)"
  grigio-chiaro: "oklch(65% 0.034 225)"
  testo-su-cornice: "oklch(92.3% 0.027 221)"
  testo-tenue-su-cornice: "oklch(80% 0.05 223)"
  arancio-azione: "oklch(64.4% 0.192 41.7)"
  arancio-pieno: "oklch(59% 0.19 41.7)"
  arancio-scuro: "oklch(54% 0.172 41.6)"
  arancio-velo: "oklch(96.7% 0.019 55)"
  giallo-tempo: "oklch(96.1% 0.068 96.6)"
  giallo-allarme: "oklch(88.3% 0.165 92)"
  giallo-inchiostro: "oklch(49% 0.1 85)"
  ambra-timer: "oklch(53.1% 0.119 65)"
  verde-fatto: "oklch(49% 0.106 154)"
  verde-velo: "oklch(94% 0.04 154)"
  rosa-errore: "oklch(53.9% 0.193 6.5)"
  rosa-velo: "oklch(95% 0.03 6)"
  oro-ospiti: "oklch(95% 0.07 95)"
  indaco-mio: "oklch(45% 0.15 270)"
  indaco-mio-velo: "oklch(93.5% 0.03 270)"
  area-ricette: "oklch(55.5% 0.107 228.5)"
  area-menu: "oklch(52% 0.13 330)"
  area-ingredienti: "oklch(55% 0.11 135)"
  area-vocabolario: "oklch(58% 0.12 70)"
  gestione-cornice: "oklch(27% 0.05 255)"
  gestione-fondo: "oklch(97.5% 0.007 255)"
typography:
  titolo-pagina:
    fontFamily: "-apple-system, SF Pro Text, system-ui, Segoe UI, Roboto, sans-serif"
    fontSize: "clamp(1.375rem, calc(1.375rem + 8 * var(--f)), 1.875rem)"
    fontWeight: 700
    lineHeight: 1.15
  titolo-sezione:
    fontFamily: "-apple-system, SF Pro Text, system-ui, Segoe UI, Roboto, sans-serif"
    fontSize: "clamp(1.0625rem, calc(1.0625rem + 3 * var(--f)), 1.25rem)"
    fontWeight: 700
    lineHeight: 1.2
  passo-corrente:
    fontFamily: "-apple-system, SF Pro Text, system-ui, Segoe UI, Roboto, sans-serif"
    fontSize: "clamp(1.0625rem, calc(1.0625rem + 5 * var(--f)), 1.375rem)"
    fontWeight: 500
    lineHeight: 1.35
  testo:
    fontFamily: "-apple-system, SF Pro Text, system-ui, Segoe UI, Roboto, sans-serif"
    fontSize: "clamp(0.9375rem, calc(0.9375rem + 1 * var(--f)), 1rem)"
    fontWeight: 400
    lineHeight: 1.4
  dettagli:
    fontFamily: "-apple-system, SF Pro Text, system-ui, Segoe UI, Roboto, sans-serif"
    fontSize: "clamp(0.75rem, calc(0.75rem + 1 * var(--f)), 0.8125rem)"
    fontWeight: 400
    lineHeight: 1.35
  etichetta-colonna:
    fontFamily: "-apple-system, SF Pro Text, system-ui, Segoe UI, Roboto, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    letterSpacing: "0.06em"
  timer:
    fontFamily: "-apple-system, SF Pro Text, system-ui, Segoe UI, Roboto, sans-serif"
    fontSize: "clamp(1.625rem, calc(1.625rem + 10 * var(--f)), 2.25rem)"
    fontWeight: 800
    fontFeature: "tnum"
rounded:
  riga: "0.5625rem"
  campo: "0.625rem"
  controllo: "0.75rem"
  scheda: "1rem"
  finestra: "1.25rem"
  pill: "9999px"
spacing:
  gap: "clamp(0.75rem, calc(0.75rem + 10 * var(--f)), 1.375rem)"
  pad: "clamp(0.875rem, calc(0.875rem + 10 * var(--f)), 1.5rem)"
  altezza-campo: "clamp(2.125rem, calc(2.125rem + 6 * var(--f)), 2.5rem)"
  altezza-bottone: "clamp(2.375rem, calc(2.375rem + 6 * var(--f)), 2.75rem)"
  altezza-bottone-cucina: "clamp(2.75rem, calc(2.75rem + 10 * var(--f)), 3.375rem)"
  altezza-piccolo: "clamp(1.875rem, calc(1.875rem + 4 * var(--f)), 2.125rem)"
  azione-riga: "1.875rem"
  bersaglio-tocco: "44px"
components:
  button-primary:
    backgroundColor: "{colors.arancio-pieno}"
    textColor: "{colors.bianco}"
    rounded: "{rounded.controllo}"
    height: "{spacing.altezza-bottone}"
    padding: "0 1.05em"
  button-primary-hover:
    backgroundColor: "{colors.arancio-scuro}"
  button-secondary:
    backgroundColor: "{colors.bianco}"
    textColor: "{colors.blu-notte}"
    rounded: "{rounded.controllo}"
    height: "{spacing.altezza-bottone}"
  button-tonal:
    backgroundColor: "{colors.azzurro-segmento}"
    textColor: "{colors.blu-cornice}"
    rounded: "{rounded.controllo}"
    height: "{spacing.altezza-bottone}"
  button-ghost:
    textColor: "{colors.blu-medio}"
    rounded: "{rounded.controllo}"
  button-danger:
    backgroundColor: "{colors.bianco}"
    textColor: "{colors.rosa-errore}"
    rounded: "{rounded.controllo}"
  button-cucina:
    backgroundColor: "{colors.arancio-pieno}"
    textColor: "{colors.bianco}"
    rounded: "{rounded.controllo}"
    height: "{spacing.altezza-bottone-cucina}"
  icon-button-riga:
    backgroundColor: "{colors.bianco}"
    textColor: "{colors.blu-cornice}"
    rounded: "{rounded.riga}"
    size: "{spacing.azione-riga}"
  input:
    backgroundColor: "{colors.bianco}"
    textColor: "{colors.blu-notte}"
    rounded: "{rounded.campo}"
    height: "{spacing.altezza-campo}"
    padding: "0 0.6em"
  search-field:
    backgroundColor: "{colors.azzurro-zona}"
    textColor: "{colors.blu-notte}"
    rounded: "{rounded.campo}"
    height: "{spacing.altezza-campo}"
  chip:
    backgroundColor: "{colors.bianco}"
    textColor: "{colors.blu-notte}"
    rounded: "{rounded.pill}"
    height: "{spacing.altezza-piccolo}"
  chip-active:
    backgroundColor: "{colors.blu-cornice}"
    textColor: "{colors.bianco}"
  card:
    backgroundColor: "{colors.bianco}"
    rounded: "{rounded.scheda}"
    padding: "{spacing.pad}"
  passo-corrente:
    backgroundColor: "{colors.bianco}"
    textColor: "{colors.blu-notte}"
    typography: "{typography.passo-corrente}"
    rounded: "{rounded.scheda}"
  dialog:
    backgroundColor: "{colors.bianco}"
    rounded: "{rounded.finestra}"
  nav-rail:
    backgroundColor: "{colors.blu-cornice}"
    textColor: "{colors.testo-su-cornice}"
  nav-rail-gestione:
    backgroundColor: "{colors.gestione-cornice}"
    textColor: "{colors.testo-su-cornice}"
  tag-tempo:
    backgroundColor: "{colors.giallo-tempo}"
    textColor: "{colors.giallo-inchiostro}"
    rounded: "{rounded.pill}"
  tag-voto-ospiti:
    backgroundColor: "{colors.oro-ospiti}"
    textColor: "{colors.giallo-inchiostro}"
    rounded: "{rounded.pill}"
  tag-mio-voto:
    backgroundColor: "{colors.indaco-mio-velo}"
    textColor: "{colors.indaco-mio}"
    rounded: "{rounded.pill}"
---

# Design System: Ricettario AN10

> **Stato:** nuovo stile completo su tutte le pagine (restyle fasi 1–8, branch `feat/restyle-frontend`); in attesa delle prove del proprietario (fase 9) prima del rilascio. Aggiornato il 20/11/2026 dal codice, tenendo le decisioni D1–D8.
> Questo file registra le **decisioni di design prese**: chi aggiunge una funzione deve seguirle, non reinventarle. Token in testa (macchina), spiegazioni sotto (persone).
> Fonti: token `app/design-tokens.css` · componenti `components/ds/` (uno per elemento della tavola) · icone `components/icons/` · logo `components/brand/`. Riferimenti visivi: tavola `docs/design/elementi.html` (foto `elementi-*.png`), struttura `docs/design/struttura-*.png`, prototipi `docs/design/ricetta.html` e `docs/design/schermate/`. Contesto prodotto: `PRODUCT.md`.

## Overview

**Creative North Star: «Il Pass»**

Il pass è il bancone della cucina di un ristorante, da dove passano i piatti pronti: un posto ordinato, a portata di braccio, dove si vede subito cosa è in corso e cosa viene dopo. Il ricettario è costruito così. Una cornice blu fissa (navigazione e fila «Sto cucinando»), fogli bianchi dove si legge, zone azzurre dove si raggruppa, e pochi colori accesi che hanno sempre lo stesso significato. È uno strumento da usare con le mani occupate, non una rivista: la precisione e la calma contano più dell'effetto.

Densità media, tutto toccabile con un dito, misure che crescono con lo schermo invece di cambiare disposizione. Il PC è un iPad con più spazio. Niente vetro, niente gradienti, niente testo con opacità: il vecchio stile (gradiente fisso e schede semitrasparenti) è stato scartato proprio perché il contrasto cambiava scorrendo.

**Key Characteristics:**
- Il blu del logo `#0A7EA4` in tre toni con ruoli fissi (cornice, vivo, zone) e una scala di blu sulla stessa tinta.
- Quattro colori secondari, ognuno con **un solo significato**: arancio = azione e quantità, giallo = tempo, verde = fatto, rosa = elimina/errore.
- Font di sistema, cifre allineate per tutto ciò che si conta.
- Layout fluido a container query; un solo punto di rottura legato allo schermo (navigazione a 700px).
- Ogni elemento ha un **codice** della tavola (`3.2`, `8.7`…) e un solo componente.

### Come usare i codici

Ogni elemento della tavola ha un codice (`3.2`, `8.7`…). Nelle richieste di modifica, nei commit e nei commenti del codice si cita il codice: «8.7 passo corrente». Quando un elemento cambia, si aggiornano **insieme** la tavola, questo file e il componente.

## Colors

Una palette fredda costruita sul blu del logo, con accenti caldi rari e parlanti.

### Primary
- **Blu del logo** (`oklch(55.5% 0.107 228.5)`, `#0A7EA4`): ciò che è vivo. Fila e mini-barra «Sto cucinando», focus dei campi, contorno di focus da tastiera, colore di area delle ricette.
- **Blu cornice** (`oklch(40% 0.075 228)`): navigazione, fascia sotto la barra di stato, testate di gruppo, chip filtro attivo, fascia della vetrina, scheda «prossimo menù».
- **Blu notte** (`oklch(25% 0.038 228)`): testo principale e fondi scurissimi (overlay delle finestre).

### Secondary
- **Arancio azione** (`oklch(64.4% 0.192 41.7)`): le quantità (ingredienti, «Ti servono») e il bordo del passo corrente.
- **Arancio pieno** (`oklch(59% 0.19 41.7)`): il fondo dell'unica azione principale della zona (bottone primario, «Fatto», voce attiva della navigazione), con testo bianco. Hover `arancio-scuro`.

### Tertiary
- **Giallo tempo** (`oklch(96.1% 0.068 96.6)`) con **inchiostro** (`oklch(49% 0.1 85)`): timer, attese, tag dei passi di attesa; **giallo allarme** (`oklch(88.3% 0.165 92)`) per il timer scaduto. Numeri del timer su fondo chiaro in **ambra** (`oklch(53.1% 0.119 65)`).
- **Verde fatto** (`oklch(49% 0.106 154)`): spunte, passi fatti, «pronta», comprato.
- **Rosa errore** (`oklch(53.9% 0.193 6.5)`): elimina, errori, sforamento delle quantità.
- **Oro ospiti** (`oklch(95% 0.07 95)`) e **indaco mio** (`oklch(45% 0.15 270)` su `oklch(93.5% 0.03 270)`): voto degli ospiti (6.2) e voto personale (6.3), da non confondere mai.

### Neutral
- **Fondo pagina** (`oklch(98% 0.006 224)`, blu-50): pieno, mai gradiente. In Gestione `oklch(97.5% 0.007 255)` (adm-50).
- **Bianco**: schede dove si legge, finestre, campi.
- **Azzurro zona** (`oklch(95% 0.017 225)`, blu-100) e **azzurro segmento** (`oklch(91.7% 0.026 224)`, blu-120): colonne, zone, ricerca, segmenti, bottone tonale.
- **Bordi**: scheda `blu-150`, campo `blu-200`, maniglie e spunte vuote `blu-250`.
- **Grigio testo** (`oklch(51% 0.038 226)`): testo secondario e dettagli (≥ 4.9:1 su ogni fondo chiaro). **Grigio chiaro** solo per segnaposto e disattivi.

### Named Rules
**La regola del significato unico.** Ogni colore secondario dice una cosa sola, in tutta l'app. Un giallo che non parla di tempo, o un rosa che non è un errore o un'eliminazione, è un bug.

**La regola della zona arancio.** In ogni zona c'è al massimo un'azione arancio. Le altre azioni sono secondarie, tonali o testuali (es. «Inizia a cucinare» è tonale accanto al «Fatto» del passo corrente).

**La regola dei colori di area.** Prugna, oliva, ocra e il blu del logo servono solo a riconoscere un'area (filo laterale, bordo superiore, icona). Mai come fondo pieno, mai per uno stato.

## Typography

**Font:** di sistema (`-apple-system`, SF Pro su iPhone/iPad, `system-ui` altrove), l'unico dell'app.

**Character:** un solo carattere, neutro e leggibilissimo: la personalità la danno il logo, le icone e il colore, non i font.

### Hierarchy
- **Titolo pagina** (700, 22→30px fluido, 1.15): testate di pagina (9.5) e nome della ricetta.
- **Titolo sezione** (700, 17→20px, 1.2): titoli delle schede (`Panel`, `FormCard`).
- **Passo corrente** (500, 17→22px, 1.35): il testo del passo che si sta facendo (8.7), leggibile a un braccio di distanza.
- **Testo** (400, 15→16px, 1.4): tutto il resto. I campi restano a 16px su touch (niente zoom di iOS).
- **Dettagli** (400, 12→13px): righe di dettaglio (2.6) sotto titoli e nomi.
- **Etichetta di colonna** (700, 12px, maiuscolo spaziato): intestazioni dei gruppi nelle liste e nella ricerca.
- **Timer** (800, 26→36px, cifre allineate).

### Named Rules
**La regola delle cifre allineate.** Timer, quantità, voti, contatori e prezzi usano sempre `tabular-nums` (classe `.tabular`).

**La regola della gerarchia senza opacità.** Si gerarchizza con peso e tinta (grigio-blu), mai con l'opacità del testo.

## Layout

Fluido a **container query**: `main` è un contenitore e le pagine decidono sullo spazio che hanno, non sul dispositivo. Un solo punto di rottura legato allo schermo, la navigazione: sotto i 700px barra in basso (9.2), sopra barra laterale (9.1). Soglie di contenitore ricorrenti: 480px (dettagli in riga), 620px (ingredienti e procedura affiancati, griglie a più colonne), 860px (form su due colonne), 900px (sotto-navigazione di Gestione), 1000px (terza colonna del dettaglio).

Spazi fluidi fra blocchi (`--gap` 12→22px) e dentro le schede (`--pad` 14→24px); dentro i componenti padding e icone in em. Margine laterale di pagina `--main-px` (16px, 24px da 640px), che a destra cresce sotto il notch dell'iPhone in orizzontale. La fascia blu in cima copre la barra di stato quando il sito è installato (barra di stato trasparente) e l'area del notch.

## Elevation & Depth

Piatto per scelta: la profondità la danno il tono (fondo `blu-50` → zone azzurre → schede bianche) e i bordi sottili `blu-150`, non le ombre. Le ombre compaiono solo su ciò che galleggia sopra la pagina.

### Shadow Vocabulary
- **Finestra** (`0 18px 50px oklch(25% 0.038 228 / .22)`): `Modal`, ricerca globale.
- **Elemento galleggiante** (`0 6px 18px oklch(25% 0.038 228 / .06–.18)`): barra 11.1 dei form, finto campo di ricerca della vetrina.
- **Controllo sopra un contenuto** (`0 4px 12px oklch(25% 0.038 228 / .14)`): frecce del carosello delle recensioni.
- **Segmento attivo** (`0 1px 2px oklch(25% 0.038 228 / .12)`).

### Named Rules
**La regola del foglio piatto.** Una scheda a riposo non ha ombra. Se sembra che serva un'ombra per staccare una scheda, manca un cambio di tono o un bordo.

## Shapes

Angoli morbidi ma non giocosi: 9px le azioni di riga, 10px i campi, 12px controlli e bottoni, 16px le schede, 20px le finestre, pill per chip, etichette, voto e bottoni tondi. Bordi da 1px; tratteggio per «aggiungi» e per «non pronta». Le icone di progetto sono disegnate sulla griglia di lucide (24, tratto 2, estremi tondi), così forme e icone parlano la stessa lingua.

## Components

Ogni componente vive una volta sola in `components/ds/` (o nella cartella della sua area) con il codice della tavola nel commento.

- **Bottoni (3.x)** `Button` / `IconButton`: primario arancio pieno, secondario bianco con bordo, tonale azzurro, testuale `blu-700`, elimina rosa; altezze 38→44px, «da cucina» 44→54px, piccoli 30→34px. Link con aspetto di bottone tramite `buttonClasses`.
- **Azioni di riga (3.12)** `IconButton size="row"` / `rowIconCls`: 30px a vista, 44px toccabili (`hit-44`).
- **Campi (4.x)** `Field` + `TextInput` / `TextArea` / `Select` / `SearchField` / `ReadonlyValue`: sottili (34→40px), bordo `blu-200`, focus con bordo e alone blu del logo; ricerca su fondo azzurro senza bordo.
- **Visibilità (4.8)** `VisibilityToggle`: sempre l'occhio; verde «pronta», tratteggiato grigio «non pronta».
- **Scelte** `Checkbox` (4.9, spunta verde), `Segmented` (4.10, frecce da tastiera), `Chip` (4.11, attivo blu cornice), `RatingInput` (4.12, il voto scelto in arancio), `Switch` (4.13, solo impostazioni).
- **Etichette (6.x)** `Tag` e derivati: tipo di passo, voto ospiti (oro), mio voto (indaco), non pronta, opzionale, veloce, dosi, sforamento. **6.11** `RatingMedal`: il voto ospiti come medaglia gialla col bordo bianco e una stella piena più scura dietro il numero, appoggiata sul bordo del piatto (8.1, 8.10).
- **Avanzamento (7.x)** `StepProgress`, `StepNumber`, `ProgressBar`, `TimerRing`, `Skeleton`.
- **Schede**: `Panel` (sezioni dei dettagli, `tone="note"` giallo), `RecipeCard` (8.1/8.2 «Piatto»: foto tonda come un piatto visto dall'alto sulla tovaglia `blu-100`, medaglia 6.11), `RecipeRow` (8.10 «Carta»: vista a lista come la carta di un ristorante, piatto piccolo, nome · puntini · pentola e cuore, righe senza scheda), `MenuCard` (8.5), `CurrentStep` (8.7, bordo arancio). Griglia o lista e card per riga le sceglie chi guarda (`CollectionView`); le card mostrano più dettagli quando sono larghe.
- **Cornice (9.x)** `NavRail`, `TabBar` (blu `blu-800` come la barra laterale, voce attiva su pastiglia arancio), `CookingRow`/`CookingMiniBar`, `BackLink`, `PageHeader` (`brand`: logo completo in cima alle pagine principali sul telefono).
- **Messaggi (10.x)** `Modal`/`ConfirmModal`, `Toast`, `EmptyState`, `Banner`, `TimerAlert`, `FormError` (con «Riprova»).
- **Gestione (11–13)** `FormParts` (barra 11.1, blocchi 11.2, righe 11.3/11.4), `ChipSearch`, `AdminTable`, dashboard, costi, timeline.

## Do's and Don'ts

**Da fare**
- Riusare il componente dell'elemento della tavola; se manca, crearlo una volta con il codice nel commento.
- Usare solo i token di `app/design-tokens.css`; misure fluide con le variabili `--h-*`, `--fs-*`, `--gap`, `--pad`.
- Decidere il layout sullo spazio del contenitore (`@min-[620px]:`), non sul dispositivo.
- Tenere i campi a 16px su touch e i bersagli a 44px (`hit-44` se il disegno è più piccolo).
- Dare a ogni stato vuoto un `EmptyState` e a ogni caricamento che può fallire un «Riprova».

**Da non fare**
- Niente gradienti, vetro, `backdrop-blur` o schede semitrasparenti con testo.
- Niente testo con opacità per fare gerarchia.
- Mai due azioni arancio nella stessa zona; mai un colore secondario fuori dal suo significato.
- Mai l'interruttore a levetta per la visibilità «pronta / non pronta» (è sempre l'occhio).
- Mai un layout diverso per il PC: è l'iPad con più spazio.
- Mai due icone per lo stesso concetto; mai il logo animato in loop.

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
I colori si scrivono in **OKLCH** (stessi colori dei mockup, solo convertiti). I blu sono una **scala con la stessa tinta (228°)** in cui cambia solo la chiarezza (`--blu-950` … `--blu-50`, elemento 1.14): un tono intermedio si ottiene cambiando la prima cifra, e i toni con la stessa chiarezza hanno lo stesso contrasto. I valori esatti sono i token di `app/design-tokens.css` (copia di riferimento in `docs/design/tokens.css`).

Il blu `#0A7EA4` del logo (`oklch(55.5% 0.107 228.5)`) è il colore principale, usato in **tre toni con ruoli fissi**:

| Tono | Codice | Ruolo | Non usarlo per |
|---|---|---|---|
| Blu scuro `#0B4F68` | 1.2 | cornice: navigazione, testate di gruppo (menù 8.5), chip filtro attivo | testo lungo su bianco |
| Blu del logo `#0A7EA4` | 1.3 | ciò che è **vivo**: fila «in corso», mini-barra, focus dei campi, link | sfondi grandi di pagina |
| Azzurri chiari `#E3F1F7` / `#D2E8F1` | 1.5 | zone e colonne (ingredienti, colonne laterali PC), ricerca, segmenti | testo |
| Bianco | 1.7 | schede **dove si legge** (passo, schede ricetta, finestre) | — |

**Colori di area** (16/11/2026, elemento 13.2): ricette = blu del logo, menù = prugna, ingredienti = oliva, categorie e tag = ocra (`--area-*` in `tokens.css`). Servono solo a riconoscere un'area: bordo superiore e icona delle scorciatoie, icone della dashboard e della sotto-navigazione di Gestione, filo laterale delle schede menù. **Mai** come sfondo pieno e mai per indicare uno stato.

Colori secondari, ereditati dallo stile originale, con un **solo significato ciascuno**:
- **Arancio** `#E8590C` (1.9) = l'azione principale della schermata e le quantità. Una sola azione arancio per zona. I **fondi** arancio con testo bianco (bottoni, voce attiva) usano l'`arancio-pieno` un po' più scuro (`oklch(59% 0.19 41.7)`, fase 8, contrasto 4.45:1); le quantità restano nell'arancio pieno di sempre.
- **Giallo** `#FFF3BF`/`#FFD43B` (1.10) = tempo: timer, attese. Su fondo chiaro il numero del timer è **ambra** `#9A5B00` (1.11).
- **Verde** (1.12, `oklch(49% 0.106 154)` dalla fase 8 per il contrasto su `verde-50`) = fatto / comprato / pronto.
- **Rosa** `#C2255C` (1.13) = elimina, errori, timer finiti.

Sfondo di pagina **pieno** `#F4F9FB` (1.6): niente più gradiente fisso (vedi problema di contrasto in `CLAUDE.md`), niente vetro/trasparenze per le schede con testo.

### D3 · Tipografia
- Font di sistema (`-apple-system`, SF Pro su iPhone/iPad). Il Courier del vecchio marchio «AN10» (2.9) è sparito con il logo nuovo (D8).
- Ricette senza foto: nelle card e nelle righe a lista il **«10» blu sul piatto bianco** (8.2, 8.10); nelle testate e nelle righe del dettaglio menù il logo bianco su `blu-800` (`NoPhoto`).
- Scala: 28 titolo pagina (2.1) · 20 titolo sezione (2.2) · 12 maiuscolo spaziato per le etichette di colonna (2.3) · **20 per il passo corrente** (2.4, leggibile a un braccio) · 16 testo (2.5) · 13 dettagli (2.6).
- Numeri che cambiano o si confrontano (timer, quantità, voti) con **cifre allineate** (`tabular-nums`).
- Gerarchia con peso e tinta (grigio-blu 1.8), **mai con l'opacità** del testo.

### D4 · Misure e tocco
- Le misure sono **fluide** e in **rem**: crescono con lo spazio disponibile, da 390px (iPhone) a 1440px (PC), con `clamp(min rem, rem + quota di larghezza, max rem)`, e seguono anche la dimensione del testo scelta dall'utente. **Dentro i componenti** padding, spazi e icone sono in **em**, così seguono il testo del componente; bordi, linee sottili e ombre restano in px. Token in `app/design-tokens.css`. Valori di partenza: campi 34→40px (4.x, **sottili**), bottoni 38→44 (3.2–3.9), bottone di cucina 44→54 (3.1), bottoni piccoli 30→34, titolo pagina 22→30, passo corrente 17→22, timer 26→36. Al telefono il dito ha comunque un'area utile di almeno 44px: si allarga l'area toccabile, non il disegno (classe `hit-44`, fase 8).
- Angoli: 12px controlli, 14–16px schede, 20px finestre, pill per chip ed etichette.
- Campi a 16px su iPhone/iPad (niente zoom al focus); padding interno ridotto (9→12px).
- **Due interruttori diversi per due cose diverse**: la visibilità «pronta / non pronta» di ricette e menù è sempre l'**occhio** (4.8, con o senza testo), ovunque compaia (form 11.1, testata 9.5, tabella 12.1). L'interruttore a levetta (4.13) resta solo per le **impostazioni** (schermo acceso, sezioni negli ingredienti, ingrediente nelle statistiche 12.2).

### D5 · Icone
- Azioni generiche: **lucide** (5.1–5.18).
- Concetti del ricettario: **icone fatte apposta** (5.19–5.27: sto cucinando, tipi di passo, menù, spesa, dosi, posate AN10, veloce), disegnate sulla **stessa griglia 24 e tratto 2 con estremi tondi** di lucide, così si mescolano. Vivono in `components/icons/` come componenti con la stessa interfaccia di lucide (`size`, `className`, `strokeWidth`).
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
«AN10» con il tratto unico tondo delle icone; ogni lettera nasconde un oggetto: **A** = mattarello, **N** = forchetta, **1** = coltello (manico tondo, lama incavata), **0** = uovo con il pallino. Il simbolo da solo è «10». Sempre a un colore (blu del logo, blu notte, bianco o nero). File in `public/brand/`, componente `components/brand/An10Logo.tsx` (colore = `currentColor`), guida d'uso in `docs/design/loghi/kit/GUIDA.md`, tavola `docs/design/loghi/kit/suite.png`, animazione `docs/design/loghi/kit/logo-animato.html` (nell'app `components/brand/An10LogoAnimated.tsx`, solo nella pagina di accesso, una volta, mai in loop). Le esplorazioni scartate sono in `docs/design/loghi/concetti/` (giri 1-7).

## Da decidere / da completare
- Movimento e transizioni: oggi solo micro-animazioni funzionali (pannelli a comparsa, timer, logo all'accesso), tutte con `prefers-reduced-motion`. Da rivedere nelle prove della fase 9.
- Schermate di avvio per iOS (`apple-touch-startup-image`): non fatte, all'apertura dell'app installata si vede un attimo il fondo bianco.
