import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { 
    Wifi, Car, Waves, UtensilsCrossed, Ship, 
    Trees, Snowflake, Footprints, ImageIcon 
} from "lucide-react";
import Header from "../components/site/Header";
import Footer from "../components/site/Footer";
import LastMinuteBanner from "../components/site/LastMinuteBanner";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Checkbox } from "../components/ui/checkbox";
import api from "../lib/api";

// Link corretti e fallback
const HERO = "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Anguillara_Sabazia_dal_lago_%281%29.jpg/1920px-Anguillara_Sabazia_dal_lago_%281%29.jpg";

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
    const [images, setImages] = useState([]);
    const [form, setForm] = useState({ name: "", email: "", phone: "", message: "", consent_newsletter: false });
    const [sending, setSending] = useState(false);

    useEffect(() => {
        // Carica info villa
        api.get("/villa/info").then((r) => setInfo(r.data)).catch(() => {});
        
        // Carica immagini galleria pubblica
        api.get("/gallery")
            .then((r) => {
                const data = Array.isArray(r) ? r : (r?.data || []);
                setImages(data);
            })
            .catch((err) => console.error("Errore gallery:", err));
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
            <section className="relative h-[88vh] w-full overflow-hidden">
                <img src={HERO} alt="Lago di Bracciano" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/55" />
                <div className="relative z-10 mx-auto max-w-7xl px-6 sm:px-10 h-full flex flex-col justify-end pb-20 text-white">
                    <p className="overline text-white/90 font-medium tracking-[0.2em]">Appartamento vista lago · Anguillara Sabazia</p>
                    <h1 className="font-display font-light text-5xl sm:text-6xl lg:text-7xl tracking-tighter max-w-3xl mt-4">
                        Una piccola perla sul Lago di Bracciano.
                    </h1>
                    <p className="mt-6 max-w-xl text-base text-white/90">Nel cuore del centro storico, a pochi passi dal lungolago.</p>
                    <div className="mt-10 flex flex-wrap gap-4">
                        <Link to="/book" className="px-7 py-3.5 rounded-sm bg-white text-lake-ink text-sm font-medium hover:bg-lake-sand transition-colors">
                            Verifica disponibilità
                        </Link>
                        <a href="#gallery" className="px-7 py-3.5 rounded-sm border border-white/60 text-white text-sm hover:bg-white/10 transition-colors">
                            Esplora la casa
                        </a>
                    </div>
                </div>
            </section>

            <LastMinuteBanner />

            {/* ABOUT */}
            <section id="about" className="mx-auto max-w-7xl px-6 sm:px-10 py-28 grid md:grid-cols-12 gap-10">
                <div className="md:col-span-5">
                    <p className="overline text-lake-blue">La Casa</p>
                    <h2 className="font-display font-light text-4xl lg:text-5xl tracking-tight text-lake-ink mt-4">Light Blue — semplicità e vista lago.</h2>
                </div>
                <div className="md:col-span-6 md:col-start-7 text-lake-ink/80 leading-relaxed space-y-4">
                    <p>{info?.description || "Benvenuti a Light Blue, il vostro rifugio nel cuore di Anguillara Sabazia."}</p>
                    <div className="grid grid-cols-3 gap-6 pt-6 border-t border-lake-border">
                        <div><p className="font-display text-3xl text-lake-ink">3</p><p className="text-xs text-lake-ink/60 mt-1 uppercase tracking-widest">Ospiti</p></div>
                        <div><p className="font-display text-3xl text-lake-ink">1</p><p className="text-xs text-lake-ink/60 mt-1 uppercase tracking-widest">Camera</p></div>
                        <div><p className="font-display text-3xl text-lake-ink">1</p><p className="text-xs text-lake-ink/60 mt-1 uppercase tracking-widest">Bagno</p></div>
                    </div>
                </div>
            </section>

            {/* GALLERY MASONRY (MOSTRA TUTTE LE FOTO) */}
            <section id="gallery" className="mx-auto max-w-7xl px-6 sm:px-10 py-16">
                <div className="mb-10">
                    <p className="overline text-lake-blue">Galleria</p>
                    <h2 className="font-display text-4xl text-lake-ink mt-3 font-light">Gli spazi</h2>
                </div>

                {images.length === 0 ? (
                    <div className="py-20 text-center border border-dashed border-lake-border rounded-sm bg-lake-sand/10">
                        <ImageIcon className="mx-auto text-lake-ink/20 mb-4" size={48} strokeWidth={1} />
                        <p className="text-lake-ink/50 italic font-light">Caricamento della galleria...</p>
                    </div>
                ) : (
                    <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
                        {images.map((img, index) => (
                            <div key={img.id || index} className="break-inside-avoid overflow-hidden rounded-sm shadow-sm group bg-white border border-lake-border">
                                <img 
                                    src={img.url} 
                                    alt={img.caption || `Galleria ${index}`} 
                                    className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                                {img.caption && (
                                    <div className="p-3 bg-white">
                                        <p className="text-[10px] uppercase tracking-widest text-lake-blue font-bold">{img.category}</p>
                                        <p className="text-xs text-lake-ink/70 mt-1 italic">{img.caption}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* SERVICES */}
            <section id="services" className="mx-auto max-w-7xl px-6 sm:px-10 py-28">
                <p className="overline text-lake-blue">Servizi & Convenzioni</p>
                <h2 className="font-display text-4xl lg:text-5xl text-lake-ink mt-3 font-light">Il territorio, a portata di piedi.</h2>
                <div className="grid md:grid-cols-4 gap-6 mt-14">
                    {services.map((s) => (
                        <div key={s.title} className="p-7 bg-white border border-lake-border rounded-sm hover:-translate-y-1 hover:shadow-md transition-all">
                            <s.icon className="w-6 h-6 text-lake-blue" strokeWidth={1.5} />
                            <p className="font-display text-lg text-lake-ink mt-5">{s.title}</p>
                            <p className="text-sm text-lake-ink/65 mt-2 leading-relaxed">{s.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* MAP */}
            <section id="map" className="mx-auto max-w-7xl px-6 sm:px-10 py-20 grid md:grid-cols-2 gap-12 items-center border-t border-lake-border/30">
                <div>
                    <p className="overline text-lake-blue">Dove siamo</p>
                    <h2 className="font-display text-4xl text-lake-ink mt-3 font-light">Anguillara Sabazia, Lago di Bracciano.</h2>
                    <p className="mt-6 text-lake-ink/70 leading-relaxed">Borgo medievale affacciato sul Lago di Bracciano, a soli 40 minuti da Roma.</p>
                    <div className="mt-6 space-y-3 text-sm text-lake-ink/80">
                        <p><span className="font-semibold uppercase tracking-tighter mr-2 text-lake-blue">Indirizzo</span> {info?.address}</p>
                        <p><span className="font-semibold uppercase tracking-tighter mr-2 text-lake-blue">Tel</span> {info?.phone}</p>
                        <p><span className="font-semibold uppercase tracking-tighter mr-2 text-lake-blue">Email</span> {info?.email}</p>
                    </div>
                </div>
                <div className="aspect-[4/3] w-full rounded-sm overflow-hidden border border-lake-border shadow-inner">
                    <iframe
                        title="Mappa"
                        src="https://www.openstreetmap.org/export/embed.html?bbox=12.25%2C42.07%2C12.29%2C42.10&layer=mapnik&marker=42.0884%2C12.2710"
                        className="w-full h-full grayscale hover:grayscale-0 transition-all duration-700"
                    />
                </div>
            </section>

            {/* CONTACT */}
            <section id="contact" className="mx-auto max-w-4xl px-6 sm:px-10 py-28">
                <div className="text-center mb-12">
                    <p className="overline text-lake-blue">Contatti</p>
                    <h2 className="font-display text-4xl lg:text-5xl text-lake-ink mt-3 font-light">Scrivici per info o prenotazioni.</h2>
                </div>
                <form onSubmit={submit} className="grid md:grid-cols-2 gap-5 bg-white p-8 rounded-sm border border-lake-border shadow-sm">
                    <Input placeholder="Nome e cognome" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    <Input placeholder="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    <Input placeholder="Telefono (opzionale)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="md:col-span-2" />
                    <Textarea placeholder="Il tuo messaggio" required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="md:col-span-2" />
                    <label className="md:col-span-2 flex items-start gap-3 text-sm text-lake-ink/70 cursor-pointer">
                        <Checkbox checked={form.consent_newsletter} onCheckedChange={(v) => setForm({ ...form, consent_newsletter: !!v })} />
                        <span>Acconsento al trattamento dei dati personali secondo le normative GDPR.</span>
                    </label>
                    <button type="submit" disabled={sending} className="md:col-span-2 w-full py-4 rounded-sm bg-lake-blue text-white text-sm font-medium hover:bg-lake-ink transition-colors disabled:opacity-50">
                        {sending ? "Invio in corso..." : "Invia messaggio"}
                    </button>
                </form>
            </section>

            <Footer />
        </div>
    );
}
</section>
