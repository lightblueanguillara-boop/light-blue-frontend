import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { api } from "../../lib/api";
import { fmtItDateTime } from "../../lib/date";

export default function AdminMarketing() {
    const [subject, setSubject] = useState("");
    const [html, setHtml] = useState("<h1>Ciao!</h1><p>Un saluto da Light Blue.</p>");
    const [sending, setSending] = useState(false);
    const [count, setCount] = useState(0);
    const [logs, setLogs] = useState([]);
    const [previewLog, setPreviewLog] = useState(null);

    useEffect(() => {
        api.get("/admin/subscribers").then((r) => setCount(r.data.length));
        api.get("/admin/marketing/logs").then((r) => setLogs(r.data));
    }, []);

    const send = async () => {
        if (!subject || !html) { toast.error("Oggetto e contenuto richiesti"); return; }
        if (!window.confirm(`Inviare a ${count} iscritti?`)) return;
        setSending(true);
        try {
            const r = await api.post("/admin/marketing/send", { subject, html_content: html });
            toast.success(`Inviato a ${r.data.sent} iscritti`);
            api.get("/admin/marketing/logs").then((r) => setLogs(r.data));
        } catch (e) {
            toast.error("Errore invio");
        } finally { setSending(false); }
    };

    const deleteLog = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm("Eliminare questo log?")) return;
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
        toast.info("Contenuto caricato nell'editor");
    };

    return (
        <div className="p-10 grid lg:grid-cols-12 gap-8 relative">
            <div className="lg:col-span-8">
                <p className="overline">Marketing</p>
                <h1 className="font-display text-4xl text-lake-ink mt-2">Comunicazione agli ospiti</h1>
                <div className="mt-8 bg-white border border-lake-border rounded-sm p-8 space-y-4">
                    <Input placeholder="Oggetto email" value={subject} onChange={(e) => setSubject(e.target.value)} />
                    <Textarea rows={12} placeholder="Contenuto HTML" value={html} onChange={(e) => setHtml(e.target.value)} />
                    <button onClick={send} disabled={sending} className="px-6 py-3 rounded-sm bg-lake-blue text-white text-sm">
                        {sending ? "Invio..." : "Invia campagna"}
                    </button>
                </div>
            </div>

            <div className="lg:col-span-4">
                <p className="overline">Storico invii</p>
                <div className="mt-4 bg-white border border-lake-border rounded-sm divide-y divide-lake-border">
                    {logs.map((l) => (
                        <div key={l.id} onClick={() => setPreviewLog(l)} className="p-5 flex justify-between items-start group hover:bg-lake-blue/5 cursor-pointer">
                            <div className="truncate flex-1">
                                <p className="font-medium text-sm truncate">{l.subject}</p>
                                <p className="text-[10px] text-lake-ink/60">{fmtItDateTime(l.created_at)}</p>
                            </div>
                            <button onClick={(e) => deleteLog(l.id, e)} className="text-xs text-red-500 opacity-0 group-hover:opacity-100 ml-2">Elimina</button>
                        </div>
                    ))}
                </div>
            </div>

            {previewLog && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-sm w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <div>
                                <h2 className="font-bold text-lake-ink text-sm">Anteprima Invio</h2>
                                <p className="text-[10px] text-lake-ink/60 uppercase tracking-widest">{previewLog.subject}</p>
                            </div>
                            <button onClick={() => setPreviewLog(null)} className="text-xl p-2 hover:bg-gray-200 rounded-full transition-colors leading-none">×</button>
                        </div>
                        <div className="flex-1 overflow-auto bg-gray-100 p-4">
                            {previewLog.html_content ? (
                                <iframe 
                                    title="Email Preview"
                                    srcDoc={previewLog.html_content} 
                                    className="w-full h-[600px] border-none bg-white shadow-sm"
                                />
                            ) : (
                                <div className="p-10 text-center text-gray-500 italic">Contenuto non disponibile per i log precedenti.</div>
                            )}
                        </div>
                        <div className="p-4 border-t flex justify-end gap-3 bg-white">
                            <button onClick={() => setPreviewLog(null)} className="px-4 py-2 text-xs font-bold uppercase tracking-widest border border-lake-border hover:bg-gray-50">Chiudi</button>
                            <button onClick={handleRestore} className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-lake-blue text-white hover:bg-lake-blue/90">Carica nell'Editor</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
