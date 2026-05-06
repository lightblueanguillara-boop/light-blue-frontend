import { useState, useRef } from "react";
import { X, Upload, Loader2, FileImage } from "lucide-react";
import { toast } from "sonner";
import api from "../../lib/api";

export default function UploadModal({ isOpen, onClose, onRefresh }) {
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const fileInputRef = useRef(null);
    
    const [formData, setFormData] = useState({
        category: "gallery",
        caption: ""
    });

    if (!isOpen) return null;

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) {
            toast.error("Seleziona un'immagine prima di procedere");
            return;
        }

        setLoading(true);
        try {
            // Creiamo un oggetto FormData per inviare il file binario
            const data = new FormData();
            data.append("file", file);
            data.append("category", formData.category);
            data.append("caption", formData.caption);

            await api.post("/admin/gallery/upload", data, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            toast.success("Immagine caricata con successo su Cloudinary");
            onRefresh();
            handleClose();
        } catch (error) {
            console.error("Errore upload:", error);
            toast.error("Errore durante il caricamento dell'immagine");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFile(null);
        setPreview(null);
        setFormData({ category: "gallery", caption: "" });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-lake-ink/40 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md rounded-sm shadow-xl overflow-hidden border border-lake-border">
                {/* Header Modal */}
                <div className="p-6 border-b border-lake-border flex justify-between items-center bg-lake-sand/10">
                    <h2 className="font-display text-xl text-lake-ink uppercase tracking-wider">Aggiungi Media</h2>
                    <button onClick={handleClose} className="text-lake-ink/40 hover:text-lake-ink transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Upload Area */}
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className={`relative border-2 border-dashed rounded-sm p-8 flex flex-col items-center justify-center transition-all cursor-pointer ${
                            preview ? "border-lake-blue bg-white" : "border-lake-border bg-lake-sand/30 hover:bg-lake-sand/50"
                        }`}
                    >
                        <input 
                            type="file" 
                            ref={fileInputRef}
                            className="hidden" 
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                        
                        {preview ? (
                            <div className="space-y-3 w-full">
                                <img src={preview} alt="Preview" className="w-full h-40 object-cover rounded-sm shadow-sm" />
                                <p className="text-[10px] text-center text-lake-blue uppercase tracking-widest font-semibold">Clicca per cambiare immagine</p>
                            </div>
                        ) : (
                            <>
                                <Upload className="text-lake-ink/30 mb-2" size={32} strokeWidth={1} />
                                <p className="text-xs text-lake-ink/50 text-center uppercase tracking-wider">Trascina o clicca per caricare</p>
                                <p className="text-[10px] text-lake-ink/30 mt-1 uppercase">JPG, PNG o WEBP (Max 5MB)</p>
                            </>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-lake-ink/60 uppercase tracking-widest mb-1.5">Categoria</label>
                            <select 
                                className="w-full px-3 py-2 bg-lake-sand border border-lake-border rounded-sm text-sm focus:outline-none focus:border-lake-blue transition-colors"
                                value={formData.category}
                                onChange={(e) => setFormData({...formData, category: e.target.value})}
                            >
                                <option value="gallery">Galleria Generale</option>
                                <option value="rooms">Camere</option>
                                <option value="home">Home Page</option>
                                <option value="general">Varie</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-lake-ink/60 uppercase tracking-widest mb-1.5">Didascalia</label>
                            <input 
                                type="text" 
                                className="w-full px-3 py-2 bg-lake-sand border border-lake-border rounded-sm text-sm focus:outline-none focus:border-lake-blue transition-colors font-light"
                                placeholder="Esempio: Tramonto sul Lago di Bracciano"
                                value={formData.caption}
                                onChange={(e) => setFormData({...formData, caption: e.target.value})}
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading || !file}
                        className="w-full py-3 bg-lake-ink text-white rounded-sm text-xs uppercase tracking-[0.2em] hover:bg-lake-blue disabled:bg-lake-ink/20 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                        {loading ? <Loader2 className="animate-spin" size={16} /> : "Carica nella Galleria"}
                    </button>
                </form>
            </div>
        </div>
    );
}
