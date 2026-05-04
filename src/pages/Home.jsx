import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Wifi, Car, Waves, UtensilsCrossed, Ship, Trees, Snowflake, Footprints } from "lucide-react";
import Header from "../components/site/Header";
import Footer from "../components/site/Footer";
import LastMinuteBanner from "../components/site/LastMinuteBanner";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Checkbox } from "../components/ui/checkbox";
import { api } from "../lib/api";

// Real images of Anguillara Sabazia / Lago di Bracciano from Wikimedia Commons
const HERO = "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Anguillara_Sabazia_dal_lago_%281%29.jpg/1920px-Anguillara_Sabazia_dal_lago_%281%29.jpg";
const G1 = "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Italy_Anguillara_2006_2.jpg/1920px-Italy_Anguillara_2006_2.jpg";
const G2 = "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1400&q=85";
const G3 = "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Anguillara_Sabazia_di_notte.jpg/1920px-Anguillara_Sabazia_di_notte.jpg";
const G4 = "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1400&q=85";
const G5 = "https://upload.wikimedia.org/wikipedia/commons/a/a5/Anguillara_Sabazia.jpg";

const services = [
    { icon: Wifi, title: "Wi-Fi", desc: "Connessione veloce in tutto l'appartamento." },
    { icon: Snowflake, title: "Aria condizionata", desc: "Climatizzazione in camera e salotto." },
    { icon: Footprints, title: "Walking distance", desc: "Centro storico, lungolago e spiagge a pochi passi. Senza auto." },
    { icon: UtensilsCrossed, title: "Ristorante in convenzione", desc: "Tavolo riservato — possibilità di servizio direttamente in casa." },
    { icon: Ship, title: "Barche elettriche", desc: "Convenzione con noleggio barche elettriche sul Lago di Bracciano." },
    { icon: Trees, title: "Maneggio", desc: "Convenzione con maneggio locale per escursioni a cavallo." },
    { icon: Waves, title: "Vista lago", desc: "Camera matrimoniale con vista diretta sul Lago di Bracciano." },
    { icon: Car, title: "Accesso discreto", desc: "Check-in riservato nel cuore del centro storico." },
];

