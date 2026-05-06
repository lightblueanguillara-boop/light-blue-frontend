import { useState } from "react";
import { Plus, Image as ImageIcon, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import UploadModal from "../../components/admin/UploadModal";

export default function AdminGallery() {
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [images, setImages] = useState([
        {
            id: 1,
            url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Lake_Como_from_Bellagio_01.jpg/1200px-Lake_Como_from_Bellagio_01.jpg",
            category: "gallery",
            alt: "Vista Lago di Como"
        }
    ]);

    const handleDelete = (id) => {
        // Simulazione eliminazione (collegheremo l'API tra poco)
        setImages(images.filter(img => img.id !== id));
        toast.error("Immagine rimossa dalla galleria");
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

            {images.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-lake-border rounded-sm bg-lake-sand/20">
                    <ImageIcon className="text-lake-ink/20 mb-4" size={48} strokeWidth={1} />
                    <p className="text-lake-ink/50 font-light italic">Nessuna immagine presente nella galleria.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {images.map((img) => (
                        <div key={img.id} className="group relative bg-white border border-lake-border rounded-sm overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                            <div className="aspect-video overflow-hidden bg-lake-sand">
                                <img 
                                    src={img.url} 
                                    alt={img.alt}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                            </div>
                            
                            <div className="p-4 flex items-center justify-between">
                                <div>
                                    <span className="text-[10px] uppercase tracking-widest text-lake-blue font-semibold">{img.category}</span>
                                    <p className="text-sm text-lake-ink truncate max-w-[150px]">{img.alt || "Senza titolo"}</p>
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
                                        onClick={() => handleDelete(img.id)}
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
                onRefresh={() => {
                    // Qui aggiungeremo la logica per ricaricare le foto dal server
                    toast.success("Galleria aggiornata!");
                }} 
            />
        </div>
    );
}
