import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DayPicker } from "react-day-picker";
import { it } from "date-fns/locale";
import "react-day-picker/dist/style.css";
import { Calendar as CalendarIcon, List, Plus, Search, X, Info, Trash2 } from "lucide-react";
import { api } from "../../lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../../components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";
import { fmtItDate } from "../../lib/date";

const statusColors = {
    pending: "bg-amber-100 text-amber-700",
    confirmed: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-rose-100 text-rose-700",
    external: "bg-slate-100 text-slate-700",
};

export default function AdminBookings() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState("calendar");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const [showAddManual, setShowAddManual] = useState(false);
    const [activeBooking, setActiveBooking] = useState(null);
    const [processing, setProcessing] = useState(false);

    const [manualForm, setManualForm] = useState({
        guest_name: "",
        guest_email: "",
        guest_phone: "",
        check_in: "",
        check_out: "",
        adults: 2,
        children: 0,
        total_price: "",
        is_refundable: "true",
        source: "manual",
        notes: ""
    });

    const loadBookings = async () => {
        setLoading(true);
        try {
            const r = await api.get("/admin/bookings");
            setBookings(r.data);
        } catch {
            toast.error("Errore caricamento prenotazioni");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBookings();
    }, []);

    const handleAddManualSubmit = async (e) => {
        e.preventDefault();
        setProcessing(true);
        try {
            const payload = {
                ...manualForm,
                is_refundable: manualForm.is_refundable === "true"
            };
            await api.post("/admin/bookings/manual", payload);
            toast.success("Prenotazione manuale registrata con successo ✓");
            setShowAddManual(false);
            setManualForm({
                guest_name: "",
                guest_email: "",
                guest_phone: "",
                check_in: "",
                check_out: "",
                adults: 2,
                children: 0,
                total_price: "",
                is_refundable: "true",
                source: "manual",
                notes: ""
            });
            loadBookings();
        } catch (err) {
            toast.error(err?.response?.data?.detail || "Errore durante il salvataggio");
        } finally {
            setProcessing(false);
        }
    };

    const handleCancelBooking = async (id) => {
        if (!confirm("Sicuro di voler cancellare questa prenotazione? Verrà calcolato l'eventuale rimborso.")) return;
        try {
            const r = await api.post(`/admin/bookings/${encodeURIComponent(id)}/cancel`);
            toast.success(`Prenotazione cancellata. Rimborso calcolato: €${r.data.refund_amount}`);
            loadBookings();
            if (activeBooking && activeBooking.id === id) setActiveBooking(null);
        } catch (err) {
            toast.error(err?.response?.data?.detail || "Errore durante la cancellazione");
        }
    };

    const filteredBookings = useMemo(() => {
        return bookings.filter(b => {
            const matchesSearch = 
                b.guest_name?.toLowerCase().includes(search.toLowerCase()) ||
                b.id?.toLowerCase().includes(search.toLowerCase()) ||
                b.guest_email?.toLowerCase().includes(search.toLowerCase());
            
            const matchesStatus = statusFilter === "all" || b.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [bookings, search, statusFilter]);

    const modifiers = useMemo(() => {
        const bookedDays = [];
        bookings.forEach(b => {
            if (b.status !== "cancelled") {
                let cur = new Date(b.check_in);
                const end = new Date(b.check_out);
                while (cur < end) {
                    bookedDays.push(new Date(cur));
                    cur.setDate(cur.getDate() + 1);
                }
            }
        });
        return { booked: bookedDays };
    }, [bookings]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-lake-border pb-5">
                <div>
                    <h1 className="text-xl font-semibold text-lake-ink uppercase tracking-wider">Prenotazioni</h1>
                    <p className="text-xs text-lake-ink/60 mt-1">Gestisci il calendario, le prenotazioni manuali e i canali sincronizzati.</p>
                </div>
                <Button onClick={() => setShowAddManual(true)} className="bg-lake-blue hover:bg-lake-ink text-white rounded-sm flex items-center gap-2 text-xs uppercase tracking-wider h-11 px-5">
                    <Plus className="w-4 h-4" /> Nuova Prenotazione
                </Button>
            </div>

            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 border border-lake-border rounded-sm">
                <div className="flex flex-1 w-full md:max-w-md items-center gap-2 border border-lake-border rounded-sm px-3 h-10 bg-lake-cream/20">
                    <Search className="w-4 h-4 text-lake-ink/40" />
                    <input 
                        type="text" 
                        placeholder="Cerca per nome, email o ID..." 
                        value={search} 
                        onChange={e => setSearch(e.target.value)} 
                        className="bg-transparent text-sm outline-none w-full text-lake-ink placeholder:text-lake-ink/30"
                    />
                    {search && <X className="w-4 h-4 text-lake-ink/40 cursor-pointer" onClick={() => setSearch("")} />}
                </div>

                <div className="flex w-full md:w-auto items-center gap-3">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full md:w-44 bg-transparent border-lake-border rounded-sm text-xs h-10">
                            <SelectValue placeholder="Filtra Stato" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tutti gli stati</SelectItem>
                            <SelectItem value="confirmed">Confermate</SelectItem>
                            <SelectItem value="pending">In Attesa</SelectItem>
                            <SelectItem value="cancelled">Cancellate</SelectItem>
                            <SelectItem value="external">Canali Esterni (iCal)</SelectItem>
                        </SelectContent>
                    </Select>

                    <div className="flex border border-lake-border rounded-sm p-0.5 bg-lake-cream/20 shrink-0">
                        <button onClick={() => setView("calendar")} className={`px-3 py-1.5 rounded-sm text-xs flex items-center gap-1.5 transition-all ${view === "calendar" ? "bg-white text-lake-blue shadow-sm font-medium" : "text-lake-ink/60 hover:text-lake-ink"}`}>
                            <CalendarIcon className="w-3.5 h-3.5" /> Calendario
                        </button>
                        <button onClick={() => setView("list")} className={`px-3 py-1.5 rounded-sm text-xs flex items-center gap-1.5 transition-all ${view === "list" ? "bg-white text-lake-blue shadow-sm font-medium" : "text-lake-ink/60 hover:text-lake-ink"}`}>
                            <List className="w-3.5 h-3.5" /> Lista
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
                <div className="xl:col-span-2 bg-white border border-lake-border rounded-sm p-4">
                    {loading ? (
                        <div className="p-10 text-center text-xs text-lake-ink/40 italic">Caricamento dati in corso...</div>
                    ) : view === "calendar" ? (
                        <div className="flex justify-center p-2 admin-daypicker">
                            <DayPicker 
                                locale={it} 
                                mode="multiple"
                                modifiers={modifiers}
                                modifiersStyles={{
                                    booked: { backgroundColor: '#7A93AC', color: 'white', borderRadius: '0px' }
                                }}
                                styles={{
                                    caption: { color: '#1C242C', fontFamily: 'monospace', fontSize: '14px' }
                                }}
                            />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-lake-cream/30">
                                    <TableRow>
                                        <TableHead className="text-[10px] uppercase tracking-wider text-lake-ink/70 font-semibold">Ospite</TableHead>
                                        <TableHead className="text-[10px] uppercase tracking-wider text-lake-ink/70 font-semibold">Soggiorno</TableHead>
                                        <TableHead className="text-[10px] uppercase tracking-wider text-lake-ink/70 font-semibold">Stato</TableHead>
                                        <TableHead className="text-[10px] uppercase tracking-wider text-lake-ink/70 font-semibold text-right">Prezzo</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredBookings.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-8 text-xs text-lake-ink/40 italic">Nessuna prenotazione trovata.</TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredBookings.map((b) => (
                                            <TableRow key={b.id} className="cursor-pointer hover:bg-lake-cream/10 transition-all" onClick={() => setActiveBooking(b)}>
                                                <TableCell className="py-3.5">
                                                    <div className="font-medium text-sm text-lake-ink">{b.guest_name || "Blocco Esterno"}</div>
                                                    <div className="text-[11px] text-lake-ink/50 mt-0.5">{b.source.toUpperCase()} · id: {b.id.substring(0,8)}...</div>
                                                </TableCell>
                                                <TableCell className="py-3.5">
                                                    <div className="text-xs text-lake-ink font-mono">{fmtItDate(b.check_in)} ➔ {fmtItDate(b.check_out)}</div>
                                                </TableCell>
                                                <TableCell className="py-3.5">
                                                    <Badge className={`rounded-sm font-normal text-[10px] uppercase tracking-wider px-2 py-0.5 border-none shadow-none ${statusColors[b.status] || "bg-slate-100"}`}>
                                                        {b.status === "external" ? b.notes || "iCal" : b.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="py-3.5 text-right font-medium text-sm text-lake-ink">
                                                    {b.total_price > 0 ? `€${Number(b.total_price).toFixed(2)}` : "—"}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>

                <div className="bg-white border border-lake-border rounded-sm p-5 space-y-5 sticky top-6">
                    <h3 className="text-xs font-semibold text-lake-ink/40 uppercase tracking-widest pb-2 border-b border-lake-border">Dettaglio Selezione</h3>
                    {activeBooking ? (
                        <div className="space-y-4 text-lake-ink">
                            <div>
                                <p className="text-[10px] uppercase tracking-wider text-lake-ink/40 font-mono">ID Prenotazione</p>
                                <p className="text-xs font-mono break-all bg-lake-cream/30 p-2 rounded-sm border border-lake-border/50 mt-1">{activeBooking.id}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] uppercase tracking-wider text-lake-ink/40">Check-in</p>
                                    <p className="text-sm font-semibold mt-0.5 font-mono text-lake-blue">{fmtItDate(activeBooking.check_in)}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-wider text-lake-ink/40">Check-out</p>
                                    <p className="text-sm font-semibold mt-0.5 font-mono text-lake-blue">{fmtItDate(activeBooking.check_out)}</p>
                                </div>
                            </div>
                            <div className="border-t border-lake-border/60 pt-3 space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-lake-ink/60">Ospite:</span>
                                    <span className="font-medium">{activeBooking.guest_name || "—"}</span>
                                </div>
                                {activeBooking.guest_email && (
                                    <div className="flex justify-between text-xs">
                                        <span className="text-lake-ink/60">Email:</span>
                                        <span className="font-mono text-lake-blue">{activeBooking.guest_email}</span>
                                    </div>
                                )}
                                {activeBooking.guest_phone && (
                                    <div className="flex justify-between text-xs">
                                        <span className="text-lake-ink/60">Telefono:</span>
                                        <span>{activeBooking.guest_phone}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-xs">
                                    <span className="text-lake-ink/60">Canale d'origine:</span>
                                    <Badge variant="outline" className="rounded-sm text-[10px] uppercase font-normal px-1.5 border-lake-border">{activeBooking.source}</Badge>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-lake-ink/60">Tariffazione:</span>
                                    <Badge variant="outline" className={`rounded-sm text-[10px] uppercase font-normal px-1.5 ${activeBooking.is_refundable ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
                                        {activeBooking.is_refundable ? "Rimborsabile (10d)" : "Non Rimborsabile"}
                                    </Badge>
                                </div>
                            </div>

                            <div className="border-t border-lake-border/60 pt-3 space-y-1.5 bg-lake-cream/10 p-3 rounded-sm border border-lake-border/40">
                                <div className="flex justify-between text-xs">
                                    <span className="text-lake-ink/60">Prezzo Totale:</span>
                                    <span className="font-semibold">€{Number(activeBooking.total_price).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-lake-ink/60">Acconto Richiesto:</span>
                                    <span>€{Number(activeBooking.deposit_amount).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-xs border-t border-dashed border-lake-border/50 pt-1.5 mt-1">
                                    <span className="text-lake-ink/60">Stato Pagamento:</span>
                                    <span className="font-medium uppercase text-[11px] font-mono">{activeBooking.payment_status}</span>
                                </div>
                                {activeBooking.refund_amount > 0 && (
                                    <div className="flex justify-between text-xs text-rose-600 font-medium">
                                        <span>Rimborsato:</span>
                                        <span>€{Number(activeBooking.refund_amount).toFixed(2)}</span>
                                    </div>
                                )}
                            </div>

                            {activeBooking.notes && (
                                <div className="bg-lake-cream/30 border border-lake-border/60 p-2.5 rounded-sm">
                                    <p className="text-[10px] uppercase tracking-wider text-lake-ink/40 font-semibold">Note interne</p>
                                    <p className="text-xs text-lake-ink/80 mt-1 leading-relaxed whitespace-pre-line">{activeBooking.notes}</p>
                                </div>
                            )}

                            {activeBooking.status !== "cancelled" && activeBooking.source !== "external" && (
                                <div className="pt-2">
                                    <Button 
                                        onClick={() => handleCancelBooking(activeBooking.id)} 
                                        className="w-full bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 rounded-sm text-xs uppercase tracking-wider h-10 font-medium flex items-center justify-center gap-1.5 shadow-none"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" /> Cancella Prenotazione
                                    </Button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-12 border border-dashed border-lake-border rounded-sm bg-lake-cream/5">
                            <Info className="w-5 h-5 text-lake-ink/20 mx-auto mb-2" />
                            <p className="text-xs text-lake-ink/40 italic font-light px-4">Seleziona una prenotazione dalla lista o naviga nel calendario per visualizzare i dettagli completi dell'ospite.</p>
                        </div>
                    )}
                </div>
            </div>

            <Dialog open={showAddManual} onOpenChange={setShowAddManual}>
                <DialogContent className="bg-white rounded-sm border border-lake-border max-w-md w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
                    <DialogHeader className="border-b border-lake-border pb-3">
                        <DialogTitle className="text-sm uppercase tracking-wider text-lake-ink font-semibold flex items-center gap-2">
                            <Plus className="w-4 h-4 text-lake-blue" /> Nuova Prenotazione Manuale
                        </DialogTitle>
                        <DialogDescription className="text-[11px] text-lake-ink/50">
                            Inserisci un blocco manuale o una prenotazione diretta/telefonica nel sistema.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddManualSubmit} className="space-y-4 pt-3 text-lake-ink">
                        <div className="grid gap-2">
                            <Label>Nome Completo Ospite</Label>
                            <Input required value={manualForm.guest_name} onChange={e => setManualForm({ ...manualForm, guest_name: e.target.value })} placeholder="Es: Mario Rossi" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Email</Label>
                                <Input type="email" required value={manualForm.guest_email} onChange={e => setManualForm({ ...manualForm, guest_email: e.target.value })} placeholder="mario@esempio.com" />
                            </div>
                            <div className="grid gap-2">
                                <Label>Telefono</Label>
                                <Input type="tel" value={manualForm.guest_phone} onChange={e => setManualForm({ ...manualForm, guest_phone: e.target.value })} placeholder="+39 333..." />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Check-in</Label>
                                <Input type="date" required value={manualForm.check_in} onChange={e => setManualForm({ ...manualForm, check_in: e.target.value })} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Check-out</Label>
                                <Input type="date" required value={manualForm.check_out} onChange={e => setManualForm({ ...manualForm, check_out: e.target.value })} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Adulti</Label>
                                <Input type="number" min="1" required value={manualForm.adults} onChange={e => setManualForm({ ...manualForm, adults: e.target.value })} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Bambini</Label>
                                <Input type="number" min="0" required value={manualForm.children} onChange={e => setManualForm({ ...manualForm, children: e.target.value })} />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Prezzo Totale (€)</Label>
                            <Input required type="number" step="0.01" value={manualForm.total_price} onChange={e => setManualForm({ ...manualForm, total_price: e.target.value })} />
                        </div>
                        
                        <div className="grid gap-2">
                            <Label>Politica di Cancellazione / Tariffa</Label>
                            <select 
                                value={manualForm.is_refundable} 
                                onChange={e => setManualForm({ ...manualForm, is_refundable: e.target.value })}
                                className="flex h-10 w-full rounded-sm border border-lake-border bg-transparent px-3 py-2 text-sm text-lake-ink bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 outline-none"
                            >
                                <option value="true">Rimborsabile (Rimborso 100% fino a 10 giorni prima)</option>
                                <option value=\"false\">Non Rimborsabile (Nessun rimborso sempre)</option>\n                            </select>\n                        </div>\n\n                        <div className=\"grid gap-2\">\n                            <Label>Note Interne / Dettagli accordo</Label>\n                            <textarea \n                                value={manualForm.notes} \n                                onChange={e => setManualForm({ ...manualForm, notes: e.target.value })} \n                                className=\"flex min-h-[60px] w-full rounded-sm border border-lake-border bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-lake-ink outline-none\"\n                                placeholder=\"Inserisci qui eventuali dettagli sulla prenotazione...\" \n                            />\n                        </div>\n                        <DialogFooter>\n                            <Button type=\"submit\" disabled={processing} className=\"w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-sm h-11 text-xs uppercase tracking-widest font-bold\">\n                                {processing ? \"Salvataggio...\" : \"Salva e Invia Email\"}\n                            </Button>\n                        </DialogFooter>\n                    </form>\n                </DialogContent>\n            </Dialog>\n        </div>\n    );\n}\n```
