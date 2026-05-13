import { useEffect, useState } from "react";
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
        if (!html.trim()) { toast.error("Incolla il codice HTML dell'email prima di inviare."); return; }
        setSending(true);
        try {
            const r = await api.post(`/admin/messages/${msg.id}/reply`, { subject, html });
            onSent(r.data);          // backend returns updated message
            toast.success("Email inviata e messaggio segnato come risposto ✓");
            onClose();
        } catch (e) {
            toast.error(e?.response?.data?.detail || "Invio fallito. Controlla Resend.");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-sm border border-lake-border w-full max-w-2xl shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between px-7 py-5 border-b border-lake-border">
                    <div>
                        <p className="overline">Rispondi a</p>
                        <p className="font-display text-xl text-lake-ink mt-0.5">{msg.name} — <span className="text-lake-ink/60 font-sans text-base font-normal">{msg.email}</span></p>
                    </div>
                    <button onClick={onClose} className="text-lake-ink/40 hover:text-lake-ink text-2xl leading-none">&times;</button>
                </div>

                {/* Body */}
                <div className="px-7 py-6 space-y-5">
                    {/* Subject */}
                    <div>
                        <label className="overline block mb-1.5">Oggetto</label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="w-full border border-lake-border rounded-sm px-3 py-2 text-sm text-lake-ink focus:outline-none focus:ring-1 focus:ring-lake-blue"
                        />
                    </div>

                    {/* HTML paste area */}
                    <div>
                        <label className="overline block mb-1.5">HTML email (da Resend)</label>
                        <textarea
                            rows={10}
                            value={html}
                            onChange={(e) => setHtml(e.target.value)}
                            placeholder="Incolla qui il codice HTML generato su Resend…"
                            className="w-full border border-lake-border rounded-sm px-3 py-2 text-xs font-mono text-lake-ink focus:outline-none focus:ring-1 focus:ring-lake-blue resize-y"
                        />
                        <p className="text-[11px] text-lake-ink/50 mt-1">L'email verrà inviata tramite Resend all'indirizzo <strong>{msg.email}</strong> e il messaggio sarà segnato automaticamente come risposto.</p>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-7 py-5 border-t border-lake-border">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-sm border border-lake-border text-sm text-lake-ink/70 hover:bg-lake-cream">
                        Annulla
                    </button>
                    <button
                        onClick={send}
                        disabled={sending}
                        className="px-5 py-2.5 rounded-sm bg-lake-blue text-white text-sm disabled:opacity-50"
                    >
                        {sending ? "Invio…" : "Invia email"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminInbox() {
    const [items, setItems] = useState([]);
    const [active, setActive] = useState(null);
    const [replyOpen, setReplyOpen] = useState(false);

    const load = () => api.get("/admin/messages").then((r) => setItems(r.data));
    useEffect(() => { load(); }, []);

    /** Update a single message both in the list and in the active panel. */
    const applyUpdate = (updated) => {
        setItems((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
        setActive((prev) => (prev?.id === updated.id ? updated : prev));
    };

    const setStatus = async (id, status) => {
        const r = await api.patch(`/admin/messages/${id}`, { status });
        applyUpdate(r.data);
    };

    const deleteMsg = async (id) => {
        if (!confirm("Eliminare questo messaggio?")) return;
        await api.delete(`/admin/messages/${id}`);
        toast.success("Messaggio eliminato");
        setActive(null);
        load();
    };

    const statusBadge = (status) => {
        if (status === "new") return <Badge className="bg-lake-blue text-white">Nuovo</Badge>;
        if (status === "replied") return <Badge className="bg-green-600 text-white flex items-center gap-1"><span>✓</span> Risposto</Badge>;
        return null;
    };

    return (
        <>
            {replyOpen && active && (
                <ReplyModal
                    msg={active}
                    onClose={() => setReplyOpen(false)}
                    onSent={(updated) => { applyUpdate(updated); }}
                />
            )}

            <div className="p-10 grid md:grid-cols-12 gap-8" data-testid="admin-inbox-page">
                {/* Left — message list */}
                <div className="md:col-span-5">
                    <p className="overline">Inbox</p>
                    <h1 className="font-display text-4xl text-lake-ink mt-2">Richieste info</h1>
                    <div className="mt-6 bg-white border border-lake-border rounded-sm divide-y divide-lake-border">
                        {items.length === 0 && <p className="p-6 text-lake-ink/60">Nessun messaggio.</p>}
                        {items.map((m) => (
                            <button
                                key={m.id}
                                onClick={() => {
                                    setActive(m);
                                    if (m.status === "new") setStatus(m.id, "read");
                                }}
                                data-testid={`message-${m.id}`}
                                className={`w-full text-left p-5 hover:bg-lake-cream ${active?.id === m.id ? "bg-lake-cream" : ""}`}
                            >
                                <div className="flex items-center justify-between">
                                    <p className="font-medium text-lake-ink truncate">{m.name}</p>
                                    {statusBadge(m.status)}
                                </div>
                                <p className="text-xs text-lake-ink/60 truncate mt-1">{m.subject || m.message.slice(0, 60)}</p>
                                <p className="text-[11px] text-lake-ink/50 mt-1">{fmtItDateTime(m.created_at)}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right — message detail */}
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

                            {/* Status indicator */}
                            {active.status === "replied" && (
                                <div className="mt-5 flex items-center gap-2 text-green-700 text-sm font-medium">
                                    <span className="text-base">✓</span> Hai già risposto a questo messaggio
                                </div>
                            )}

                            <div className="mt-8 flex flex-wrap gap-3">
                                {/* Reply → opens modal */}
                                <button
                                    onClick={() => setReplyOpen(true)}
                                    data-testid="reply-email-btn"
                                    className="px-5 py-2.5 rounded-sm bg-lake-blue text-white text-sm"
                                >
                                    Rispondi
                                </button>

                                {/* Mark as replied — with checkmark feedback */}
                                <button
                                    onClick={async () => {
                                        await setStatus(active.id, "replied");
                                        toast.success("Contrassegnato come risposto ✓");
                                    }}
                                    data-testid="mark-replied-btn"
                                    className={`px-5 py-2.5 rounded-sm border text-sm flex items-center gap-2 ${
                                        active.status === "replied"
                                            ? "border-green-500 text-green-700 bg-green-50"
                                            : "border-lake-border text-lake-ink"
                                    }`}
                                >
                                    {active.status === "replied" ? "✓ Risposto" : "Segna come risposto"}
                                </button>

                                <button onClick={() => deleteMsg(active.id)} className="px-5 py-2.5 rounded-sm bg-red-600 text-white text-sm">
                                    Elimina
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-lake-ink/60 mt-20">Seleziona un messaggio per vedere i dettagli.</p>
                    )}
                </div>
            </div>
        </>
    );
}
