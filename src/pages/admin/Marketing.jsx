import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { api } from "../../lib/api";
import { fmtItDateTime } from "../../lib/date";

export default function AdminMarketing() {
    const [subject, setSubject] = useState("");
    const [html, setHtml] = useState("<h1>Ciao!</h1><p>Un saluto da Liht Blue Anguillara Sabazia.</p>");
    const [sending, setSending] = useState(false);
    const [count, setCount] = useState(0);
    const [logs, setLogs] = useState([]);

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
            toast.success(`Inviato a ${r.data.sent} iscritti (${r.data.failed} falliti)`);
            api.get("/admin/marketing/logs").then((r) => setLogs(r.data));
        } catch (e) {
            toast.error(e?.response?.data?.detail || "Errore invio");
        } finally { setSending(false); }
    };

    return (
        <div className="p-10 grid lg:grid-cols-12 gap-8" data-testid="admin-marketing-page">
            <div className="lg:col-span-8">
                <p className="overline">Marketing</p>
                <h1 className="font-display text-4xl text-lake-ink mt-2">Comunicazione agli ospiti</h1>
                <p className="text-sm text-lake-ink/60 mt-2">Verrà inviato a <strong>{count}</strong> iscritti con consenso GDPR.</p>

                <div className="mt-8 bg-white border border-lake-border rounded-sm p-8 space-y-4">
                    <Input data-testid="marketing-subject" placeholder="Oggetto email" value={subject} onChange={(e) => setSubject(e.target.value)} />
                    <Textarea data-testid="marketing-html" rows={12} placeholder="Contenuto HTML" value={html} onChange={(e) => setHtml(e.target.value)} />
                    <button onClick={send} disabled={sending} data-testid="marketing-send-btn" className="px-6 py-3 rounded-sm bg-lake-blue text-white text-sm disabled:opacity-50">
                        {sending ? "Invio..." : "Invia campagna"}
                    </button>
                    <p className="text-[11px] text-lake-ink/50">Servizio: Resend · Se la chiave API non è configurata, l'invio fallirà silenziosamente.</p>
                </div>
            </div>
            <div className="lg:col-span-4">
                <p className="overline">Storico invii</p>
                <div className="mt-4 bg-white border border-lake-border rounded-sm divide-y divide-lake-border">
                    {logs.length === 0 && <p className="p-5 text-sm text-lake-ink/60">Nessun invio finora.</p>}
                    {logs.map((l) => (
                        <div key={l.id} className="p-5" data-testid={`marketing-log-${l.id}`}>
                            <p className="font-medium text-lake-ink text-sm truncate">{l.subject}</p>
                            <p className="text-xs text-lake-ink/60 mt-1">{fmtItDateTime(l.created_at)}</p>
                            <p className="text-xs mt-1">Inviati: {l.sent_count} / {l.total}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
