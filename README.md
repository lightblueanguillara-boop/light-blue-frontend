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

## Logo, anteprima dei link e app sul telefono

- Logo e immagine di anteprima si cambiano da **Impostazioni → Logo e anteprima**: il backend genera
  favicon, icone dell'app, logo per sito ed email (`/api/brand/...`).
- `public/manifest.webmanifest` (app "Light Blue", solo pannello `/admin`) è generato da
  `scripts/gen-manifest.js` prima di `npm start` / `npm run build`, usando `REACT_APP_BACKEND_URL`.
- I tag Open Graph in `public/index.html` danno titolo, descrizione e immagine alle anteprime di WhatsApp,
  Facebook e Telegram.
