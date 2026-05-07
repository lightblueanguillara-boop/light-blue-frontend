import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "../../lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../../components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { fmtItDate } from "../../lib/date";

const statusColors = {
    pending: "bg-amber-100 text-amber-700",
    confirmed: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-rose-100 text-rose-700",
    external: "bg-slate-100 text-slate-700",
};

export default function AdminBookings() {
    const [items, setItems] = useState([]);
    const [filter, setFilter] = useState("all");
    const [refundDialog, setRefundDialog] = useState({ open: false, booking: null, preview: null, custom: "" });
    const [processing, setProcessing] = useState(false);

    const load = () => api.get("/admin/bookings").then((r) => setItems(r.data));
    useEffect(() => { load(); }, []);

    const update = async (id, patch) => {
        try {
            await api.patch(`/admin/bookings/${id}`, patch);
            toast.success("Aggiornato");
            load();
        } catch { toast.error("Errore"); }
    };

    const del = async (id) => {
        if (!window.confirm("Eliminare questa prenotazione?")) return;
        try { await api.delete(`/admin/bookings/${id}`); toast.success("Eliminata"); load(); } catch { toast.error("Errore"); }
    };

    const openRefund = async (b) => {
        try {
            const r = await api.get(`/admin/bookings/${b.id}/refund-preview`);
            setRefundDialog({ open: true, booking: b, preview: r.data, custom: String(r.data.refund) });
        } catch {
            toast.error("Errore preview rimborso");
        }
    };

    const confirmRefund = async () => {
        if (!refundDialog.booking) return;
        setProcessing(true);
        try {
            const amount = parseFloat(refundDialog.custom);
            const r = await api.post(`/admin/bookings/${refundDialog.booking.id}/cancel-refund`, { amount: isNaN(amount) ? null : amount });
            toast.success(`Rimborso di €${r.data.refund_amount} eseguito`);
            setRefundDialog({ open: false, booking: null, preview: null, custom: "" });
            load();
        } catch (e) {
            toast.error(e?.response?.data?.detail || "Rimborso fallito");
        } finally { setProcessing(false); }
    };

    const sendReminder = async (b) => {
        try {
            await api.post(`/admin/bookings/${b.id}/balance-reminder`);
            toast.success("Promemoria inviato");
            load();
        } catch (e) {
            toast.error(e?.response?.data?.detail || "Errore invio");
        }
    };

    const filtered = filter === "all" ? items : items.filter((b) => b.status === filter);

    return (
        <div className="p-10" data-testid="admin-bookings-page">
            <div className="flex items-end justify-between">
                <div>
                    <p className="overline">Prenotazioni</p>
                    <h1 className="font-display text-4xl text-lake-ink mt-2">Gestione prenotazioni</h1>
                </div>
                <Select value={filter} onValueChange={setFilter}>
                    <SelectTrigger className="w-48" data-testid="bookings-filter"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tutte</SelectItem>
                        <SelectItem value="pending">In attesa</SelectItem>
                        <SelectItem value="confirmed">Confermate</SelectItem>
                        <SelectItem value="cancelled">Cancellate</SelectItem>
                        <SelectItem value="external">Esterne (Airbnb/Booking)</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="mt-8 bg-white border border-lake-border rounded-sm overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Ospite</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Totale</TableHead>
                            <TableHead>Stato</TableHead>
                            <TableHead>Pagamento</TableHead>
                            <TableHead>Policy</TableHead>
                            <TableHead>Fonte</TableHead>
                            <TableHead>Azioni</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.map((b) => (
                            <TableRow key={b.id} data-testid={`booking-row-${b.id}`}>
                                <TableCell>
                                    <p className="font-medium text-lake-ink">{b.guest_name}</p>
                                    <p className="text-xs text-lake-ink/60">{b.guest_email}</p>
                                </TableCell>
                                <TableCell className="text-sm">{fmtItDate(b.check_in)} → {fmtItDate(b.check_out)}</TableCell>
                                <TableCell className="text-sm">€{b.total_price?.toFixed?.(0) ?? b.total_price}</TableCell>
                                <TableCell>
                                    <Select value={b.status} onValueChange={(v) => update(b.id, { status: v })}>
                                        <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pending">In attesa</SelectItem>
                                            <SelectItem value="confirmed">Confermata</SelectItem>
                                            <SelectItem value="cancelled">Cancellata</SelectItem>
                                            <SelectItem value="external">Esterna</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                                <TableCell>
                                    <Badge className={statusColors[b.status] || ""}>{b.payment_status}</Badge>
                                </TableCell>
                                <TableCell>
                                    <Select value={b.cancellation_policy} onValueChange={(v) => update(b.id, { cancellation_policy: v })}>
                                        <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="flexible">Flessibile</SelectItem>
                                            <SelectItem value="moderate">Moderata</SelectItem>
                                            <SelectItem value="strict">Rigorosa</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                                <TableCell className="text-xs uppercase">{b.source}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1 text-xs">
                                        {b.payment_status === "deposit_paid" && (
                                            <button onClick={() => sendReminder(b)} data-testid={`remind-${b.id}`} className="text-lake-blue hover:underline text-left">Invia reminder saldo</button>
                                        )}
                                        {(b.payment_status === "deposit_paid" || b.payment_status === "fully_paid") && b.status !== "cancelled" && (
                                            <button onClick={() => openRefund(b)} data-testid={`refund-${b.id}`} className="text-amber-700 hover:underline text-left">Cancella + Rimborsa</button>
                                        )}
                                        <button onClick={() => del(b.id)} data-testid={`delete-booking-${b.id}`} className="text-red-600 hover:underline text-left">Elimina</button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filtered.length === 0 && (
                            <TableRow><TableCell colSpan={8} className="text-center text-lake-ink/60 py-10">Nessuna prenotazione.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={refundDialog.open} onOpenChange={(o) => !o && setRefundDialog({ open: false, booking: null, preview: null, custom: "" })}>
                <DialogContent data-testid="refund-dialog">
                    <DialogHeader>
                        <DialogTitle>Cancella prenotazione e rimborsa</DialogTitle>
                        <DialogDescription>
                            {refundDialog.preview && (
                                <>Policy <strong>{refundDialog.booking?.cancellation_policy}</strong> · {refundDialog.preview.reason}<br/>
                                Pagato: €{refundDialog.preview.paid} · Rimborso suggerito: <strong>€{refundDialog.preview.refund} ({refundDialog.preview.percent}%)</strong></>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label>Importo rimborso (€) — modificabile</Label>
                        <Input type="number" step="0.01" data-testid="refund-amount-input" value={refundDialog.custom} onChange={(e) => setRefundDialog({ ...refundDialog, custom: e.target.value })} />
                    </div>
                    <DialogFooter>
                        <button onClick={() => setRefundDialog({ open: false, booking: null, preview: null, custom: "" })} className="px-4 py-2 text-sm border border-lake-border rounded-sm">Annulla</button>
                        <button onClick={confirmRefund} disabled={processing} data-testid="confirm-refund-btn" className="px-5 py-2 bg-lake-blue text-white text-sm rounded-sm disabled:opacity-50">
                            {processing ? "Elaborazione..." : "Conferma rimborso"}
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
