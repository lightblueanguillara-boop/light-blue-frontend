import { useEffect, useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";
import { it } from "date-fns/locale";
import "react-day-picker/dist/style.css";
import { toast } from "sonner";
import Header from "../components/site/Header";
import Footer from "../components/site/Footer";
import { Input } from "../components/ui/input";
import { Checkbox } from "../components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Label } from "../components/ui/label";
import { api } from "../lib/api";
import { fmtItDate, toIsoDate } from "../lib/date";

const fmt = toIsoDate;

export default function Booking() {
    const [range, setRange] = useState();
    const [blocked, setBlocked] = useState([]);
    const [quote, setQuote] = useState(null);
    const [paymentChoice, setPaymentChoice] = useState("deposit");
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
                payment_choice: paymentChoice,
                origin_url: window.location.origin,
            });
            window.location.href = r.data.url;
        } catch (err) {
            toast.error(err?.response?.data?.detail || "Errore nel checkout");
            setSubmitting(false);
        }
    };

    const minDate = useMemo(() => new Date(), []);
    const amount = quote ? (paymentChoice === "full" ? quote.total : quote.deposit_amount) : 0;

    return (
        <div className="bg-lake-cream min-h-screen">
            <Header />
            <section className="mx-auto max-w-7xl px-6 sm:px-10 pt-12 pb-6" data-testid="booking-page">
                <p className="overline">Prenota il tuo soggiorno</p>
                <h1 className="font-display text-4xl lg:text-5xl text-lake-ink mt-3 tracking-tight">Seleziona le date.</h1>
            </section>

            <section className="mx-auto max-w-7xl px-6 sm:px-10 pb-20 grid lg:grid-cols-12 gap-10">
                <div className="lg:col-span-7 bg-white border border-lake-border rounded-sm p-8" data-testid="booking-calendar">
                    <DayPicker
                        mode="range"
                        locale={it}
                        selected={range}
                        onSelect={setRange}
                        disabled={[{ before: minDate }, ...blocked]}
                        numberOfMonths={2}
                        showOutsideDays={false}
                        weekStartsOn={1}
                        styles={{
                            caption: { color: "#2A333C", textTransform: "capitalize" },
                            day_selected: { background: "#7A93AC", color: "#fff" },
                            day_range_middle: { background: "#D3C7B640", color: "#2A333C" },
                        }}
                    />
                </div>

                <form onSubmit={submit} className="lg:col-span-5 bg-white border border-lake-border rounded-sm p-8 space-y-5" data-testid="booking-form">
                    <div>
                        <p className="overline">Ospite principale</p>
                        <div className="grid gap-3 mt-4">
                            <Input data-testid="guest-name" required placeholder="Nome e cognome" value={form.guest_name} onChange={(e) => setForm({ ...form, guest_name: e.target.value })} />
                            <Input data-testid="guest-email" required type="email" placeholder="Email" value={form.guest_email} onChange={(e) => setForm({ ...form, guest_email: e.target.value })} />
                            <Input data-testid="guest-phone" placeholder="Telefono (opzionale)" value={form.guest_phone} onChange={(e) => setForm({ ...form, guest_phone: e.target.value })} />
                            <div className="grid grid-cols-2 gap-3">
                                <Input data-testid="guest-adults" type="number" min={1} max={8} placeholder="Adulti" value={form.adults} onChange={(e) => setForm({ ...form, adults: parseInt(e.target.value || 0) })} />
                                <Input data-testid="guest-children" type="number" min={0} max={6} placeholder="Bambini" value={form.children} onChange={(e) => setForm({ ...form, children: parseInt(e.target.value || 0) })} />
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-lake-border pt-5">
                        <p className="overline">Modalità di pagamento</p>
                        <RadioGroup value={paymentChoice} onValueChange={setPaymentChoice} className="mt-4 grid gap-3" data-testid="payment-choice">
                            <label className="flex items-start gap-3 p-4 border border-lake-border rounded-sm cursor-pointer hover:bg-lake-cream">
                                <RadioGroupItem value="deposit" id="r-dep" data-testid="radio-deposit" />
                                <div>
                                    <Label htmlFor="r-dep" className="font-medium text-lake-ink">Acconto ({quote ? `€${quote.deposit_amount}` : `${quote?.deposit_percent ?? 30}%`})</Label>
                                    <p className="text-xs text-lake-ink/60 mt-1">Blocca la prenotazione. Saldo da versare successivamente.</p>
                                </div>
                            </label>
                            <label className="flex items-start gap-3 p-4 border border-lake-border rounded-sm cursor-pointer hover:bg-lake-cream">
                                <RadioGroupItem value="full" id="r-full" data-testid="radio-full" />
                                <div>
                                    <Label htmlFor="r-full" className="font-medium text-lake-ink">Pagamento totale {quote ? `(€${quote.total})` : ""}</Label>
                                    <p className="text-xs text-lake-ink/60 mt-1">Saldo 100% subito. Nulla da pagare al check-in.</p>
                                </div>
                            </label>
                        </RadioGroup>
                    </div>

                    <div className="border-t border-lake-border pt-5 space-y-2">
                        <p className="overline">Riepilogo</p>
                        {range?.from && range?.to ? (
                            <div className="text-sm text-lake-ink" data-testid="booking-summary">
                                <p>Dal <strong>{fmtItDate(range.from)}</strong> al <strong>{fmtItDate(range.to)}</strong></p>
                                {quote ? (
                                    <div className="mt-2 space-y-1">
                                        <p>Notti: <strong>{quote.nights}</strong></p>
                                        <p>Totale soggiorno: <strong>€{quote.total}</strong></p>
                                        <p>Da pagare ora: <strong className="text-lake-blue">€{amount}</strong></p>
                                        {!quote.available && <p className="text-red-600 text-xs">Alcune date non sono disponibili.</p>}
                                    </div>
                                ) : null}
                            </div>
                        ) : (
                            <p className="text-sm text-lake-ink/60">Seleziona le date per vedere il riepilogo.</p>
                        )}
                    </div>

                    <label className="flex items-start gap-3 text-xs text-lake-ink/70">
                        <Checkbox data-testid="book-consent" checked={form.consent_newsletter} onCheckedChange={(v) => setForm({ ...form, consent_newsletter: !!v })} />
                        <span>Acconsento a ricevere comunicazioni promozionali (GDPR). Revocabile in qualsiasi momento.</span>
                    </label>

                    <button type="submit" disabled={!canSubmit || submitting} data-testid="book-submit" className="w-full py-3.5 rounded-sm bg-lake-blue text-white text-sm hover:bg-[#678099] transition-colors disabled:opacity-50">
                        {submitting ? "Attendi..." : `Procedi al pagamento${amount ? ` · €${amount}` : ""}`}
                    </button>
                    <p className="text-[11px] text-lake-ink/50 text-center">Pagamento sicuro con Stripe · Carta, PayPal, Klarna, Satispay, Bonifico SEPA (in base ai metodi abilitati sull'account Stripe in modalità live)</p>
                </form>
            </section>
            <Footer />
        </div>
    );
}
