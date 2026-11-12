import { api } from "./api";

/** Notifiche sul telefono: registrazione del service worker e iscrizione del dispositivo. */

export const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
export const isStandalone = () => window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
export const pushSupported = () => "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

export async function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return null;
    try {
        return await navigator.serviceWorker.register("/sw.js", { scope: "/admin" });
    } catch (e) {
        return null;
    }
}

function urlBase64ToUint8Array(base64) {
    const padding = "=".repeat((4 - (base64.length % 4)) % 4);
    const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
    return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export async function currentSubscription() {
    const reg = await registerServiceWorker();
    return reg ? reg.pushManager.getSubscription() : null;
}

/** Chiede il permesso (deve partire da un tocco dell'utente) e iscrive questo dispositivo. */
export async function enablePush() {
    const { data: cfg } = await api.get("/admin/push/config");
    if (!cfg.enabled) throw new Error("Le notifiche non sono ancora configurate sul server.");
    const permission = await Notification.requestPermission();
    if (permission !== "granted") throw new Error("Permesso negato: abilita le notifiche per Light Blue nelle impostazioni del telefono.");
    const reg = await registerServiceWorker();
    if (!reg) throw new Error("Questo browser non supporta le notifiche.");
    await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(cfg.public_key) });
    const json = sub.toJSON();
    const { data } = await api.post("/admin/push/subscribe", { endpoint: json.endpoint, keys: json.keys });
    return data;
}

export async function disablePush(serverId) {
    const sub = await currentSubscription();
    if (sub) await sub.unsubscribe().catch(() => {});
    if (serverId) await api.delete(`/admin/push/subscriptions/${serverId}`).catch(() => {});
}

/** Numero sull'icona dell'app (richieste da valutare + messaggi nuovi). */
export async function refreshAppBadge() {
    if (!("setAppBadge" in navigator)) return;
    try {
        const { data } = await api.get("/admin/push/badge");
        if (data.count > 0) await navigator.setAppBadge(data.count); else await navigator.clearAppBadge();
    } catch (e) { /* non bloccante */ }
}

/** Identificativo casuale di questo dispositivo (per l'avviso "nuovo accesso al pannello"). */
export function deviceId() {
    try {
        let id = localStorage.getItem("lv_device_id");
        if (!id) { id = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2)) ; localStorage.setItem("lv_device_id", id); }
        return id;
    } catch (e) { return null; }
}
