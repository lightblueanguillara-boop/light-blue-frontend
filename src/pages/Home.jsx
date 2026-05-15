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

// Import della libreria Lightbox e relativi stili
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

const HERO = "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Anguillara_Sabazia_dal_lago_%281%29.jpg/1920px-Anguillara_Sabazia_dal_lago_%281%29.jpg";

const services = [
    { icon: Wifi, title: "Wi-Fi", desc: "Connessione veloce in tutto l'appartamento." },
    { icon: Snowflake, title: "Aria condizionata", desc: "Climatizzazione in camera e salotto." },
    { icon: Footprints, title: "Walking distance", desc: "Centro storico, lungolago e spiagge a pochi passi. Senza auto." },
    { icon: UtensilsCrossed, title: "Enogastronomia", desc: "Ristorante in convenzione con possibilità di servizio in casa" },
    { icon: Ship, title: "Escursioni in Barca", desc: "Convenzione con barche elettriche per visite turistiche" },
    { icon: Trees, title: "Passeggiate a Cavallo", desc: "Maneggi nelle vicinanze che organizzano passeggiate a cavallo." },
    { icon: Waves, title: "Vista lago", desc: "Camera matrimoniale con vista diretta sul Lago di Bracciano." },
    { icon: Car, title: "Accesso discreto", desc: "Check-in riservato nel cuore del centro storico." },
];

