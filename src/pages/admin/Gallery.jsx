import { useState, useEffect } from "react";
import { Plus, Image as ImageIcon, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import UploadModal from "../../components/admin/UploadModal";
import api from "../../lib/api"; 

export default function AdminGallery() {
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [images, setImages] = useState([]);

    // Funzione per caricare le immagini dal server con protezione anti-crash
    const fetchImages = async () => {
        try {
            setLoading(true);
            const response = await api.get("/admin/gallery");
            
            // Gestione robusta della risposta: 
            // Verifichiamo se la risposta è direttamente un array o se i dati sono in .data
            const data = Array.isArray(response) ? response : (response?.data || []);
            
            if (Array.isArray(data)) {
                setImages(data);
            } else {
                console.error("Formato dati ricevuto non valido:", response);
                setImages([]);
            }
        } catch (error) {
            console.error("Errore nel caricamento galleria:", error);
            // In caso di errore (es. 404 o 500), resettiamo a array vuoto per non crashare
            setImages([]);
            toast.error("Impossibile recuperare le immagini dal server");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchImages();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Sei sicuro di voler eliminare questa immagine?")) return;

        try {
            await api.delete(`/admin/gallery/${id}`);
            setImages(images.filter(img => img.id !== id));
            toast.success("Immagine rimossa correttamente");
        } catch (error) {
            console.error("Errore eliminazione:", error);
            toast.error("Errore durante l'eliminazione");
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="font-display text-3xl text-lake-ink uppercase tracking-wider">Media & Galleria</h1>
                    <p className="text-lake-ink/60 mt-2 font-light">Gestisci le immagini del sito e della galleria fotografica.</p>
                </div>
                
                <button 
                    onClick={() => setIsUploadOpen(true)}
                    className="flex items-center justify-center gap-2 bg-lake-ink text-white px-6 py-3 rounded-sm text-xs uppercase tracking-[0.2em] hover:bg-lake-blue transition-colors w-full md:w-auto"
                >
                    <Plus size={16} /> Carica nuova immagine
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="animate-spin text-lake-blue" size={32} />
                </div>
            ) : images.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-lake-border rounded-sm bg-lake-sand/20">
                    <ImageIcon className="text-lake-ink/20 mb-4" size={48} strokeWidth={1} />
                    <p className="text-lake-ink/50 font-light italic">Nessuna immagine presente nella galleria.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {images.map((img) => (
                        <div key={img.id || img._id} className="group relative bg-white border border-lake-border rounded-sm overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                            <div className="aspect-video overflow-hidden bg-lake-sand">
                                <img 
                                    src={img.url} 
                                    alt={img.caption || "Galleria"}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                            </div>
                            
                            <div className="p-4 flex items-center justify-between">
                                <div>
                                    <span className="text-[10px] uppercase tracking-widest text-lake-blue font-semibold">{img.category}</span>
                                    <p className="text-sm text-lake-ink truncate max-w-[150px]">{img.caption || "Senza titolo"}</p>
                                </div>
                                
                                <div className="flex gap-1">
                                    <a 
                                        href={img.url} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="p-2 text-lake-ink/40 hover:text-lake-blue transition-colors"
                                    >
                                        <ExternalLink size={16} />
                                    </a>
                                    <button 
                                        onClick={() => handleDelete(img.id || img._id)}
                                        className="p-2 text-lake-ink/40 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <UploadModal 
                isOpen={isUploadOpen} 
                onClose={() => setIsUploadOpen(false)}
                onRefresh={fetchImages} 
            />
        </div>
    );
}
