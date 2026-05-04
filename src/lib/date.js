/** Date display utilities — Italian format GG-MM-AAAA. */

export function fmtItDate(input) {
    if (!input) return '';
    let d;
    if (input instanceof Date) {
        d = input;
    } else if (typeof input === 'string') {
        // Expect YYYY-MM-DD or full ISO; for YYYY-MM-DD avoid TZ shift
        if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
            const [y, m, day] = input.split('-');
            return `${day}-${m}-${y}`;
        }
        d = new Date(input);
    } else {
        return '';
    }
    if (isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const y = d.getFullYear();
    return `${day}-${m}-${y}`;
}

export function fmtItDateTime(input) {
    if (!input) return '';
    const d = input instanceof Date ? input : new Date(input);
    if (isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const y = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${day}-${m}-${y} · ${hh}:${mm}`;
}

/** Convert a Date object to ISO YYYY-MM-DD without timezone shift. */
export function toIsoDate(d) {
    if (!d) return null;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}
