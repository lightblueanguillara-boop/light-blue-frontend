/** Link "click to chat" di WhatsApp: apre WhatsApp con il messaggio già scritto (invio manuale). */

/** Normalizza un numero in formato internazionale senza "+" (es. "333 123 4567" -> "393331234567"). */
export function normalizePhone(raw) {
    if (!raw) return "";
    const trimmed = String(raw).trim();
    let digits = trimmed.replace(/\D/g, "");
    if (trimmed.startsWith("00")) digits = digits.slice(2);
    else if (!trimmed.startsWith("+") && !digits.startsWith("39") && digits.length >= 9 && digits.length <= 10) {
        // numero italiano senza prefisso (cellulari 3xx, fissi 0x)
        digits = "39" + digits;
    }
    return digits.length >= 8 ? digits : "";
}

export function whatsappUrl(phone, text) {
    const n = normalizePhone(phone);
    if (!n) return "";
    return `https://wa.me/${n}?text=${encodeURIComponent(text || "")}`;
}
