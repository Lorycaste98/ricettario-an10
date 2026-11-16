# Restyle · piano d'azione e TODO

> Branch: `feat/restyle-frontend` · aggiornato al 16/11/2026
> Riferimenti: `DESIGN.md` (decisioni D1–D8), `PRODUCT.md`, tavola `docs/design/elementi-*.png` (codici elemento), prototipi `docs/design/ricetta.html` e `docs/design/schermate/`, token `docs/design/tokens.css`, logo `docs/design/loghi/kit/GUIDA.md`.
> Prima di toccare l'interfaccia: skill `ricettario-design`.

## Come lavoriamo
- **Un componente nuovo per ogni elemento della tavola**, creato una volta sola e citato con il suo codice in un commento (`// Elemento 8.7`). Le pagine si rifanno **solo con quei componenti**.
- **Una fase alla volta, un commit per blocco.** Alla fine di ogni fase: anteprima Vercel del branch e prova su **iPhone e iPad veri** (verticale e orizzontale), poi giro di correzioni.
- **Funzioni invariate:** cambiano aspetto e disposizione, non il comportamento. Niente modifiche a API, schema Prisma o logica (`lib/`), salvo dove indicato.
- Durante il lavoro alcune pagine avranno lo stile vecchio e altre il nuovo: è normale, siamo su un branch. Si unisce in `main` solo a fine fase 8.
- A ogni fase si aggiornano `CLAUDE.md` (in particolare la sezione «Classi base ricorrenti», che descrive lo stile vecchio) e `DESIGN.md`.

## Prima di iniziare (fase 0)
- [ ] Decidere cosa fare dell'anteprima dei passi successivi in «Sto cucinando» (`CookingDock.tsx`, oggi non committata su `main`): committarla su `main` o portarla nel restyle.
- [x] Commit dei documenti di design già pronti: `PRODUCT.md`, `DESIGN.md`, `docs/design/`, skill `ricettario-design`, `.gitignore`, `public/brand/`, `components/brand/An10Logo.tsx`.
- [x] Verificare su Vercel che le anteprime del branch funzionino: `an10recipes-git-feat-restyle-frontend-lorycaste98s-projects.vercel.app`. ⚠️ Usa il **database di produzione** (scelta del 16/11/2026): dall'anteprima, da admin, non eliminare né modificare dati veri.
- [x] Fare la foto di com'è oggi (screenshot già in `.playwright-mcp/before/`), per il confronto finale.

### Decisioni prese prima della fase 3
- [x] **Pagina iniziale** (deciso 16/11/2026): admin loggato → libreria ricette (`/` rimanda a `/ricette`); visitatori → vetrina, da rifare in fase 6.
- [x] **Ricerca globale** (deciso 16/11/2026): la vuoi, come overlay dalla vetrina → vedi **Fase 3B**, da approvare dopo la valutazione dei costi.
- [x] **Preferiti** (deciso 16/11/2026): restano voce di navigazione con il contatore.

---

## Fase 1 · Fondamenta (token, caratteri, icone, logo)
**Obiettivo:** tutto quello che le pagine useranno, pronto e controllato in una pagina di prova.

### Token e stile globale
- [x] Portare `docs/design/tokens.css` in `app/design-tokens.css` (importato da `globals.css`) come `@theme` di Tailwind v4 (colori OKLCH, scala dei blu, colori di area, cornice admin, misure fluide in rem).
- [ ] → *spostato alla fase 2*: **togliere** il gradiente fisso `.page-bg` e lo stile «vetro» (`backdrop-blur`, `bg-white/xx`); sfondo pieno `blu-50`. Rimandato perché molte pagine vecchie hanno testo bianco pensato per il gradiente: si toglie quando il guscio nuovo è pronto, e le pagine si sistemano una per una (oggi 66 file usano `backdrop-blur`/`bg-white/`).
- [x] Scala tipografica fluida (2.1–2.9), `tabular-nums` per timer, quantità e voti.
- [x] Mantenere la guardia anti-zoom iOS a 16px sui campi (vedi `CLAUDE.md`); verificare che i campi sottili (34→40px) la rispettino.
- [x] `prefers-reduced-motion`: ogni componente nuovo ha `motion-reduce:` sulle animazioni.

