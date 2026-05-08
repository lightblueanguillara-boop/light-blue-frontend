import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { DayPicker } from "react-day-picker";
import { it } from "date-fns/locale";
import "react-day-picker/dist/style.css";
import { Calendar as CalendarIcon, List, Plus, Pencil } from "lucide-react";
import { api } from "../../lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../../components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
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
    const [manualOpen, setManualOpen] = useState(false);
    const [processing, setProcessing] = useState(false);

    // Stato per nuova prenotazione manuale / modifica
    const [manualForm, setManualForm] = useState({
        guest_name: "",
        guest_email: "",
        check_in: "",
        check_out: "",
        total_price: "",
        notes: "Prenotazione manuale"
    });

    const load = () => api.get("/admin/bookings").then((r) => setItems(r.data));
    useEffect(() => { load(); }, []);

    const bookedDates = useMemo(() => {
        const dates = [];
        items.filter(b => b.status !== "cancelled").forEach(b => {
            let current = new Date(b.check_in);
            const end = new Date(b.check_out);
            while (current <= end) {
                dates.push(new Date(current));
                current.setDate(current.getDate() + 1);
            }
        });
        return dates;
    }, [items]);

    const update = async (id, patch) => {
        try {
            await api.patch(`/admin/bookings/${id}`, patch);
            toast.success("Aggiornato");
            load();
        } catch { toast.error("Errore durante l'aggiornamento"); }
    };

    const del = async (id) => {
        if (!window.confirm("Eliminare questa prenotazione?")) return;
        try { await api.delete(`/admin/bookings/${id}`); toast.success("Eliminata"); load(); } catch { toast.error("Errore durante l'eliminazione"); }
    };

    const handleManualSubmit = async (e) => {
        e.preventDefault();
        setProcessing(true);
        try {
            const payload = {
                ...manualForm,
                status: "confirmed",
                total_price: parseFloat(manualForm.total_price) || 0,
            };

            // Se ha un ID, è una modifica, altrimenti è nuova
            if (manualForm.id) {
                await api.patch(`/admin/bookings/${manualForm.id}`, payload);
                toast.success("Prenotazione aggiornata!");
            } else {
                await api.post("/admin/bookings/manual", {
                    ...payload,
                    id: `man-${Date.now()}`,
                    payment_status: "fully_paid",
                    source: "manual",
                    created_at: new Date().toISOString()
                });
                toast.success("Prenotazione registrata!");
            }
            
            setManualOpen(false);
            setManualForm({ guest_name: "", guest_email: "", check_in: "", check_out: "", total_price: "", notes: "Prenotazione manuale" });
            load();
        } catch (err) {
            toast.error("Errore nel salvataggio");
        } finally { setProcessing(false); }
    };

    const openEdit = (b) => {
        setManualForm({
            id: b.id,
            guest_name: b.guest_name,
            guest_email: b.guest_email,
            check_in: b.check_in,
            check_out: b.check_out,
            total_price: String(b.total_price),
            notes: b.notes || ""
        });
        setManualOpen(true);
    };

    const openRefund = async (b) => {
        try {
            const r = await api.get(`/admin/bookings/${b.id}/refund-preview`);
            setRefundDialog({ open: true, booking: b, preview: r.data, custom: String(r.data.refund) });
        } catch { toast.error("Errore nel caricamento del rimborso"); }
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
            toast.success("Promemoria inviato all'ospite");
            load();
        } catch (e) { toast.error(e?.response?.data?.detail || "Errore durante l'invio"); }
    };

    const filtered = filter === "all" ? items : items.filter((b) => b.status === filter);

    return (
        <div className="p-10" data-testid="admin-bookings-page">
            <div className="flex items-end justify-between mb-8">
                <div>
                    <p className="overline">Dashboard Admin</p>
                    <h1 className="font-display text-4xl text-lake-ink mt-2">Gestione prenotazioni</h1>
                </div>
                
                <div className="flex gap-4">
                    <Dialog open={manualOpen} onOpenChange={(o) => {
                        setManualOpen(o);
                        if(!o) setManualForm({ guest_name: "", guest_email: "", check_in: "", check_out: "", total_price: "", notes: "Prenotazione manuale" });
                    }}>
                        <DialogTrigger asChild>
                            <Button className="bg-lake-blue hover:bg-lake-blue/90">
                                <Plus className="mr-2 h-4 w-4" /> Nuova Prenotazione
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{manualForm.id ? "Modifica Prenotazione" : "Inserimento Manuale"}</DialogTitle>
                                <DialogDescription>Gestisci i dettagli della prenotazione e blocca le date.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleManualSubmit} className="space-y-4 pt-4">
                                <div className="grid gap-2">
                                    <Label>Nome Ospite</Label>
                                    <Input required value={manualForm.guest_name} onChange={e => setManualForm({...manualForm, guest_name: e.target.value})} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Email Ospite</Label>
                                    <Input type="email" required placeholder="nome@esempio.it" value={manualForm.guest_email} onChange={e => setManualForm({...manualForm, guest_email: e.target.value})} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Check-in</Label>
                                        <Input type="date" required value={manualForm.check_in} onChange={e => setManualForm({...manualForm, check_in: e.target.value})} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Check-out</Label>
                                        <Input type="date" required value={manualForm.check_out} onChange={e => setManualForm({...manualForm, check_out: e.target.value})} />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Prezzo Totale (€)</Label>
                                    <Input required type="number" step="0.01" value={manualForm.total_price} onChange={e => setManualForm({...manualForm, total_price: e.target.value})} />
                                </div>
                                <DialogFooter>
                                    <Button type="submit" disabled={processing} className="w-full bg-emerald-600 hover:bg-emerald-700">
                                        {processing ? "Salvataggio..." : "Salva Prenotazione"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>

                    <Select value={filter} onValueChange={setFilter}>
                        <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tutte le fonti</SelectItem>
                            <SelectItem value="pending">In attesa</SelectItem>
                            <SelectItem value="confirmed">Confermate</SelectItem>
                            <SelectItem value="cancelled">Cancellate</SelectItem>
                            <SelectItem value="external">Esterne (Sync)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Tabs defaultValue="list" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="list"><List className="mr-2 h-4 w-4" /> Lista</TabsTrigger>
                    <TabsTrigger value="calendar"><CalendarIcon className="mr-2 h-4 w-4" /> Calendario</TabsTrigger>
                </TabsList>

                <TabsContent value="list">
                    <div className="bg-white border border-lake-border rounded-sm overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Ospite</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Totale</TableHead>
                                    <TableHead>Stato Prenotazione</TableHead>
                                    <TableHead>Stato Pagamento</TableHead>
                                    <TableHead>Fonte</TableHead>
                                    <TableHead>Azioni</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map((b) => (
                                    <TableRow key={b.id}>
                                        <TableCell>
                                            <p className="font-medium text-lake-ink">{b.guest_name}</p>
                                            <p className="text-xs text-lake-ink/60">{b.guest_email}</p>
                                        </TableCell>
                                        <TableCell className="text-sm whitespace-nowrap">{fmtItDate(b.check_in)} → {fmtItDate(b.check_out)}</TableCell>
                                        <TableCell className="text-sm font-bold">€{b.total_price}</TableCell>
                                        <TableCell>
                                            <Select value={b.status} onValueChange={(v) => update(b.id, { status: v })}>
                                                <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="pending">In attesa</SelectItem>
                                                    <SelectItem value="confirmed">Confermata</SelectItem>
                                                    <SelectItem value="cancelled">Cancellata</SelectItem>
                                                    <SelectItem value="external">Esterna</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            <Select value={b.payment_status} onValueChange={(v) => update(b.id, { payment_status: v })}>
                                                <SelectTrigger className="w-36 h-8 text-xs">
                                                    <Badge className={statusColors[b.status] || ""}>{b.payment_status}</Badge>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="unpaid">Non pagato</SelectItem>
                                                    <SelectItem value="deposit_paid">Acconto pagato</SelectItem>
                                                    <SelectItem value="fully_paid">Saldato</SelectItem>
                                                    <SelectItem value="refunded">Rimborsato</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell className="text-xs uppercase font-bold text-lake-blue">{b.source}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1 text-xs">
                                                <button onClick={() => openEdit(b)} className="text-lake-ink hover:underline text-left flex items-center gap-1">
                                                    <Pencil className="w-3 h-3"/> Modifica
                                                </button>
                                                {b.payment_status === "deposit_paid" && (
                                                    <button onClick={() => sendReminder(b)} className="text-lake-blue hover:underline text-left">Invia reminder saldo</button>
                                                )}
                                                {b.status !== "cancelled" && b.source !== "external" && (
                                                    <button onClick={() => openRefund(b)} className="text-amber-700 hover:underline text-left">Cancella + Rimborsa</button>
                                                )}
                                                <button onClick={() => del(b.id)} className="text-red-600 hover:underline text-left font-semibold">Elimina</button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                <TabsContent value="calendar" className="bg-white border border-lake-border rounded-sm p-10 flex justify-center">
                    <DayPicker
                        mode="multiple"
                        locale={it}
                        modifiers={{ booked: bookedDates }}
                        modifiersStyles={{
                            booked: { backgroundColor: "#ef4444", color: "white", borderRadius: 0 }
                        }}
                        numberOfMonths={3}
                        className="admin-calendar"
                    />
                </TabsContent>
            </Tabs>

            <Dialog open={refundDialog.open} onOpenChange={(o) => !o && setRefundDialog({ open: false, booking: null, preview: null, custom: "" })}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Cancella e rimborsa</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <DialogDescription>
                            {refundDialog.preview && (
                                <>Policy: <strong>{refundDialog.booking?.cancellation_policy}</strong><br/>
                                Pagato: €{refundDialog.preview.paid} · Rimborso suggerito: <strong>€{refundDialog.preview.refund}</strong></>
                            )}
                        </DialogDescription>
                        <div className="space-y-2">
                            <Label>Importo rimborso (€)</Label>
                            <Input type="number" step="0.01" value={refundDialog.custom} onChange={(e) => setRefundDialog({ ...refundDialog, custom: e.target.value })} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRefundDialog({ open: false, booking: null, preview: null, custom: "" })}>Annulla</Button>
                        <Button onClick={confirmRefund} disabled={processing} className="bg-lake-blue">
                            {processing ? "Elaborazione..." : "Conferma Rimborso"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
