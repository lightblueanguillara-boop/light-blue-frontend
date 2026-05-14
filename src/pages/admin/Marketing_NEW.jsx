import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { api } from "../../lib/api";
import { fmtItDateTime } from "../../lib/date";
import { Badge } from "../../components/ui/badge";

export default function AdminMarketing() {
    const [subject, setSubject] = useState("");
    const [html, setHtml] = useState("<h1>Ciao!</h1><p>Un saluto da Light Blue Anguillara.</p>");
    const [sending, setSending] = useState(false);
    
    // Gestione Iscritti
    const [subscribers, setSubscribers] = useState([]);
    const [selectedEmails, setSelectedEmails] = useState([]);
    
    // Gestione Log/Storico
    const [logs, setLogs] = useState([]);
    const [previewLog, setPreviewLog] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [subsRes, logsRes] = await Promise.all([
                api.get("/admin/subscribers"),
                api.get("/admin/marketing/logs")
            ]);
            setSubscribers(subsRes.data);
            setLogs(logsRes.data);
        } catch (e) {
            toast.error("Errore nel caricamento dati");
        }
    };

    // Logica Selezione
    const toggleSelectAll = () => {
        if (selectedEmails.length === subscribers.length) {
            setSelectedEmails([]);
        } else {
            setSelectedEmails(subscribers.map(s => s.email));
        }
    };

    const toggleSelectOne = (email) => {
        setSelectedEmails(prev => 
            prev.includes(email) 
                ? prev.filter(e => e !== email) 
                : [...prev, email]
        );
    };

    const sendCampaign = async () => {
        if (!subject || !html) return toast.error("Oggetto e contenuto richiesti");
        if (selectedEmails.length === 0) return toast.error("Seleziona almeno un destinatario");
        
        if (!window.confirm(`Inviare questa email a ${selectedEmails.length} destinatari?`)) return;
        
        setSending(true);
        try {
            const r = await api.post("/admin/marketing/send", { 
                subject, 
                html_content: html,
                recipients: selectedEmails // Passiamo la lista scelta al backend
            });
            toast.success(`Campagna inviata con successo!`);
            loadData(); // Ricarica lo storico
        } catch (e) {
            toast.error("Errore durante l'invio");
        } finally {
            setSending(false);
        }
    };

    const deleteLog = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm("Eliminare definitivamente questo log dallo storico?")) return;
        try {
            await api.delete(`/admin/marketing/logs/${id}`);
            toast.success("Log eliminato");
            setLogs(logs.filter(l => l.id !== id));
        } catch (e) { toast.error("Errore"); }
    };

    const handleRestore = () => {
        setSubject(previewLog.subject);
        setHtml(previewLog.html_content);
        setPreviewLog(null);
        toast.info("Contenuto ricaricato nell'editor");
    };

    return (
        <div className="p-10 grid lg:grid-cols-12 gap-8 relative">
            
            {/* COLONNA SINISTRA: EDITOR E SELEZIONE */}
            <div className="lg:col-span-8 space-y-8">
                <div>
                    <p className="overline text-lake-blue">Marketing</p>
                    <h1 className="font-display text-4xl text-lake-ink mt-2">Comunicazione agli ospiti</h1>
                </div>

                {/* Box Selezione Destinatari */}
                <div className="bg-white border border-lake-border rounded-sm p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lake-ink">1. Seleziona Destinatari ({selectedEmails.length}/{subscribers.length})</h3>
                        <button 
                            onClick={toggleSelectAll}
                            className="text-xs font-bold uppercase tracking-wider text-lake-blue hover:underline"
                        >
                            {selectedEmails.length === subscribers.length ? "Deseleziona tutti" : "Seleziona tutti"}
                        </button>
                    </div>
                    <div className="max-h-48 overflow-y-auto border rounded-sm p-4 grid grid-cols-1 md:grid-cols-2 gap-2 bg-gray-50">
                        {subscribers.map((s) => (
                            <label key={s.id} className="flex items-center space-x-3 cursor-pointer p-2 hover:bg-white rounded-md transition-colors">
                                <input 
                                    type="checkbox" 
                                    className="w-4 h-4 accent-lake-blue"
                                    checked={selectedEmails.includes(s.email)}
                                    onChange={() => toggleSelectOne(s.email)}
                                />
                                <span className="text-sm text-lake-ink truncate">{s.email}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Box Editor */}
                <div className="bg-white border border-lake-border rounded-sm p-8 space-y-4 shadow-sm">
                    <h3 className="font-bold text-lake-ink">2. Componi Email (HTML Supportato)</h3>
                    <Input 
                        placeholder="Oggetto della campagna" 
                        value={subject} 
                        onChange={(e) => setSubject(e.target.value)} 
                        className="border-lake-border focus:ring-lake-blue"
                    />
                    <Textarea 
                        rows={15} 
                        placeholder="Incolla qui il codice HTML o scrivi il testo..." 
                        value={html} 
                        onChange={(e) => setHtml(e.target.value)} 
                        className="font-mono text-sm border-lake-border"
                    />
                    <div className="flex justify-end">
                        <button 
                            onClick={sendCampaign} 
                            disabled={sending || selectedEmails.length === 0} 
                            className={`px-8 py-3 rounded-sm font-bold uppercase tracking-widest text-xs transition-all ${
                                sending || selectedEmails.length === 0 
                                ? "bg-gray-300 cursor-not-allowed" 
                                : "bg-lake-blue text-white hover:bg-lake-ink"
                            }`}
                        >
                            {sending ? "Invio in corso..." : `Invia a ${selectedEmails.length} persone`}
                        </button>
                    </div>
                </div>
            </div>

            {/* COLONNA DESTRA: STORICO */}
            <div className="lg:col-span-4">
                <p className="overline text-lake-ink/60">Storico invii</p>
                <div className="mt-4 bg-white border border-lake-border rounded-sm divide-y divide-lake-border shadow-sm max-h-[80vh] overflow-y-auto">
                    {logs.length === 0 && <p className="p-10 text-center text-sm text-gray-400 italic">Nessun invio registrato</p>}
                    {logs.map((l) => (
                        <div 
                            key={l.id} 
                            onClick={() => setPreviewLog(l)} 
                            className="p-5 flex justify-between items-start group hover:bg-lake-blue/5 cursor-pointer transition-colors"
                        >
                            <div className="truncate flex-1">
                                <p className="font-medium text-lake-ink text-sm truncate">{l.subject}</p>
                                <p className="text-[10px] text-lake-ink/50 mt-1">{fmtItDateTime(l.created_at)}</p>
                            </div>
                            <button 
                                onClick={(e) => deleteLog(l.id, e)} 
                                className="text-xs text-red-500 opacity-0 group-hover:opacity-100 ml-2 p-1 hover:bg-red-50 rounded"
                            >
                                Elimina
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* MODAL ANTEPRIMA */}
            {previewLog && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-sm w-full max-w-4xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden">
                        <div className="p-4 border-b flex justify-between items-center bg-lake-cream">
                            <div>
                                <h2 className="font-bold text-lake-ink">Dettaglio Invio</h2>
                                <p className="text-xs text-lake-ink/60 font-mono">{previewLog.subject}</p>
                            </div>
                            <button onClick={() => setPreviewLog(null)} className="text-2xl font-light p-2">&times;</button>
                        </div>
                        
                        <div className="flex-1 overflow-auto bg-gray-200 p-6">
                            <div className="bg-white shadow-lg mx-auto w-full min-h-full">
                                {previewLog.html_content ? (
                                    <iframe 
                                        title="Anteprima Email"
                                        srcDoc={previewLog.html_content} 
                                        className="w-full h-[600px] border-none"
                                    />
                                ) : (
                                    <div className="p-20 text-center text-gray-400 italic">Contenuto non disponibile.</div>
                                )}
                            </div>
                        </div>

                        <div className="p-4 border-t flex justify-end gap-3 bg-white">
                            <button 
                                onClick={() => setPreviewLog(null)} 
                                className="px-6 py-2 text-xs font-bold uppercase border border-lake-border hover:bg-gray-50 transition-colors"
                            >
                                Chiudi
                            </button>
                            <button 
                                onClick={handleRestore} 
                                className="px-6 py-2 text-xs font-bold uppercase bg-lake-blue text-white hover:bg-lake-ink transition-colors"
                            >
                                Carica nell'Editor
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
