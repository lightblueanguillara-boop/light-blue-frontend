import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Lock, Plus, Euro, X, MessageCircle, ExternalLink, Check, XCircle, Unlock, RotateCcw } from "lucide-react";
import { api } from "../../lib/api";
import { fmtItDate } from "../../lib/date";
import { useRequestActions } from "../../components/admin/RequestActions";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";

// ---------------------------------------------------------------- date (stringhe ISO, niente fusi orari)
const pad = (n) => String(n).padStart(2, "0");
const iso = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
const parse = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(Date.UTC(y, m - 1, d)); };
const fmt = (dt) => iso(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate());
const addDays = (s, n) => { const dt = parse(s); dt.setUTCDate(dt.getUTCDate() + n); return fmt(dt); };
const diffDays = (a, b) => Math.round((parse(b) - parse(a)) / 86400000);
const todayIso = () => { const t = new Date(); return iso(t.getFullYear(), t.getMonth(), t.getDate()); };
const MONTHS = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
const WEEKDAYS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

// Stati che occupano il calendario (stessa lista del backend)
const BLOCKING = ["pending", "confirmed", "external", "request", "awaiting_payment", "blocked"];

// ---------------------------------------------------------------- colori e legenda
function kindOf(b) {
    if (b.status === "blocked") return "blocked";
    if (b.status === "request") return "request";
    if (b.status === "awaiting_payment") return "awaiting";
    if (b.status === "pending") return "pending";
    if (b.source === "airbnb") return "airbnb";
    if (b.source === "booking") return "booking";
    return "confirmed";
}
const KINDS = {
    confirmed: { label: "Confermata", bar: "bg-emerald-600 text-white", dot: "bg-emerald-600" },
    request: { label: "Richiesta da valutare", bar: "bg-sky-500 text-white", dot: "bg-sky-500" },
    awaiting: { label: "Attende pagamento", bar: "bg-violet-500 text-white", dot: "bg-violet-500" },
    pending: { label: "Pagamento in corso", bar: "bg-amber-400 text-amber-950", dot: "bg-amber-400" },
    airbnb: { label: "Airbnb", bar: "bg-rose-500 text-white", dot: "bg-rose-500" },
    booking: { label: "Booking.com", bar: "bg-blue-800 text-white", dot: "bg-blue-800" },
    blocked: { label: "Date bloccate", bar: "bg-slate-500 text-white bg-[repeating-linear-gradient(135deg,transparent_0_6px,rgba(255,255,255,.18)_6px_12px)]", dot: "bg-slate-500" },
};
const STATUS_LABEL = {
    pending: "Pagamento online in corso", confirmed: "Confermata", external: "Importata dal calendario esterno",
    request: "Richiesta da valutare", awaiting_payment: "Accettata, attende pagamento", blocked: "Date bloccate",
};

const barLabel = (b) => (b.status === "blocked" ? (b.notes || "Bloccato") : b.guest_name || "Ospite");

