---
name: ricettario-design
description: Regole di design del Ricettario AN10 (struttura «Pass», blu del logo in tre toni, elementi numerati, icone). Usare PRIMA di creare o modificare qualsiasi interfaccia del progetto — nuove pagine, componenti, bottoni, form, card, icone, colori — così le nuove funzioni restano uguali al resto.
---

# Design del Ricettario AN10

Prima di scrivere UI:

1. Se stai lavorando al restyle, apri `docs/design/RESTYLE-TODO.md` e segui la fase in corso.
2. Leggi `DESIGN.md` (decisioni D1–D7) e, se serve il contesto, `PRODUCT.md`.
3. Apri la tavola `docs/design/elementi-*.png` (sorgente `docs/design/elementi.html`): ogni elemento ha un codice (`3.2`, `8.7`…). Trova l'elemento che corrisponde a ciò che ti serve.
4. **Riusa il componente esistente** di quell'elemento. Se non esiste ancora, crealo una volta sola, con il codice della tavola in un commento (`// Elemento 8.7 · passo corrente`), e usalo ovunque serva.

Regole che non si violano:
- Colori e misure solo dai token di `docs/design/tokens.css` (tabella D2 di `DESIGN.md`); misure in rem, spazi interni ai componenti in em; colori di area solo per riconoscere un'area, mai per uno stato; ogni colore secondario ha un solo significato (arancio = azione/quantità, giallo = tempo, verde = fatto, rosa = elimina/errore).
- Una sola azione arancio per zona.
- Misure fluide (D4): usa le variabili `--h-field`, `--h-btn`, `--h-btn-lg`… invece di altezze fisse; area toccabile ≥ 44px al telefono; campi a 16px su touch.
- Layout fluido (D1): container query sullo spazio del contenitore, non media query per dispositivo (unica eccezione: barra in basso ↔ barra laterale a 700px).
- Visibilità pronta/non pronta = sempre l'occhio (4.8); interruttore a levetta (4.13) solo per le impostazioni.
- iPhone, iPad e PC con le stesse zone (D1): il PC è l'iPad con più spazio, mai un layout a parte.
- Icone: lucide per le azioni generiche, icone del progetto (`components/icons/`) per i concetti del ricettario; mai due icone diverse per lo stesso concetto.
- Niente testo con opacità, niente schede semitrasparenti con testo.

Se un elemento nuovo non rientra nella tavola: proponilo all'utente con un codice nuovo (prossimo numero libero della sezione), poi aggiorna **insieme** tavola, `DESIGN.md` e componente.
