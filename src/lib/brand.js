import { API } from "./api";

/** URL del logo nella misura richiesta; la versione cambia a ogni nuovo logo (aggiorna la cache). */
export function logoUrl(version, size = 256) {
    return `${API}/brand/logo-${size}.png?v=${encodeURIComponent(version || "default")}`;
}

export function shareImageUrl(version) {
    return `${API}/brand/share.jpg?v=${encodeURIComponent(version || "default")}`;
}