export default function AdminCalendar() {
    const navigate = useNavigate();
    const today = todayIso();
    const [month, setMonth] = useState(() => { const t = new Date(); return { y: t.getFullYear(), m: t.getMonth() }; });
    const [items, setItems] = useState([]);
    const [prices, setPrices] = useState({});
    const [sel, setSel] = useState(null); // { start, end } = notti selezionate (incluse)
    const [selected, setSelected] = useState(null); // prenotazione aperta nel dettaglio
    const [priceInput, setPriceInput] = useState("");
    const [blockNote, setBlockNote] = useState("");
    const [busy, setBusy] = useState(false);

    // griglia: dal lunedì prima del 1° alla domenica dopo l'ultimo giorno del mese
    const grid = useMemo(() => {
        const first = iso(month.y, month.m, 1);
        const lead = (parse(first).getUTCDay() + 6) % 7;
        const start = addDays(first, -lead);
        const daysInMonth = new Date(Date.UTC(month.y, month.m + 1, 0)).getUTCDate();
        const weeks = Math.ceil((lead + daysInMonth) / 7);
        return { start, end: addDays(start, weeks * 7), weeks, first, last: iso(month.y, month.m, daysInMonth) };
    }, [month]);

    const loadBookings = useCallback(() => {
        api.get("/admin/bookings").then((r) => setItems(r.data.filter((b) => BLOCKING.includes(b.status)))).catch(() => toast.error("Errore nel caricamento delle prenotazioni"));
    }, []);
    const loadPrices = useCallback(() => {
        api.get("/admin/calendar", { params: { start: grid.start, end: grid.end } })
            .then((r) => setPrices(Object.fromEntries(r.data.days.map((d) => [d.date, d]))))
            .catch(() => toast.error("Errore nel caricamento dei prezzi"));
    }, [grid.start, grid.end]);
    const reload = useCallback(() => { loadBookings(); loadPrices(); }, [loadBookings, loadPrices]);

    useEffect(() => { loadBookings(); }, [loadBookings]);
    useEffect(() => { loadPrices(); }, [loadPrices]);

    const requestActions = useRequestActions(() => { setSelected(null); reload(); });

    // notte occupata -> prenotazione
    const nightOwner = useMemo(() => {
        const map = {};
        items.forEach((b) => {
            for (let d = b.check_in; d < b.check_out; d = addDays(d, 1)) map[d] = b;
        });
        return map;
    }, [items]);

    // barre per settimana (griglia a mezze giornate: arrivo e partenza a metà giorno)
    const weeks = useMemo(() => {
        const out = [];
        for (let w = 0; w < grid.weeks; w++) {
            const ws = addDays(grid.start, w * 7);
            const wl = addDays(ws, 6);
            const days = Array.from({ length: 7 }, (_, i) => addDays(ws, i));
            const bars = items
                .filter((b) => b.check_in <= wl && b.check_out >= ws)
                .map((b) => {
                    const startCol = b.check_in < ws ? 1 : 2 * diffDays(ws, b.check_in) + 2;
                    const endCol = b.check_out > wl ? 15 : 2 * diffDays(ws, b.check_out) + 2;
                    return { b, startCol, endCol, contL: b.check_in < ws, contR: b.check_out > wl };
                })
                .filter((x) => x.endCol > x.startCol)
                .sort((a, c) => a.startCol - c.startCol);
            const lanes = [];
            bars.forEach((x) => {
                let lane = lanes.findIndex((end) => end <= x.startCol);
                if (lane === -1) { lane = lanes.length; lanes.push(0); }
                lanes[lane] = x.endCol;
                x.lane = lane;
            });
            out.push({ days, bars, lanes: Math.max(1, lanes.length) });
        }
        return out;
    }, [grid, items]);

    const monthStays = useMemo(() => items
        .filter((b) => b.check_in <= grid.last && b.check_out > grid.first)
        .sort((a, b) => (a.check_in < b.check_in ? -1 : 1)), [items, grid]);

    // ---------------------------------------------------------------- selezione
    const rangeFree = (a, b) => { for (let d = a; d <= b; d = addDays(d, 1)) if (nightOwner[d]) return false; return true; };
    const clickDay = (d) => {
        if (nightOwner[d]) { setSelected(nightOwner[d]); return; }
        if (d < today) return;
        if (!sel || sel.end !== sel.start || d < sel.start) { setSel({ start: d, end: d }); return; }
        if (rangeFree(sel.start, d)) setSel({ start: sel.start, end: d });
        else { setSel({ start: d, end: d }); toast.info("L'intervallo contiene notti già occupate: selezione ricominciata"); }
    };
    const inSel = (d) => sel && d >= sel.start && d <= sel.end;
    const selNights = sel ? diffDays(sel.start, sel.end) + 1 : 0;
    const selCheckout = sel ? addDays(sel.end, 1) : null;
    const selTotal = useMemo(() => {
        if (!sel) return 0;
        let t = 0;
        for (let d = sel.start; d <= sel.end; d = addDays(d, 1)) t += prices[d]?.price || 0;
        return Math.round(t * 100) / 100;
    }, [sel, prices]);
    const clearSel = () => { setSel(null); setPriceInput(""); setBlockNote(""); };

    // ---------------------------------------------------------------- azioni
    const run = async (fn, ok) => {
        setBusy(true);
        try { await fn(); toast.success(ok); clearSel(); reload(); }
        catch (e) { const d = e?.response?.data?.detail; toast.error(typeof d === "string" ? d : "Operazione non riuscita"); }
        finally { setBusy(false); }
    };
    const blockDates = () => run(() => api.post("/admin/blocks", { check_in: sel.start, check_out: selCheckout, note: blockNote }), "Date bloccate");
    const setPrice = () => {
        const p = parseFloat(String(priceInput).replace(",", "."));
        if (!(p > 0)) { toast.error("Inserisci un prezzo valido"); return; }
        run(() => api.put("/admin/calendar/prices", { start: sel.start, end: selCheckout, price: p }), `Prezzo di €${p} applicato a ${selNights} notti`);
    };
    const resetPrice = () => run(() => api.put("/admin/calendar/prices", { start: sel.start, end: selCheckout, price: null }), "Prezzi normali ripristinati");
    const removeBlock = (b) => run(() => api.delete(`/admin/blocks/${b.id}`), "Blocco rimosso").then(() => setSelected(null));
    const newBooking = () => navigate(`/admin/bookings?new=1&ci=${sel.start}&co=${selCheckout}&price=${selTotal}`);

    const shiftMonth = (n) => setMonth(({ y, m }) => { const t = new Date(y, m + n, 1); return { y: t.getFullYear(), m: t.getMonth() }; });
    const goToday = () => { const t = new Date(); setMonth({ y: t.getFullYear(), m: t.getMonth() }); };

    return (
        <div className="p-4 sm:p-10 space-y-6" data-testid="admin-calendar-page">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="overline text-lake-ink/60 font-bold tracking-widest leading-none">Gestione Proprietà</p>
                    <h1 className="font-display text-4xl text-lake-ink mt-2">Calendario</h1>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => shiftMonth(-1)} aria-label="Mese precedente" data-testid="cal-prev"><ChevronLeft className="w-4 h-4" /></Button>
                    <div className="min-w-[150px] text-center font-display text-xl text-lake-ink capitalize" data-testid="cal-month">{MONTHS[month.m]} {month.y}</div>
                    <Button variant="outline" size="icon" onClick={() => shiftMonth(1)} aria-label="Mese successivo" data-testid="cal-next"><ChevronRight className="w-4 h-4" /></Button>
                    <Button variant="outline" onClick={goToday}>Oggi</Button>
                </div>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-lake-ink/70">
                {Object.entries(KINDS).map(([k, v]) => (
                    <span key={k} className="inline-flex items-center gap-1.5"><span className={`w-3 h-3 rounded-sm ${v.dot}`} />{v.label}</span>
                ))}
                <span className="inline-flex items-center gap-1.5"><span className="font-bold text-lake-blue">€</span>prezzo personalizzato</span>
            </div>

            <p className="text-xs text-lake-ink/55">Clicca su un soggiorno per aprirlo. Clicca su un giorno libero e poi su un altro per selezionare delle notti: potrai bloccarle, crearci una prenotazione o cambiarne il prezzo.</p>

            {/* ---------------- griglia del mese */}
            <div className="bg-white border border-lake-border rounded-sm overflow-hidden select-none">
                <div className="grid grid-cols-7 bg-slate-50 border-b border-lake-border">
                    {WEEKDAYS.map((w) => <div key={w} className="py-2 text-center text-[10px] uppercase font-bold text-lake-ink/50">{w}</div>)}
                </div>
                {weeks.map((wk, wi) => (
                    <div key={wi} className="relative border-b border-lake-border last:border-b-0">
                        <div className="grid grid-cols-7">
                            {wk.days.map((d) => {
                                const inMonth = d >= grid.first && d <= grid.last;
                                const past = d < today;
                                const owner = nightOwner[d];
                                const p = prices[d];
                                return (
                                    <button
                                        key={d}
                                        type="button"
                                        onClick={() => clickDay(d)}
                                        data-testid={`day-${d}`}
                                        style={{ minHeight: `${44 + wk.lanes * 24}px` }}
                                        className={`relative flex flex-col items-start justify-start border-r border-lake-border last:border-r-0 text-left p-1.5 sm:p-2 transition-colors
                                            ${inMonth ? "" : "bg-slate-50/70"} ${past ? "bg-slate-100/70 cursor-default" : "hover:bg-lake-blue/5"}
                                            ${inSel(d) ? "!bg-lake-blue/20 ring-2 ring-inset ring-lake-blue" : ""}`}
                                    >
                                        <span className={`text-xs sm:text-sm font-semibold ${inMonth ? "text-lake-ink" : "text-lake-ink/35"} ${d === today ? "inline-grid place-items-center w-6 h-6 rounded-full bg-lake-ink text-white" : ""}`}>
                                            {Number(d.slice(8))}
                                        </span>
                                        {!owner && !past && p && (
                                            <span className={`absolute bottom-1 right-1.5 text-[10px] sm:text-[11px] ${p.source === "custom" ? "font-bold text-lake-blue" : "text-lake-ink/45"}`} title={p.source === "custom" ? `Prezzo personalizzato (normale €${p.base_price})` : p.rate_name || "Prezzo base"}>
                                                €{Math.round(p.price)}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                        {/* barre dei soggiorni */}
                        <div className="absolute inset-x-0 top-7 sm:top-8 grid grid-cols-[repeat(14,minmax(0,1fr))] pointer-events-none" style={{ gridAutoRows: "22px", rowGap: "2px" }}>
                            {wk.bars.map(({ b, startCol, endCol, contL, contR, lane }) => (
                                <button
                                    key={b.id + wi}
                                    type="button"
                                    onClick={() => setSelected(b)}
                                    data-testid={`bar-${b.id}`}
                                    title={`${barLabel(b)} · ${fmtItDate(b.check_in)} → ${fmtItDate(b.check_out)}`}
                                    style={{ gridColumn: `${startCol} / ${endCol}`, gridRow: lane + 1 }}
                                    className={`pointer-events-auto mx-[1px] px-1.5 text-[10px] sm:text-[11px] font-semibold truncate text-left shadow-sm hover:brightness-110
                                        ${KINDS[kindOf(b)].bar} ${contL ? "rounded-l-none" : "rounded-l-full"} ${contR ? "rounded-r-none" : "rounded-r-full"}`}
                                >
                                    {barLabel(b)}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* ---------------- pannello selezione */}
            {sel && (
                <div className="bg-white border-2 border-lake-blue rounded-sm p-5 space-y-4 sticky bottom-4 shadow-lg" data-testid="selection-panel">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="font-display text-lg text-lake-ink">
                                {selNights} {selNights === 1 ? "notte" : "notti"} selezionate
                            </p>
                            <p className="text-sm text-lake-ink/70">
                                Arrivo <strong>{fmtItDate(sel.start)}</strong> · Partenza <strong>{fmtItDate(selCheckout)}</strong> · Prezzo attuale totale <strong>€{selTotal}</strong>
                            </p>
                            {selNights === 1 && <p className="text-xs text-lake-ink/50 mt-1">Clicca un altro giorno libero per estendere la selezione.</p>}
                        </div>
                        <button onClick={clearSel} className="text-lake-ink/50 hover:text-lake-ink" aria-label="Annulla selezione"><X className="w-5 h-5" /></button>
                    </div>
                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs">Blocca queste date</Label>
                            <Input placeholder="Nota (es. uso personale, manutenzione)" value={blockNote} maxLength={300} onChange={(e) => setBlockNote(e.target.value)} />
                            <Button onClick={blockDates} disabled={busy} className="w-full bg-slate-700 hover:bg-slate-800" data-testid="block-btn"><Lock className="w-4 h-4 mr-2" /> Blocca date</Button>
                            <p className="text-[11px] text-lake-ink/50">Non prenotabili dal sito e segnalate come occupate ad Airbnb e Booking.</p>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">Prezzo per notte (€)</Label>
                            <Input type="number" min="1" step="1" placeholder="Es. 150" value={priceInput} onChange={(e) => setPriceInput(e.target.value)} data-testid="price-input" />
                            <div className="flex gap-2">
                                <Button onClick={setPrice} disabled={busy} className="flex-1 bg-lake-blue hover:bg-lake-blue/90" data-testid="price-btn"><Euro className="w-4 h-4 mr-1" /> Applica</Button>
                                <Button onClick={resetPrice} disabled={busy} variant="outline" title="Ripristina le tariffe normali"><RotateCcw className="w-4 h-4" /></Button>
                            </div>
                            <p className="text-[11px] text-lake-ink/50">Vale per le notti selezionate e ha la precedenza sulle tariffe stagionali.</p>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">Prenotazione</Label>
                            <Button onClick={newBooking} variant="outline" className="w-full" data-testid="new-booking-btn"><Plus className="w-4 h-4 mr-2" /> Nuova prenotazione manuale</Button>
                            <p className="text-[11px] text-lake-ink/50">Apre il modulo con date e prezzo già compilati.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* ---------------- soggiorni del mese */}
            <div className="bg-white border border-lake-border rounded-sm">
                <p className="px-5 py-3 border-b border-lake-border text-[11px] uppercase font-bold tracking-wider text-lake-ink/60">Soggiorni e blocchi di {MONTHS[month.m]}</p>
                {monthStays.length === 0 && <p className="px-5 py-6 text-sm italic text-lake-ink/40">Nessun soggiorno in questo mese.</p>}
                <ul className="divide-y divide-lake-border">
                    {monthStays.map((b) => (
                        <li key={b.id}>
                            <button onClick={() => setSelected(b)} className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-slate-50">
                                <span className={`w-2.5 h-8 rounded-sm shrink-0 ${KINDS[kindOf(b)].dot}`} />
                                <span className="flex-1 min-w-0">
                                    <span className="block font-semibold text-lake-ink truncate">{barLabel(b)}</span>
                                    <span className="block text-xs text-lake-ink/60">{fmtItDate(b.check_in)} → {fmtItDate(b.check_out)} · {diffDays(b.check_in, b.check_out)} notti · {KINDS[kindOf(b)].label}</span>
                                </span>
                                {b.total_price > 0 && <span className="text-sm font-bold text-lake-blue">€{b.total_price}</span>}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            {/* ---------------- dettaglio */}
            <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
                <DialogContent className="sm:max-w-[480px]" data-testid="calendar-detail">
                    {selected && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="font-display text-2xl text-lake-ink flex items-center gap-2">
                                    <span className={`w-3 h-3 rounded-sm ${KINDS[kindOf(selected)].dot}`} /> {barLabel(selected)}
                                </DialogTitle>
                                <DialogDescription>{STATUS_LABEL[selected.status] || selected.status}{selected.source && selected.status !== "blocked" ? ` · ${selected.source}` : ""}</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-2 text-sm text-lake-ink/85">
                                <p><strong>{fmtItDate(selected.check_in)}</strong> → <strong>{fmtItDate(selected.check_out)}</strong> · {diffDays(selected.check_in, selected.check_out)} notti</p>
                                {selected.status !== "blocked" && (
                                    <>
                                        {selected.guest_email && <p>{selected.guest_email}</p>}
                                        {selected.guest_phone && <p>{selected.guest_phone}{selected.contact_whatsapp ? " · WhatsApp ok" : ""}</p>}
                                        {selected.adults > 0 && <p>{selected.adults} adulti, {selected.children || 0} bambini</p>}
                                        {selected.total_price > 0 && <p>Totale <strong>€{selected.total_price}</strong></p>}
                                    </>
                                )}
                                {selected.notes && <p className="italic bg-amber-50 border border-amber-100 p-2 rounded-sm">"{selected.notes}"</p>}
                            </div>
                            <DialogFooter className="flex-wrap gap-2 sm:gap-2 sm:justify-start">
                                {selected.status === "request" && (
                                    <>
                                        <Button onClick={() => requestActions.askApprove(selected)} className="bg-emerald-600 hover:bg-emerald-700"><Check className="w-4 h-4 mr-1" /> Accetta</Button>
                                        <Button onClick={() => requestActions.askReject(selected)} variant="outline" className="text-rose-600 border-rose-200"><XCircle className="w-4 h-4 mr-1" /> Rifiuta</Button>
                                    </>
                                )}
                                {selected.status === "awaiting_payment" && (
                                    <Button onClick={() => requestActions.askReject(selected)} variant="outline" className="text-rose-600 border-rose-200"><XCircle className="w-4 h-4 mr-1" /> Annulla richiesta</Button>
                                )}
                                {selected.guest_phone && (
                                    <Button variant="outline" onClick={() => requestActions.openWhatsapp(selected)} className="text-green-700 border-green-200"><MessageCircle className="w-4 h-4 mr-1" /> WhatsApp</Button>
                                )}
                                {selected.status === "blocked" ? (
                                    <Button variant="outline" onClick={() => removeBlock(selected)} disabled={busy} data-testid="unblock-btn"><Unlock className="w-4 h-4 mr-1" /> Rimuovi blocco</Button>
                                ) : selected.source !== "airbnb" && selected.source !== "booking" ? (
                                    <Button variant="outline" onClick={() => navigate(`/admin/bookings?open=${encodeURIComponent(selected.id)}`)}><ExternalLink className="w-4 h-4 mr-1" /> Apri in Prenotazioni</Button>
                                ) : null}
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {requestActions.dialogs}
        </div>
    );
}
