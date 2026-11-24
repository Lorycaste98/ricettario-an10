# Restyle · piano d'azione e TODO

> Branch: `feat/restyle-frontend` · aggiornato al 20/11/2026
> Riferimenti: `DESIGN.md` (decisioni D1–D8), `PRODUCT.md`, tavola `docs/design/elementi-*.png` (codici elemento), prototipi `docs/design/ricetta.html` e `docs/design/schermate/`, token `docs/design/tokens.css`, logo `docs/design/loghi/kit/GUIDA.md`.
> Prima di toccare l'interfaccia: skill `ricettario-design`.

## Come lavoriamo
- **Un componente nuovo per ogni elemento della tavola**, creato una volta sola e citato con il suo codice in un commento (`// Elemento 8.7`). Le pagine si rifanno **solo con quei componenti**.
- **Una fase alla volta, un commit per blocco.** Alla fine di ogni fase: anteprima Vercel del branch e prova su **iPhone e iPad veri** (verticale e orizzontale), poi giro di correzioni.
- **Funzioni invariate:** cambiano aspetto e disposizione, non il comportamento. Niente modifiche a API, schema Prisma o logica (`lib/`), salvo dove indicato.
- Durante il lavoro alcune pagine avranno lo stile vecchio e altre il nuovo: è normale, siamo su un branch. Si unisce in `main` solo nella fase 10, dopo l'approvazione del proprietario (fase 9).
- A ogni fase si aggiornano `CLAUDE.md` (in particolare la sezione «Classi base ricorrenti», che descrive lo stile vecchio) e `DESIGN.md`.

## Prima di iniziare (fase 0)
- [x] Anteprima dei passi successivi in «Sto cucinando» (`CookingDock.tsx`): portata nel restyle (deciso il 16/11/2026), arriva su `main` con l'unione del restyle.
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
- [x] → *fasi 2, 3, 6*: sostituire il vecchio logo (`public/an10.webp` in `Navbar`, `RecipeCard`, home, dettaglio menù; `public/an10.svg`; immagine OG) con `<An10Logo>` / `public/brand/`, man mano che si rifanno quelle parti.

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
- [ ] Valutazione ed estensioni: rimandate alla **fase 8** (decisione del 16/11/2026).


---

## Fase 4 · Menù
- [x] **Lista menù** (`/menu`, `MenuGrid`, `MenuCard`): in alto il **prossimo menù** (`NextMenuCard`) con conto alla rovescia, spesa e ricette pronte (admin) e azioni rapide; sotto le schede 8.5 con il filo del colore di area.
- [x] **Dettaglio menù** (`/menu/[id]`): testata 9.5 con azioni (`MenuAdminBar`: occhio, Modifica, PDF, Elimina), riga Modalità cucina + Recensioni ospiti (13.5), nota rapida (13.7), ricette come righe 8.3, lista spesa (8.8), costi e prezzo (13.4) e note nella colonna laterale da 1000px, recensioni ricevute (solo contenitore).
- [x] **Modalità cucina** (`/menu/[id]/cucina`): timeline (13.6) e stepper con il passo corrente 8.7, ora componente unico `CurrentStep`. Zoom e trascinamento invariati.
- [x] Card interne del pannello «Sto cucinando» con `CurrentStep`, `TimerAlert` e `Switch`.
- [x] `loading.tsx` della sezione.

> **Stato 16/11/2026:** fatta. Verificata a vista da visitatore (lista, dettaglio) e con dati finti per le parti admin (spesa, costi, note, modalità cucina, pannello). Da verificare da admin loggato sui dati veri. L'interno delle recensioni (`ReviewBubble`, `Collapsible`) resta per la fase 8.

---

