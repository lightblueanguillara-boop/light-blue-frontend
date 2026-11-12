// Genera public/manifest.webmanifest prima di build/avvio: l'app "Light Blue" (solo pannello admin).
// Le icone sono servite dal backend e seguono il logo caricato in Impostazioni.
const fs = require("fs");
const path = require("path");

const api = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/$/, "");
const icon = (name, sizes, purpose) => ({ src: `${api}/api/brand/${name}`, sizes, type: "image/png", purpose });

const manifest = {
    name: "Light Blue",
    short_name: "Light Blue",
    description: "Gestione prenotazioni di Light Blue - Anguillara Sabazia",
    lang: "it",
    id: "/admin",
    start_url: "/admin",
    scope: "/admin",
    display: "standalone",
    orientation: "portrait",
    // schermata d'ingresso blu acqua (stesso colore di public/index.html e del backend)
    background_color: "#2FA4C7",
    theme_color: "#2FA4C7",
    icons: [
        icon("logo-192.png", "192x192", "any"),
        icon("logo-512.png", "512x512", "any"),
        icon("logo-maskable-512.png", "512x512", "maskable"),
    ],
};

fs.writeFileSync(path.join(__dirname, "..", "public", "manifest.webmanifest"), JSON.stringify(manifest, null, 2) + "\n");
console.log(`manifest.webmanifest generato (icone da ${api || "stesso dominio"})`);