export default function Home() {
    const [info, setInfo] = useState(null);
    const [images, setImages] = useState([]);
    const [form, setForm] = useState({ name: "", email: "", phone: "", message: "", consent_newsletter: false });
    const [sending, setSending] = useState(false);
    
    // Stato per gestire l'apertura della galleria
    const [index, setIndex] = useState(-1);

    useEffect(() => {
        api.get("/villa/info").then((r) => setInfo(r.data)).catch(() => {});
        
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
        <div className="bg-lake-cream min-h-screen font-sans">
            <Header />

            {/* HERO SECTION */}
            <section className="relative h-[88vh] w-full overflow-hidden">
                <img src={HERO} alt="Lago di Bracciano" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
                
                <div className="relative z-10 mx-auto max-w-7xl px-6 sm:px-10 h-full flex flex-col justify-end pb-20 text-white">
                    <p className="overline !text-white/95 font-semibold tracking-[0.25em] drop-shadow-lg">
                        Appartamento vista lago · Anguillara Sabazia
                    </p>
                    <h1 className="font-display font-light text-5xl sm:text-6xl lg:text-7xl tracking-tighter max-w-3xl mt-4 text-white drop-shadow-md">
                        Una perla sul Lago di Bracciano.
                    </h1>
                    <div className="mt-10 flex flex-wrap gap-4">
                        <Link 
                            to="/book" 
                            className="px-7 py-3.5 rounded-sm font-medium transition-colors 
                                       bg-lake-blue text-white 
                                       sm:bg-white sm:text-lake-ink sm:hover:bg-lake-sand shadow-lg"
                        >
                            <span className="inline sm:hidden">Prenota ora</span>
                            <span className="hidden sm:inline">Verifica disponibilità</span>
                        </Link>
                    </div>
                </div>
            </section>

            <LastMinuteBanner />

            {/* ABOUT */}
            <section id="about" className="mx-auto max-w-7xl px-6 sm:px-10 py-28 grid md:grid-cols-12 gap-10">
                <div className="md:col-span-5">
                    <p className="overline text-lake-blue">La Casa</p>
                    <h2 className="font-display font-light text-4xl lg:text-5xl tracking-tight text-lake-ink mt-4 italic">Light Blue — semplicità e vista lago.</h2>
                </div>
                <div className="md:col-span-6 md:col-start-7 text-lake-ink/80 leading-relaxed space-y-4">
                    <p>{info?.description || "Benvenuti nel cuore di Anguillara Sabazia."}</p>
                    <div className="grid grid-cols-3 gap-6 pt-6 border-t border-lake-border">
                        <div><p className="font-display text-3xl text-lake-ink">4</p><p className="text-[10px] uppercase tracking-widest text-lake-ink/60 mt-1">Ospiti</p></div>
                        <div><p className="font-display text-3xl text-lake-ink">1</p><p className="text-[10px] uppercase tracking-widest text-lake-ink/60 mt-1">Camera</p></div>
                        <div><p className="font-display text-3xl text-lake-ink">1</p><p className="text-[10px] uppercase tracking-widest text-lake-ink/60 mt-1">Bagno</p></div>
                    </div>
                </div>
            </section>

            {/* GALLERY */}
            <section id="gallery" className="mx-auto max-w-7xl px-6 sm:px-10 py-16">
                <div className="mb-10">
                    <p className="overline text-lake-blue">Galleria</p>
                    <h2 className="font-display text-4xl text-lake-ink mt-3 font-light">Atmosfera</h2>
                </div>

                {images.length === 0 ? (
                    <div className="py-20 text-center border border-dashed border-lake-border rounded-sm bg-lake-sand/10">
                        <ImageIcon className="mx-auto text-lake-ink/20 mb-4" size={48} strokeWidth={1} />
                        <p className="text-lake-ink/50 italic font-light">Caricamento della galleria...</p>
                    </div>
                ) : (
                    <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
                        {images.map((img, idx) => (
                            <div 
                                key={img.id || idx} 
                                className="break-inside-avoid overflow-hidden rounded-sm shadow-sm group bg-white border border-lake-border cursor-pointer"
                                onClick={() => setIndex(idx)}
                            >
                                <img 
                                    src={img.url} 
                                    alt={img.caption || "Galleria"} 
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

                <Lightbox
                    index={index}
                    open={index >= 0}
                    close={() => setIndex(-1)}
                    slides={images.map((img) => ({ src: img.url }))}
                />
            </section>

            {/* SERVICES */}
            <section id="services" className="mx-auto max-w-7xl px-6 sm:px-10 py-28">
                <p className="overline text-lake-blue">Servizi & Convenzioni</p>
                <h2 className="font-display text-4xl lg:text-5xl text-lake-ink mt-3 font-light">Il territorio: posizione strategica per esplorare il lago e le sue bellezze</h2>
                <div className="grid md:grid-cols-4 gap-6 mt-14">
                    {services.map((s) => (
                        <div key={s.title} className="p-7 bg-white border border-lake-border rounded-sm hover:-translate-y-1 transition-all">
                            <s.icon className="w-6 h-6 text-lake-blue" strokeWidth={1.5} />
                            <p className="font-display text-lg text-lake-ink mt-5">{s.title}</p>
                            <p className="text-sm text-lake-ink/65 mt-2 leading-relaxed">{s.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* MAP */}
            <section id="map" className="mx-auto max-w-7xl px-6 sm:px-10 py-20 grid md:grid-cols-2 gap-12 items-center">
                <div>
                    <p className="overline text-lake-blue">Dove siamo</p>
                    <h2 className="font-display text-4xl text-lake-ink mt-3 font-light italic">Anguillara Sabazia, Lago di Bracciano.</h2>
                    <div className="mt-6 space-y-3 text-sm text-lake-ink/80">
                        <p><span className="font-semibold uppercase mr-2 text-lake-blue">Indirizzo:</span> {info?.address}</p>
                        <p><span className="font-semibold uppercase mr-2 text-lake-blue">Tel:</span> {info?.phone}</p>
                        <p><span className="font-semibold uppercase mr-2 text-lake-blue">Email:</span> {info?.email}</p>
                    </div>
                </div>
                <div className="aspect-[4/3] w-full rounded-sm overflow-hidden border border-lake-border shadow-inner">
                    <iframe
                        title="Mappa"
                        src="https://www.openstreetmap.org/export/embed.html?bbox=12.26714998483658%2C42.0921838870187%2C12.2703418135643%2C42.093511456304455&layer=mapnik&marker=42.092846679955606%2C12.26874589920044"
                        className="w-full h-full grayscale hover:grayscale-0 transition-all duration-700"
                    />
                </div>
            </section>

            {/* CONTACT FORM */}
            <section id="contact" className="mx-auto max-w-4xl px-6 sm:px-10 py-28">
                <div className="text-center mb-12">
                    <p className="overline text-lake-blue">Contatti</p>
                    <h2 className="font-display text-4xl lg:text-5xl text-lake-ink mt-3 font-light">Scrivici.</h2>
                </div>
                <form onSubmit={submit} className="grid md:grid-cols-2 gap-5 bg-white p-8 rounded-sm border border-lake-border shadow-sm">
                    <Input placeholder="Nome e cognome" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    <Input placeholder="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    <Input placeholder="Telefono (opzionale)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="md:col-span-2" />
                    <Textarea placeholder="Il tuo messaggio" required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="md:col-span-2" />
                    <label className="md:col-span-2 flex items-start gap-3 text-sm text-lake-ink/70">
                        <Checkbox checked={form.consent_newsletter} onCheckedChange={(v) => setForm({ ...form, consent_newsletter: !!v })} />
                        <span>Acconsento al trattamento dati GDPR.</span>
                    </label>
                    <button type="submit" disabled={sending} className="md:col-span-2 w-full py-4 rounded-sm bg-lake-blue text-white text-sm font-medium hover:bg-lake-ink transition-colors">
                        {sending ? "Invio..." : "Invia messaggio"}
                    </button>
                </form>
            </section>

            <Footer />
        </div>
    );
}
