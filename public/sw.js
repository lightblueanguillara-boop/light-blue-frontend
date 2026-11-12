/* Service worker dell'app "Light Blue": riceve le notifiche e, al tocco, apre la pagina giusta.
   Non salva dati in cache (il pannello mostra sempre dati aggiornati e nessun dato personale resta sul telefono). */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

function setBadge(count) {
    if (!("setAppBadge" in self.navigator)) return Promise.resolve();
    return (count > 0 ? self.navigator.setAppBadge(count) : self.navigator.clearAppBadge()).catch(() => {});
}

self.addEventListener("push", (event) => {
    let data = {};
    try { data = event.data ? event.data.json() : {}; } catch (e) { data = { body: event.data && event.data.text() }; }
    const title = data.title || "Light Blue";
    const options = {
        body: data.body || "",
        icon: data.icon,
        tag: data.tag,                 // stessa notifica aggiornata invece di duplicata
        renotify: !!data.tag,
        lang: "it",
        data: { url: data.url || "/admin" },
    };
    event.waitUntil(Promise.all([self.registration.showNotification(title, options), setBadge(data.badge)]));
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    // solo pagine del pannello di questo sito
    let path = (event.notification.data && event.notification.data.url) || "/admin";
    if (!path.startsWith("/admin")) path = "/admin";
    const target = new URL(path, self.location.origin).href;

    event.waitUntil((async () => {
        const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
        const app = windows.find((w) => new URL(w.url).origin === self.location.origin && new URL(w.url).pathname.startsWith("/admin"));
        if (app) {
            // app già aperta: prima le diciamo dove andare, poi la portiamo in primo piano
            // (se il sistema rifiuta il primo piano, la navigazione avviene comunque)
            app.postMessage({ type: "navigate", url: path });
            try { await app.focus(); } catch (e) { /* ignorato */ }
            return;
        }
        // app chiusa: si apre con la schermata d'ingresso e atterra sulla pagina della notifica
        await self.clients.openWindow(target);
    })());
});
