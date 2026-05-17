import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "../../lib/api";
import { Badge } from "../../components/ui/badge";
import { fmtItDateTime } from "../../lib/date";
import { Trash2 } from "lucide-react"; // Icona già presente ma inutilizzata

// ─── Reply Modal ──────────────────────────────────────────────────────────────
function ReplyModal({ msg, onClose, onSent }) {
    const [subject, setSubject] = useState(`Re: ${msg.subject || "Richiesta info"}`);
    const [html, setHtml] = useState("");
    const [sending, setSending] = useState(false);

    const send = async () => {
        if (!html.trim()) { toast.error("Scrivi un messaggio prima di inviare."); return; }
        setSending(true);
        try {
            const r = await api.post(`/admin/messages/${msg.id}/reply`, { subject, html });
            onSent(r.data);
            toast.success("Risposta inviata e salvata in cronologia ✓");
            onClose();
        } catch (e) {
            toast.error(e?.response?.data?.detail || "Invio fallito.");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-sm border border-lake-border w-full max-w-2xl shadow-xl">
                <div className="p-6 border-b border-lake-border flex justify-between items-center">
                    <h3 className="font-display text-lg text-lake-ink">Rispondi a {msg.name}</h3>
                    <button onClick={onClose} className="text-lake-ink/40 hover:text-lake-ink">✕</button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-widest text-lake-ink/50 font-bold">Oggetto</label>
                        <input 
                            type="text" 
                            className="w-full border border-lake-border rounded-sm px-3 py-2 text-sm text-lake-ink focus:outline-none focus:border-lake-blue"
                            value={subject} 
                            onChange={e => setSubject(e.target.value)} 
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-widest text-lake-ink/50 font-bold">Messaggio (HTML supportato)</label>
                        <textarea 
                            rows={8}
                            className="w-full border border-lake-border rounded-sm px-3 py-2 text-sm text-lake-ink focus:outline-none focus:border-lake-blue font-mono"
                            placeholder="Buongiorno... <br/> Cordiali saluti."
                            value={html} 
                            onChange={e => setHtml(e.target.value)} 
                        />
                    </div>
                </div>
                <div className="p-6 border-t border-lake-border bg-lake-sand/10 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 border border-lake-border text-xs text-lake-ink rounded-sm hover:bg-lake-sand/20">Annulla</button>
                    <button onClick={send} disabled={sending} className="px-4 py-2 bg-lake-blue text-white text-xs rounded-sm hover:opacity-90 disabled:opacity-50">
                        {sending ? "Invio..." : "Invia Risposta"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Inbox Component ──────────────────────────────────────────────────────
export default function Inbox() {
    const [messages, setMessages] = useState([]);
    const [active, setActive] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showReply, setShowReply] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const loadMessages = useCallback(async () => {
        try {
            const r = await api.get("/admin/messages");
            const data = Array.isArray(r) ? r : (r?.data || []);
            setMessages(data);
        } catch {
            toast.error("Impossibile caricare i messaggi.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadMessages();
    }, [loadMessages]);

    // Funzione per eliminare la chat attiva
    const deleteMessage = async (id) => {
        if (!window.confirm("Sei sicuro di voler eliminare definitivamente questa chat? Questa azione non è reversibile.")) return;
        setDeleting(true);
        try {
            await api.delete(`/admin/messages/${id}`);
            toast.success("Chat eliminata con successo.");
            setMessages(prev => prev.filter(m => m.id !== id));
            setActive(null);
        } catch (e) {
            toast.error(e?.response?.data?.detail || "Errore durante l'eliminazione.");
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="p-10 text-center italic text-lake-ink/40 font-light">
                Caricamento messaggi...
            </div>
        );
    }

    return (
        <>
            <div className="grid md:grid-cols-12 border border-lake-border bg-white rounded-sm h-[calc(100vh-220px)] shadow-sm overflow-hidden">
                {/* LISTA MESSAGGI (COL 5) */}
                <div className="md:col-span-5 border-r border-lake-border flex flex-col h-full bg-lake-sand/5">
                    <div className="p-4 border-b border-lake-border bg-white">
                        <h2 className="font-display text-lg text-lake-ink">Richiesta Informazioni ({messages.length})</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto divide-y divide-lake-border">
                        {messages.length === 0 ? (
                            <p className="p-8 text-center text-sm italic text-lake-ink/40">Nessun messaggio ricevuto.</p>
                        ) : (
                            messages.map((m) => {
                                const isSelected = active?.id === m.id;
                                return (
                                    <div 
                                        key={m.id}
                                        onClick={() => setActive(m)}
                                        className={`p-4 cursor-pointer transition-colors space-y-2 text-left ${isSelected ? "bg-lake-blue/10 border-l-2 border-lake-blue" : "hover:bg-lake-sand/20"}`}
                                    >
                                        <div className="flex justify-between items-start gap-2">
                                            <p className="font-medium text-sm text-lake-ink truncate">{m.name}</p>
                                            <span className="text-[10px] text-lake-ink/40 whitespace-nowrap">{fmtItDateTime(m.created_at)}</span>
                                        </div>
                                        <p className="text-xs text-lake-ink/80 font-medium truncate">{m.subject || "Richiesta info"}</p>
                                        <p className="text-xs text-lake-ink/60 line-clamp-2 italic font-light">{m.message}</p>
                                        <div className="flex justify-between items-center pt-1">
                                            <span className="text-[10px] text-lake-ink/40 truncate">{m.email}</span>
                                            <Badge variant={m.status === "replied" ? "success" : "warning"} className="text-[9px] uppercase tracking-wider px-1.5 py-0">
                                                {m.status === "replied" ? "Risposto" : "Da gestire"}
                                            </Badge>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* VISUALIZZAZIONE CHAT / DETTAGLIO (COL 7) */}
                <div className="md:col-span-7 flex flex-col h-full bg-white">
                    {active ? (
                        <div className="flex flex-col h-full">
                            {/* HEADER DETTAGLIO */}
                            <div className="p-6 border-b border-lake-border flex justify-between items-start bg-lake-sand/5">
                                <div className="space-y-1 text-left">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-display text-xl text-lake-ink">{active.name}</h3>
                                        <Badge variant={active.status === "replied" ? "success" : "warning"} className="text-[9px] uppercase tracking-wider">
                                            {active.status === "replied" ? "Risposto" : "Da gestire"}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-lake-ink/60">
                                        Email: <span className="text-lake-ink/80 font-medium">{active.email}</span> 
                                        {active.phone && <> &middot; Tel: <span className="text-lake-ink/80 font-medium">{active.phone}</span></>}
                                    </p>
                                    <p className="text-sm font-medium text-lake-ink pt-1">Oggetto: {active.subject || "Richiesta info"}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        disabled={deleting}
                                        onClick={() => deleteMessage(active.id)}
                                        className="p-2 border border-rose-200 text-rose-600 rounded-sm hover:bg-rose-50 transition-colors disabled:opacity-50"
                                        title="Elimina chat"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                    <button 
                                        onClick={() => setShowReply(true)}
                                        className="px-4 py-2 bg-lake-blue text-white text-xs rounded-sm hover:opacity-90"
                                    >
                                        Rispondi
                                    </button>
                                </div>
                            </div>

                            {/* CORPO CRONOLOGIA MESSAGGI */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-lake-cream/10 flex flex-col">
                                {/* Messaggio Iniziale dell'Utente */}
                                <div className="bg-lake-sand/20 border border-lake-border/60 rounded-sm p-4 max-w-[85%] text-left self-start shadow-sm">
                                    <p className="text-[10px] uppercase tracking-widest text-lake-blue font-bold mb-1">Richiesta iniziale</p>
                                    <p className="text-sm text-lake-ink whitespace-pre-line leading-relaxed font-light">{active.message}</p>
                                    <p className="text-[9px] text-lake-ink/40 mt-2 text-right">{fmtItDateTime(active.created_at)}</p>
                                </div>

                                {/* Eventuali Risposte dell'Amministratore */}
                                {active.chat && active.chat.length > 0 && (
                                    <div className="space-y-4 pt-4 border-t border-dashed border-lake-border">
                                        <p className="text-[10px] uppercase tracking-widest text-center text-lake-ink/40 font-bold">Cronologia risposte</p>
                                        {active.chat.map((reply) => (
                                            <div key={reply.id} className="bg-lake-blue/5 border border-lake-blue/20 rounded-sm p-4 max-w-[85%] text-left self-end shadow-sm">
                                                <p className="text-[10px] uppercase tracking-widest text-lake-blue font-bold mb-1">Tua risposta ({reply.subject})</p>
                                                <div 
                                                    className="text-sm text-lake-ink prose prose-sm max-w-none"
                                                    dangerouslySetInnerHTML={{ __html: reply.content }}
                                                />
                                                <p className="text-[9px] text-lake-ink/40 mt-2 text-right">{fmtItDateTime(reply.created_at)}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-10 border border-dashed border-lake-border rounded-sm">
                            <p className="text-lake-ink/40 italic font-light">Seleziona una richiesta dalla lista per visualizzare la chat.</p>
                        </div>
                    )}
                </div>
            </div>

            {showReply && active && (
                <ReplyModal 
                    msg={active} 
                    onClose={() => setShowReply(false)} 
                    onSent={(updatedMsg) => {
                        setActive(updatedMsg);
                        setMessages(prev => prev.map(m => m.id === updatedMsg.id ? updatedMsg : m));
                    }}
                />
            )}
        </>
    );
}
