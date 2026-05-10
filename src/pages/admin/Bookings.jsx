import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { DayPicker } from "react-day-picker";
import { it } from "date-fns/locale";
import "react-day-picker/dist/style.css";
import { Calendar as CalendarIcon, List, Plus, Pencil, Search, X, Info, CreditCard, Hash, Users, Phone, Mail, FileText, Trash2 } from "lucide-react";

// MODIFICA CRUCIALE: Usiamo l'alias @ come richiesto dalla diagnosi
import { api } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fmtItDate } from "@/lib/date";

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
        guest_name: "", guest_email: "", guest_phone: "", check_in: "", check_out: "", total_price: "", notes: "Prenotazione manuale"
    });

    const load = () => api.get("/admin/bookings").then((r) => setItems(r.data)).catch(() => toast.error("Errore caricamento dati"));
    useEffect(() => { load(); }, []);

    const filtered = useMemo(() => {
        return items.filter((b) => {
            const searchTerm = search.toLowerCase();
            const matchesSearch = 
                (b.guest_name?.toLowerCase() || "").includes(searchTerm) ||
                (b.guest_email?.toLowerCase() || "").includes(searchTerm) ||
                (b.guest_phone || "").includes(searchTerm) || 
                (b.id?.toString() || "").includes(searchTerm);
            
            let matchesStatus = filterStatus === "all" || (filterStatus === "external" ? (b.status === "external" || b.source === "airbnb" || b.source === "booking") : b.status === filterStatus);
            const matchesPayment = filterPayment === "all" || b.payment_status === filterPayment;
            let matchesSource = filterSource === "all" || (filterSource === "external" ? (b.source === "airbnb" || b.source === "booking" || b.source === "external") : b.source === filterSource);

            return matchesSearch && matchesStatus && matchesPayment && matchesSource;
        });
    }, [items, search, filterStatus, filterPayment, filterSource]);

    const handleManualSubmit = async (e) => {
        e.preventDefault();
        setProcessing(true);
        try {
            const priceAsNumber = parseFloat(manualForm.total_price) || 0;
            const payload = { ...manualForm, total_price: priceAsNumber };
            
            if (manualForm.id) {
                await api.patch(`/admin/bookings/${manualForm.id}`, payload);
                toast.success("Modificata");
            } else {
                await api.post("/admin/bookings/manual", { 
                    ...payload, 
                    id: `man-${Date.now()}`, 
                    status: "confirmed", 
                    payment_status: "fully_paid", 
                    source: "manual", 
                    created_at: new Date().toISOString() 
                });
                toast.success("Registrata");
            }
            setManualOpen(false);
            setManualForm({ guest_name: "", guest_email: "", guest_phone: "", check_in: "", check_out: "", total_price: "", notes: "Prenotazione manuale" });
            load();
        } catch { toast.error("Errore"); } finally { setProcessing(false); }
    };

    const del = async (id) => {
        if (!window.confirm("Eliminare definitivamente?")) return;
        try { await api.delete(`/admin/bookings/${id}`); toast.success("Eliminata"); load(); } catch { toast.error("Errore"); }
    };

    return (
        <div className="p-10">
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-8 gap-4">
                <div>
                    <p className="overline text-lake-ink/60 font-bold tracking-widest leading-none">Gestione Proprietà</p>
                    <h1 className="font-display text-4xl text-lake-ink mt-2 tracking-tight">Prenotazioni</h1>
                </div>
                <Button onClick={() => setManualOpen(true)} className="bg-lake-blue hover:bg-lake-blue/90 shadow-lg shadow-lake-blue/20">
                    <Plus className="mr-2 h-4 w-4" /> NUOVA PRENOTAZIONE
                </Button>
            </div>

            <div className="bg-white border border-lake-border p-4 mb-6 rounded-sm shadow-sm flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-lake-ink/40" />
                    <Input placeholder="Cerca per nome o telefono..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-10" />
                </div>
            </div>

            <div className="bg-white border border-lake-border rounded-sm overflow-hidden shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50 uppercase text-[10px] font-bold">
                            <TableHead>Ospite</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Importo</TableHead>
                            <TableHead>Stato</TableHead>
                            <TableHead className="text-right">Azioni</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.map((b) => (
                            <TableRow key={b.id} className="hover:bg-slate-50/50 transition-colors">
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-lake-ink">{b.guest_name}</span>
                                        {b.guest_phone && (
                                            <span className="text-[10px] text-lake-blue font-bold flex items-center gap-1">
                                                <Phone className="w-2.5 h-2.5"/> {b.guest_phone}
                                            </span>
                                        )}
                                        <span className="text-[10px] text-slate-500 uppercase">{b.guest_email}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-sm italic text-slate-600">
                                    {fmtItDate(b.check_in)} → {fmtItDate(b.check_out)}
                                </TableCell>
                                <TableCell className="text-sm font-bold text-lake-blue">€{b.total_price}</TableCell>
                                <TableCell>
                                    <Badge className={`${statusColors[b.status] || ""} border-none text-[10px] uppercase font-bold`}>
                                        {b.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm" onClick={() => del(b.id)} className="text-red-500 hover:bg-red-50">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={manualOpen} onOpenChange={setManualOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader><DialogTitle>Nuova Prenotazione</DialogTitle></DialogHeader>
                    <form onSubmit={handleManualSubmit} className="space-y-4 pt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2"><Label>Nome Ospite</Label><Input required value={manualForm.guest_name} onChange={e => setManualForm({...manualForm, guest_name: e.target.value})} /></div>
                            <div className="grid gap-2"><Label>Telefono</Label><Input value={manualForm.guest_phone} onChange={e => setManualForm({...manualForm, guest_phone: e.target.value})} placeholder="+39..." /></div>
                        </div>
                        <div className="grid gap-2"><Label>Email</Label><Input type="email" required value={manualForm.guest_email} onChange={e => setManualForm({...manualForm, guest_email: e.target.value})} /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2"><Label>Check-in</Label><Input type="date" required value={manualForm.check_in} onChange={e => setManualForm({...manualForm, check_in: e.target.value})} /></div>
                            <div className="grid gap-2"><Label>Check-out</Label><Input type="date" required value={manualForm.check_out} onChange={e => setManualForm({...manualForm, check_out: e.target.value})} /></div>
                        </div>
                        <div className="grid gap-2"><Label>Prezzo Totale (€)</Label><Input required type="number" step="0.01" value={manualForm.total_price} onChange={e => setManualForm({...manualForm, total_price: e.target.value})} /></div>
                        <DialogFooter><Button type="submit" disabled={processing} className="w-full bg-lake-blue text-white shadow-md font-bold uppercase">{processing ? "Salvataggio..." : "Salva Prenotazione"}</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
