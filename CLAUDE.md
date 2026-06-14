# Ricettario AN10

Applicazione Next.js 16 per gestione ricette, menu e recensioni. Include area admin protetta, autenticazione JWT, upload immagini e statistiche.

## Stack

- **Framework:** Next.js 16 (App Router) — React 19
- **DB:** PostgreSQL via Supabase — ORM Prisma 7
- **Auth:** JWT con `jose`, sessioni in `lib/session.ts`
- **Upload immagini:** Cloudinary (`lib/upload.ts`)
- **Stile:** Tailwind CSS v4
- **Icone:** Lucide React — usare sempre lucide per nuove icone
- **Grafici:** Recharts (solo area admin)
- **Deploy:** Vercel

## Comandi

```bash
npm run dev          # dev server
npm run build        # prisma generate + next build
npm run start        # produzione
npm run lint         # eslint
npm run seed         # popola il DB (prisma/seed.ts)
npm run create-admin # crea utente admin (prisma/create-admin.ts)
```

## Struttura

```
app/
  page.tsx                        # Home pubblica
  layout.tsx                      # Layout root con AuthProvider
  login/page.tsx                  # Login

  ricette/[id]/page.tsx           # Dettaglio ricetta pubblica
  ricette/[id]/RecipeActions.tsx  # Azioni (salva, cucina ecc.)

  menu/page.tsx                   # Lista menu pubblica
  menu/[id]/page.tsx              # Dettaglio menu
  menu/[id]/MenuReviewSection.tsx # Recensioni menu

  admin/page.tsx                  # Dashboard admin
  admin/vocabolario/              # Gestione tag/categorie (VocabolarioClient.tsx)
  admin/ricette/nuova/            # Crea ricetta
  admin/ricette/[id]/             # Modifica ricetta
  admin/menu/                     # CRUD menu
  admin/import/                   # Import da JSON (ImportJsonClient.tsx)

app/api/
  auth/login|logout|me|password/  # Autenticazione
  recipes/                        # CRUD ricette + cook + reviews
  menus/                          # CRUD menu + reviews
  categories/                     # CRUD categorie
  tags/                           # CRUD tag
  reviews/[id]/                   # Modifica/elimina singola recensione
  search/                         # Ricerca full-text
  upload/                         # Upload immagini Cloudinary
  keepalive/                      # Ping DB per evitare cold start Supabase
  admin/import/                   # Import bulk JSON

components/
  ui/                             # Button, Input, Badge, Modal — componenti base
  recipe/                         # RecipeCard, RecipeGrid, RecipeForm, CookCounter, ReviewSection, RecipeProcedure
  menu/                           # MenuCard, MenuForm
  admin/                          # ChartsSection (Recharts)
  Navbar.tsx
  AuthProvider.tsx                # Context auth globale

lib/
  db.ts        # Client Prisma (singleton)
  api.ts       # Fetch wrapper per chiamate client → API
  types.ts     # Tipi TypeScript condivisi
  session.ts   # Helpers JWT (crea/legge/invalida sessione)
  upload.ts    # Helpers Cloudinary

prisma/
  schema.prisma       # Schema DB
  seed.ts             # Seed dati
  create-admin.ts     # Script crea admin
  data/ricettario.json
```

## Convenzioni

- Tipizzazione TypeScript rigorosa — no `any`, usare `unknown` se necessario
- Tipi condivisi in `lib/types.ts`
- Chiamate API lato client sempre tramite `lib/api.ts`
- Client Prisma sempre da `lib/db.ts` (mai istanziare direttamente)
- Icone: usare `lucide-react` — non introdurre altre librerie di icone
- Animazioni: Tailwind CSS — non c'è uno standard, valutare caso per caso
- Stile: Tailwind CSS v4 — no CSS modules, no styled-components
- Componenti UI riutilizzabili in `components/ui/`
- Dopo ogni modifica allo schema Prisma: `npx prisma generate`

## Auth e ruoli

- Sessione JWT gestita in `lib/session.ts` con `jose`
- Le route `/admin/*` sono protette lato server
- Le API admin verificano il JWT prima di ogni operazione
- `AuthProvider.tsx` espone il contesto auth a tutto il client

## Note importanti

- Il DB è su Supabase con pool via `@prisma/adapter-pg` — non modificare la config di connessione senza verificare `prisma/prisma.config.ts` e `prisma.config.ts`
- L'API `/api/keepalive` esiste per mantenere attiva la connessione Supabase — non rimuoverla
- Il file `proxy.ts` nella root gestisce configurazione proxy — non modificarlo senza sapere l'impatto sul deploy Vercel

## ⚠️ Next.js 16 — versione non nel training data

Questa app usa Next.js 16 che ha breaking changes rispetto alle versioni precedenti.
Prima di scrivere codice leggi la documentazione in `node_modules/next/dist/docs/`.
Rispetta i deprecation notice — non assumere che le API che conosci siano ancora valide.