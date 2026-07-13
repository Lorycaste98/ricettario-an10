# Ricettario AN10

Next.js 16 (App Router) + React 19 + PostgreSQL/Supabase + Prisma 7 + Tailwind CSS v4 + JWT (`jose`) + Cloudinary + Recharts + Vercel.

## ⚠️ Aggiorna questo file ogni volta che aggiungi feature, route, modelli o lib.

## Comandi

```bash
npm run dev          # dev server
npm run build        # prisma generate + next build
npm run seed         # popola il DB
npm run create-admin # crea utente admin
```

## File non ovvi

| File | Scopo |
|------|-------|
| `lib/favorites.ts` | Hook `useFavorites` — preferiti in localStorage, nessuna persistenza server |
| `lib/local-store.ts` | Hook generico `useLocalStore(key, fallback, parse, serialize?)` — stato persistito in localStorage via `useSyncExternalStore` (stesso pattern di `favorites.ts` ma parametrizzato); usato da lista spesa e modalità cucina |
| `lib/shopping-list.ts` | `buildShoppingList(recipes)` — aggrega gli `Ingredient` di tutte le ricette di un menù per nome+unità normalizzati (case-insensitive), sommando le quantità e tracciando le ricette sorgente |
| `lib/api.ts` | Fetch wrapper + `recipeSummarySelect` / `flattenRecipe` helpers |
| `lib/cook-schedule.ts` | `totalLeadMinutes` / `resolveServeAt` / `computeStart` / `startLabel` — calcolo "quando iniziare" una ricetta dato il servizio del menù (data + `servingTime`) |
| `lib/cook-timeline.ts` | Matematica della timeline cucina (riusa `cook-schedule`): `defaultStart` (cookStartAt ?? automatico), `buildSchedule` (segmenti per step, overshoot), `stepStartTimes`, `formatClock`, `snapMinutes` |
| `lib/recipe-progress.ts` | Hook `useRecipeProgress(recipeId, stepsCount)` — avanzamento passi per **indice**: admin → DB via `/api/recipes/[id]/progress` (debounce 800ms + flush `keepalive` su `pagehide`), visitatori → localStorage. Guardia anti-stale su `stepsCount` |
| `components/ui/ReorderList.tsx` | `ReorderList`/`ReorderRow` — drag & drop riordino liste (`motion` Reorder) con maniglia grip (render prop `children(handle)`); `dragListener={false}` così input e scroll touch non vengono sequestrati; `layoutScroll` per contenitori scrollabili. Usato da RecipeForm (ingredienti+step, righe con `uid` client-side), MenuForm, vocabolario categorie (PUT reorder solo su dragEnd) |
| `components/ui/PriceTag.tsx` | Etichetta "cartellino negozio con filo" (CSS clip-path + micro-SVG), label parametrica (default "opzionale") — riusabile; usata per `Ingredient.optional` in dettaglio ricetta e lista spesa |
| `components/menu/CookPlanner.tsx` | Wrapper client della pagina cucina: possiede gli orari pianificati (`MenuRecipe.cookStartAt`, PATCH `/api/menus/[id]/schedule` con update ottimistico) e passa `stepTimes` allo stepper. Orari formattati solo client-side (server UTC): gate con `useSyncExternalStore` hydrated |
| `components/menu/CookTimeline.tsx` | Timeline Gantt cucina: una corsia per ricetta, barra segmentata per step (larghezza ∝ minuti, sliver per step senza durata), drag orizzontale con snap 5 min (`motion` drag="x"), zoom preset px/min, linea servizio, warning "finisce dopo il servizio", pannello dettaglio step al tap |
| `components/ui/ConfirmDialog.tsx` | Dialog conferma con hook `useConfirm()` |
| `components/ui/IngredientCombobox.tsx` | Combobox autocomplete su `IngredientMaster` |
| `components/ui/ColorPicker.tsx` | `ColorPicker` + `PALETTE` + `nextPaletteColor()` — condiviso vocabolario/form |
| `components/ui/CategoryCombobox.tsx` | Cerca/crea categoria al volo (POST `/api/categories`) con color-picker inline |
| `components/ui/TagCombobox.tsx` | Cerca/crea tag al volo (POST `/api/tags`) |
| `components/AppShell.tsx` | Wrapper layout comune |
| `lib/review-style.ts` | `ratingStyle(rating)` — colori card/badge per voto 1-10 (9-10 oro animato → 1-2 rosa, bucket a coppie) |
| `components/ui/Rating.tsx` | `RatingInput` (selettore 1-10 a bottoni, touch-first) + `RatingBadge` (badge sola lettura "N/10") |
| `lib/site-url.ts` | `getSiteUrl()` — URL base del sito (prod Vercel o `NEXT_PUBLIC_SITE_URL`), usato da OG e dal link di recensione menù |
| `components/admin/ReviewCard.tsx` | Card recensione (righe: badge voto+data / ricetta + tag menù opzionale / autore); `expand="inline"` o `"dialog"` |
| `components/admin/RecentReviews.tsx` | Dashboard: ultime 5 recensioni ricetta affiancate (scroll mobile / grid-5 desktop), Dialog |
| `components/admin/ReviewsBrowser.tsx` | Pagina recensioni admin: **una sola lista** di `Review` (niente più tab) con toolbar filtri — ricerca testo/autore + `SearchableSelect` Ricetta/Menù/Data (le date elencano solo i giorni con recensioni, col conteggio) + segmented «Raggruppa per» (Ricetta default / Menù / Data / Nessuno). Gruppi collassabili con media+conteggio, card `ReviewMiniCard`, eliminazione via `ConfirmModal`. La sorgente (`app/admin/recensioni/page.tsx`) è **una sola** `review.findMany` piatta (ogni review porta `recipe` + `menu`, null = nota personale) |
| `components/admin/ReviewMiniCard.tsx` | Card recensione compatta admin: a colpo d'occhio voto+autore+soggetto+data; il commento è nascosto e si apre al tap **solo se presente** (icona, altrimenti nulla). Chip ricetta/menù nascondibili (`showRecipe`/`showMenu`) quando la lista è già raggruppata per quella dimensione |
| `components/ui/SearchableSelect.tsx` | Select a scelta singola con ricerca interna (combobox) + opzione azzera; valore controllato (`null` = nessuna scelta), opzioni con `count`. Usato dai filtri Ricetta/Menù/Data della pagina recensioni admin |
| `components/recipe/ReviewBubble.tsx` | Card recensione pubblica compatta (pagina ricetta/menù): a colpo d'occhio voto+autore (+data/chip opzionali); il commento è nascosto e si apre in un `Modal` **solo se presente** (comodo dentro il carosello). Colorata per voto via `ratingStyle`, il 10 eredita alone+sheen. Sostituisce la vecchia `DetailReviewCard` |
| `components/recipe/ReviewCarousel.tsx` | Riga di card recensione scorrevole: swipe su mobile, frecce con snap su desktop (compaiono solo se il contenuto eccede la larghezza, disabilitate agli estremi). Scrollbar sottile custom |
| `components/menu/MenuReviewForm.tsx` | Form pubblico "recensisci il menù" (`/recensisci/[token]`): nickname una volta + voto 1-10 per ricetta, nessun login |
| `components/menu/ShareReviewLink.tsx` | Bottone admin "Recensioni ospiti" sul dettaglio menù: apre modal con link `/recensisci/[token]`, copia, QR (generato server-side con `qrcode`) |
| `components/menu/MenuReceivedReviews.tsx` | Pannello admin sul dettaglio menù: recensioni ricetta arrivate dal link di quel menù, raggruppate per ricetta, eliminabili. Card = `ReviewBubble` (scroll mobile / grid desktop) |
| `components/recipe/ReviewSection.tsx` | Sezione recensioni pubblica della ricetta: **raggruppate per data** (più recente in cima, max 4 date + «Vedi altre date»); ogni gruppo ha header (data · media · voti · chip «dal menù X» se unanime) e un `ReviewCarousel` di `ReviewBubble`. In cima il form «nota personale» solo admin |
| `components/admin/ChartsSection.tsx` | Grafici dashboard: select grafico + period picker (preset + range custom); fa fetch su `/api/admin/stats` al cambio periodo |
| `components/recipe/RecipePdfButton.tsx` | Tasto "Esporta in PDF" (client): import lazy di `@react-pdf/renderer`, foto→dataURL, download blob |
| `components/recipe/RecipePdfDocument.tsx` | Layout PDF ricetta (`@react-pdf/renderer`) — importato solo dal button, mai a livello pagina. Esporta `pdfStyles` / `PdfFooter` / `RecipePdfContent` riusati dal PDF menù |
| `components/menu/MenuPdfButton.tsx` | Tasto "Esporta PDF" del menù (client): fa fetch dei dettagli ricetta da `/api/recipes/[id]`, import lazy di `@react-pdf/renderer` |
| `components/menu/MenuShoppingList.tsx` | Lista della spesa nel dettaglio menù (solo admin): ricerca, checkbox "comprato" persistite in localStorage per menù, collassata oltre 8 righe con "Vedi tutta la lista" |
| `components/menu/MenuCookMode.tsx` | "Modalità cucina" (`/menu/[id]/cucina`, solo admin): una card per ricetta con stepper avanti/indietro sugli step (uno alla volta, progresso in localStorage per menù), bottone finale "Segna cucinata" → `POST /api/recipes/[id]/cook`. Prop opzionale `stepTimes` (da `CookPlanner`): mostra "inizia alle HH:mm" sullo step corrente + orario del prossimo passo |
| `components/menu/MenuPdfDocument.tsx` | Layout PDF menù: copertina/intestazione + una pagina per ricetta (riusa `RecipePdfContent`) |
| `app/opengraph-image.tsx` | Immagine OG dinamica (`next/og`) per l'anteprima di condivisione; `metadataBase`/OG/Twitter in `app/layout.tsx`, base = `VERCEL_PROJECT_PRODUCTION_URL` o `NEXT_PUBLIC_SITE_URL` |
| `components/recipe/TagFilterCombobox.tsx` | Combobox ricerca+multi-selezione per filtrare le ricette per tag (no «#»); usato in `RecipeGrid` desktop dropdown + sheet mobile |
| `components/Navbar.tsx` | Navbar globale. La voce **Dashboard** (solo admin) è un trigger con sottomenu delle azioni admin (gruppi «Crea»/«Gestione»): dropdown in hover su desktop (chevron) + accordion nell'hamburger mobile. La voce «Recensioni» appare solo se `hasReviews` (da `useAuth`). «Utenti» è dentro il sottomenu (solo SUPERADMIN), non più voce a sé |
| `prisma/prisma.config.ts` | Config connessione Supabase + adapter — non toccare |
| `proxy.ts` (root) | Config proxy Vercel — non toccare |

## Struttura aree principali

```
app/preferiti/          # Preferiti filtrati lato client da localStorage
app/admin/ricette/      # Gestione ricette: lista con switch "Visibile" (Recipe.published); nuova/[id] = form
app/admin/ingredienti/  # Catalogo IngredientMaster: rinomina, merge, escludi da stats
app/admin/utenti/       # CRUD utenti admin, crea con ruolo ADMIN/SUPERADMIN, dedica
app/admin/recensioni/   # Recensioni ricette + menù, due sezioni con ricerca (link da dashboard)
app/admin/profilo/      # Cambio username e password admin (self-service)
app/api/auth/first-login/       # Primo accesso: mostra dedica, imposta firstLogin=false
app/api/auth/username/          # Cambio username self-service (conferma password, ricrea sessione)
app/api/auth/password/          # Cambio password self-service (conferma password attuale)
app/api/categories/reorder/     # Riordina categorie (sortOrder)
app/api/ingredients/            # Lista pubblica ingredienti master (autocomplete)
app/api/admin/stats/            # Dati grafici dashboard filtrati per periodo (?from=&to=); cotture via CookLog, fallback cookCount per "Tutto"
app/api/admin/ingredients/      # CRUD + merge + exclude IngredientMaster
app/api/admin/utenti/           # CRUD utenti admin
app/menu/[id]/cucina/           # Modalità cucina del menù (solo admin): timeline (CookPlanner/CookTimeline) + stepper per ricetta (MenuCookMode)
app/api/recipes/[id]/progress/  # GET/PUT — avanzamento passi dell'admin loggato (RecipeProgress, per indice)
app/api/menus/[id]/schedule/    # PATCH — imposta MenuRecipe.cookStartAt (timeline cucina); null = automatico
app/recensisci/[token]/         # Pagina pubblica "vota le ricette del menù" (nessun login, protetta dal token)
app/api/recensisci/[token]/     # POST — crea le Review (voto 1-10) per le ricette del menù, dato il token
```

## Auth e ruoli

- JWT httpOnly cookie, session helpers in `lib/session.ts`
- Ruoli: `ADMIN` | `SUPERADMIN` — solo superadmin accede a `/admin/utenti/`
- `AuthProvider.tsx` espone `{ username, role, dedication, hasReviews }` a tutto il client (`hasReviews` da `/api/auth/me`: true se esiste almeno una `Review` o `MenuReview`)
- Primo accesso: API `first-login` mostra la dedica e resetta il flag `firstLogin`

## Convenzioni

- No `any` — usare `unknown`; tipi condivisi in `lib/types.ts`
- Client Prisma solo da `lib/db.ts`; API client solo tramite `lib/api.ts`
- Icone: solo `lucide-react`
- Dopo ogni modifica schema Prisma: `npx prisma generate`
- Ogni route con fetch lenta ha il suo `loading.tsx` con skeleton
- Rispondi sempre in italiano

## Note critiche

- `/api/keepalive` mantiene attiva la connessione Supabase — non rimuovere
- I preferiti sono solo localStorage — non c'è tabella DB per i preferiti utente
- `IngredientMaster` è il catalogo canonico degli ingredienti; il merge aggiorna tutte le ricette collegate
- `CookLog` registra ogni cottura (una riga per click su "Ho cucinato"): l'API `/api/recipes/[id]/cook` POST crea una riga + incrementa `cookCount`, DELETE rimuove l'ultima riga + decrementa. Lo storico CookLog parte dalle cotture registrate **dopo** l'introduzione della tabella; le cotture precedenti vivono solo in `cookCount` (visibili col periodo "Tutto")
- `Step.kind` (`PREP` | `COOK` | `WAIT`, default `PREP`): tipo di tempo dello step. `prep`/`cook` della ricetta **non** sono derivati a forza — il form suggerisce le somme per tipo e l'admin le applica/modifica (niente sovrascrittura silenziosa dei valori salvati). Usa `toStepKind()` per normalizzare il valore grezzo dal DB
- `Recipe.published` (`Boolean`, default `true`): visibilità della ricetta. Le ricette `published=false` ("non pronta") sono **nascoste ai visitatori** in tutti i percorsi di lettura pubblici (`/`, `/ricette`, `/preferiti`, dettaglio `/ricette/[id]` → `notFound`, `/api/recipes` GET, `/api/search`) — il filtro `where: { published: true }` si applica solo quando **non** c'è sessione admin. Gli admin le vedono ovunque, offuscate + badge "Non pronta" nella `RecipeCard`. Toggle da `/admin/ricette` (switch) o dal dettaglio (`RecipeActions`) via `PATCH /api/recipes/[id]` con `{ published }`. Chi renderizza `RecipeCard` deve includere `published` nel select (è in `recipeSummarySelect`)
- `Recipe.createdAt` è anche la **"data della ricetta"** modificabile dall'admin nel `RecipeForm` (campo `Data`, `<input type="date">`): default = oggi alla creazione, sempre cambiabile. Il form invia `createdAt` come `"YYYY-MM-DD"`; POST/PUT `/api/recipes` lo convertono con `parseDateOnly()` (lib/api.ts) → `Date` a mezzogiorno UTC, ricostruibile con `.toISOString().slice(0, 10)`
- `Recipe.quick` (`Boolean`, default `false`): ricetta "veloce" — solo nome, senza ingredienti/step, per voci minime nei menù (es. "Arrosticini", "Insalata") che non meritano una scheda completa. Ortogonale a `published` (resta `true` di default, così la ricetta è comunque visibile/recensibile nei contesti-menù che filtrano solo su `published`). Esclusa **sempre**, anche per l'admin, da libreria e ricerca (`/`, `/ricette`, `/preferiti`, `/admin/ricette`, `/api/search`, `getRecipeSummaries`/`getHomeRecipes` in `lib/queries.ts`) e dalla pagina di dettaglio (`/ricette/[id]` e `GET /api/recipes/[id]` → 404 incondizionato). Resta selezionabile solo nel picker ricette del form menù (`components/menu/MenuForm.tsx`, fetch con `?includeQuick=1`, ammesso solo se admin), che permette anche di crearne una al volo (`POST /api/recipes` con `{ name, quick: true }`). Nel dettaglio menù e nelle liste recensioni (`ReviewCard`, `ReviewsBrowser`, `MenuReceivedReviews`) il nome compare come testo semplice invece che come link, dato che non esiste una pagina da linkare
- `Menu.servingTime` (`"HH:mm"`, opzionale): orario di servizio. Insieme a `Menu.date` alimenta il countdown "quando iniziare" mostrato sulle card ricetta nel dettaglio menù. Il lead time = somma di **tutti** i minuti degli step (prep+cottura+attesa), fallback `prep+cook` — vedi `lib/cook-schedule.ts`
- Lista della spesa del menù (solo admin, per ora): calcolata al volo in `queryMenuDetail` (`lib/queries.ts`) con `buildShoppingList`, nessuna tabella/snapshot salvato. Raggruppa per `Ingredient.name` normalizzato — quando gli ingredienti verranno unificati via `IngredientMaster`, il merge riscrive `Ingredient.name` in tutte le ricette (vedi `app/api/admin/ingredients/merge/route.ts`) e la lista si allinea da sola al giro successivo, nessuna modifica necessaria
- Checkbox "comprato" (lista spesa) e avanzamento step (modalità cucina) vivono solo in `localStorage` per menù (`lib/local-store.ts`) — nessuna migrazione Prisma, nessuna persistenza server, coerente con l'approccio già usato per i preferiti
- `Recipe.servingsUnit` (`String?`): unità delle porzioni (es. "teglie da 28cm", "pirofile"); nulla = persone. Formattazione con `formatServings(n, unit)` (lib/types.ts, tollera `undefined` per payload cached). Il controllo porzioni di `RecipeProcedure` mostra l'unità come label; lo scaler resta un rapporto numerico
- `Ingredient.optional` (`Boolean`, default `false`): ingrediente facoltativo, mostrato con `PriceTag` "opzionale" (dettaglio ricetta, lista spesa) e "(opz.)" nel PDF. Nella lista spesa un aggregato è opzionale solo se lo è in **tutte** le ricette che lo usano (`buildShoppingList`)
- `RecipeProgress` (`@@id([adminId, recipeId])`): avanzamento passi della pagina ricetta per admin, per **indice** di step (gli id sono instabili: il PUT ricetta fa delete-recreate) con `stepsCount` come guardia anti-stale. Il PUT `/api/recipes/[id]` cancella i progressi della ricetta quando gli step cambiano. Visitatori anonimi: localStorage (`ricettario:recipe-progress:{id}`). Vedi `lib/recipe-progress.ts`
- `MenuRecipe.cookStartAt` (`DateTime?`): inizio pianificato della ricetta nella timeline cucina (drag della barra, PATCH `/api/menus/[id]/schedule`); nullo = calcolo automatico all'indietro dal servizio. ⚠️ Il PUT `/api/menus/[id]` fa delete-recreate dei `MenuRecipe`: **deve** rileggere e reintegrare i `cookStartAt` esistenti (già gestito) o la pianificazione va persa
- Il riordino righe (ingredienti/step del form ricetta, ricette del menù, categorie) è **solo drag & drop** via `ReorderList`/`ReorderRow` (niente più frecce ▲/▼); le righe del RecipeForm hanno un `uid` client-side (`crypto.randomUUID()`) come key stabile, mai inviato all'API
- **Recensioni (voto 1-10, non più stelle)**: `Review` appartiene sempre a una `Recipe`; `menuId` opzionale distingue l'origine — presente = recensione arrivata dal link di quel menù (badge/tag col nome del menù sulla pagina ricetta), nullo = nota personale dell'admin (promemoria, non una recensione pubblica). Gli ospiti **non possono più** scrivere una recensione direttamente sulla pagina ricetta: l'unico modo è il link pubblico `/recensisci/[token]` (nessun login, protetto dal `Menu.reviewToken` generato alla creazione del menù), condivisibile dall'admin via bottone "Recensioni ospiti" sul dettaglio menù (link + QR, generato server-side con `qrcode`, mai esposto ai visitatori). `MenuReview` (voto al menù intero) è dismesso: nessuna nuova riga viene più creata, resta in schema solo come storico (non più mostrato in UI) perché non è ricostruibile una recensione-ricetta a partire da un voto dato all'intero menù. `Menu.avgRating`/`_count.reviews` (liste e dettaglio) sono ora calcolati aggregando `Menu.recipeReviews` (le `Review` arrivate dal link di quel menù), non più da `MenuReview`

## ⚠️ Next.js 16 — non nel training data

Leggi `node_modules/next/dist/docs/` prima di scrivere codice. Non assumere che le API note siano ancora valide.
