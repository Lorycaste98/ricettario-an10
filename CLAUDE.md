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
| `components/admin/ReviewsBrowser.tsx` | Pagina recensioni: ricerca + switcher tab animato — "Ricette" (Review raggruppate per ricetta) / "Menù" (Review raggruppate per menù d'origine, stessa tabella vista da due angoli) |
| `components/recipe/DetailReviewCard.tsx` | Card recensione (ricetta e menù): badge voto 1-10, chip `tag` opzionale (link a menù o ricetta collegata), eliminabile da admin |
| `components/menu/MenuReviewForm.tsx` | Form pubblico "recensisci il menù" (`/recensisci/[token]`): nickname una volta + voto 1-10 per ricetta, nessun login |
| `components/menu/ShareReviewLink.tsx` | Bottone admin "Recensioni ospiti" sul dettaglio menù: apre modal con link `/recensisci/[token]`, copia, QR (generato server-side con `qrcode`) |
| `components/menu/MenuReceivedReviews.tsx` | Pannello admin sul dettaglio menù: recensioni ricetta arrivate dal link di quel menù, eliminabili |
| `components/admin/ChartsSection.tsx` | Grafici dashboard: select grafico + period picker (preset + range custom); fa fetch su `/api/admin/stats` al cambio periodo |
| `components/recipe/RecipePdfButton.tsx` | Tasto "Esporta in PDF" (client): import lazy di `@react-pdf/renderer`, foto→dataURL, download blob |
| `components/recipe/RecipePdfDocument.tsx` | Layout PDF ricetta (`@react-pdf/renderer`) — importato solo dal button, mai a livello pagina. Esporta `pdfStyles` / `PdfFooter` / `RecipePdfContent` riusati dal PDF menù |
| `components/menu/MenuPdfButton.tsx` | Tasto "Esporta PDF" del menù (client): fa fetch dei dettagli ricetta da `/api/recipes/[id]`, import lazy di `@react-pdf/renderer` |
| `components/menu/MenuShoppingList.tsx` | Lista della spesa nel dettaglio menù (solo admin): ricerca, checkbox "comprato" persistite in localStorage per menù, collassata oltre 8 righe con "Vedi tutta la lista" |
| `components/menu/MenuCookMode.tsx` | "Modalità cucina" (`/menu/[id]/cucina`, solo admin): una card per ricetta con stepper avanti/indietro sugli step (uno alla volta, progresso in localStorage per menù), bottone finale "Segna cucinata" → `POST /api/recipes/[id]/cook` |
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
app/menu/[id]/cucina/           # Modalità cucina del menù (solo admin): stepper per ricetta, vedi MenuCookMode
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

## Note critiche

- `/api/keepalive` mantiene attiva la connessione Supabase — non rimuovere
- I preferiti sono solo localStorage — non c'è tabella DB per i preferiti utente
- `IngredientMaster` è il catalogo canonico degli ingredienti; il merge aggiorna tutte le ricette collegate
- `CookLog` registra ogni cottura (una riga per click su "Ho cucinato"): l'API `/api/recipes/[id]/cook` POST crea una riga + incrementa `cookCount`, DELETE rimuove l'ultima riga + decrementa. Lo storico CookLog parte dalle cotture registrate **dopo** l'introduzione della tabella; le cotture precedenti vivono solo in `cookCount` (visibili col periodo "Tutto")
- `Step.kind` (`PREP` | `COOK` | `WAIT`, default `PREP`): tipo di tempo dello step. `prep`/`cook` della ricetta **non** sono derivati a forza — il form suggerisce le somme per tipo e l'admin le applica/modifica (niente sovrascrittura silenziosa dei valori salvati). Usa `toStepKind()` per normalizzare il valore grezzo dal DB
- `Recipe.published` (`Boolean`, default `true`): visibilità della ricetta. Le ricette `published=false` ("non pronta") sono **nascoste ai visitatori** in tutti i percorsi di lettura pubblici (`/`, `/ricette`, `/preferiti`, dettaglio `/ricette/[id]` → `notFound`, `/api/recipes` GET, `/api/search`) — il filtro `where: { published: true }` si applica solo quando **non** c'è sessione admin. Gli admin le vedono ovunque, offuscate + badge "Non pronta" nella `RecipeCard`. Toggle da `/admin/ricette` (switch) o dal dettaglio (`RecipeActions`) via `PATCH /api/recipes/[id]` con `{ published }`. Chi renderizza `RecipeCard` deve includere `published` nel select (è in `recipeSummarySelect`)
- `Recipe.createdAt` è anche la **"data della ricetta"** modificabile dall'admin nel `RecipeForm` (campo `Data`, `<input type="date">`): default = oggi alla creazione, sempre cambiabile. Il form invia `createdAt` come `"YYYY-MM-DD"`; POST/PUT `/api/recipes` lo convertono con `parseDateOnly()` (lib/api.ts) → `Date` a mezzogiorno UTC, ricostruibile con `.toISOString().slice(0, 10)`
- `Menu.servingTime` (`"HH:mm"`, opzionale): orario di servizio. Insieme a `Menu.date` alimenta il countdown "quando iniziare" mostrato sulle card ricetta nel dettaglio menù. Il lead time = somma di **tutti** i minuti degli step (prep+cottura+attesa), fallback `prep+cook` — vedi `lib/cook-schedule.ts`
- Lista della spesa del menù (solo admin, per ora): calcolata al volo in `queryMenuDetail` (`lib/queries.ts`) con `buildShoppingList`, nessuna tabella/snapshot salvato. Raggruppa per `Ingredient.name` normalizzato — quando gli ingredienti verranno unificati via `IngredientMaster`, il merge riscrive `Ingredient.name` in tutte le ricette (vedi `app/api/admin/ingredients/merge/route.ts`) e la lista si allinea da sola al giro successivo, nessuna modifica necessaria
- Checkbox "comprato" (lista spesa) e avanzamento step (modalità cucina) vivono solo in `localStorage` per menù (`lib/local-store.ts`) — nessuna migrazione Prisma, nessuna persistenza server, coerente con l'approccio già usato per i preferiti
- **Recensioni (voto 1-10, non più stelle)**: `Review` appartiene sempre a una `Recipe`; `menuId` opzionale distingue l'origine — presente = recensione arrivata dal link di quel menù (badge/tag col nome del menù sulla pagina ricetta), nullo = nota personale dell'admin (promemoria, non una recensione pubblica). Gli ospiti **non possono più** scrivere una recensione direttamente sulla pagina ricetta: l'unico modo è il link pubblico `/recensisci/[token]` (nessun login, protetto dal `Menu.reviewToken` generato alla creazione del menù), condivisibile dall'admin via bottone "Recensioni ospiti" sul dettaglio menù (link + QR, generato server-side con `qrcode`, mai esposto ai visitatori). `MenuReview` (voto al menù intero) è dismesso: nessuna nuova riga viene più creata, resta in schema solo come storico (non più mostrato in UI) perché non è ricostruibile una recensione-ricetta a partire da un voto dato all'intero menù. `Menu.avgRating`/`_count.reviews` (liste e dettaglio) sono ora calcolati aggregando `Menu.recipeReviews` (le `Review` arrivate dal link di quel menù), non più da `MenuReview`

## ⚠️ Next.js 16 — non nel training data

Leggi `node_modules/next/dist/docs/` prima di scrivere codice. Non assumere che le API note siano ancora valide.
