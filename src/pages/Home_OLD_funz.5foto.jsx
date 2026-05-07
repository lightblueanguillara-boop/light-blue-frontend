import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Wifi, Car, Waves, UtensilsCrossed, Ship, Trees, Snowflake, Footprints, ImageIcon } from "lucide-react"; // Aggiunto ImageIcon
import Header from "../components/site/Header";
import Footer from "../components/site/Footer";
import LastMinuteBanner from "../components/site/LastMinuteBanner";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Checkbox } from "../components/ui/checkbox";
import api from "../lib/api"; // Usa l'import di default come nell'admin

// Immagini di fallback (se il database è vuoto usa queste)
const HERO = "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Anguillara_Sabazia_dal_lago_%281%29.jpg/1920px-Anguillara_Sabazia_dal_lago_%281%29.jpg";
const FALLBACK_G = "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1400&q=85";

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
    const [images, setImages] = useState([]); // MODIFICA: Stato per le immagini reali
    const [form, setForm] = useState({ name: "", email: "", phone: "", message: "", consent_newsletter: false });
    const [sending, setSending] = useState(false);

    useEffect(() => {
        // Carica info villa
        api.get("/villa/info").then((r) => setInfo(r.data)).catch(() => {});
        
        // MODIFICA: Carica immagini galleria (usiamo la rotta pubblica /gallery)
        api.get("/gallery")
            .then((r) => {
                const data = Array.isArray(r) ? r : (r?.data || []);
                setImages(data);
            })
            .catch((err) => {
                console.error("Errore caricamento immagini pubbliche:", err);
            });
    }, []);

    const submit = async (e) => {
        e.preventDefault();
        setSending(true);
        try {
            await api.post("/contact", form);
            toast.success("Messaggio inviato. Ti risponeremo al più presto.");
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
                <div className="relative z-10 mx-auto max-w-7xl px-6 sm:px-10 h-full flex flex-col justify-end pb-20 text-white fade-up">
                    <p className="overline text-white/90">Appartamento vista lago · Anguillara Sabazia</p>
                    <h1 className="font-display font-light text-5xl sm:text-6xl lg:text-7xl tracking-tighter max-w-3xl mt-4">
                        Una piccola perla sul Lago di Bracciano.
                    </h1>
                    <p className="mt-6 max-w-xl text-base text-white/90">Nel cuore del centro storico, a pochi passi dal lungolago.</p>
                    <div className="mt-10 flex flex-wrap gap-4">
                        <Link to="/book" className="px-7 py-3.5 rounded-sm bg-white text-lake-ink text-sm font-medium hover:bg-lake-sand transition-colors">Verifica disponibilità</Link>
                        <a href="#gallery" className="px-7 py-3.5 rounded-sm border border-white/60 text-white text-sm hover:bg-white/10 transition-colors">Esplora la casa</a>
                    </div>
                </div>
            </section>

            <LastMinuteBanner />

            {/* ABOUT */}
            <section id="about" className="mx-auto max-w-7xl px-6 sm:px-10 py-28 grid md:grid-cols-12 gap-10">
                <div className="md:col-span-5">
                    <p className="overline">La Casa</p>
                    <h2 className="font-display font-light text-4xl lg:text-5xl tracking-tight text-lake-ink mt-4">Light Blue — semplicità e vista lago.</h2>
                </div>
                <div className="md:col-span-6 md:col-start-7 text-lake-ink/80 leading-relaxed space-y-4">
                    <p>{info?.description || "Benvenuti a Light Blue."}</p>
                    <div className="grid grid-cols-3 gap-6 pt-6 border-t border-lake-border">
                        <div><p className="font-display text-3xl text-lake-ink">3</p><p className="text-xs text-lake-ink/60 mt-1">Ospiti</p></div>
                        <div><p className="font-display text-3xl text-lake-ink">1</p><p className="text-xs text-lake-ink/60 mt-1">Camera</p></div>
                        <div><p className="font-display text-3xl text-lake-ink">1</p><p className="text-xs text-lake-ink/60 mt-1">Bagno</p></div>
                    </div>
                </div>
            </section>

            {/* GALLERY DINAMICA - MODIFICATA */}
            <section id="gallery" className="mx-auto max-w-7xl px-6 sm:px-10 py-16">
                <div className="flex items-end justify-between mb-10">
                    <div>
                        <p className="overline">Galleria</p>
                        <h2 className="font-display text-4xl text-lake-ink mt-3">Gli spazi</h2>
                    </div>
                </div>

                {images.length === 0 ? (
                    <div className="py-20 text-center border border-dashed border-lake-border">
                        <ImageIcon className="mx-auto text-lake-ink/20 mb-4" size={48} />
                        <p className="text-lake-ink/50 italic">Caricamento immagini in corso...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-6 gap-4 auto-rows-[150px] md:auto-rows-[200px]">
                        {/* Immagine 1 (Grande) */}
                        <div className="col-span-6 md:col-span-4 row-span-2 md:row-span-3">
                            <img src={images[0]?.url || FALLBACK_G} className="w-full h-full object-cover rounded-sm shadow-sm" alt="Galleria 1" />
                        </div>
                        {/* Immagine 2 */}
                        <div className="col-span-3 md:col-span-2 row-span-2">
                            <img src={images[1]?.url || images[0]?.url} className="w-full h-full object-cover rounded-sm shadow-sm" alt="Galleria 2" />
                        </div>
                        {/* Immagine 3 */}
                        <div className="col-span-3 md:col-span-2 row-span-2 md:row-span-3">
                            <img src={images[2]?.url || images[0]?.url} className="w-full h-full object-cover rounded-sm shadow-sm" alt="Galleria 3" />
                        </div>
                        {/* Immagine 4 */}
                        <div className="col-span-3 md:col-span-3 row-span-2">
                            <img src={images[3]?.url || images[0]?.url} className="w-full h-full object-cover rounded-sm shadow-sm" alt="Galleria 4" />
                        </div>
                        {/* Immagine 5 */}
                        <div className="col-span-3 md:col-span-3 row-span-2">
                            <img src={images[4]?.url || images[0]?.url} className="w-full h-full object-cover rounded-sm shadow-sm" alt="Galleria 5" />
                        </div>
                    </div>
                )}
            </section>

            {/* RESTO DEL CODICE INVARIATO (SERVIZI, MAPPA, CONTATTI) */}
            <section id="services" className="mx-auto max-w-7xl px-6 sm:px-10 py-28">
                {/* ... (lascia il tuo codice originale dei servizi) ... */}
                <p className="overline">Servizi & Convenzioni</p>
                <h2 className="font-display text-4xl lg:text-5xl text-lake-ink mt-3 max-w-2xl">Il territorio, a portata di piedi.</h2>
                <div className="grid md:grid-cols-4 gap-6 mt-14">
                    {services.map((s) => (
                        <div key={s.title} className="p-7 bg-white border border-lake-border rounded-sm hover:-translate-y-1 hover:shadow-lg transition-all">
                            <s.icon className="w-6 h-6 text-lake-blue" strokeWidth={1.5} />
                            <p className="font-display text-lg text-lake-ink mt-5">{s.title}</p>
                            <p className="text-sm text-lake-ink/65 mt-2 leading-relaxed">{s.desc}</p>
                        </div>
                    ))}
                </div>
            </section>
            
            {/* ... Mantieni le sezioni MAP, CONTACT e FOOTER così come le avevi ... */}
            <Footer />
        </div>
    );
}
