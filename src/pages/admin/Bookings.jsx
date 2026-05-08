import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { DayPicker } from "react-day-picker";
import { it } from "date-fns/locale";
import "react-day-picker/dist/style.css";
import { Calendar as CalendarIcon, List, Plus, Pencil, Search, X, Info, CreditCard, Hash, Users, Phone, Mail, FileText } from "lucide-react";
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
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterPayment, setFilterPayment] = useState("all");
    const [filterSource, setFilterSource] = useState("all");
    
    const [manualOpen, setManualOpen] = useState(false);
    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [processing, setProcessing] = useState(false);

    const [manualForm, setManualForm] = useState({
        guest_name: "", guest_email: "", check_in: "", check_out: "", total_price: "", notes: "Prenotazione manuale"
    });

    const load = () => api.get("/admin/bookings").then((r) => setItems(r.data)).catch(() => toast.error("Errore caricamento dati"));
    useEffect(() => { load(); }, []);

    const filtered = useMemo(() => {
        return items.filter((b) => {
            const searchTerm = search.toLowerCase();
            const matchesSearch = 
                (b.guest_name?.toLowerCase() || "").includes(searchTerm) ||
                (b.guest_email?.toLowerCase() || "").includes(searchTerm) ||
                (b.id?.toString() || "").includes(searchTerm);
            
            let matchesStatus = filterStatus === "all" || (filterStatus === "external" ? (b.status === "external" || b.source === "airbnb" || b.source === "booking") : b.status === filterStatus);
            const matchesPayment = filterPayment === "all" || b.payment_status === filterPayment;
            let matchesSource = filterSource === "all" || (filterSource === "external" ? (b.source === "airbnb" || b.source === "booking" || b.source === "external") : b.source === filterSource);

            return matchesSearch && matchesStatus && matchesPayment && matchesSource;
        });
    }, [items, search, filterStatus, filterPayment, filterSource]);

    const bookedDates = useMemo(() => {
        const dates = [];
        items.filter(b => b.status !== "cancelled").forEach(b => {
            let current = new Date(b.check_in);
            const end = new Date(b.check_out);
            // Corretto: usiamo < invece di <= per liberare il giorno del checkout nel calendario
            while (current < end) {
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
        if (!window.confirm("Eliminare definitivamente questa prenotazione?")) return;
        try { await api.delete(`/admin/bookings/${id}`); toast.success("Eliminata"); load(); } catch { toast.error("Errore durante l'eliminazione"); }
    };

    const handleManualSubmit = async (e) => {
        e.preventDefault();
        setProcessing(true);
        try {
            const payload = { ...manualForm, total_price: parseFloat(manualForm.total_price) || 0 };
            if (manualForm.id) {
                await api.patch(`/admin/bookings/${manualForm.id}`, payload);
                toast.success("Modificata con successo");
            } else {
                await api.post("/admin/bookings/manual", { ...payload, id: `man-${Date.now()}`, status: "confirmed", payment_status: "fully_paid", source: "manual", created_at: new Date().toISOString() });
                toast.success("Registrata con successo");
            }
            setManualOpen(false);
            setManualForm({ guest_name: "", guest_email: "", check_in: "", check_out: "", total_price: "", notes: "Prenotazione manuale" });
            load();
        } catch { toast.error("Errore nel salvataggio"); } finally { setProcessing(false); }
    };

    const openEdit = (b) => {
        setManualForm({ id: b.id, guest_name: b.guest_name || "", guest_email: b.guest_email || "", check_in: b.check_in || "", check_out: b.check_out || "", total_price: String(b.total_price || 0), notes: b.notes || "" });
        setManualOpen(true);
    };

    const openDetail = (b) => {
        setSelectedBooking(b);
        setDetailOpen(true);
    };

    return (
        <div className="p-10" data-testid="admin-bookings-page">
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-8 gap-4">
                <div>
                    <p className="overline text-lake-ink/60 font-bold tracking-widest leading-none">Gestione Proprietà</p>
                    <h1 className="font-display text-4xl text-lake-ink mt-2">Prenotazioni</h1>
                </div>
                <Button onClick={() => setManualOpen(true)} className="bg-lake-blue hover:bg-lake-blue/90">
                    <Plus className="mr-2 h-4 w-4" /> Nuova Prenotazione
                </Button>
            </div>

            <div className="bg-white border border-lake-border p-4 mb-6 rounded-sm flex flex-wrap gap-4 items-center">
                <div className="relative flex-1 min-w-[250px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-lake-ink/40" />
                    <Input placeholder="Cerca per nome, email o ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-10" />
                </div>
                <div className="flex flex-wrap gap-2">
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-44 text-xs h-10"><SelectValue placeholder="Stato" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tutti gli stati</SelectItem>
                            <SelectItem value="pending">In attesa</SelectItem>
                            <SelectItem value="confirmed">Confermate</SelectItem>
                            <SelectItem value="cancelled">Cancellate</SelectItem>
                            <SelectItem value="external">Esterne (Airbnb/Booking)</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={filterPayment} onValueChange={setFilterPayment}>
                        <SelectTrigger className="w-44 text-xs h-10"><SelectValue placeholder="Pagamento" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tutti i pagamenti</SelectItem>
                            <SelectItem value="unpaid">Non pagato</SelectItem>
                            <SelectItem value="deposit_paid">Acconto pagato</SelectItem>
                            <SelectItem value="fully_paid">Saldato</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={filterSource} onValueChange={setFilterSource}>
                        <SelectTrigger className="w-32 text-xs h-10"><SelectValue placeholder="Fonte" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tutte le fonti</SelectItem>
                            <SelectItem value="website">Sito Web</SelectItem>
                            <SelectItem value="manual">Manuale</SelectItem>
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
                    <div className="bg-white border border-lake-border rounded-sm overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50 uppercase text-[10px] font-bold">
                                    <TableHead>Ospite</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Importo</TableHead>
                                    <TableHead>Stato Prenotazione</TableHead>
                                    <TableHead>Stato Pagamento</TableHead>
                                    <TableHead>Fonte</TableHead>
                                    <TableHead className="text-right">Azioni</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map((b) => (
                                    <TableRow key={b.id} className="hover:bg-slate-50/50 transition-colors">
                                        <TableCell>
                                            <button onClick={() => openDetail(b)} className="text-left group flex flex-col">
                                                <div className="flex items-center gap-1">
                                                    <span className="font-bold text-lake-ink group-hover:text-lake-blue transition-colors underline decoration-dotted underline-offset-4 tracking-tight">
                                                        {b.guest_name}
                                                    </span>
                                                    <Info className="w-3 h-3 text-lake-ink/20 group-hover:text-lake-blue" />
                                                </div>
                                                <span className="text-[10px] text-lake-ink/50 uppercase">{b.guest_email}</span>
                                            </button>
                                        </TableCell>
                                        <TableCell className="text-sm font-medium whitespace-nowrap italic text-slate-600 tracking-tight">
                                            {fmtItDate(b.check_in)} → {fmtItDate(b.check_out)}
                                        </TableCell>
                                        <TableCell className="text-sm font-bold text-lake-blue">€{b.total_price}</TableCell>
                                        
                                        <TableCell>
                                            <Select value={b.status} onValueChange={(v) => update(b.id, { status: v })}>
                                                <SelectTrigger className="w-32 h-8 text-[11px] font-semibold"><SelectValue /></SelectTrigger>
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
                                                <SelectTrigger className="w-36 h-8 text-[11px] border-none shadow-none focus:ring-0 p-0">
                                                    <Badge className={`${statusColors[b.status] || ""} border-none text-[10px] uppercase font-bold w-full justify-center`}>
                                                        {b.payment_status}
                                                    </Badge>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="unpaid">Non pagato</SelectItem>
                                                    <SelectItem value="deposit_paid">Acconto pagato</SelectItem>
                                                    <SelectItem value="fully_paid">Saldato</SelectItem>
                                                    <SelectItem value="refunded">Rimborsato</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>

                                        <TableCell className="text-[10px] uppercase font-black text-lake-ink/40 tracking-widest">{b.source}</TableCell>
                                        
                                        <TableCell className="text-right">
                                            <div className="flex flex-col items-end gap-1 text-[11px]">
                                                <button onClick={() => openEdit(b)} className="text-lake-ink hover:text-lake-blue flex items-center gap-1 font-bold">
                                                    <Pencil className="w-3 h-3"/> MODIFICA
                                                </button>
                                                <button onClick={() => del(b.id)} className="text-red-500 hover:underline font-bold uppercase tracking-tighter">ELIMINA</button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                <TabsContent value="calendar" className="bg-white border border-lake-border rounded-sm p-10 flex justify-center">
                    <DayPicker mode="multiple" locale={it} modifiers={{ booked: bookedDates }} modifiersStyles={{ booked: { backgroundColor: "#ef4444", color: "white", borderRadius: 0 } }} numberOfMonths={3} className="admin-calendar" />
                </TabsContent>
            </Tabs>

            <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
                <DialogContent className="sm:max-w-[550px] border-t-4 border-t-lake-blue">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-display text-lake-ink">Scheda Dettagliata</DialogTitle>
                        <DialogDescription>Informazioni complete sulla prenotazione e dati tecnici.</DialogDescription>
                    </DialogHeader>

                    {selectedBooking && (
                        <div className="space-y-6 py-4">
                            <div className="grid grid-cols-2 gap-4 border-b pb-4">
                                <div className="space-y-1">
                                    <Label className="text-[10px] uppercase text-slate-400 font-bold flex items-center gap-1"><Users className="w-3 h-3"/> Ospite</Label>
                                    <p className="font-bold text-lg text-lake-ink leading-tight">{selectedBooking.guest_name}</p>
                                    <div className="flex flex-col gap-0.5 mt-1">
                                        <span className="text-xs text-slate-500 flex items-center gap-1"><Mail className="w-3 h-3"/> {selectedBooking.guest_email}</span>
                                        <span className="text-xs text-slate-500 flex items-center gap-1"><Phone className="w-3 h-3"/> {selectedBooking.guest_phone || "N/A"}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <Label className="text-[10px] uppercase text-slate-400 font-bold">Ospiti / Fonte</Label>
                                    <p className="font-bold text-xl text-lake-ink">{selectedBooking.num_guests || 1} Persone</p>
                                    <Badge variant="outline" className="mt-2 uppercase text-[9px] font-black tracking-widest">{selectedBooking.source}</Badge>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 border-b pb-4 text-sm">
                                <div>
                                    <Label className="text-[10px] uppercase text-slate-400 font-bold flex items-center gap-1"><CalendarIcon className="w-3 h-3"/> Soggiorno</Label>
                                    <p className="font-bold text-lake-ink">{fmtItDate(selectedBooking.check_in)}</p>
                                    <p className="font-bold text-lake-ink">{fmtItDate(selectedBooking.check_out)}</p>
                                </div>
                                <div className="text-right">
                                    <Label className="text-[10px] uppercase text-slate-400 font-bold">Totale Pagato</Label>
                                    <p className="font-bold text-2xl text-lake-blue">€{selectedBooking.total_price}</p>
                                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">{selectedBooking.payment_status}</p>
                                </div>
                            </div>

                            {selectedBooking.notes && (
                                <div className="bg-amber-50 p-3 rounded-sm border border-amber-100 flex gap-2 italic">
                                    <FileText className="w-4 h-4 text-amber-600 shrink-0" />
                                    <div className="text-sm text-amber-900 leading-relaxed">"{selectedBooking.notes}"</div>
                                </div>
                            )}

                            <div className="bg-slate-50 p-4 rounded-sm border border-slate-100 space-y-3">
                                <div>
                                    <Label className="text-[10px] uppercase text-slate-400 font-bold flex items-center gap-1"><Hash className="w-3 h-3" /> Numero Prenotazione (ID)</Label>
                                    <code className="text-[11px] bg-white p-2 border rounded block mt-1 select-all font-mono text-lake-ink border-slate-200">{selectedBooking.id}</code>
                                </div>
                                <div>
                                    <Label className="text-[10px] uppercase text-slate-400 font-bold flex items-center gap-1"><CreditCard className="w-3 h-3" /> Stripe Payment ID</Label>
                                    <code className="text-[11px] bg-white p-2 border rounded block mt-1 select-all font-mono text-emerald-700 font-bold border-slate-200 uppercase tracking-tighter">
                                        {selectedBooking.stripe_payment_intent_id || "NON DISPONIBILE"}
                                    </code>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter><Button onClick={() => setDetailOpen(false)} className="w-full bg-lake-ink hover:bg-lake-ink/90">Chiudi</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={manualOpen} onOpenChange={setManualOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader><DialogTitle>{manualForm.id ? "Modifica Dettagli" : "Nuovo Inserimento Manuale"}</DialogTitle></DialogHeader>
                    <form onSubmit={handleManualSubmit} className="space-y-4 pt-4">
                        <div className="grid gap-2"><Label>Nome Ospite</Label><Input required value={manualForm.guest_name} onChange={e => setManualForm({...manualForm, guest_name: e.target.value})} /></div>
                        <div className="grid gap-2"><Label>Email</Label><Input type="email" required value={manualForm.guest_email} onChange={e => setManualForm({...manualForm, guest_email: e.target.value})} /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2"><Label>Check-in</Label><Input type="date" required value={manualForm.check_in} onChange={e => setManualForm({...manualForm, check_in: e.target.value})} /></div>
                            <div className="grid gap-2"><Label>Check-out</Label><Input type="date" required value={manualForm.check_out} onChange={e => setManualForm({...manualForm, check_out: e.target.value})} /></div>
                        </div>
                        <div className="grid gap-2"><Label>Prezzo Totale (€)</Label><Input required type="number" step="0.01" value={manualForm.total_price} onChange={e => setManualForm({...manualForm, total_price: e.target.value})} /></div>
                        <DialogFooter><Button type="submit" disabled={processing} className="w-full bg-emerald-600 hover:bg-emerald-700">{processing ? "Salvataggio..." : "Salva e Aggiorna"}</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