### Icone e logo
- [x] `components/icons/`: le 9 icone del progetto (5.19–5.27: pentola, tagliere, fornello, ciotola, cloche, sacchetto, piatto, posate, mestolo) come componenti con la stessa interfaccia di lucide (`size`, `className`, `strokeWidth`). Sorgente in `docs/design/build-elementi.mjs` (`CUSTOM`).
- [x] Aggiornare la regola «Icone: solo lucide-react» in `CLAUDE.md`.
- [x] Favicon, icona dell'app e manifest: usare i file di `public/brand/web/` tramite le convenzioni di Next (`app/icon.svg`, `app/apple-icon.png`, `app/favicon.ico`, manifest), sostituendo quelli attuali; `themeColor` = blu del logo.
- [ ] → *fasi 2, 3, 6*: sostituire il vecchio logo (`public/an10.webp` in `Navbar`, `RecipeCard`, home, dettaglio menù; `public/an10.svg`; immagine OG) con `<An10Logo>` / `public/brand/`, man mano che si rifanno quelle parti.

### Componenti base (tavola, sezioni 2–7 e 10)
- [x] `Button` (3.1–3.9) con le varianti primario, secondario, tonale, testo, elimina, disattivo, piccolo e grande da cucina.
- [x] `IconButton` (3.10–3.12), `Stepper` dosi (3.13).
- [x] `Field`, `Input`, `Textarea`, `Select`, `SearchField`, campo calcolato in sola lettura (4.1–4.7).
- [x] `VisibilityToggle` con l'occhio (4.8), che **sostituisce** `PublishSwitch` e i toggle «Visibile» di lista ricette admin, `RecipeAdminBar` e `MenuAdminBar`.
- [x] `Checkbox` (4.9), `Segmented` (4.10), `Chip` filtro (4.11), `RatingInput` 1-10 (4.12), `Switch` impostazioni (4.13).
- [x] `Tag` per tipo di passo, voto ospiti, mio voto, non pronta, opzionale, veloce, dosi, ruolo, sforamento (6.1–6.10); `Counter` (6.7). Sostituisce `Badge`, `PriceTag`, `QuickTag`, `ReviewStats`.
- [x] `StepProgress` (7.1), `StepNumber` (7.2), `ProgressBar` (7.3), `TimerRing` (7.4), `Skeleton` (7.5).
- [x] `Toast` (10.2), `EmptyState` (10.3), `Banner` (10.4), `TimerAlert` (10.5).
- [ ] → *fase 2*: `Modal` e `ConfirmModal` restyle (10.1), mantenendo il portale e la correzione per Safari/iPad (cambiarli ora cambierebbe tutte le finestre delle pagine vecchie).
- [x] Pagina di prova interna (solo in sviluppo) con tutti i componenti, da confrontare con `docs/design/elementi-*.png`.

**Fatto quando:** la pagina di prova coincide con la tavola su iPhone, iPad e PC; lint e `tsc` puliti.

