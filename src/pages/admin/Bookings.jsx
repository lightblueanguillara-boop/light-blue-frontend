import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { DayPicker } from "react-day-picker";
import { it } from "date-fns/locale";
import "react-day-picker/dist/style.css";
import { Calendar as CalendarIcon, List, Plus, Pencil } from "lucide-react"; // Aggiunto Pencil
import { api } from "../../lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../../components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { fmtItDate, toIsoDate } from "../../lib/date";

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
    const [editOpen, setEditOpen] = useState(false); // Stato per il Dialog di modifica
    const [processing, setProcessing] = useState(false);

    const [manualForm, setManualForm] = useState({
        guest_name: "", guest_email: "", check_in: "", check_out: "", total_price: "", notes: "Prenotazione manuale"
    });

    const [editForm, setEditForm] = useState(null); // Stato per i dati in modifica

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

    const handleManualSubmit = async (e) => {
        e.preventDefault();
        setProcessing(true);
        try {
            const payload = {
                ...manualForm,
                id: `man-${Date.now()}`, 
                status: "confirmed",
                payment_status: "fully_paid", 
                source: "manual",
                total_price: parseFloat(manualForm.total_price) || 0,
                deposit_amount: 0,
                created_at: new Date().toISOString()
            };
            await api.post("/admin/bookings/manual", payload);
            toast.success("Prenotazione registrata!");
            setManualOpen(false);
            setManualForm({ guest_name: "", guest_email: "", check_in: "", check_out: "", total_price: "", notes: "" });
            load();
        } catch (err) {
            toast.error("Errore nel salvataggio. Controlla i dati.");
        } finally { setProcessing(false); }
    };

    // Funzione per aprire il modulo di modifica
    const openEdit = (booking) => {
        setEditForm(booking);
        setEditOpen(true);
    };

    // Invio della modifica
    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setProcessing(true);
        try {
            await api.patch(`/admin/bookings/${editForm.id}`, editForm);
            toast.success("Prenotazione modificata");
            setEditOpen(false);
            load();
        } catch {
            toast.error("Erro error durante la modifica");
        } finally { setProcessing(false); }
    };

    const del = async (id) => {
        if (!window.confirm("Eliminare questa prenotazione?")) return;
        try { await api.delete(`/admin/bookings/${id}`); toast.success("Eliminata"); load(); } catch { toast.error("Errore"); }
    };

    const filtered = filter === "all" ? items : items.filter((b) => b.status === filter);

    return (
        <div className="p-10">
            {/* HEADER E FILTRI (Invariati) */}
            <div className="flex items-end justify-between mb-8">
                <div>
                    <p className="overline">Dashboard Admin</p>
                    <h1 className="font-display text-4xl text-lake-ink mt-2">Gestione prenotazioni</h1>
                </div>
                <div className="flex gap-4">
                    <Button onClick={() => setManualOpen(true)} className="bg-lake-blue hover:bg-lake-blue/90">
                        <Plus className="mr-2 h-4 w-4" /> Nuova Prenotazione
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="list">
                <TabsList className="mb-4">
                    <TabsTrigger value="list"><List className="mr-2 h-4 w-4" /> Lista</TabsTrigger>
                    <TabsTrigger value="calendar"><CalendarIcon className="mr-2 h-4 w-4" /> Calendario</TabsTrigger>
                </TabsList>

                <TabsContent value="list">
                    <div className="bg-white border rounded-sm">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Ospite</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Prezzo</TableHead>
                                    <TableHead>Stato Pren.</TableHead>
                                    <TableHead>Stato Pagam.</TableHead>
                                    <TableHead>Azioni</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map((b) => (
                                    <TableRow key={b.id}>
                                        <TableCell>
                                            <div className="font-medium">{b.guest_name}</div>
                                            <div className="text-xs text-gray-500">{b.guest_email}</div>
                                        </TableCell>
                                        <TableCell className="text-sm">{fmtItDate(b.check_in)} → {fmtItDate(b.check_out)}</TableCell>
                                        <TableCell className="text-sm">€{b.total_price}</TableCell>
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
                                            {/* MODIFICA PAGAMENTO DIRETTA */}
                                            <Select value={b.payment_status} onValueChange={(v) => update(b.id, { payment_status: v })}>
                                                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="unpaid">Non Pagato</SelectItem>
                                                    <SelectItem value="deposit_paid">Acconto</SelectItem>
                                                    <SelectItem value="fully_paid">Saldato</SelectItem>
                                                    <SelectItem value="refunded">Rimborsato</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <button onClick={() => openEdit(b)} className="flex items-center text-xs text-blue-600 hover:underline">
                                                    <Pencil className="mr-1 h-3 w-3" /> Modifica
                                                </button>
                                                <button onClick={() => del(b.id)} className="text-xs text-red-600 hover:underline text-left">Elimina</button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>
                {/* Calendario (Invariato) */}
            </Tabs>

            {/* DIALOG INSERIMENTO MANUALE (Invariato ma con email obbligatoria) */}
            <Dialog open={manualOpen} onOpenChange={setManualOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Nuova Prenotazione</DialogTitle></DialogHeader>
                    <form onSubmit={handleManualSubmit} className="space-y-4">
                        <Input placeholder="Nome" required value={manualForm.guest_name} onChange={e => setManualForm({...manualForm, guest_name: e.target.value})} />
                        <Input placeholder="Email" type="email" required value={manualForm.guest_email} onChange={e => setManualForm({...manualForm, guest_email: e.target.value})} />
                        <div className="grid grid-cols-2 gap-2">
                            <Input type="date" required value={manualForm.check_in} onChange={e => setManualForm({...manualForm, check_in: e.target.value})} />
                            <Input type="date" required value={manualForm.check_out} onChange={e => setManualForm({...manualForm, check_out: e.target.value})} />
                        </div>
                        <Input placeholder="Prezzo" type="number" required value={manualForm.total_price} onChange={e => setManualForm({...manualForm, total_price: e.target.value})} />
                        <Button type="submit" disabled={processing} className="w-full">Salva</Button>
                    </form>
                </DialogContent>
            </Dialog>

            {/* DIALOG MODIFICA PRENOTAZIONE ESISTENTE */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Modifica Prenotazione</DialogTitle></DialogHeader>
                    {editForm && (
                        <form onSubmit={handleEditSubmit} className="space-y-4">
                            <div className="grid gap-2">
                                <Label>Nome Ospite</Label>
                                <Input required value={editForm.guest_name} onChange={e => setEditForm({...editForm, guest_name: e.target.value})} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Email</Label>
                                <Input type="email" required value={editForm.guest_email} onChange={e => setEditForm({...editForm, guest_email: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="grid gap-1">
                                    <Label>Check-in</Label>
                                    <Input type="date" required value={editForm.check_in} onChange={e => setEditForm({...editForm, check_in: e.target.value})} />
                                </div>
                                <div className="grid gap-1">
                                    <Label>Check-out</Label>
                                    <Input type="date" required value={editForm.check_out} onChange={e => setEditForm({...editForm, check_out: e.target.value})} />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Prezzo Totale (€)</Label>
                                <Input type="number" step="0.01" required value={editForm.total_price} onChange={e => setEditForm({...editForm, total_price: e.target.value})} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Note</Label>
                                <Input value={editForm.notes || ""} onChange={e => setEditForm({...editForm, notes: e.target.value})} />
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={processing} className="w-full bg-lake-blue">Salva Modifiche</Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