export default function Home() {
    const [info, setInfo] = useState(null);
    const [form, setForm] = useState({ name: "", email: "", phone: "", message: "", consent_newsletter: false });
    const [sending, setSending] = useState(false);

    useEffect(() => {
        api.get("/villa/info").then((r) => setInfo(r.data)).catch(() => {});
    }, []);

    const submit = async (e) => {
        e.preventDefault();
        setSending(true);
        try {
            await api.post("/contact", form);
            toast.success("Messaggio inviato. Ti risponderemo al più presto.");
            setForm({ name: "", email: "", phone: "", message: "", consent_newsletter: false });
        } catch {
            toast.error("Errore durante l'invio. Riprova.");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="bg-lake-cream min-h-screen">
            <Header />

            {/* HERO */}
            <section className="relative h-[88vh] w-full overflow-hidden" data-testid="hero-section">
                <img src={HERO} alt="Lago di Bracciano — Anguillara Sabazia" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/55" />
                <div className="relative z-10 mx-auto max-w-7xl px-6 sm:px-10 h-full flex flex-col justify-end pb-20 text-white fade-up">
                    <p className="overline text-white/90">Appartamento vista lago · Anguillara Sabazia</p>
                    <h1 className="font-display font-light text-5xl sm:text-6xl lg:text-7xl tracking-tighter max-w-3xl mt-4">
                        Una piccola perla sul Lago di Bracciano.
                    </h1>
                    <p className="mt-6 max-w-xl text-base text-white/90">
                        Nel cuore del centro storico, a pochi passi dal lungolago. Relax, luce, e tutto ciò che serve raggiungibile a piedi.
                    </p>
                    <div className="mt-10 flex flex-wrap gap-4">
                        <Link to="/book" data-testid="hero-book-btn" className="px-7 py-3.5 rounded-sm bg-white text-lake-ink text-sm font-medium hover:bg-lake-sand transition-colors">
                            Verifica disponibilità
                        </Link>
                        <a href="#gallery" data-testid="hero-gallery-btn" className="px-7 py-3.5 rounded-sm border border-white/60 text-white text-sm hover:bg-white/10 transition-colors">
                            Esplora la casa
                        </a>
                    </div>
                </div>
            </section>

            <LastMinuteBanner />

            {/* ABOUT */}
            <section id="about" className="mx-auto max-w-7xl px-6 sm:px-10 py-28 grid md:grid-cols-12 gap-10" data-testid="about-section">
                <div className="md:col-span-5">
                    <p className="overline">La Casa</p>
                    <h2 className="font-display font-light text-4xl lg:text-5xl tracking-tight text-lake-ink mt-4">Light Blue — semplicità e vista lago.</h2>
                </div>
                <div className="md:col-span-6 md:col-start-7 text-lake-ink/80 leading-relaxed space-y-4">
                    <p>{info?.description}</p>
                    <p>Due passi per raggiungere il lungolago, le spiagge del Lago di Bracciano, i ristoranti, la piazza. Un buon punto di partenza per scoprire il territorio e le sue convenzioni esclusive.</p>
                    <div className="grid grid-cols-3 gap-6 pt-6 border-t border-lake-border">
                        <div><p className="font-display text-3xl text-lake-ink">3</p><p className="text-xs text-lake-ink/60 mt-1">Ospiti</p></div>
                        <div><p className="font-display text-3xl text-lake-ink">1</p><p className="text-xs text-lake-ink/60 mt-1">Camera vista lago</p></div>
                        <div><p className="font-display text-3xl text-lake-ink">1</p><p className="text-xs text-lake-ink/60 mt-1">Bagno con box doccia</p></div>
                    </div>
                </div>
            </section>

            {/* GALLERY - Tetris */}
            <section id="gallery" className="mx-auto max-w-7xl px-6 sm:px-10 py-16" data-testid="gallery-section">
                <div className="flex items-end justify-between mb-10">
                    <div>
                        <p className="overline">Galleria</p>
                        <h2 className="font-display text-4xl text-lake-ink mt-3">Gli spazi</h2>
                    </div>
                </div>
                <div className="grid grid-cols-6 gap-4 auto-rows-[130px]">
                    <img src={G1} alt="Salotto" className="col-span-4 row-span-3 w-full h-full object-cover" />
                    <img src={G2} alt="Camera" className="col-span-2 row-span-2 w-full h-full object-cover" />
                    <img src={G3} alt="Lago di Bracciano" className="col-span-2 row-span-3 w-full h-full object-cover" />
                    <img src={G4} alt="Bagno" className="col-span-3 row-span-2 w-full h-full object-cover" />
                    <img src={G5} alt="Dettaglio" className="col-span-3 row-span-2 w-full h-full object-cover" />
                </div>
            </section>

            {/* SERVICES */}
            <section id="services" className="mx-auto max-w-7xl px-6 sm:px-10 py-28" data-testid="services-section">
                <p className="overline">Servizi & Convenzioni</p>
                <h2 className="font-display text-4xl lg:text-5xl text-lake-ink mt-3 max-w-2xl">Il territorio, a portata di piedi.</h2>
                <div className="grid md:grid-cols-4 gap-6 mt-14">
                    {services.map((s) => (
                        <div key={s.title} className="p-7 bg-white border border-lake-border rounded-sm hover:-translate-y-1 hover:shadow-lg transition-all" data-testid={`service-${s.title.toLowerCase().replace(/\s/g, '-')}`}>
                            <s.icon className="w-6 h-6 text-lake-blue" strokeWidth={1.5} />
                            <p className="font-display text-lg text-lake-ink mt-5">{s.title}</p>
                            <p className="text-sm text-lake-ink/65 mt-2 leading-relaxed">{s.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* MAP */}
            <section id="map" className="mx-auto max-w-7xl px-6 sm:px-10 py-20 grid md:grid-cols-2 gap-12 items-center" data-testid="map-section">
                <div>
                    <p className="overline">Dove siamo</p>
                    <h2 className="font-display text-4xl text-lake-ink mt-3">Anguillara Sabazia, Lago di Bracciano.</h2>
                    <p className="mt-6 text-lake-ink/70 leading-relaxed">Borgo medievale a circa 40 minuti da Roma, affacciato sul Lago di Bracciano. Stazione ferroviaria Roma–Viterbo a breve distanza, servizi tutti raggiungibili a piedi.</p>
                    <div className="mt-6 space-y-1 text-sm text-lake-ink/80" data-testid="contact-info">
                        <p><span className="overline mr-2">Indirizzo</span>{info?.address}</p>
                        <p><span className="overline mr-2">Tel</span>{info?.phone}</p>
                        <p><span className="overline mr-2">Email</span>{info?.email}</p>
                        {info?.cir && <p><span className="overline mr-2">CIR</span>{info.cir}</p>}
                    </div>
                </div>
                <div className="aspect-[4/3] w-full rounded-sm overflow-hidden border border-lake-border">
                    <iframe
                        title="Anguillara Sabazia — Lago di Bracciano"
                        src="https://www.openstreetmap.org/export/embed.html?bbox=12.25%2C42.07%2C12.29%2C42.10&layer=mapnik&marker=42.0884%2C12.2710"
                        className="w-full h-full"
                    />
                </div>
            </section>

            {/* CONTACT */}
            <section id="contact" className="mx-auto max-w-4xl px-6 sm:px-10 py-28" data-testid="contact-section">
                <p className="overline">Contatti</p>
                <h2 className="font-display text-4xl lg:text-5xl text-lake-ink mt-3">Scrivici.</h2>
                <p className="text-lake-ink/70 mt-3">Ti risponderemo entro 24 ore.</p>
                <form onSubmit={submit} className="mt-10 grid md:grid-cols-2 gap-5" data-testid="contact-form">
                    <Input data-testid="contact-name" placeholder="Nome e cognome" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    <Input data-testid="contact-email" placeholder="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    <Input data-testid="contact-phone" placeholder="Telefono (opzionale)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="md:col-span-2" />
                    <Textarea data-testid="contact-message" placeholder="Il tuo messaggio" required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="md:col-span-2" />
                    <label className="md:col-span-2 flex items-start gap-3 text-sm text-lake-ink/70">
                        <Checkbox data-testid="contact-consent" checked={form.consent_newsletter} onCheckedChange={(v) => setForm({ ...form, consent_newsletter: !!v })} />
                        <span>Acconsento a ricevere comunicazioni promozionali in conformità al GDPR. Potrò revocare il consenso in qualsiasi momento.</span>
                    </label>
                    <button type="submit" disabled={sending} data-testid="contact-submit" className="md:col-span-2 justify-self-start px-8 py-3.5 rounded-sm bg-lake-blue text-white text-sm hover:bg-[#678099] transition-colors disabled:opacity-60">
                        {sending ? "Invio..." : "Invia messaggio"}
                    </button>
                </form>
            </section>

            <Footer />
        </div>
    );
}
