iimport { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "../../lib/api";
import { Badge } from "../../components/ui/badge";
import { fmtItDateTime } from "../../lib/date";

export default function AdminInbox() {
    const [items, setItems] = useState([]);
    const [active, setActive] = useState(null);
    
    const load = () => api.get("/admin/messages").then((r) => setItems(r.data));
    useEffect(() => { load(); }, []);

    const setStatus = async (id, status) => {
        await api.patch(`/admin/messages/${id}`, { status });
        load();
    };

    // NUOVA FUNZIONE ELIMINA
    const deleteItem = async (id) => {
        if (!confirm("Sei sicuro di voler eliminare questo messaggio?")) return;
        try {
            await api.delete(`/admin/messages/${id}`);
            toast.success("Messaggio eliminato");
            setActive(null);
            load();
        } catch (err) {
            toast.error("Errore durante l'eliminazione");
        }
    };

    return (
        <div className="p-10 grid md:grid-cols-12 gap-8" data-testid="admin-inbox-page">
            <div className="md:col-span-5">
                <p className="overline">Inbox</p>
                <h1 className="font-display text-4xl text-lake-ink mt-2">Richieste info</h1>
                <div className="mt-6 bg-white border border-lake-border rounded-sm divide-y divide-lake-border">
                    {items.length === 0 && <p className="p-6 text-lake-ink/60">Nessun messaggio.</p>}
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
                    <div className="bg-white border border-lake-border rounded-sm p-8" data-testid="message-detail">
                        <p className="overline">Da</p>
                        <p className="font-display text-2xl text-lake-ink mt-2">{active.name}</p>
                        <p className="text-sm text-lake-ink/70">{active.email} · {active.phone}</p>
                        <p className="overline mt-6">Oggetto</p>
                        <p className="text-lake-ink mt-1">{active.subject || "—"}</p>
                        <p className="overline mt-6">Messaggio</p>
                        <p className="mt-2 text-lake-ink whitespace-pre-wrap">{active.message}</p>
                        
                        <div className="mt-8 flex flex-wrap gap-3">
                            <a href={`mailto:${active.email}?subject=Re: ${encodeURIComponent(active.subject || 'Richiesta')}`} className="px-5 py-2.5 rounded-sm bg-lake-blue text-white text-sm">Rispondi via email</a>
                            <button onClick={async () => { await setStatus(active.id, "replied"); toast.success("Contrassegnato come risposto"); }} className="px-5 py-2.5 rounded-sm border border-lake-border text-sm">Segna come risposto</button>
                            
                            {/* TASTO ELIMINA AGGIUNTO QUI */}
                            <button onClick={() => deleteItem(active.id)} className="px-5 py-2.5 rounded-sm bg-red-50 text-red-600 border border-red-200 text-sm hover:bg-red-600 hover:text-white transition-colors">
                                Elimina
                            </button>
                        </div>
                    </div>
                ) : <p className="text-lake-ink/60 mt-20">Seleziona un messaggio per vedere i dettagli.</p>}
            </div>
        </div>
    );
}
