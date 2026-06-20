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
| `lib/api.ts` | Fetch wrapper + `recipeSummarySelect` / `flattenRecipe` helpers |
| `lib/cook-schedule.ts` | `totalLeadMinutes` / `resolveServeAt` / `computeStart` / `startLabel` — calcolo "quando iniziare" una ricetta dato il servizio del menù (data + `servingTime`) |
| `components/ui/ConfirmDialog.tsx` | Dialog conferma con hook `useConfirm()` |
| `components/ui/IngredientCombobox.tsx` | Combobox autocomplete su `IngredientMaster` |
| `components/ui/ColorPicker.tsx` | `ColorPicker` + `PALETTE` + `nextPaletteColor()` — condiviso vocabolario/form |
| `components/ui/CategoryCombobox.tsx` | Cerca/crea categoria al volo (POST `/api/categories`) con color-picker inline |
| `components/ui/TagCombobox.tsx` | Cerca/crea tag al volo (POST `/api/tags`) |
| `components/AppShell.tsx` | Wrapper layout comune |
| `lib/review-style.ts` | `ratingStyle(rating)` — colori card/stelle per voto (5★ oro animato → 1★ rosa) |
| `components/admin/ReviewCard.tsx` | Card recensione (righe: stelle+data / sorgente / autore); badge tipo via `source`; `expand="inline"` o `"dialog"` |
| `components/admin/RecentReviews.tsx` | Dashboard: ultime 5 recensioni miste ricette+menù affiancate (scroll mobile / grid-5 desktop), Dialog |
| `components/admin/ReviewsBrowser.tsx` | Pagina recensioni: ricerca + switcher tab animato (ricette/menù), gruppi per entità |
| `components/recipe/DetailReviewCard.tsx` | Card recensione per pagine dettaglio ricetta **e** menù (espandibile, eliminabile da admin) |
| `components/admin/ChartsSection.tsx` | Grafici dashboard: select grafico + period picker (preset + range custom); fa fetch su `/api/admin/stats` al cambio periodo |
| `components/recipe/RecipePdfButton.tsx` | Tasto "Esporta in PDF" (client): import lazy di `@react-pdf/renderer`, foto→dataURL, download blob |
| `components/recipe/RecipePdfDocument.tsx` | Layout PDF ricetta (`@react-pdf/renderer`) — importato solo dal button, mai a livello pagina. Esporta `pdfStyles` / `PdfFooter` / `RecipePdfContent` riusati dal PDF menù |
| `components/menu/MenuPdfButton.tsx` | Tasto "Esporta PDF" del menù (client): fa fetch dei dettagli ricetta da `/api/recipes/[id]`, import lazy di `@react-pdf/renderer` |
| `components/menu/MenuPdfDocument.tsx` | Layout PDF menù: copertina/intestazione + una pagina per ricetta (riusa `RecipePdfContent`) |
| `app/opengraph-image.tsx` | Immagine OG dinamica (`next/og`) per l'anteprima di condivisione; `metadataBase`/OG/Twitter in `app/layout.tsx`, base = `VERCEL_PROJECT_PRODUCTION_URL` o `NEXT_PUBLIC_SITE_URL` |
| `components/recipe/TagFilterCombobox.tsx` | Combobox ricerca+multi-selezione per filtrare le ricette per tag (no «#»); usato in `RecipeGrid` desktop dropdown + sheet mobile |
| `prisma/prisma.config.ts` | Config connessione Supabase + adapter — non toccare |
| `proxy.ts` (root) | Config proxy Vercel — non toccare |

## Struttura aree principali

```
app/preferiti/          # Preferiti filtrati lato client da localStorage
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
```

## Auth e ruoli

- JWT httpOnly cookie, session helpers in `lib/session.ts`
- Ruoli: `ADMIN` | `SUPERADMIN` — solo superadmin accede a `/admin/utenti/`
- `AuthProvider.tsx` espone `{ username, role, dedication }` a tutto il client
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
- `Menu.servingTime` (`"HH:mm"`, opzionale): orario di servizio. Insieme a `Menu.date` alimenta il countdown "quando iniziare" mostrato sulle card ricetta nel dettaglio menù. Il lead time = somma di **tutti** i minuti degli step (prep+cottura+attesa), fallback `prep+cook` — vedi `lib/cook-schedule.ts`

## ⚠️ Next.js 16 — non nel training data

Leggi `node_modules/next/dist/docs/` prima di scrivere codice. Non assumere che le API note siano ancora valide.
