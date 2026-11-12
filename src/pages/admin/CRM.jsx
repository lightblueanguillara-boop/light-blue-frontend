import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Download, Trash2 } from "lucide-react";
import { api } from "../../lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { fmtItDate } from "../../lib/date";

const SOURCE_LABELS = { website: "Sito", contact_form: "Modulo contatti", booking: "Prenotazione", booking_request: "Richiesta prenotazione", newsletter_form: "Newsletter" };

/** Valore CSV sicuro: tra virgolette e senza formule eseguibili da Excel. */
function csvCell(v) {
    let s = String(v ?? "");
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
    return `"${s.replace(/"/g, '""')}"`;
}

export default function AdminCRM() {
    const [subs, setSubs] = useState([]);
    const load = () => api.get("/admin/subscribers").then((r) => setSubs(r.data)).catch(() => toast.error("Errore nel caricamento"));
    useEffect(() => { load(); }, []);

    const del = async (s) => {
        if (!window.confirm(`Rimuovere ${s.email} dalla mailing list?`)) return;
        try { await api.delete(`/admin/subscribers/${s.id}`); toast.success("Iscritto rimosso"); load(); }
        catch { toast.error("Rimozione non riuscita"); }
    };

    const exportCSV = () => {
        const lines = [["email", "nome", "fonte", "data_consenso"].map(csvCell).join(",")];
        subs.forEach((s) => lines.push([s.email, s.name || "", s.source, s.consent_date].map(csvCell).join(",")));
        const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = "iscritti-newsletter.csv"; a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    };

    return (
        <div className="p-4 sm:p-10" data-testid="admin-crm-page">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <p className="overline">CRM</p>
                    <h1 className="font-display text-3xl sm:text-4xl text-lake-ink mt-2">Mailing list</h1>
                    <p className="text-sm text-lake-ink/60 mt-2">{subs.length} iscritti · solo con consenso esplicito alla newsletter.</p>
                </div>
                <button onClick={exportCSV} disabled={!subs.length} data-testid="export-csv-btn" className="inline-flex items-center justify-center gap-2 px-5 h-10 rounded-sm border border-lake-border bg-white text-sm disabled:opacity-50">
                    <Download className="w-4 h-4" /> Esporta CSV
                </button>
            </div>

            {/* PC: tabella */}
            <div className="hidden md:block mt-8 bg-white border border-lake-border rounded-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50 uppercase text-[10px] font-bold">
                            <TableHead>Email</TableHead>
                            <TableHead>Nome</TableHead>
                            <TableHead>Fonte</TableHead>
                            <TableHead>Consenso</TableHead>
                            <TableHead className="text-right">Azioni</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {subs.map((s) => (
                            <TableRow key={s.id}>
                                <TableCell className="max-w-[320px] truncate">{s.email}</TableCell>
                                <TableCell>{s.name || "—"}</TableCell>
                                <TableCell className="text-xs text-lake-ink/70">{SOURCE_LABELS[s.source] || s.source}</TableCell>
                                <TableCell className="text-xs whitespace-nowrap">{fmtItDate(s.consent_date)}</TableCell>
                                <TableCell className="text-right"><button onClick={() => del(s)} className="text-xs font-semibold text-red-600 hover:underline" data-testid={`delete-sub-${s.id}`}>Rimuovi</button></TableCell>
                            </TableRow>
                        ))}
                        {subs.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-lake-ink/50 italic py-10">Nessun iscritto.</TableCell></TableRow>}
                    </TableBody>
                </Table>
            </div>

            {/* Telefono: schede */}
            <div className="md:hidden mt-6 space-y-3" data-testid="crm-cards">
                {subs.length === 0 && <p className="bg-white border border-lake-border rounded-sm text-center text-lake-ink/50 italic py-10">Nessun iscritto.</p>}
                {subs.map((s) => (
                    <div key={s.id} className="bg-white border border-lake-border rounded-sm p-4 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <p className="font-semibold text-lake-ink break-all">{s.email}</p>
                            {s.name && <p className="text-sm text-lake-ink/70">{s.name}</p>}
                            <p className="text-xs text-lake-ink/50 mt-1">{SOURCE_LABELS[s.source] || s.source} · consenso del {fmtItDate(s.consent_date)}</p>
                        </div>
                        <button onClick={() => del(s)} aria-label={`Rimuovi ${s.email}`} className="p-2 -m-1 text-red-500 shrink-0"><Trash2 className="w-4 h-4" /></button>
                    </div>
                ))}
            </div>
        </div>
    );
}
