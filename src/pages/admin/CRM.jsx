import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "../../lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { fmtItDate } from "../../lib/date";

export default function AdminCRM() {
    const [subs, setSubs] = useState([]);
    const load = () => api.get("/admin/subscribers").then((r) => setSubs(r.data));
    useEffect(() => { load(); }, []);
    const del = async (id) => {
        if (!window.confirm("Rimuovere iscritto?")) return;
        await api.delete(`/admin/subscribers/${id}`); toast.success("Rimosso"); load();
    };
    const exportCSV = () => {
        const lines = ["email,name,source,consent_date"];
        subs.forEach((s) => lines.push(`${s.email},${s.name || ''},${s.source},${s.consent_date}`));
        const blob = new Blob([lines.join("\n")], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = "subscribers.csv"; a.click();
    };

    return (
        <div className="p-10" data-testid="admin-crm-page">
            <div className="flex items-end justify-between">
                <div>
                    <p className="overline">CRM</p>
                    <h1 className="font-display text-4xl text-lake-ink mt-2">Mailing list</h1>
                    <p className="text-sm text-lake-ink/60 mt-2">Solo iscritti con consenso GDPR esplicito.</p>
                </div>
                <button onClick={exportCSV} data-testid="export-csv-btn" className="px-5 py-2.5 rounded-sm border border-lake-border text-sm">Esporta CSV</button>
            </div>

            <div className="mt-8 bg-white border border-lake-border rounded-sm overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Nome</TableHead>
                            <TableHead>Fonte</TableHead>
                            <TableHead>Consenso</TableHead>
                            <TableHead>Azioni</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {subs.map((s) => (
                            <TableRow key={s.id}>
                                <TableCell>{s.email}</TableCell>
                                <TableCell>{s.name || "—"}</TableCell>
                                <TableCell className="text-xs uppercase">{s.source}</TableCell>
                                <TableCell className="text-xs">{fmtItDate(s.consent_date)}</TableCell>
                                <TableCell><button onClick={() => del(s.id)} className="text-xs text-red-600 hover:underline" data-testid={`delete-sub-${s.id}`}>Rimuovi</button></TableCell>
                            </TableRow>
                        ))}
                        {subs.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-lake-ink/60 py-10">Nessun iscritto.</TableCell></TableRow>}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
