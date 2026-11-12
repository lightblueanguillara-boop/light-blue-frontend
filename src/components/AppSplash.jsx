import { useEffect } from "react";
import { onRequestsIdle, pendingRequests } from "../lib/api";

const MIN_VISIBLE_MS = 700;   // la schermata non sparisce "a scatto"
const MAX_WAIT_MS = 6000;     // mai bloccati sulla schermata, anche senza rete
const IDLE_MS = 250;          // nessuna richiesta in corso per questo tempo = dati pronti
const PULSE_MS = 600;
const EXIT_MS = 400;

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/** Attende che non ci siano richieste ai dati in corso (pagina di atterraggio caricata). */
function dataReady() {
    return new Promise((resolve) => {
        let timer = null;
        const check = () => {
            clearTimeout(timer);
            if (pendingRequests() === 0) timer = setTimeout(() => { if (pendingRequests() === 0) { off(); resolve(); } }, IDLE_MS);
        };
        const off = onRequestsIdle(check);
        check();
    });
}

function logoLoaded(img) {
    if (!img || (img.complete && img.naturalWidth)) return Promise.resolve();
    return new Promise((r) => { img.onload = r; img.onerror = r; });
}

/**
 * Schermata d'ingresso dell'app installata: sfondo blu acqua e logo (già nell'HTML, visibile subito).
 * Quando la pagina di atterraggio è pronta il logo pulsa una volta e la schermata si dissolve.
 */
export default function AppSplash() {
    useEffect(() => {
        const root = document.documentElement;
        const el = document.getElementById("app-splash");
        if (!el || !root.classList.contains("app-standalone")) { el?.remove(); return; }
        let cancelled = false;
        (async () => {
            const start = performance.now();
            await Promise.race([
                Promise.all([dataReady(), logoLoaded(el.querySelector("img")), wait(MIN_VISIBLE_MS)]),
                wait(MAX_WAIT_MS),
            ]);
            if (cancelled) return;
            el.classList.add("pulse");
            await wait(PULSE_MS);
            el.classList.add("exit");
            root.classList.remove("app-standalone");           // sfondo della pagina di nuovo chiaro
            document.querySelector('meta[name="theme-color"]')?.setAttribute("content", "#FAF9F6");
            await wait(EXIT_MS);
            el.remove();
            window.__appSplashMs = Math.round(performance.now() - start);   // per le prove
        })();
        return () => { cancelled = true; };
    }, []);
    return null;
}
