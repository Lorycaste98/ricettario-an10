# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Il cuoco (proprietario, admin).** Unico utente vero e quotidiano. Crea e modifica ricette e menù, li consulta e ci cucina sopra. Usa iPad e iPhone per **tutto**, senza divisione netta fra dispositivi: l'iPad spesso appoggiato in cucina (anche in orizzontale), l'iPhone ovunque.
- **Lo sviluppatore (admin).** Consulta il sito per verificare le modifiche che rilascia. Non è un pubblico da progettare a parte.
- **Gli ospiti dei menù.** Ricevono il link `/recensisci/[token]` dopo una cena e votano le ricette (1-10) senza login, quasi sempre dal telefono. È l'unico punto in cui il sito parla con persone esterne.
- I visitatori anonimi del sito pubblico oggi non esistono in pratica: il sito pubblico va mantenuto funzionante (le ricette non pronte restano nascoste) ma non guida le decisioni.

## Product Purpose

Ricettario personale del cuoco: archivio delle sue ricette (ingredienti, passi con tempi e tipo, foto, sezioni, quantità per passo), strumento per cucinarle (avanzamento passi, timer, «Sto cucinando», riproporzionamento delle dosi) e per organizzare menù per cene con ospiti (lista della spesa, pianificazione cucina sulla timeline, recensioni degli ospiti). Successo: il cuoco trova la ricetta in pochi tocchi, la segue senza perdere il segno con le mani occupate, e prepara un menù senza fogli di carta a parte.

## Positioning

È il ricettario **di una persona sola**, costruito sul suo modo di cucinare: passi con tempo e tipo (preparazione/cottura/attesa) che alimentano timer e pianificazione, quantità ripartite per passo, menù con orario di servizio da cui si calcola quando iniziare ogni ricetta, recensioni degli ospiti raccolte col link della cena. Non è un social di ricette né un sito di contenuti.

## Operating Context

- In cucina: dispositivo appoggiato, mani sporche o occupate, distanza di un braccio, schermo che non deve spegnersi durante i timer; più ricette in parallelo.
- Prima della cena: comporre il menù, fare la spesa dal telefono spuntando la lista, pianificare gli orari.
- Dopo la cena: condividere link/QR delle recensioni con gli ospiti, leggere i voti.
- Inserimento ricette: avviene anche da telefono/tablet; i form sono lunghi (ingredienti, passi, legami passo-ingrediente) e vanno compilati con il touch.
- **Attività secondaria in valutazione:** il cuoco sta pensando a un'attività di cucina a domicilio. La sezione Costi del menù (spesa, manodopera, altri costi, ricarico, prezzo a persona, margine) serve a farsi un'idea dei prezzi: è esplorativa, non un gestionale.

## Capabilities and Constraints

- Stack esistente da preservare: Next.js 16 App Router, React 19, Prisma/Supabase, Tailwind v4, deploy Vercel. Vedi `CLAUDE.md` per modelli, rotte e regole.
- Funzioni da preservare nel redesign (contenuto e comportamento, non l'aspetto): libreria ricette con ricerca/filtri/ordinamenti, preferiti per account, dettaglio ricetta con avanzamento passi e timer, «Sto cucinando», riproporzionamento, PDF ricetta/menù, menù con lista spesa, costi, note, modalità cucina con timeline, recensioni ospiti con link/QR, voto personale, dashboard e gestione admin (ricette, menù, ingredienti, categorie/tag, utenti, recensioni, profilo).
- Dati veri a disposizione: circa 224 ricette, 6 menù, 1154 ingredienti a catalogo, 15 categorie, 100 tag (dalla dashboard di produzione, 14/11/2026). Molte ricette non hanno foto: il layout deve reggere senza immagini.
- Interfaccia in italiano.

## Brand Commitments

- Nome: «Ricettario AN10», logo `AN10` esistente (`public/an10.svg`): quadrato blu `#0A7EA4` con posate e scritta «AN10» bianche in carattere da macchina da scrivere (Courier).
- Richiesta esplicita dell'utente (15/11/2026): la palette del redesign deve essere **in linea con il logo**, costruita sul blu `#0A7EA4`.
- Richiesta esplicita dell'utente per il redesign: **rifare tutto con stile uguale o simile per gli elementi gemelli o fratelli** (stessi componenti per stesse funzioni in ricette, menù e admin), e ripensare la **disposizione** degli elementi, non solo l'aspetto. Le sei direzioni visive di novembre 2026 (comanda, maiolica, editoriale, schedario, lavagna, quaderno, in `.playwright-mcp/mockups2-3`) non hanno convinto.

## Evidence on Hand

- Ricette, menù e foto reali nel database di produzione (foto su Cloudinary).
- Recensioni reali degli ospiti dai link dei menù.
- Nessuna testimonianza, cliente o prezzo pubblico: la cucina a domicilio non è avviata, non va presentata come servizio esistente.

## Product Principles

1. **Touch first, su entrambi i dispositivi.** Ogni operazione si fa comodamente con un dito su iPhone e su iPad, in verticale e in orizzontale; il desktop è il caso secondario.
2. **Cucinare senza perdere il segno.** Durante la cottura conta il passo corrente, il prossimo e i timer; tutto il resto si fa da parte.
3. **Stessa funzione, stesso componente.** Ricette, menù e admin condividono gli stessi pattern per le stesse cose (liste, card, barre azioni, form, recensioni).
4. **Il cuoco prima del visitatore.** Le schermate si progettano per chi ci lavora ogni giorno; il pubblico (ospiti delle recensioni) riceve un percorso breve e chiaro.

## Accessibility & Inclusion

- Bersagli touch generosi (almeno 44px) e testo leggibile a distanza di un braccio in cucina.
- Contrasto affidabile: oggi lo sfondo a gradiente fisso rende il contrasto variabile durante lo scroll (vedi `CLAUDE.md`), da non ripetere.
- I campi dei form pubblici restano a 16px su iOS per evitare lo zoom al focus.
