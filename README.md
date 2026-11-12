# Light Blue Anguillara — frontend

Sito pubblico e pannello di gestione della casa vacanze **Light Blue – Anguillara Sabazia**.
React (Create React App + craco), Tailwind CSS, componenti Radix/shadcn.

Il backend (FastAPI) è nel repository `light_blue_anguillara`.

## Sviluppo locale

```bash
npm ci
REACT_APP_BACKEND_URL=http://localhost:8001 npm start
```

## Build di produzione

```bash
npm ci
REACT_APP_BACKEND_URL=https://api.lightblueanguillara.com npm run build
npx serve -s build
```

`REACT_APP_BACKEND_URL` viene inserita nel codice al momento della build: se cambia, serve una nuova build.

## Privacy

Il sito non carica risorse da servizi esterni all'avvio: font e immagine di copertina sono ospitati dal sito,
non ci sono strumenti di analisi o tracciamento. Unica eccezione: la mappa OpenStreetMap nella home (dichiarata nell'Informativa privacy e con avviso sotto la mappa).
Prima di aggiungere script o servizi di terze parti, aggiornare Informativa privacy e Cookie policy
(`src/pages/legal/`) e valutare la necessità di un banner di consenso.
