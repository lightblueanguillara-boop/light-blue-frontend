import { useEffect, useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";
import { it } from "date-fns/locale";
import "react-day-picker/dist/style.css";
import { toast } from "sonner";
import { Link, useSearchParams } from "react-router-dom";
import Header from "../components/site/Header";
import Footer from "../components/site/Footer";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Checkbox } from "../components/ui/checkbox";
import { Label } from "../components/ui/label";
import { CheckCircle2 } from "lucide-react";
import { api } from "../lib/api";
import { fmtItDate, toIsoDate } from "../lib/date";

const fmt = toIsoDate;

export default function Booking() {
    const [searchParams] = useSearchParams();
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');

    const [range, setRange] = useState({
        from: fromParam ? new Date(fromParam) : undefined,
        to: toParam ? new Date(toParam) : undefined
    });
    
    const [blocked, setBlocked] = useState([]);
    const [touristTax, setTouristTax] = useState("");
    // Modalità impostata dal proprietario: "request" (su richiesta, predefinita) o "instant" (pagamento subito)
    const [mode, setMode] = useState("request");
    const [holdHours, setHoldHours] = useState(24);
    const [requestSent, setRequestSent] = useState(null);
    const isRequest = mode !== "instant";
    const [quote, setQuote] = useState(null);
    const [isRefundable, setIsRefundable] = useState(true);
    const [paymentChoice] = useState("full");
    
    const [form, setForm] = useState({
        guest_name: "",
        guest_email: "",
        guest_phone: "",
        adults: 2,
        children: 0,
        notes: "",
        consent_newsletter: false,
        contact_whatsapp: false,
    });
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        api.get("/villa/info").then((r) => {
            setTouristTax(r.data.tourist_tax_note || "");
            setMode(r.data.booking_mode || "request");
            setHoldHours(r.data.request_hold_hours || 24);
        }).catch(() => {});
    }, []);

    useEffect(() => {
        const today = new Date();
        const start = fmt(today);
        const end = fmt(new Date(today.getFullYear(), today.getMonth() + 12, 0));
        api.get(`/availability?start=${start}&end=${end}`).then((r) => {
            setBlocked(r.data.blocked_dates.map((d) => new Date(d)));
        });
    }, []);

    useEffect(() => {
        if (range?.from && range?.to && range.to > range.from) {
            api.post(`/quote?check_in=${fmt(range.from)}&check_out=${fmt(range.to)}`).then((r) => setQuote(r.data)).catch(() => setQuote(null));
        } else {
            setQuote(null);
        }
    }, [range]);

    const canSubmit = quote?.available && acceptTerms && form.guest_name && form.guest_email && range?.from && range?.to
        && (!isRequest || form.guest_phone.trim().length >= 6);

    const submit = async (e) => {
        e.preventDefault();
        if (!canSubmit) return;
        setSubmitting(true);
        try {
            if (isRequest) {
                const r = await api.post("/bookings/request", {
                    ...form,
                    check_in: fmt(range.from),
                    check_out: fmt(range.to),
                    payment_choice: "full",
                    is_refundable: isRefundable,
                    accept_terms: acceptTerms,
                });
                setRequestSent({ ...r.data, from: range.from, to: range.to });
                window.scrollTo({ top: 0, behavior: "smooth" });
                return;
            }
            const r = await api.post("/bookings/checkout", {
                ...form,
                check_in: fmt(range.from),
                check_out: fmt(range.to),
                payment_choice: "full",
                is_refundable: isRefundable,
                accept_terms: acceptTerms,
                origin_url: window.location.origin,
            });
            window.location.href = r.data.url;
        } catch (err) {
            const detail = err?.response?.data?.detail;
            toast.error(typeof detail === "string" ? detail : "Si è verificato un errore. Riprova.");
        } finally {
            setSubmitting(false);
        }
    };

    const minDate = useMemo(() => new Date(), []);
    
    // Calcola il prezzo visualizzato in base alla scelta
    const displayPrice = quote ? (isRefundable ? quote.refundable_total : quote.non_refundable_total) : 0;

    return (
        <div className="bg-lake-cream min-h-screen w-full overflow-x-hidden">
            <Header />
            
            <section className="mx-auto max-w-7xl px-6 sm:px-10 pt-8 md:pt-12 pb-6 text-center md:text-left">
                <p className="overline text-xs md:text-sm">Prenota il tuo soggiorno</p>
                <h1 className="font-display text-3xl md:text-5xl text-lake-ink mt-3 tracking-tight">
                    {requestSent ? "Ci siamo quasi." : "Seleziona le date."}
                </h1>
                {isRequest && !requestSent && (
                    <p className="mt-3 text-sm text-lake-ink/70 max-w-2xl">
                        Le prenotazioni avvengono su richiesta: scegli le date e invia la richiesta, ti risponderemo entro {holdHours} ore.
                    </p>
                )}
            </section>

            {requestSent ? (
            <section className="mx-auto max-w-2xl px-4 sm:px-10 pb-20" data-testid="request-sent">
                <div className="bg-white border border-lake-border rounded-sm p-8 sm:p-12 text-center space-y-4">
                    <CheckCircle2 className="w-12 h-12 text-lake-blue mx-auto" strokeWidth={1.2} />
                    <h2 className="font-display text-3xl text-lake-ink">Richiesta inviata</h2>
                    <p className="text-lake-ink/75">
                        Grazie {form.guest_name.split(" ")[0]}! Abbiamo ricevuto la tua richiesta per il soggiorno dal{" "}
                        <strong>{fmtItDate(requestSent.from)}</strong> al <strong>{fmtItDate(requestSent.to)}</strong>{" "}
                        (totale €{requestSent.total_price}).
                    </p>
                    <p className="text-lake-ink/75">
                        Ti risponderemo entro {requestSent.hold_hours} ore all'indirizzo <strong>{form.guest_email}</strong>
                        {form.contact_whatsapp ? " o su WhatsApp" : ""}. Nel frattempo le date restano riservate per te e non ti è stato addebitato nulla.
                    </p>
                    <Link to="/" className="mt-4 inline-block px-6 py-3 rounded-sm bg-lake-blue text-white text-sm">Torna alla home</Link>
                </div>
            </section>
            ) : (
            <section className="mx-auto max-w-7xl px-4 sm:px-10 pb-20 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
                
                <div className="lg:col-span-7 bg-white border border-lake-border rounded-sm p-2 sm:p-8 flex justify-center overflow-hidden" data-testid="booking-calendar">
                    <DayPicker
                        mode="range"
                        locale={it}
                        selected={range}
                        onSelect={setRange}
                        disabled={[{ before: minDate }, ...blocked]}
                        numberOfMonths={isMobile ? 1 : 2}
                        showOutsideDays={false}
                        weekStartsOn={1}
                        className="mx-auto"
                        styles={{
                            caption: { color: "#2A333C", textTransform: "capitalize" },
                            day_selected: { background: "#7A93AC", color: "#fff" },
                            day_range_middle: { background: "#D3C7B640", color: "#2A333C" },
                        }}
                    />
                </div>

                <form onSubmit={submit} className="lg:col-span-5 bg-white border border-lake-border rounded-sm p-6 sm:p-8 space-y-6" data-testid="booking-form">
                    <div className="space-y-4">
                        <p className="overline text-[10px] md:text-xs">Dati dell'ospite</p>
                        <div className="grid gap-3">
                            <Input data-testid="guest-name" required placeholder="Nome e cognome" value={form.guest_name} onChange={(e) => setForm({ ...form, guest_name: e.target.value })} />
                            <Input data-testid="guest-email" required type="email" placeholder="Email" value={form.guest_email} onChange={(e) => setForm({ ...form, guest_email: e.target.value })} />
                            <Input data-testid="guest-phone" type="tel" required={isRequest} placeholder={isRequest ? "Telefono (per comunicazioni sulla richiesta)" : "Telefono (opzionale)"} value={form.guest_phone} onChange={(e) => setForm({ ...form, guest_phone: e.target.value })} />
                            
                            <div className="grid grid-cols-2 gap-4 mt-2">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] uppercase font-bold text-lake-ink/60">Adulti</Label>
                                    <Input data-testid="guest-adults" type="number" min={1} max={8} value={form.adults} onChange={(e) => setForm({ ...form, adults: parseInt(e.target.value || 0) })} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] uppercase font-bold text-lake-ink/60">Bambini</Label>
                                    <Input data-testid="guest-children" type="number" min={0} max={6} value={form.children} onChange={(e) => setForm({ ...form, children: parseInt(e.target.value || 0) })} />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5 pt-2">
                            <Label className="text-[10px] uppercase font-bold text-lake-ink/60">Note o richieste speciali</Label>
                            <Textarea 
                                placeholder="Esempio: orario di arrivo, allergie, lettino per neonati..." 
                                className="min-h-[80px] resize-none"
                                value={form.notes} 
                                onChange={(e) => setForm({ ...form, notes: e.target.value })} 
                            />
                        </div>
                    </div>

                    {/* NUOVA SEZIONE: Selezione tipo tariffa */}
                    {quote && (
                        <div className="border-t border-lake-border pt-6 space-y-4">
                            <p className="overline text-[10px] md:text-xs text-lake-ink/60">Scegli il tipo di tariffa</p>
                            
                            <div className="space-y-3">
                                {/* Opzione Rimborsabile */}
                                <div 
                                    onClick={() => setIsRefundable(true)}
                                    className={`p-4 rounded-sm border-2 cursor-pointer transition-all ${
                                        isRefundable 
                                            ? 'border-lake-blue bg-lake-blue/5' 
                                            : 'border-lake-border bg-white hover:border-lake-border/70'
                                    }`}
                                    data-testid="rate-refundable"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                                            isRefundable 
                                                ? 'border-lake-blue bg-lake-blue' 
                                                : 'border-lake-border bg-white'
                                        }`}>
                                            {isRefundable && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-baseline justify-between">
                                                <p className="font-bold text-lake-ink">Tariffa Rimborsabile</p>
                                                <p className="text-lg font-display text-lake-blue font-bold">€{quote.refundable_total}</p>
                                            </div>
                                            <p className="text-sm text-lake-ink/70 mt-1">
                                                Cancellazione gratuita fino a 10 giorni prima dell'arrivo
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Opzione Non Rimborsabile */}
                                <div 
                                    onClick={() => setIsRefundable(false)}
                                    className={`p-4 rounded-sm border-2 cursor-pointer transition-all ${
                                        !isRefundable 
                                            ? 'border-lake-blue bg-lake-blue/5' 
                                            : 'border-lake-border bg-white hover:border-lake-border/70'
                                    }`}
                                    data-testid="rate-non-refundable"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                                            !isRefundable 
                                                ? 'border-lake-blue bg-lake-blue' 
                                                : 'border-lake-border bg-white'
                                        }`}>
                                            {!isRefundable && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-baseline justify-between">
                                                <p className="font-bold text-lake-ink">Tariffa Non Rimborsabile</p>
                                                <div className="text-right">
                                                    <p className="text-lg font-display text-lake-blue font-bold">€{quote.non_refundable_total}</p>
                                                    <p className="text-xs text-green-600 font-bold">Risparmia {quote.discount_percent}%</p>
                                                </div>
                                            </div>
                                            <p className="text-sm text-lake-ink/70 mt-1">
                                                Nessun rimborso in caso di cancellazione o mancata presentazione
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="border-t border-lake-border pt-6 space-y-4">
                        <p className="overline text-[10px] md:text-xs text-lake-ink/60">Riepilogo Soggiorno</p>
                        {range?.from && range?.to ? (
                            <div className="bg-lake-cream/30 p-4 rounded-sm border border-lake-border text-sm text-lake-ink" data-testid="booking-summary">
                                <p className="font-medium text-base mb-2">{fmtItDate(range.from)} — {fmtItDate(range.to)}</p>
                                {quote ? (
                                    <div className="space-y-1 text-lake-ink/80">
                                        <div className="flex justify-between"><span>Notti:</span><span className="font-bold">{quote.nights}</span></div>
                                        <div className="flex justify-between border-t border-lake-border/40 pt-2 mt-2">
                                            <span className="text-lake-ink font-bold">{isRequest ? "Totale soggiorno:" : "Totale da pagare:"}</span>
                                            <span className="text-xl font-display text-lake-blue">€{displayPrice}</span>
                                        </div>
                                        {!quote.available && <p className="text-red-600 text-xs mt-2 font-bold italic">Date non disponibili.</p>}
                                        {touristTax && <p className="text-[11px] text-lake-ink/60 mt-2">{touristTax}</p>}
                                    </div>
                                ) : null}
                            </div>
                        ) : (
                            <p className="text-sm text-lake-ink/60 italic">Seleziona le date per visualizzare il riepilogo.</p>
                        )}
                    </div>

                    <div className="space-y-4">
                        <label className="flex items-start gap-3 text-[11px] text-lake-ink/70 cursor-pointer">
                            <Checkbox data-testid="book-terms" checked={acceptTerms} onCheckedChange={(v) => setAcceptTerms(!!v)} />
                            <span>
                                Ho letto e accetto le <Link to="/condizioni" target="_blank" className="underline">Condizioni di prenotazione</Link>, inclusa la politica di cancellazione della tariffa scelta. <span className="text-red-600">*</span>
                            </span>
                        </label>
                        {isRequest && (
                            <label className="flex items-start gap-3 text-[11px] text-lake-ink/70 cursor-pointer">
                                <Checkbox data-testid="book-whatsapp" checked={form.contact_whatsapp} onCheckedChange={(v) => setForm({ ...form, contact_whatsapp: !!v })} />
                                <span>Potete contattarmi anche su WhatsApp al numero indicato per questa richiesta (facoltativo).</span>
                            </label>
                        )}
                        <label className="flex items-start gap-3 text-[11px] text-lake-ink/70 cursor-pointer">
                            <Checkbox data-testid="book-consent" checked={form.consent_newsletter} onCheckedChange={(v) => setForm({ ...form, consent_newsletter: !!v })} />
                            <span>Desidero ricevere via email offerte e novità (facoltativo, revocabile in qualsiasi momento).</span>
                        </label>
                        <p className="text-[11px] text-lake-ink/60">
                            I tuoi dati sono trattati per gestire la prenotazione come descritto nell'<Link to="/privacy" target="_blank" className="underline">Informativa privacy</Link>.
                        </p>

                        <button type="submit" disabled={!canSubmit || submitting} data-testid="book-submit" className="w-full py-4 rounded-sm bg-lake-blue text-white text-sm hover:bg-lake-ink transition-all disabled:opacity-50 font-bold uppercase tracking-widest shadow-sm">
                            {isRequest
                                ? (submitting ? "Invio in corso..." : "Invia richiesta di prenotazione")
                                : (submitting ? "Reindirizzamento..." : `Conferma e Paga · €${displayPrice || ""}`)}
                        </button>
                        
                        <div className="flex flex-col items-center gap-2">
                            {isRequest ? (
                                <p className="text-[11px] text-lake-ink/60 leading-snug text-center">
                                    Nessun addebito ora. Le date restano riservate per te per {holdHours} ore: se la richiesta viene
                                    accettata riceverai via email un link per pagare in modo sicuro con Stripe e confermare.
                                </p>
                            ) : (
                                <p className="text-[10px] text-lake-ink/50 leading-tight text-center uppercase tracking-tighter">
                                    Pagamento sicuro al 100% via Stripe
                                </p>
                            )}
                        </div>
                    </div>
                </form>
            </section>
            )}
            <Footer />
        </div>
    );
}
