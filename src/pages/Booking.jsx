import { useEffect, useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";
import { it } from "date-fns/locale";
import "react-day-picker/dist/style.css";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";
import Header from "../components/site/Header";
import Footer from "../components/site/Footer";
import { Input } from "../components/ui/input";
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
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({ guest_name: "", guest_email: "", guest_phone: "", adults: 2, children: 0, consent_newsletter: false });

    useEffect(() => {
        api.get("/public/bookings/blocked").then(r => setBlocked(r.data.map(d => new Date(d))));
    }, []);

    useEffect(() => {
        if (range?.from && range?.to) {
            api.get(`/public/pricing/quote?start=${fmt(range.from)}&end=${fmt(range.to)}`)
                .then(r => setQuote(r.data))
                .catch(() => setQuote(null));
        } else {
            setQuote(null);
        }
    }, [range]);

    const handleBook = async (e) => {
        e.preventDefault();
        if (!range?.from || !range?.to || !quote?.available) return;
        setSubmitting(true);
        try {
            const res = await api.post("/bookings/checkout", {
                ...form,
                check_in: fmt(range.from),
                check_out: fmt(range.to)
            });
            window.location.href = res.data.url;
        } catch (err) {
            toast.error(err.response?.data?.detail || "Errore durante il checkout.");
            setSubmitting(false);
        }
    };

    const canSubmit = form.guest_name && form.guest_email && range?.from && range?.to && quote?.available;
    const amount = quote?.total;

    return (
        <div className="min-h-screen bg-lake-cream font-sans text-lake-ink">
            <Header />
            <section className="max-w-6xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-16">
                <div className="space-y-8">
                    <div>
                        <h1 className="text-5xl font-display mb-4">Prenota il tuo soggiorno</h1>
                        <p className="text-lake-ink/70 leading-relaxed">Seleziona le date nel calendario. Verrai reindirizzato su Stripe per il pagamento sicuro del totale del soggiorno.</p>
                    </div>
                    <div className="bg-white p-6 border border-lake-border rounded-sm shadow-sm">
                        <DayPicker
                            mode="range"
                            selected={range}
                            onSelect={setRange}
                            locale={it}
                            disabled={blocked}
                            fromDate={new Date()}
                            modifiersStyles={{ selected: { backgroundColor: "#87A2B7", color: "white" } }}
                            className="mx-auto"
                        />
                    </div>
                </div>

                <form onSubmit={handleBook} className="bg-white p-10 border border-lake-border rounded-sm shadow-sm space-y-6">
                    <div className="grid gap-4">
                        <div className="grid gap-2"><Label className="text-xs uppercase tracking-widest font-bold">Nome e Cognome</Label><Input required value={form.guest_name} onChange={e => setForm({ ...form, guest_name: e.target.value })} placeholder="Mario Rossi" /></div>
                        <div className="grid gap-2"><Label className="text-xs uppercase tracking-widest font-bold">Email</Label><Input type="email" required value={form.guest_email} onChange={e => setForm({ ...form, guest_email: e.target.value })} placeholder="mario@esempio.com" /></div>
                        <div className="grid gap-2"><Label className="text-xs uppercase tracking-widest font-bold">Telefono</Label><Input type="tel" value={form.guest_phone} onChange={e => setForm({ ...form, guest_phone: e.target.value })} placeholder="+39..." /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2"><Label className="text-xs uppercase tracking-widest font-bold">Adulti</Label><Input type="number" min="1" max="10" value={form.adults} onChange={e => setForm({ ...form, adults: parseInt(e.target.value) })} /></div>
                            <div className="grid gap-2"><Label className="text-xs uppercase tracking-widest font-bold">Bambini</Label><Input type="number" min="0" max="10" value={form.children} onChange={e => setForm({ ...form, children: parseInt(e.target.value) })} /></div>
                        </div>
                    </div>

                    <div className="p-6 bg-lake-cream border border-lake-border rounded-sm space-y-4">
                        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-lake-ink/50">Riepilogo Soggiorno</p>
                        {range?.from && range?.to ? (
                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <p className="text-sm font-medium">{fmtItDate(range.from)} — {fmtItDate(range.to)}</p>
                                    <p className="text-xs text-lake-ink/60">{quote?.breakdown?.length} notti</p>
                                </div>
                                {quote ? (
                                    <div className="pt-4 border-t border-lake-border/50">
                                        <div className="flex justify-between items-baseline mb-2">
                                            <span className="text-sm">Totale da pagare</span>
                                            <span className="text-2xl font-display">€{quote.total}</span>
                                        </div>
                                        {!quote.available && <p className="text-red-600 text-xs italic">Spiacenti, queste date sono state appena occupate.</p>}
                                    </div>
                                ) : null}
                            </div>
                        ) : (
                            <p className="text-sm text-lake-ink/60 italic">Seleziona le date sul calendario per vedere il prezzo.</p>
                        )}
                    </div>

                    <label className="flex items-start gap-3 text-[11px] text-lake-ink/70 cursor-pointer">
                        <Checkbox checked={form.consent_newsletter} onCheckedChange={(v) => setForm({ ...form, consent_newsletter: !!v })} />
                        <span>Acconsento al trattamento dei dati e a ricevere comunicazioni promozionali.</span>
                    </label>

                    <button type="submit" disabled={!canSubmit || submitting} className="w-full py-4 rounded-sm bg-lake-blue text-white text-sm hover:bg-lake-ink transition-all disabled:opacity-50 font-bold uppercase tracking-widest">
                        {submitting ? "Elaborazione..." : `Paga ora · €${amount || ""}`}
                    </button>
                    <p className="text-[10px] text-lake-ink/50 text-center leading-tight">
                        Pagamento protetto e crittografato tramite Stripe.
                    </p>
                </form>
            </section>
            <Footer />
        </div>
    );
}