## Fase 5 · Gestione (admin)
- [x] Cornice admin: barra laterale inchiostro-indaco, fondi freddi, etichetta «admin» (D7).
- [x] **Sotto-navigazione** di Gestione: gruppo «Crea» in cima (Nuova ricetta, Nuovo menù, Importa) e gruppo «Consulta e gestisci»; a colonna dai 900px, lista con «torna a Gestione» su iPhone.
- [x] **Dashboard** (`/admin`): schede «Crea» con il + arancio; tessere «Consulta e gestisci» con numero e freccia (Ricette, Menù, Ingredienti, Categorie e tag, Recensioni, Utenti); grafici (`ChartsSection`, 13.3) e ultime recensioni.
- [x] **Gestione ricette** e **menù** (tabelle 12.1 con l'occhio).
- [x] **Ingredienti** (12.2): selezione, interruttore statistiche, barra «Unifica» (12.3), finestra di unione.
- [x] **Categorie e tag** (12.4, 12.5): riordino con `ReorderList`, scelta del colore.
- [x] **Recensioni** (`ReviewsBrowser`, 12.7, 12.8), **Utenti** (12.6), **Profilo**, **Importa** (12.9).
- [x] **Form ricetta** (`RecipeForm`) e **form menù** (`MenuForm`), sezione 11:
  - [x] barra in alto con l'occhio, Annulla e Salva (11.1);
  - [x] due colonne dagli 860px;
  - [x] righe ingrediente e passo (11.3, 11.4) a misura compatta; tipo di passo con le icone del progetto;
  - [x] ingredienti per passo, avviso di sforamento (6.10) e finestra «Salva comunque»;
  - [x] foto (11.5), ricerca con creazione (11.6), categorie e tag (11.7), ricetta nel menù con porzioni (11.8), tempi automatici o a mano (11.9).
  - [x] **Non toccare** la logica dei legami passo-ingrediente né `createRecipeContent`.
- [x] `FormSkeleton` e `loading.tsx` admin allineati.
- [x] A form rifatti: in `components/AppShell.tsx` sostituire l'elenco delle pagine `/admin/...` in `RESTYLED` con `"/admin/*"`.

> **Stato 17/11/2026:** fatte le parti **5A** (cornice, sotto-navigazione, dashboard; commit a1ca5a0) e **5B** (tutte le liste di Gestione; commit e9ce2b1), pubblicate sull'anteprima. Verificate con dati finti su iPad e iPhone; il proprietario le controlla da admin sui dati veri prima della **5C** (form ricetta e menù, i file più lunghi: `components/recipe/RecipeForm.tsx` ~1500 righe, `components/menu/MenuForm.tsx`). Prototipo del form: `docs/design/schermate/6-form-ricetta*`. Pezzi già pronti da riusare: `AdminTable`, `buttonClasses`/`rowIconCls` (`components/ds/button-classes.ts`), `ColorSwatches`, maniglia di `ReorderList` già nel nuovo stile. Per vedere le pagine admin senza login si sono usate pagine temporanee sotto `app/prova-elementi/admin/` con dati finti (poi cancellate).

> **Stato 17/11/2026 (5C):** form ricetta e menù rifatti con i pezzi di `components/admin/FormParts.tsx` (barra 11.1, blocco 11.2, chip piccoli, tipo di passo) e `ChipSearch` (11.6/11.7, categorie e tag nella stessa fila). Logica invariata (stato, ripartizione per passo, payload, «Salva comunque»). Differenze dal prototipo: un blocco in più «Note e fonte» (note, link, data della ricetta, che il prototipo non mostra); la seconda fila della riga ingrediente (opz., descrizione, sezione) compare sulla riga che si sta modificando o se c'è qualcosa da mostrare; i campi restano a 16px su touch (prima il form ricetta li rimpiccioliva e su iOS zoomava). Eliminati `PublishSwitch`, `SectionHeader`, `QuickTag` e il vecchio `ColorPicker` a tendina. Verificato con dati finti su iPad e iPhone; da provare da admin sui dati veri (salvataggio compreso).

---

## Fase 6 · Pagine per ospiti e uscite
- [x] **Accesso** (`/login`, 13.8) con il logo.
- [x] **Recensioni degli ospiti** (`/recensisci/[token]`, `MenuReviewForm`): percorso breve da telefono, voto 4.12, campi a 16px.
- [x] **Pagina iniziale e vetrina pubblica** secondo la decisione presa in fase 0.
- [x] **Immagine di condivisione** (`app/opengraph-image.tsx`) con il nuovo logo e i nuovi colori.
- [x] **PDF** ricetta e menù (`RecipePdfDocument`, `MenuPdfDocument`): intestazione con il logo, colori allineati. Va controllata la resa delle maschere SVG in `@react-pdf/renderer`; se non le supporta, usare una versione del logo senza ritagli.

> **Stato 17/11/2026:** fatta. Accesso 13.8 (logo, Utente, Password, «Entra»); recensioni degli ospiti con schede bianche, voto 4.12 e «Non l'ho provata»; vetrina dentro la cornice (fascia blu con logo e ricerca, ultime ricette, menù); immagine di condivisione blu con il logo orizzontale; PDF con il logo orizzontale (rasterizzato dal browser: react-pdf non disegna le maschere) e i colori del restyle, quantità «0» come solo unità, passi non spezzati fra due pagine. Eliminati il vecchio logo (`public/an10.webp`, `public/an10.svg`, `app/an10.svg`, `public/logo.ico`). Da sistemare in fase 8: il piè di pagina dei PDF (`PdfFooter`) non viene disegnato, ed era così già prima del restyle. Verificato con dati veri da visitatore (vetrina, PDF) e con dati finti per le recensioni (nessun voto inviato).

---

## Fase 7 · App installabile (PWA)
- [x] Manifest completo (`app/manifest.ts`): nome, nome breve «AN10», `id`/`scope`, colori della cornice (barra `blu-800`, avvio `blu-50`), icone `any` e `maskable`, `display: standalone`, scorciatoie Ricette/Menù/Preferiti (pressione lunga sull'icona, Android e PC).
- [x] iPhone e iPad (`appleWebApp` in `app/layout.tsx`): schermo intero, titolo «AN10», barra di stato **trasparente** sopra la fascia blu di `AppShell` (ora presente a tutte le larghezze, alta 0 nel browser), icona `app/apple-icon.png`; niente numeri trasformati in link telefonici.
- [x] Notch con il telefono in orizzontale: la barra laterale si allarga di `safe-area-inset-left`, `main` tiene a destra almeno `safe-area-inset-right` (variabile `--main-px`, annullata con la stessa espressione da `FormBar` e `FormSkeleton`).
- [ ] **Da provare sui dispositivi veri (proprietario):** «Aggiungi alla schermata Home» su iPhone e iPad: icona e nome, apertura a schermo intero, barra di stato (ora e batteria bianche sulla fascia blu, anche in Gestione), iPhone in orizzontale (niente sotto il notch), Android/PC se capita (installazione, scorciatoie).
- [ ] *(Facoltativo, da valutare a parte)* notifiche push per i timer a telefono bloccato: service worker, chiavi VAPID e invio programmato lato server (vedi la nota in `CLAUDE.md` su `cooking-session`).

> **Stato 17/11/2026:** fatta la parte di codice; manca la prova da schermata Home su iPhone e iPad veri (nel browser e in Playwright le aree del notch valgono 0, quindi non si possono vedere qui). Niente service worker: per installare l'app non serve più, e senza le notifiche push non avrebbe un compito. Niente schermate di avvio per iOS (`apple-touch-startup-image`, una per ogni misura di schermo): all'apertura iOS mostra un attimo il fondo bianco.

---

## Fase 8 · Rifinitura
**Obiettivo:** chiudere i punti rimasti aperti nelle fasi precedenti, prima delle prove complete della fase 9.
- [x] Animazione del logo (`docs/design/loghi/kit/logo-animato.html`) solo nei momenti speciali: avvio o pagina di accesso, mai in loop.
- [x] Stati vuoti (10.3) e messaggi di errore in tutte le liste.
- [x] Interno delle recensioni (`ReviewBubble`, `ReviewCarousel`, `Collapsible`) e voto 4.12 in `PersonalRatingCard` (vedi fase 3); poi eliminare i vecchi `components/ui/Input`, `Button`, `Rating` se restano senza uso.
- [x] PDF: il piè di pagina (`PdfFooter`, «Ricettario AN10 · data · pagina») non viene disegnato da react-pdf (difetto preesistente).
- [x] Togliere i resti dello stile vecchio: ora tutte le pagine sono rifatte, quindi `RESTYLED` in `AppShell`, il gradiente `.page-bg` e lo stile «vetro» in `globals.css` non servono più.
- [x] Accessibilità: contrasto, bersagli toccabili da almeno 44px su telefono, navigazione da tastiera su PC, `aria` di interruttori e segmenti.
- [x] Revisione con la skill `impeccable` (polish e audit) e confronto con le foto in `.playwright-mcp/before/`.
- [x] Rigenerare `DESIGN.md` dal codice (impeccable `document`), tenendo le decisioni D1–D8.
- [x] Aggiornare `CLAUDE.md`: classi base, componenti nuovi, regole su icone e logo; eliminare le note sullo stile vetro e sul gradiente.
- [x] **Ricerca globale (fase 3B), da riprendere a fine restyle:** rivedere insieme la prima versione e decidere le estensioni:
  - [x] cercare anche nel testo dei passi e nelle note (oggi solo nomi, categorie, tag, ingredienti);
  - [x] ricerche recenti nello stato iniziale;
  - [x] quantità tipiche e cotture nelle statistiche degli ingredienti;
  - [x] eliminare il vecchio `/api/search` se resta inutilizzato.

> **Stato 20/11/2026:** fatta. Recensioni nel nuovo stile (`ReviewBubble`, carosello, `Collapsible`, testata comune, «Il mio voto» con 4.12); via lo stile vecchio (gradiente, `RESTYLED`, `ui/Input`, `ui/Button`, `ui/Rating`, `ui/Badge`, `ui/PriceTag`, `ui/Skeleton`, `ui/ConfirmDialog`, `lib/review-style`, `/api/search`); piè di pagina dei PDF di nuovo visibile; pagine di errore e «non trovata», errori di caricamento con «Riprova»; logo animato nell'accesso; accessibilità (`hit-44`, segmenti da tastiera, focus comune, verde e link più contrastati, `arancio-pieno` per i fondi con testo bianco); «Inizia a cucinare» tonale; ricerca con testo dei passi e note, ricerche recenti, quantità tipiche e cotture; `CLAUDE.md` e `DESIGN.md` (unito: token + sezioni standard + D1–D8). Audit `impeccable`: nessun problema bloccante; i 5 avvisi del rilevatore (fili e bordi di colore di area, rimbalzo del logo animato) sono scelte della tavola, non errori. Da guardare nelle prove: le soglie di 44px su iPhone vero.


---

## Fase 9 · Prove e sistemazioni
**Obiettivo:** che il nuovo stile piaccia al proprietario in ogni sua parte, provato sui dispositivi veri e sui dati veri, prima di pensare al rilascio. Si gira finché non ci sono più punti aperti.
- [ ] **Giro di prove di Claude** sull'anteprima e in locale: ogni pagina a misura di iPhone, iPad (verticale e orizzontale) e PC, da visitatore e da admin; percorsi completi (cercare e cucinare una ricetta con timer e «Sto cucinando», preparare un menù con spesa, costi e modalità cucina, creare e modificare ricetta e menù, recensione da ospite). Elenco dei difetti trovati, con le foto.
  - ⚠️ L'anteprima usa il **database di produzione**: niente salvataggi né eliminazioni sui dati veri; le prove che scrivono si fanno con dati di prova creati apposta e poi tolti, o in locale.
- [ ] **Prove del proprietario** su iPhone e iPad veri (verticale e orizzontale), sul PC e da app installata: cosa piace, cosa no, cosa manca.
- [ ] Raccolta dei punti da sistemare in una lista qui sotto (chi l'ha trovato, pagina, cosa cambiare), decisi insieme.
- [ ] Sistemazioni, un commit per punto o per gruppo di punti, con anteprima aggiornata.
- [ ] Nuovo giro di prove sui punti sistemati, finché il proprietario non approva il nuovo stile.

### Punti da sistemare
- [x] **Proprietario · dettaglio menù · PDF che non si generava + ordinamento perso** (24/11/2026). Corretto su `main` (`239ae43`, già in produzione) e unito qui: le ricette veloci non si chiedono più all'API (404 → falliva tutto il PDF) e stanno solo nell'elenco in copertina con «veloce»; finestra «Esporta senza» se una ricetta non si legge; foto WebP/HEIC convertite in JPEG; ordinamento delle liste ricette e menù in `localStorage`.
- [ ] **Proprietario · dettaglio menù · PDF in due formati** (24/11/2026, nuova funzione). Premendo il PDF del menù, prima una scelta fra due formati (nomi da decidere, «cucina» e «ristorante» erano solo indicativi):
  - **per chi cucina**: il PDF di oggi (copertina con l'elenco + una pagina per ricetta con ingredienti e passi), già nello stile del restyle;
  - **da mandare agli ospiti** (amici, parenti): un foglio carino da condividere, tipo menù del ristorante, con nome del menù, data e ora del servizio e l'elenco dei piatti (veloci comprese); niente ingredienti, passi, costi né note private. Da decidere insieme: cosa ci sta in più (descrizione del menù, foto, descrizione breve dei piatti, raggruppamento per portata, logo, messaggio/dedica), formato (A4 verticale, A5 o una pagina da mandare sul telefono) e se condividerlo anche col tasto «Invia» (`navigator.share`) oltre allo scaricamento.
  - Dove: `MenuPdfButton` (la scelta, una finestra 10.1 con le due opzioni) e un nuovo documento accanto a `MenuPdfDocument`. Il formato ospiti è per tutti o solo admin? Da decidere (oggi il PDF del menù è per tutti).
- [x] **Proprietario · telefono · poco colore, sembra anonimo** (24/11/2026). Sul PC l'identità la porta la barra laterale `blu-800` con il logo; sotto i 700px diventa la barra in basso bianca e il logo sparisce: resta azzurrino quasi bianco + schede bianche. Peggiorano le ricette senza foto (logo azzurro su `blu-100`, riquadri slavati). Due anteprime da confrontare sul telefono (schermate in `.playwright-mcp/fase9/`, `m-*` = oggi):
  - **A** (branch `anteprima/mobile-a`): barra in basso `blu-800` come la barra laterale (voce attiva su pastiglia arancio) + segnaposto delle ricette senza foto con logo bianco su `blu-800` (`components/recipe/NoPhoto.tsx`, lista, dettaglio ricetta, righe del menù).
  - **B** (branch `anteprima/mobile-b`): fascia `blu-800` in cima con il logo orizzontale bianco (solo < 700px, scorre via) + fondo pagina `blu-100` invece di `blu-50`. Nota: col fondo `blu-100` le zone già `blu-100` (testata delle schede menù, segnaposto, colonna ingredienti) non si staccano più dal fondo: andrebbero ripensate.
  - **Scelta del proprietario: A.** Aggiunto alla A il logo completo in cima a Ricette, Menù e Preferiti (`PageHeader brand`, solo < 700px, scorre via con la pagina: niente barra fissa né sfocatura). Da provare sul telefono, poi unire nel restyle.
- [ ] **Proprietario · tutto · togliere le scelte «da template» segnalate da Impeccable** (24/11/2026): il proprietario vuole un prodotto che non somigli ai siti fatti in serie, anche dove la scelta era nostra. Proposte da decidere:
  - **Filo laterale delle schede menù** (`MenuCard`, `border-l-4 border-area-menu`): al posto del filo, la data come **biglietto del calendario** a sinistra della testata (giorno grande in prugna, mese e giorno della settimana sotto): riconosce l'area ed è un'informazione, non decorazione.
  - **Bordo superiore delle tessere della dashboard** (`border-t-4` col colore di area): via il bordo, resta l'icona dell'area su quadratino tinto (già presente) eventualmente più grande; il numero porta il peso.
  - **Filo laterale delle schede «Sto cucinando»** (`CookingBar`, colore = tipo del passo): sostituirlo con l'icona del tipo di passo (`StepKindTag`/icone del progetto) o con un anellino di avanzamento attorno all'icona: lo stesso significato, disegnato.
  - **Timeline cucina**: stessa logica, il colore di area/tipo passa a icone e alla barra stessa, niente filo sul bordo.
  - **Rimbalzo del logo animato** (accesso, `an10a-drop` in `globals.css`: l'uovo cade, rimbalza di 16px e si assesta): niente rimbalzo, caduta con decelerazione decisa (`cubic-bezier(0.16, 1, 0.3, 1)`) e un piccolo «schiacciamento» all'arrivo, oppure l'uovo che compare con una dissolvenza in scala. Il resto dell'animazione (tratto disegnato) resta.
- [x] **Proprietario · libreria (e preferiti) · vista a griglia o a lista** (24/11/2026). Le card sembrano molto simili alle vecchie; scelta fra griglia (card 8.1 di oggi) e **lista** (righe come le ricette del dettaglio menù, 8.3: miniatura 48px, nome, pallino della categoria, tempo, voti, pentola e cuore). Interruttore a icone (`Segmented` 4.10) nella barra dei filtri, scelta salvata sul dispositivo come l'ordinamento. Valutare anche il menù (lista già simile) e se rivedere la card in griglia. **Anteprima** (branch `anteprima/viste`, parte dalla A): griglia/lista + «− N per riga +» in Ricette, Preferiti e Menù (`components/ui/CollectionView.tsx`, `RecipeRow`, `MenuRow`); il massimo per riga dipende dallo spazio vero (telefono 3 ricette / 2 menù, iPad orizzontale e PC fino a 8); le card mostrano più informazioni quando sono larghe (categoria, porzioni, cotture, tag). Schermate `.playwright-mcp/fase9/v-*`. Aggiunto: elementi per pagina **multipli delle card per riga** (`pageSizeFor`: righe intere più vicine a 20 ricette / 12 menù; 1 per riga = 10 / 8, lista = 20 / 15), tutto nel browser, nessuna modifica al server; la pagina salvata è l'indice della prima voce, così cambiando le card per riga si resta sulle stesse ricette.
- [x] **Proprietario · libreria · card con più identità** (24/11/2026): le card attuali sembrano «basic». Tre proposte nel branch `anteprima/card` (parte da `anteprima/viste`), confrontabili su `/prova-card` (solo locale e anteprime) a larghezza telefono/larga e 1–6 per riga, con le ricette vere: **1 · Comanda** (scontrino del pass con perforazione, voto come totale «9.1 /10»), **2 · Piatto** (foto a cerchio come un piatto visto dall'alto sulla tovaglia `blu-100`, voto come medaglia oro sul bordo), **3 · Copertina** (foto verticale piena, nome su etichetta bianca, voto in un quadrato `blu-800`). Pressione al tocco su tutte; al mouse sollevamento / piatto che gira / foto che si avvicina. Da scegliere (anche mescolando), poi va estesa a lista, preferiti, vetrina e alla card menù. Il proprietario preferisce il **Piatto**, ma vorrebbe anche mescolare o lasciare la scelta. Aggiunta sulla stessa pagina la lista **«Carta»** (`RecipeRowCarta`: piatto tondo, nome, puntini di guida e il voto al posto del prezzo, «da provare» se non ci sono voti; poi separata su richiesta del proprietario — il foglio unico faceva sembrare le ricette un gruppo: ora due versioni, **schede separate** e **senza scheda** sul fondo pagina).
- [x] **Fatto (24/11/2026) · unito nel restyle:** anteprima A (barra in basso blu, logo in cima alle pagine principali, segnaposto `NoPhoto`), viste griglia/lista con card per riga e pagine a righe piene, card **Piatto** (8.1/8.2) e lista **Carta senza scheda** (8.10) con la medaglia del voto 6.11 (stella nostra: quella di Super Mario è un disegno Nintendo). Tolte le proposte scartate e `/prova-card`; aggiornati tavola (`elementi*.html/png`), `DESIGN.md`, `CLAUDE.md`. I branch `anteprima/*` si possono eliminare.
- [ ] **Prossimo · gemella per i menù:** `MenuCard` (8.5) e `MenuRow` nello stesso linguaggio di Piatto e Carta (oggi testata azzurra con il filo prugna, segnalato anche da Impeccable).
- [ ] **Proprietario · in coda, dopo la scelta di card e lista · sezione Impostazioni** (24/11/2026): scelte di vista e ordinamenti predefiniti in un posto solo, per alleggerire le barre delle liste; più un configuratore delle informazioni da mostrare nelle card, con l'anteprima dal vivo. Analisi nella conversazione del 24/11: decidere se ne vale la pena e cosa ci entra.

---

## Fase 10 · Rilascio
**Si fa solo dopo l'approvazione della fase 9.**
- [ ] Ultimo controllo: `npm run build`, `tsc` e lint puliti; nessuna pagina di prova temporanea rimasta.
- [ ] Eliminare `app/prova-elementi/` (pagina di prova dei componenti).
- [ ] Unione di `feat/restyle-frontend` in `main` e pubblicazione in produzione.
- [ ] Prova veloce in produzione (vetrina, accesso, una ricetta, un menù, Gestione).
- [ ] Eliminare il branch e i deployment di anteprima; aggiornare `CLAUDE.md` (togliere i rimandi al restyle «in corso»).

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
| 8 | rifinitura | medio |
| 9 | prove del proprietario e di Claude, sistemazioni | medio, dipende da quanti punti escono |
| 10 | rilascio | piccolo |

Le fasi 3, 4 e 5 si possono fare in qualunque ordine dopo la 2. Consiglio 3 → 4 → 5, perché la ricetta è quello che il cuoco usa di più ed è la prova migliore del nuovo stile.
