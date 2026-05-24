import { useEffect, useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";
import { it } from "date-fns/locale";
import "react-day-picker/dist/style.css";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";
import Header from "../components/site/Header";
import Footer from "../components/site/Footer";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea"; // Assicurati di avere questo componente
import { Checkbox } from "../components/ui/checkbox";
import { Label } from "../components/ui/label";
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
    const [quote, setQuote] = useState(null);
    const [paymentChoice] = useState("full"); // Stato fisso, non modificabile dall'utente
    
    const [form, setForm] = useState({
        guest_name: "",
        guest_email: "",
        guest_phone: "",
        adults: 2,
        children: 0,
        notes: "",
        consent_newsletter: false,
    });
    const [submitting, setSubmitting] = useState(false);

    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
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

    const canSubmit = quote?.available && form.guest_name && form.guest_email && range?.from && range?.to;

    const submit = async (e) => {
        e.preventDefault();
        if (!canSubmit) return;
        setSubmitting(true);
        try {
            const r = await api.post("/bookings/checkout", {
                ...form,
                check_in: fmt(range.from),
                check_out: fmt(range.to),
                payment_choice: "full",
                origin_url: window.location.origin,
            });
            window.location.href = r.data.url;
        } catch (err) {
            toast.error(err?.response?.data?.detail || "Errore nel checkout");
            setSubmitting(false);
        }
    };

    const minDate = useMemo(() => new Date(), []);
    const amount = quote ? quote.total : 0;

    return (
        <div className="bg-lake-cream min-h-screen w-full overflow-x-hidden">
            <Header />
            
            <section className="mx-auto max-w-7xl px-6 sm:px-10 pt-8 md:pt-12 pb-6 text-center md:text-left">
                <p className="overline text-xs md:text-sm">Prenota il tuo soggiorno</p>
                <h1 className="font-display text-3xl md:text-5xl text-lake-ink mt-3 tracking-tight">
                    Seleziona le date.
                </h1>
            </section>

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
                            <Input data-testid="guest-phone" placeholder="Telefono (opzionale)" value={form.guest_phone} onChange={(e) => setForm({ ...form, guest_phone: e.target.value })} />
                            
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

                    <div className="border-t border-lake-border pt-6 space-y-4">
                        <p className="overline text-[10px] md:text-xs text-lake-ink/60">Riepilogo Soggiorno</p>
                        {range?.from && range?.to ? (
                            <div className="bg-lake-cream/30 p-4 rounded-sm border border-lake-border text-sm text-lake-ink" data-testid="booking-summary">
                                <p className="font-medium text-base mb-2">{fmtItDate(range.from)} — {fmtItDate(range.to)}</p>
                                {quote ? (
                                    <div className="space-y-1 text-lake-ink/80">
                                        <div className="flex justify-between"><span>Notti:</span><span className="font-bold">{quote.nights}</span></div>
                                        <div className="flex justify-between border-t border-lake-border/40 pt-2 mt-2">
                                            <span className="text-lake-ink font-bold">Totale da pagare:</span>
                                            <span className="text-xl font-display text-lake-blue">€{quote.total}</span>
                                        </div>
                                        {!quote.available && <p className="text-red-600 text-xs mt-2 font-bold italic">Date non disponibili.</p>}
                                    </div>
                                ) : null}
                            </div>
                        ) : (
                            <p className="text-sm text-lake-ink/60 italic">Seleziona le date per visualizzare il riepilogo.</p>
                        )}
                    </div>

                    <div className="space-y-4">
                        <label className="flex items-start gap-3 text-[11px] text-lake-ink/70 cursor-pointer">
                            <Checkbox data-testid="book-consent" checked={form.consent_newsletter} onCheckedChange={(v) => setForm({ ...form, consent_newsletter: !!v })} />
                            <span>Desidero ricevere offerte speciali e aggiornamenti (GDPR).</span>
                        </label>

                        <button type="submit" disabled={!canSubmit || submitting} data-testid="book-submit" className="w-full py-4 rounded-sm bg-lake-blue text-white text-sm hover:bg-lake-ink transition-all disabled:opacity-50 font-bold uppercase tracking-widest shadow-sm">
                            {submitting ? "Reindirizzamento..." : `Conferma e Paga · €${amount || ""}`}
                        </button>
                        
                        <div className="flex flex-col items-center gap-2">
                            <p className="text-[10px] text-lake-ink/50 leading-tight text-center uppercase tracking-tighter">
                                Pagamento sicuro al 100% via Stripe
                            </p>
                            <div className="flex gap-2 opacity-40 grayscale scale-75">
                                {/* Qui puoi inserire icone carte se le hai */}
                            </div>
                        </div>
                    </div>
                </form>
            </section>
            <Footer />
        </div>
    );
}
