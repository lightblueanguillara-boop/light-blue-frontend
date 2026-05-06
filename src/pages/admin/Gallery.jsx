import { useState, useEffect } from "react";
import { Plus, Trash2, Image as ImageIcon, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../lib/api";

export default function Gallery() {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);

    // Caricamento iniziale delle immagini
    useEffect(() => {
        fetchImages();
    }, []);

    const fetchImages = async () => {
        try {
            const response = await api.get("/images");
            setImages(response.data);
        } catch (error) {
            toast.error("Errore nel caricamento della galleria");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Sei sicuro di voler eliminare questa immagine?")) return;
        try {
            await api.delete(`/images/${id}`);
            setImages(images.filter(img => img.id !== id));
            toast.success("Immagine eliminata");
        } catch (error) {
            toast.error("Errore durante l'eliminazione");
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header della pagina */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
                <div>
                    <p className="overline text-lake-blue">Media & Asset</p>
                    <h1 className="font-display text-4xl text-lake-ink mt-2">Gestione Galleria</h1>
                    <p className="text-lake-ink/60 mt-1">Gestisci le foto della Home e della galleria fotografica della Villa.</p>
                </div>
                <button 
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-lake-blue text-white rounded-sm hover:bg-[#678099] transition-all shadow-sm text-sm"
                    onClick={() => toast.info("Funzionalità di upload in arrivo nel prossimo step")}
                >
                    <Plus size={18} /> Carica nuova immagine
                </button>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-lake-ink/40">
                    <Loader2 className="animate-spin mb-4" size={32} />
                    <p>Caricamento media...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {images.length === 0 && (
                        <div className="col-span-full py-20 border-2 border-dashed border-lake-border rounded-sm flex flex-col items-center justify-center text-lake-ink/40">
                            <ImageIcon size={48} strokeWidth={1} className="mb-4" />
                            <p>Nessuna immagine presente in galleria</p>
                        </div>
                    )}

                    {images.map((img) => (
                        <div key={img.id} className="group relative bg-white border border-lake-border rounded-sm overflow-hidden hover:shadow-md transition-all">
                            {/* Badge Categoria */}
                            <div className="absolute top-3 left-3 z-10">
                                <span className={`px-2 py-1 text-[10px] uppercase tracking-widest font-medium rounded-full shadow-sm ${
                                    img.category === 'home' 
                                    ? 'bg-lake-blue text-white' 
                                    : 'bg-white/90 text-lake-ink'
                                }`}>
                                    {img.category}
                                </span>
                            </div>

                            {/* Immagine */}
                            <div className="aspect-[4/3] w-full bg-lake-sand overflow-hidden">
                                <img 
                                    src={img.url} 
                                    alt={img.alt_text || "Immagine villa"} 
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                            </div>

                            {/* Azioni al passaggio del mouse */}
                            <div className="p-3 flex items-center justify-between bg-white border-t border-lake-border">
                                <div className="truncate pr-2">
                                    <p className="text-xs text-lake-ink/50 truncate italic">
                                        {img.alt_text || "Senza descrizione"}
                                    </p>
                                </div>
                                <div className="flex gap-1">
                                    <a 
                                        href={img.url} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="p-2 text-lake-ink/40 hover:text-lake-blue transition-colors"
                                        title="Apri originale"
                                    >
                                        <ExternalLink size={16} />
                                    </a>
                                    <button 
                                        onClick={() => handleDelete(img.id)}
                                        className="p-2 text-lake-ink/40 hover:text-red-500 transition-colors"
                                        title="Elimina"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
