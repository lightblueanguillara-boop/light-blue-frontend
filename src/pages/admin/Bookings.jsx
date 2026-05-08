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

// Colori originali per gli stati
const statusColors = {
    pending: "bg-amber-100 text-amber-700",
    confirmed: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-rose-100 text-rose-700",
    external: "bg-slate-100 text-slate-700",
};

// Colori per i pagamenti (quelli che ti piacevano)
const payColors = {
    unpaid: "bg-slate-100 text-slate-600",
    deposit_paid: "bg-blue-100 text-blue-700",
    fully_paid: "bg-emerald-100 text-emerald-700",
    refunded: "bg-purple-100 text-purple-700",
};

export default function AdminBookings() {
    const [items, setItems] = useState([]);
    const [filter, setFilter] = useState("all");
    const [refundDialog, setRefundDialog] = useState({ open: false, booking: null, preview: null, custom: "" });
    const [manualOpen, setManualOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [processing, setProcessing] = useState(false);

    const [manualForm, setManualForm] = useState({
        guest_name: "", guest_email: "", check_in: "", check_out: "", total_price: "", notes: "Prenotazione manuale"
    });

    const [editForm, setEditForm] = useState(null);

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
            setManualForm({ guest_name: "", guest_email: "", check_in: "", check_out: "", total_price: "", notes: "Prenotazione manuale" });
            load();
        } catch (err) {
            toast.error("Errore: controlla che l'email sia corretta");
        } finally { setProcessing(false); }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setProcessing(true);
        try {
            await api.patch(`/admin/bookings/${editForm.id}`, editForm);
            toast.success("Modifica salvata");
            setEditOpen(false);
            load();
        } catch { toast.error("Errore durante la modifica"); }
        finally { setProcessing(false); }
    };

    const del = async (id) => {
        if (!window.confirm("Eliminare questa prenotazione?")) return;
        try { await api.delete(`/admin/bookings/${id}`); toast.success("Eliminata"); load(); } catch { toast.error("Errore"); }
    };

    const filtered = filter === "all" ? items : items.filter((b) => b.status === filter);

    return (
        <div className="p-10" data-testid="admin-bookings-page">
            <div className="flex items-end justify-between mb-8">
                <div>
                    <p className="overline text-lake-blue font-bold">Dashboard Admin</p>
                    <h1 className="font-display text-4xl text-lake-ink mt-2">Gestione prenotazioni</h1>
                </div>
                
                <div className="flex gap-4">
                    <Button onClick={() => setManualOpen(true)} className="bg-lake-blue hover:bg-lake-blue/90">
                        <Plus className="mr-2 h-4 w-4" /> Nuova Prenotazione
                    </Button>

                    <Select value={filter} onValueChange={setFilter}>
                        <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tutte le fonti</SelectItem>
                            <SelectItem value="pending">In attesa</SelectItem>
                            <SelectItem value="confirmed">Confermate</SelectItem>
                            <SelectItem value="cancelled">Cancellate</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Tabs defaultValue="list" className="w-full">
                <TabsList className="mb-6">
                    <TabsTrigger value="list" className="px-8"><List className="mr-2 h-4 w-4" /> Lista</TabsTrigger>
                    <TabsTrigger value="calendar" className="px-8"><CalendarIcon className="mr-2 h-4 w-4" /> Calendario Visivo</TabsTrigger>
                </TabsList>

                <TabsContent value="list">
                    <div className="bg-white border border-lake-border rounded-sm overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead className="font-bold">Ospite</TableHead>
                                    <TableHead className="font-bold">Date soggiorno</TableHead>
                                    <TableHead className="font-bold">Totale</TableHead>
                                    <TableHead className="font-bold">Stato Pren.</TableHead>
                                    <TableHead className="font-bold">Stato Pagam.</TableHead>
                                    <TableHead className="font-bold text-right">Azioni</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map((b) => (
                                    <TableRow key={b.id} className="hover:bg-slate-50/50">
                                        <TableCell>
                                            <p className="font-medium text-lake-ink">{b.guest_name}</p>
                                            <p className="text-xs text-lake-ink/60">{b.guest_email}</p>
                                        </TableCell>
                                        <TableCell className="text-sm font-medium">
                                            {fmtItDate(b.check_in)} <span className="text-slate-400 mx-1">→</span> {fmtItDate(b.check_out)}
                                        </TableCell>
                                        <TableCell className="text-sm font-bold text-lake-blue">€{b.total_price}</TableCell>
                                        <TableCell>
                                            <Select value={b.status} onValueChange={(v) => update(b.id, { status: v })}>
                                                <SelectTrigger className={`h-8 w-32 border-none shadow-none font-bold ${statusColors[b.status]}`}>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="pending text-amber-700">In attesa</SelectItem>
                                                    <SelectItem value="confirmed text-emerald-700">Confermata</SelectItem>
                                                    <SelectItem value="cancelled text-rose-700">Cancellata</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            <Select value={b.payment_status} onValueChange={(v) => update(b.id, { payment_status: v })}>
                                                <SelectTrigger className={`h-8 w-36 border-none shadow-none font-bold ${payColors[b.payment_status] || "bg-slate-100"}`}>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="unpaid">Non Pagato</SelectItem>
                                                    <SelectItem value="deposit_paid">Acconto</SelectItem>
                                                    <SelectItem value="fully_paid">Saldato</SelectItem>
                                                    <SelectItem value="refunded">Rimborsato</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-3">
                                                <button onClick={() => { setEditForm(b); setEditOpen(true); }} className="text-lake-blue hover:text-blue-800 transition-colors" title="Modifica">
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => del(b.id)} className="text-rose-500 hover:text-rose-700" title="Elimina">
                                                    <Plus className="h-4 w-4 rotate-45" /> 
                                                </button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                <TabsContent value="calendar" className="bg-white border border-lake-border rounded-sm p-10 flex justify-center min-h-[500px]">
                    <DayPicker
                        mode="multiple"
                        locale={it}
                        modifiers={{ booked: bookedDates }}
                        modifiersStyles={{
                            booked: { backgroundColor: "#ef4444", color: "white", borderRadius: 0 }
                        }}
                        numberOfMonths={2}
                        className="admin-calendar"
                    />
                </TabsContent>
            </Tabs>

            {/* MODALE INSERIMENTO MANUALE */}
            <Dialog open={manualOpen} onOpenChange={setManualOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader><DialogTitle className="text-2xl font-display text-lake-ink">Nuova Prenotazione</DialogTitle></DialogHeader>
                    <form onSubmit={handleManualSubmit} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label>Nome Ospite</Label>
                            <Input required value={manualForm.guest_name} onChange={e => setManualForm({...manualForm, guest_name: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <Label>Email Ospite</Label>
                            <Input type="email" required value={manualForm.guest_email} onChange={e => setManualForm({...manualForm, guest_email: e.target.value})} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Check-in</Label>
                                <Input type="date" required value={manualForm.check_in} onChange={e => setManualForm({...manualForm, check_in: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <Label>Check-out</Label>
                                <Input type="date" required value={manualForm.check_out} onChange={e => setManualForm({...manualForm, check_out: e.target.value})} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Prezzo Totale (€)</Label>
                            <Input type="number" step="0.01" required value={manualForm.total_price} onChange={e => setManualForm({...manualForm, total_price: e.target.value})} />
                        </div>
                        <Button type="submit" disabled={processing} className="w-full bg-lake-blue">Salva Prenotazione</Button>
                    </form>
                </DialogContent>
            </Dialog>

            {/* MODALE MODIFICA */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader><DialogTitle className="text-2xl font-display text-lake-ink">Modifica Dettagli</DialogTitle></DialogHeader>
                    {editForm && (
                        <form onSubmit={handleEditSubmit} className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label>Nome Ospite</Label>
                                <Input required value={editForm.guest_name} onChange={e => setEditForm({...editForm, guest_name: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input type="email" required value={editForm.guest_email} onChange={e => setEditForm({...editForm, guest_email: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Check-in</Label>
                                    <Input type="date" required value={editForm.check_in} onChange={e => setEditForm({...editForm, check_in: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Check-out</Label>
                                    <Input type="date" required value={editForm.check_out} onChange={e => setEditForm({...editForm, check_out: e.target.value})} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Prezzo Totale (€)</Label>
                                <Input type="number" step="0.01" required value={editForm.total_price} onChange={e => setEditForm({...editForm, total_price: e.target.value})} />
                            </div>
                            <Button type="submit" disabled={processing} className="w-full bg-lake-blue">Salva Modifiche</Button>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
