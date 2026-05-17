import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "../../lib/api";
import { Badge } from "../../components/ui/badge";
import { fmtItDateTime } from "../../lib/date";

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
                    <h3 className="font-display text-xl text-lake-ink">Invia Risposta</h3>
                    <button onClick={onClose} className="text-lake-ink/40 hover:text-lake-ink">✕</button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="text-[10px] uppercase tracking-widest text-lake-ink/50 block mb-1">Oggetto Email</label>
                        <input 
                            value={subject} 
                            onChange={e => setSubject(e.target.value)}
                            className="w-full p-3 border border-lake-border rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-lake-blue"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] uppercase tracking-widest text-lake-ink/50 block mb-1">Messaggio (HTML o Testo)</label>
                        <textarea 
                            value={html} 
                            onChange={e => setHtml(e.target.value)}
                            rows={8}
                            placeholder="Scrivi qui la tua risposta..."
                            className="w-full p-3 border border-lake-border rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-lake-blue font-mono"
                        />
                    </div>
                </div>
                <div className="p-6 border-t border-lake-border flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-2 text-sm text-lake-ink/60">Annulla</button>
                    <button 
                        onClick={send} 
                        disabled={sending}
                        className="px-6 py-2 bg-lake-blue text-white rounded-sm text-sm disabled:opacity-50"
                    >
                        {sending ? "Invio..." : "Invia Email"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Inbox() {
    const [messages, setMessages] = useState([]);
    const [active, setActive] = useState(null);
    const [showReply, setShowReply] = useState(false);

    const load = useCallback(async () => {
        try {
            const r = await api.get("/admin/messages");
            setMessages(r.data);
        } catch (e) { toast.error("Errore caricamento messaggi"); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const deleteMsg = async (id) => {
        if (!confirm("Eliminare questo messaggio definitivamente?")) return;
        try {
            await api.patch(`/admin/messages/${id}`, { status: 'deleted' });
            toast.success("Messaggio eliminato");
            setActive(null);
            load();
        } catch (e) { toast.error("Errore eliminazione"); }
    };

    const setStatus = async (id, status) => {
        try {
            const r = await api.patch(`/admin/messages/${id}`, { status });
            setActive(r.data);
            setMessages(prev => prev.map(m => m.id === id ? r.data : m));
        } catch (e) { toast.error("Errore aggiornamento stato"); }
    };

    return (
        <>
            <div className="flex h-[calc(100vh-120px)] gap-6">
                {/* Sidebar Elenco */}
                <div className="w-1/3 border border-lake-border rounded-sm bg-white overflow-y-auto">
                    {messages.map((m) => (
                        <div 
                            key={m.id}
                            onClick={() => setActive(m)}
                            className={`p-5 border-b border-lake-border cursor-pointer transition-colors ${
                                active?.id === m.id ? "bg-lake-sand/20" : "hover:bg-gray-50"
                            }`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-xs font-bold text-lake-blue uppercase tracking-tighter">
                                    {m.status === 'replied' ? '✓ Risposto' : m.status}
                                </span>
                                <span className="text-[10px] text-lake-ink/40">{fmtItDateTime(m.created_at)}</span>
                            </div>
                            <h4 className="font-medium text-lake-ink truncate">{m.name}</h4>
                            <p className="text-xs text-lake-ink/60 truncate">{m.message}</p>
                        </div>
                    ))}
                </div>

                {/* Dettaglio e Chat */}
                <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2">
                    {active ? (
                        <div className="space-y-6 pb-10">
                            {/* Scheda Messaggio Originale — identica all'originale */}
                            <div className="bg-white border border-lake-border rounded-sm p-8 shadow-sm">
                                <div className="flex justify-between items-start mb-8">
                                    <div>
                                        <h2 className="font-display text-3xl text-lake-ink">{active.name}</h2>
                                        <p className="text-lake-blue text-sm">{active.email} • {active.phone || "No tel"}</p>
                                    </div>
                                    <Badge variant="outline">{active.status}</Badge>
                                </div>
                                
                                <div className="bg-lake-cream/30 p-6 rounded-sm border border-lake-border/50 italic text-lake-ink/80 leading-relaxed">
                                    "{active.message}"
                                </div>

                                <div className="mt-8 flex gap-3 border-t border-lake-border pt-6">
                                    <button 
                                        onClick={() => setShowReply(true)}
                                        className="px-6 py-2.5 bg-lake-blue text-white rounded-sm text-sm hover:bg-lake-ink transition-all"
                                    >
                                        Rispondi ora
                                    </button>
                                    <button 
                                        onClick={() => setStatus(active.id, active.status === "replied" ? "pending" : "replied")}
                                        className="px-6 py-2.5 border border-lake-border text-lake-ink rounded-sm text-sm hover:bg-gray-50"
                                    >
                                        {active.status === "replied" ? "Segna come da gestire" : "Segna come risposto"}
                                    </button>
                                    <button onClick={() => deleteMsg(active.id)} className="px-6 py-2.5 text-red-600 text-sm hover:underline ml-auto">
                                        Elimina
                                    </button>
                                </div>
                            </div>

                            {/* CRONOLOGIA CHAT — stesso stile bubble dell'originale, visibile solo se ci sono risposte */}
                            {active.replies && active.replies.length > 0 && (
                                <div className="space-y-4">
                                    <h3 className="text-[10px] uppercase tracking-[0.2em] text-lake-ink/40 font-bold px-2">Cronologia Conversazione</h3>

                                    {/* Messaggio iniziale del cliente */}
                                    <div className="flex flex-col items-start max-w-[80%]">
                                        <div className="bg-white border border-lake-border p-4 rounded-sm rounded-bl-none shadow-sm">
                                            <p className="text-xs font-bold text-lake-blue mb-1">{active.name}</p>
                                            <p className="text-sm text-lake-ink">{active.message}</p>
                                            <p className="text-[9px] text-lake-ink/40 mt-2">{fmtItDateTime(active.created_at)}</p>
                                        </div>
                                    </div>

                                    {/* Risposte inviate dall'admin */}
                                    {active.replies.map((reply) => (
                                        <div key={reply.id} className="flex flex-col items-end w-full">
                                            <div className="max-w-[80%] bg-lake-blue/5 border border-lake-blue/20 p-4 rounded-sm rounded-br-none shadow-sm">
                                                <p className="text-xs font-bold text-lake-ink mb-1">Tu (Admin)</p>
                                                <p className="text-[11px] text-lake-ink/40 mb-2 uppercase tracking-tight">Oggetto: {reply.subject}</p>
                                                <div 
                                                    className="text-sm text-lake-ink prose prose-sm max-w-none"
                                                    dangerouslySetInnerHTML={{ __html: reply.content }}
                                                />
                                                <p className="text-[9px] text-lake-ink/40 mt-2 text-right">{fmtItDateTime(reply.created_at)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
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