> **Stato 16/11/2026:** fatta. Componenti in `components/ds/`, icone in `components/icons/`, token in `app/design-tokens.css`, pagina di prova `/prova-elementi` (in locale e sull'anteprima). Restano per le fasi successive: gradiente, `Modal`, vecchio logo nelle pagine.

---

## Fase 2 · Guscio dell'app e «Sto cucinando»
- [x] `body` con sfondo pieno e carattere di sistema (classe `.ds`), `themeColor` = blu scuro della cornice. Il gradiente `.page-bg` ora è **per pagina**: resta sulle pagine non ancora rifatte (lista `RESTYLED` in `AppShell`) e sparisce man mano.
- [x] Restyle di `Modal`/`ConfirmModal` (10.1).
- [x] `AppShell` nuovo: **barra laterale** (9.1) da 700px in su, **barra in basso** (9.2) sotto; safe area di iPhone e iPad; logo nella barra laterale.
- [x] Togliere `Navbar.tsx` (menu a hamburger e sottomenu Dashboard); le voci admin passano in «Gestione» (fase 5).
- [x] «Sto cucinando»: la **fila delle ricette in corso** (8.4) in cima alle pagine su iPad e PC e la **mini-barra** (9.3) su iPhone **sostituiscono** il bottone flottante di `CookingDock`. Il pannello con timer, Fatto/Indietro e anteprima dei passi resta, restilizzato. `lib/cooking-session.ts` non cambia.
- [x] `BackLink` (9.4) e testata di pagina con azioni (9.5).
- [x] Contenitore di pagina con container query (`container-type: inline-size`); punto di rottura unico a 700px solo per la navigazione.
- [x] `nav-history`: verificare che continui a funzionare con la nuova navigazione.

**Fatto quando:** si naviga in tutta l'app con la nuova cornice, e su iPhone la mini-barra non copre contenuti né la barra in basso.

> **Stato 16/11/2026:** fatta. `components/shell/` (navigazione, fila e mini-barra), `AppShell` nuovo, `Navbar` eliminata, `Modal` e `BackLink` restilizzati, `PageHeader` (9.5) in `components/ds`. Il pannello «Sto cucinando» ha solo la cornice nuova: le sue card si rifanno con il passo corrente (8.7) nella fase 3. Da verificare su iPhone e iPad veri (safe area, mini-barra) e da admin loggato (Gestione, Account).

---

## Fase 3 · Ricette
- [x] **Libreria** (`/ricette`, `RecipeGrid`, `RecipeCard`): ricerca, chip categoria, ordinamento, griglia elastica; card 8.1, card senza foto con il logo (8.2), non pronta offuscata; filtri su iPhone in un pannello dal basso. Filtri in sessionStorage invariati.
- [x] **Dettaglio ricetta** (`/ricette/[id]`, `RecipeProcedure`), come da prototipo `docs/design/ricetta.html`:
  - [x] testata con miniatura e azioni (occhio, Modifica, PDF, cuore);
  - [x] **ingredienti e procedura affiancati** da 620px in su, schede a segmenti sotto; terza colonna (foto, voto, recensioni) da 1000px in su;
  - [x] passo corrente 8.7 con timer e «Fatto» (3.1), passi fatti e futuri (7.2), «Ti servono», anteprima dei passi successivi;
  - [x] riproporzionamento: stepper delle dosi (3.13), quantità toccabili, banner 10.4;
  - [x] sezioni degli ingredienti, opzionali, quantità per passo;
  - [x] foto con `PhotoViewer` (non toccare le tre trappole descritte in `CLAUDE.md`);
  - [~] recensioni ospiti e «Il mio voto»: contenitori già nel nuovo stile (card bianche); l'interno (`ReviewBubble`, `ReviewCarousel`, voto 4.12 nel `PersonalRatingCard`) si rifinisce con la fase 8.
- [x] **Preferiti** (`/preferiti`) con la stessa griglia della libreria.
- [x] Tutti i `loading.tsx` della sezione con la nuova forma.

**Fatto quando:** con il prototipo affiancato, la ricetta si segue con le mani occupate su iPad in verticale e in orizzontale e su iPhone.

> **Stato 16/11/2026:** fatta. Libreria con chip e griglia elastica, card 8.1/8.2, dettaglio con testata 9.5 (azioni: occhio, Modifica, PDF, preferito, Elimina), ingredienti e procedura affiancati da 620px / a schede sotto, terza colonna da 1000px, passo corrente 8.7 con timer grande. `/` rimanda l'admin a `/ricette`. Il pannello «Sto cucinando» ha ancora le card interne vecchie (stessa forma da rifare con 8.7) → in fase 4 insieme alla modalità cucina, che usa gli stessi elementi.

---

## Fase 3B · Ricerca globale (prima versione fatta, da provare)
**Cosa:** nella vetrina un campo «Cerca» che apre un **overlay** (si intravede la vetrina sotto, bloccata) e cerca insieme **ricette, menù e ingredienti**. Per ricette e menù mostra un'**anteprima** della pagina; per gli ingredienti una **scheda statistica** (in quante ricette compare, in quali menù, quantità tipiche, quante volte cucinato).

**Valutazione dei costi (16/11/2026):**
- **Dati in gioco** (produzione): ~224 ricette, 6 menù, 1154 ingredienti a catalogo. Sono numeri piccoli: ogni ricerca è una manciata di query `contains` (come `/api/search`, che già cerca su nome, note, ingredienti e passi) che rispondono in pochi millisecondi.
- **Traffico per ricerca:** con un ritardo di ~250ms dopo l'ultima lettera e minimo 2 caratteri, una ricerca = 1 chiamata, risposta di ~5–15 KB (10 risultati per tipo, solo campi del riepilogo). Anche con 1000 ricerche al giorno sono ~15 MB/giorno, ~450 MB/mese: dentro i limiti gratuiti di Supabase (5 GB di traffico) e senza effetti sul piano Vercel.
- **Anteprime:** si caricano solo per il risultato scelto/evidenziato (dettaglio ricetta ~10–30 KB, già cachato lato server per le ricette pubblicate). Nessun costo se non si apre nulla.
- **Statistiche ingrediente:** una query di aggregazione per ingrediente scelto (conteggi su `Ingredient` per nome + `CookLog`), economica con questi volumi.
- **Alternativa ancora più leggera:** scaricare una volta un indice compatto (nomi di ricette/menù/ingredienti, ~100–200 KB, in cache) e cercare nel browser: zero chiamate per lettera, risultati istantanei anche offline; le anteprime restano a richiesta.
- **Visitatori:** la ricerca pubblica deve restare su ricette e menù **pubblicati**; le statistiche degli ingredienti vanno bene anche in pubblico (non espongono dati personali) ma va deciso.

**Scelte della prima versione (16/11/2026, «fai quello che consigli, poi valutiamo»):**
- [x] **Indice nel browser**: `GET /api/search/index` (`lib/search-index.ts`), scaricato alla prima apertura e tenuto per 5 minuti. Misurato in locale: 140 ricette + 6 menù = 57 KB, **~9 KB compresso**, una volta per visita. Visitatore: versione cachata a tag; admin: fresca con i non pronti.
- [x] **Statistiche ingredienti per tutti**, calcolate solo su ciò che chi guarda può vedere: ricette che lo usano (e % del ricettario), menù, distribuzione per categoria, «spesso insieme a» (esclusi gli ingredienti fuori statistica). Niente quantità tipiche né cotture: verranno dopo se servono.
- [x] **«Cerca» per tutti**: voce nella navigazione (barra laterale e barra in basso, anche admin), ⌘K / Ctrl+K e «/», campo nella vetrina attuale (da rimettere nella vetrina nuova in fase 6).
- [x] Overlay (`components/search/SearchOverlay.tsx`): ambiti Tutto/Ricette/Menù/Ingredienti, gruppi ordinati per pertinenza, anteprima affiancata da 760px (prima voce già aperta) e a tutto pannello su iPhone con «‹ Risultati»; dalle anteprime si salta fra ricetta → ingrediente → menù con «Indietro».
- [ ] Da valutare dopo la prova: cercare anche nel testo dei passi e nelle note (oggi solo nomi, categorie, tag, ingredienti; il vecchio `/api/search` resta ma non è usato); ricerche recenti; quantità tipiche negli ingredienti.


---

## Fase 4 · Menù
- [ ] **Lista menù** (`/menu`, `MenuGrid`, `MenuCard`): in alto il **prossimo menù** con conto alla rovescia, avanzamento di spesa e ricette e azioni rapide; sotto le schede 8.5 con il filo del colore di area.
- [ ] **Dettaglio menù** (`/menu/[id]`): testata e barra admin (`MenuAdminBar`, con l'occhio), card delle ricette, lista della spesa (8.8, `MenuShoppingList`), costi e prezzo (13.4, `MenuCosts`), note (13.7, `MenuNotesCard`/`MenuNoteQuickLink`), recensioni ricevute, link e QR per le recensioni (13.5).
- [ ] **Modalità cucina** (`/menu/[id]/cucina`): timeline (13.6, `CookTimeline`, `StartTimeEditor`) e stepper (`MenuCookMode`) con gli stessi elementi del dettaglio ricetta (8.7). Zoom e trascinamento della timeline invariati.
- [ ] `loading.tsx` della sezione.

---

## Fase 5 · Gestione (admin)
- [ ] Cornice admin: barra laterale inchiostro-indaco, fondi freddi, etichetta «admin» (D7).
- [ ] **Sotto-navigazione** di Gestione: gruppo «Crea» in cima (Nuova ricetta, Nuovo menù, Importa) e gruppo «Consulta e gestisci»; a colonna dai 900px, lista con «torna a Gestione» su iPhone.
- [ ] **Dashboard** (`/admin`): schede «Crea» con il + arancio; tessere «Consulta e gestisci» con numero e freccia (Ricette, Menù, Ingredienti, Categorie e tag, Recensioni, Utenti); grafici (`ChartsSection`, 13.3) e ultime recensioni.
- [ ] **Gestione ricette** e **menù** (tabelle 12.1 con l'occhio).
- [ ] **Ingredienti** (12.2): selezione, interruttore statistiche, barra «Unifica» (12.3), finestra di unione.
- [ ] **Categorie e tag** (12.4, 12.5): riordino con `ReorderList`, scelta del colore.
- [ ] **Recensioni** (`ReviewsBrowser`, 12.7, 12.8), **Utenti** (12.6), **Profilo**, **Importa** (12.9).
- [ ] **Form ricetta** (`RecipeForm`) e **form menù** (`MenuForm`), sezione 11:
  - [ ] barra in alto con l'occhio, Annulla e Salva (11.1);
  - [ ] due colonne dagli 860px;
  - [ ] righe ingrediente e passo (11.3, 11.4) a misura compatta; tipo di passo con le icone del progetto;
  - [ ] ingredienti per passo, avviso di sforamento (6.10) e finestra «Salva comunque»;
  - [ ] foto (11.5), ricerca con creazione (11.6), categorie e tag (11.7), ricetta nel menù con porzioni (11.8), tempi automatici o a mano (11.9).
  - [ ] **Non toccare** la logica dei legami passo-ingrediente né `createRecipeContent`.
- [ ] `FormSkeleton` e `loading.tsx` admin allineati.

---

## Fase 6 · Pagine per ospiti e uscite
- [ ] **Accesso** (`/login`, 13.8) con il logo.
- [ ] **Recensioni degli ospiti** (`/recensisci/[token]`, `MenuReviewForm`): percorso breve da telefono, voto 4.12, campi a 16px.
- [ ] **Pagina iniziale e vetrina pubblica** secondo la decisione presa in fase 0.
- [ ] **Immagine di condivisione** (`app/opengraph-image.tsx`) con il nuovo logo e i nuovi colori.
- [ ] **PDF** ricetta e menù (`RecipePdfDocument`, `MenuPdfDocument`): intestazione con il logo, colori allineati. Va controllata la resa delle maschere SVG in `@react-pdf/renderer`; se non le supporta, usare una versione del logo senza ritagli.

---

## Fase 7 · App installabile (PWA)
- [ ] Manifest completo (`public/brand/web/site.webmanifest` o `app/manifest.ts`): nome, colori, icone, `display: standalone`.
- [ ] Verificare «Aggiungi alla schermata Home» su iPhone e iPad: icona, schermo intero, barra di stato.
- [ ] *(Facoltativo, da valutare a parte)* notifiche push per i timer a telefono bloccato: service worker, chiavi VAPID e invio programmato lato server (vedi la nota in `CLAUDE.md` su `cooking-session`).

---

## Fase 8 · Rifinitura e rilascio
- [ ] Animazione del logo (`docs/design/loghi/kit/logo-animato.html`) solo nei momenti speciali: avvio o pagina di accesso, mai in loop.
- [ ] Stati vuoti (10.3) e messaggi di errore in tutte le liste.
- [ ] Accessibilità: contrasto, bersagli toccabili da almeno 44px su telefono, navigazione da tastiera su PC, `aria` di interruttori e segmenti.
- [ ] Prova completa su iPhone e iPad veri, in verticale e in orizzontale, e su PC con la finestra a varie larghezze.
- [ ] Revisione finale con la skill `impeccable` (polish e audit) e confronto con le foto in `.playwright-mcp/before/`.
- [ ] Rigenerare `DESIGN.md` dal codice rilasciato (impeccable `document`), tenendo le decisioni D1–D8.
- [ ] Aggiornare `CLAUDE.md`: classi base, componenti nuovi, regole su icone e logo; eliminare le note sullo stile vetro e sul gradiente.
- [ ] Anteprima al proprietario, raccolta del feedback, ultime correzioni.
- [ ] Unione in `main` e rilascio.

---

## Ordine consigliato e dimensioni
| Fase | Contenuto | Peso indicativo |
|---|---|---|
| 0 | preparazione e decisioni | piccolo |
| 1 | fondamenta e componenti base | **grande**: tutto il resto ci si appoggia |
| 2 | guscio e «Sto cucinando» | medio |
| 3 | ricette | **grande**: la parte più usata |
| 4 | menù e modalità cucina | medio-grande |
| 5 | gestione e form | **grande**: i form sono i file più lunghi |
| 6 | ospiti, PDF, condivisione | piccolo-medio |
| 7 | PWA | piccolo |
| 8 | rifinitura e rilascio | medio |

Le fasi 3, 4 e 5 si possono fare in qualunque ordine dopo la 2. Consiglio 3 → 4 → 5, perché la ricetta è quello che il cuoco usa di più ed è la prova migliore del nuovo stile.
