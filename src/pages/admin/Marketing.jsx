import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "../../lib/api";
import { Badge } from "../../components/ui/badge";
import { Textarea } from "../../components/ui/textarea";
import { fmtItDateTime } from "../../lib/date";

export default function AdminInbox() {
    const [items, setItems] = useState([]);
    const [active, setActive] = useState(null);
    const [replyModal, setReplyModal] = useState(false);
    const [replyHtml, setReplyHtml] = useState("");
    const [sending, setSending] = useState(false);

    const load = () => api.get("/admin/messages").then((r) => setItems(r.data));
    useEffect(() => { load(); }, []);

    const setStatus = async (id, status) => {
        await api.patch(`/admin/messages/${id}`, { status });
        toast.success(`Messaggio contrassegnato come: ${status}`);
        load();
        if (active && active.id === id) setActive({ ...active, status });
    };

    const deleteMsg = async (id) => {
        if (!confirm("Eliminare questo messaggio?")) return;
        await api.delete(`/admin/messages/${id}`);
        toast.success("Messaggio eliminato");
        setActive(null);
        load();
    };

    const handleSendReply = async () => {
        if (!replyHtml) { toast.error("Inserisci il contenuto HTML"); return; }
        setSending(true);
        try {
            // Nota: Assicurati che il tuo backend gestisca l'invio specifico a un'email
            await api.post("/admin/marketing/send", { 
                subject: `Re: ${active.subject || "Richiesta info"}`, 
                html_content: replyHtml,
                recipient_ids: [active.email] 
            });
            await setStatus(active.id, "replied");
            setReplyModal(false);
            setReplyHtml("");
        } catch (e) { toast.error("Errore nell'invio"); }
        finally { setSending(false); }
    };

    return (
        <div className="p-10 grid md:grid-cols-12 gap-8" data-testid="admin-inbox-page">
            <div className="md:col-span-5">
                <p className="overline">Inbox</p>
                <h1 className="font-display text-4xl text-lake-ink mt-2">Richieste info</h1>
                <div className="mt-6 bg-white border border-lake-border rounded-sm divide-y divide-lake-border">
                    {items.map((m) => (
                        <button key={m.id} onClick={() => { setActive(m); if (m.status === "new") setStatus(m.id, "read"); }} className={`w-full text-left p-5 hover:bg-lake-cream ${active?.id === m.id ? "bg-lake-cream" : ""}`}>
                            <div className="flex items-center justify-between">
                                <p className="font-medium text-lake-ink truncate">{m.name}</p>
                                {m.status === "new" && <Badge className="bg-lake-blue text-white">Nuovo</Badge>}
                            </div>
                            <p className="text-xs text-lake-ink/60 truncate mt-1">{m.subject || m.message.slice(0, 60)}</p>
                            <p className="text-[11px] text-lake-ink/50 mt-1">{fmtItDateTime(m.created_at)}</p>
                        </button>
                    ))}
                </div>
            </div>

            <div className="md:col-span-7">
                {active ? (
                    <div className="bg-white border border-lake-border rounded-sm p-8">
                        <p className="overline">Da</p>
                        <p className="font-display text-2xl text-lake-ink mt-2">{active.name}</p>
                        <p className="text-sm text-lake-ink/70">{active.email} · {active.phone}</p>
                        <p className="overline mt-6">Oggetto</p>
                        <p className="text-lake-ink mt-1">{active.subject || "—"}</p>
                        <p className="overline mt-6">Messaggio</p>
                        <p className="mt-2 text-lake-ink whitespace-pre-wrap">{active.message}</p>
                        
                        <div className="mt-8 flex flex-wrap gap-3">
                            <button onClick={() => setReplyModal(true)} className="px-5 py-2.5 rounded-sm bg-lake-blue text-white text-sm">Rispondi con Editor HTML</button>
                            <button onClick={() => setStatus(active.id, "replied")} className="px-5 py-2.5 rounded-sm border border-lake-border text-sm">Segna come risposto</button>
                            <button onClick={() => setStatus(active.id, "new")} className="px-5 py-2.5 rounded-sm border border-lake-border text-sm">Segna come non letto</button>
                            <button onClick={() => deleteMsg(active.id)} className="px-5 py-2.5 rounded-sm bg-red-600 text-white text-sm">Elimina</button>
                        </div>
                    </div>
                ) : <p className="text-lake-ink/60 mt-20">Seleziona un messaggio per vedere i dettagli.</p>}
            </div>

            {/* Modal Editor Risposta */}
            {replyModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-sm w-full max-w-2xl p-8 shadow-2xl">
                        <h2 className="text-lg font-bold mb-4">Risposta HTML per {active.name}</h2>
                        <Textarea rows={12} value={replyHtml} onChange={(e) => setReplyHtml(e.target.value)} placeholder="Incolla qui il tuo codice HTML..." />
                        <div className="flex gap-3 mt-6 justify-end">
                            <button onClick={() => setReplyModal(false)} className="px-5 py-2 border">Annulla</button>
                            <button onClick={handleSendReply} disabled={sending} className="px-5 py-2 bg-lake-blue text-white">
                                {sending ? "Invio in corso..." : "Invia email"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
