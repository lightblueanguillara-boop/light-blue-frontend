import { useState } from "react";
import { X, Upload, Link as LinkIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../lib/api";

export default function UploadModal({ isOpen, onClose, onRefresh }) {
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState("file"); // "file" o "url"
    const [formData, setFormData] = useState({
        url: "",
        category: "gallery",
        alt_text: ""
    });

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Qui gestiremo l'invio al backend
            await api.post("/images", formData);
            toast.success("Immagine aggiunta con successo");
            onRefresh();
            onClose();
        } catch (error) {
            toast.error("Errore durante il caricamento");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-lake-ink/40 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md rounded-sm shadow-xl overflow-hidden">
                {/* Header Modal */}
                <div className="p-6 border-b border-lake-border flex justify-between items-center">
                    <h2 className="font-display text-xl text-lake-ink">Aggiungi Media</h2>
                    <button onClick={onClose} className="text-lake-ink/40 hover:text-lake-ink">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Switch Mode */}
                    <div className="flex bg-lake-sand p-1 rounded-sm">
                        <button 
                            type="button"
                            onClick={() => setMode("file")}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs uppercase tracking-widest ${mode === "file" ? "bg-white shadow-sm text-lake-blue" : "text-lake-ink/50"}`}
                        >
                            <Upload size={14} /> Carica File
                        </button>
                        <button 
                            type="button"
                            onClick={() => setMode("url")}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs uppercase tracking-widest ${mode === "url" ? "bg-white shadow-sm text-lake-blue" : "text-lake-ink/50"}`}
                        >
                            <LinkIcon size={14} /> Incolla URL
                        </button>
                    </div>

                    {/* Inputs */}
                    <div className="space-y-4">
                        {mode === "url" ? (
                            <div>
                                <label className="block text-xs font-medium text-lake-ink/60 uppercase mb-1.5">URL Immagine</label>
                                <input 
                                    type="url" 
                                    required
                                    className="w-full px-3 py-2 bg-lake-sand border border-lake-border rounded-sm text-sm focus:outline-none focus:border-lake-blue"
                                    placeholder="https://images.unsplash.com/..."
                                    value={formData.url}
                                    onChange={(e) => setFormData({...formData, url: e.target.value})}
                                />
                            </div>
                        ) : (
                            <div className="border-2 border-dashed border-lake-border rounded-sm p-8 flex flex-col items-center justify-center bg-lake-sand/30 hover:bg-lake-sand/50 transition-colors cursor-pointer">
                                <Upload className="text-lake-ink/30 mb-2" size={32} strokeWidth={1} />
                                <p className="text-xs text-lake-ink/50 text-center">Trascina qui il file o clicca per selezionarlo</p>
                                <p className="text-[10px] text-lake-ink/30 mt-1">Sperimentale: per ora usa la modalità URL</p>
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-medium text-lake-ink/60 uppercase mb-1.5">Categoria</label>
                            <select 
                                className="w-full px-3 py-2 bg-lake-sand border border-lake-border rounded-sm text-sm focus:outline-none focus:border-lake-blue"
                                value={formData.category}
                                onChange={(e) => setFormData({...formData, category: e.target.value})}
                            >
                                <option value="gallery">Galleria Generale</option>
                                <option value="home">Immagine Hero (Home)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-lake-ink/60 uppercase mb-1.5">Descrizione (Alt Text)</label>
                            <input 
                                type="text" 
                                className="w-full px-3 py-2 bg-lake-sand border border-lake-border rounded-sm text-sm focus:outline-none focus:border-lake-blue"
                                placeholder="Esempio: Vista lago dalla terrazza"
                                value={formData.alt_text}
                                onChange={(e) => setFormData({...formData, alt_text: e.target.value})}
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full py-3 bg-lake-ink text-white rounded-sm text-sm uppercase tracking-[0.2em] hover:bg-lake-blue transition-colors flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" size={16} /> : "Conferma e Salva"}
                    </button>
                </form>
            </div>
        </div>
    );
}
