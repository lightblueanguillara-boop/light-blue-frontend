import { useState, useEffect } from "react";
import { Loader2, ImageIcon } from "lucide-react";
import api from "../../lib/api"; 

export default function PublicGallery() {
    const [loading, setLoading] = useState(true);
    const [images, setImages] = useState([]);

    const fetchImages = async () => {
        try {
            setLoading(true);
            // USIAMO UNA ROTTA PUBBLICA (senza /admin)
            const response = await api.get("/gallery"); 
            
            const data = Array.isArray(response) ? response : (response?.data || []);
            setImages(data);
        } catch (error) {
            console.error("Errore nel caricamento della galleria pubblica:", error);
            setImages([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchImages();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-lake-blue" size={32} />
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
            {images.length === 0 ? (
                <div className="col-span-full text-center py-20">
                    <ImageIcon className="mx-auto text-lake-ink/20 mb-4" size={48} />
                    <p className="text-lake-ink/50 italic">La galleria è in fase di allestimento.</p>
                </div>
            ) : (
                images.map((img) => (
                    <div key={img.id || img._id} className="overflow-hidden rounded-sm bg-lake-sand shadow-sm">
                        <img 
                            src={img.url} 
                            alt={img.caption || "Galleria Anguillara"}
                            className="w-full h-full object-cover aspect-video hover:scale-105 transition-transform duration-500"
                        />
                        {img.caption && (
                            <div className="p-2 text-xs uppercase tracking-widest text-lake-ink/70">
                                {img.caption}
                            </div>
                        )}
                    </div>
                ))
            )}
        </div>
    );
}
