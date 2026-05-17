import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DayPicker } from "react-day-picker";
import { it } from "date-fns/locale";
import "react-day-picker/dist/style.css";
import { Calendar as CalendarIcon, List, Plus, Pencil, Search, X, Info, CreditCard, Hash, Users, Phone, Mail, FileText, Archive, Trash2 } from "lucide-react";
import { api } from "../../lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../../components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
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

export default function Bookings() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterPayment, setFilterPayment] = useState("all");
    const [filterSource, setFilterSource] = useState("all");

    // Detail Dialog
    const [selected, setSelected] = useState(null);

    // Manual / Edit Dialog
    const [editTarget, setEditTarget] = useState(null);
    const [isManualOpen, setIsManualOpen] = useState(false);
    const [processing, setProcessing] = useState(false);

    const [manualForm, setManualForm] = useState({
        guest_name: "",
        guest_email: "",
        guest_phone: "",
        source: "manual",
        check_in: "",
        check_out: "",
        adults: "2",
        children: "0",
        total_price: "",
        notes: "",
    });

    useEffect(() => {
        load();
    }, []);

    async function load() {
        try {
            const r = await api.get("/admin/bookings");
            setItems(r.data);
        } catch (e) {
            toast.error("Errore nel caricamento delle prenotazioni");
        } finally {
            setLoading(false);
        }
    }

    const activeItems = useMemo(() => {
        return items.filter((b) => b.status !== "cancelled").filter((b) => {
            const searchTerm = search.toLowerCase();
            
            const matchesSearch =
                (b.guest_name?.toLowerCase() || "").includes(searchTerm) ||
                (b.guest_email?.toLowerCase() || "").includes(searchTerm) ||
                (b.id?.toString() || "").includes(searchTerm);
                
            const matchesStatus = filterStatus === "all" || 
                (filterStatus === "external" ? (b.source === "airbnb" || b.source === "booking") : b.status === filterStatus);
                
            const matchesPayment = filterPayment === "all" || b.payment_status === filterPayment;
            
            // CORREZIONE SINTASSI: Evita il token inaspettato risolvendo con un array .includes()
            const matchesSource = filterSource === "all" || 
                (filterSource === "external" 
                    ? ["airbnb", "booking", "external"].includes(b.source) 
                    : b.source === filterSource);
                    
            return matchesSearch && matchesStatus && matchesPayment && matchesSource;
        });
    }, [items, search, filterStatus, filterPayment, filterSource]);

    const archivedItems = useMemo(() => {
        return items.filter((b) => b.status === "cancelled").filter((b) => {
            const searchTerm = search.toLowerCase();
            return (
                (b.guest_name?.toLowerCase() || "").includes(searchTerm) ||
                (b.guest_email?.toLowerCase() || "").includes(searchTerm) ||
                (b.id?.toString() || "").includes(searchTerm)
            );
        });
    }, [items, search]);

    async function handleManualSubmit(e) {
        e.preventDefault();
        setProcessing(true);
        try {
            if (editTarget) {
                const r = await api.patch(`/admin/bookings/${encodeURIComponent(editTarget.id)}`, manualForm);
                toast.success("Prenotazione aggiornata con successo");
                setEditTarget(null);
            } else {
                await api.post("/admin/bookings/manual", manualForm);
                toast.success("Prenotazione manuale creata");
            }
            setIsManualOpen(false);
            setManualForm({
                guest_name: "",
                guest_email: "",
                guest_phone: "",
                source: "manual",
                check_in: "",
                check_out: "",
                adults: "2",
                children: "0",
                total_price: "",
                notes: "",
            });
            load();
        } catch (err) {
            toast.error(err?.response?.data?.detail || "Errore durante il salvataggio");
        } finally {
            setProcessing(false);
        }
    }

    function openEdit(b) {
        setEditTarget(b);
        setManualForm({
            guest_name: b.guest_name || "",
            guest_email: b.guest_email || "",
            guest_phone: b.guest_phone || "",
            source: b.source || "manual",
            check_in: b.check_in || "",
            check_out: b.check_out || "",
            adults: b.adults?.toString() || "2",
            children: b.children?.toString() || "0",
            total_price: b.total_price?.toString() || "",
            notes: b.notes || "",
        });
        setIsManualOpen(true);
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-lake-border pb-5">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-lake-ink">Prenotazioni</h1>
                    <p className="text-sm text-lake-ink/60 mt-1">Gestisci i soggiorni, i pagamenti e sincronizza i canali esterni.</p>
                </div>
                <Button onClick={() => { setEditTarget(null); setIsManualOpen(true); }} className="bg-lake-teal hover:bg-lake-teal/90 text-white rounded-sm flex items-center gap-2">
                    <Plus className="h-4 w-4" /> Nuova Prenotazione
                </Button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[260px] max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-lake-ink/40" />
                    <Input placeholder="Cerca per ospite, email o ID..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 border-lake-border focus-visible:ring-lake-teal rounded-sm bg-white" />
                </div>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[160px] border-lake-border rounded-sm bg-white"><SelectValue placeholder="Stato" /></SelectTrigger>
                    <SelectContent><SelectItem value="all">Tutti gli stati</SelectItem><SelectItem value="confirmed">Confermata</SelectItem><SelectItem value="pending">In attesa</SelectItem></SelectContent>
                </Select>

                <Select value={filterPayment} onValueChange={setFilterPayment}>
                    <SelectTrigger className="w-[160px] border-lake-border rounded-sm bg-white"><SelectValue placeholder="Pagamento" /></SelectTrigger>
                    <SelectContent><SelectItem value="all">Tutti i pagamenti</SelectItem><SelectItem value="paid">Saldato</SelectItem><SelectItem value="deposit_paid">Acconto pagato</SelectItem><SelectItem value="unpaid">Non pagato</SelectItem></SelectContent>
                </Select>

                <Select value={filterSource} onValueChange={setFilterSource}>
                    <SelectTrigger className="w-[160px] border-lake-border rounded-sm bg-white"><SelectValue placeholder="Sorgente" /></SelectTrigger>
                    <SelectContent><SelectItem value="all">Tutte le sorgenti</SelectItem><SelectItem value="website">Sito Web</SelectItem><SelectItem value="manual">Manuale</SelectItem><SelectItem value="external">OTA Esterne</SelectItem></SelectContent>
                </Select>
            </div>

            <Tabs defaultValue="active" className="w-full">
                <TabsList className="bg-lake-light border border-lake-border p-1 rounded-sm mb-4">
                    <TabsTrigger value="active" className="rounded-sm data-[state=active]:bg-white data-[state=active]:text-lake-ink flex items-center gap-2 px-4 py-2"><List className="h-4 w-4" /> Attive ({activeItems.length})</TabsTrigger>
                    <TabsTrigger value="archived" className="rounded-sm data-[state=active]:bg-white data-[state=active]:text-lake-ink flex items-center gap-2 px-4 py-2"><Archive className="h-4 w-4" /> Cancellate ({archivedItems.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="active" className="border border-lake-border rounded-sm bg-white overflow-hidden shadow-sm">
                    <Table>
                        <TableHeader className="bg-lake-light/60">
                            <TableRow>
                                <TableHead className="font-medium text-lake-ink/70">Ospite</TableHead>
                                <TableHead className="font-medium text-lake-ink/70">Date</TableHead>
                                <TableHead className="font-medium text-lake-ink/70">Sorgente</TableHead>
                                <TableHead className="font-medium text-lake-ink/70">Stato</TableHead>
                                <TableHead className="font-medium text-lake-ink/70">Pagamento</TableHead>
                                <TableHead className="text-right font-medium text-lake-ink/70">Totale</TableHead>
                                <TableHead className="w-[80px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={7} className="text-center py-8 text-lake-ink/50">Caricamento in corso...</TableCell></TableRow>
                            ) : activeItems.length === 0 ? (
                                <TableRow><TableCell colSpan={7} className="text-center py-8 text-lake-ink/50">Nessuna prenotazione attiva trovata.</TableCell></TableRow>
                            ) : (
                                activeItems.map((b) => (
                                    <TableRow key={b.id} className="hover:bg-lake-light/30 transition-colors">
                                        <TableCell><div className="font-medium text-lake-ink">{b.guest_name || "Ospite Esterno"}</div><div className="text-xs text-lake-ink/50">{b.guest_email || "Nessuna email"}</div></TableCell>
                                        <TableCell><div className="text-sm text-lake-ink font-mono">{fmtItDate(b.check_in)} → {fmtItDate(b.check_out)}</div></TableCell>
                                        <TableCell><Badge variant="outline" className="capitalize text-xs font-normal border-lake-border">{b.source}</Badge></TableCell>
                                        <TableCell><Badge className={`${statusColors[b.status] || "bg-gray-100 text-gray-700"} shadow-none border-0 rounded-sm font-normal px-2.5 py-0.5`}>{b.status}</Badge></TableCell>
                                        <TableCell><Badge variant="secondary" className="bg-slate-100 text-slate-700 capitalize font-normal">{b.payment_status?.replace("_", " ")}</Badge></TableCell>
                                        <TableCell className="text-right font-semibold font-mono text-lake-ink">€{parseFloat(b.total_price || 0).toFixed(2)}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-end gap-1">
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-lake-ink/70 hover:text-lake-teal" onClick={() => setSelected(b)}><Info className="h-4 w-4" /></Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-lake-ink/70 hover:text-lake-teal" onClick={() => openEdit(b)}><Pencil className="h-4 w-4" /></Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TabsContent>

                <TabsContent value="archived" className="border border-lake-border rounded-sm bg-white overflow-hidden shadow-sm">
                    <Table>
                        <TableHeader className="bg-lake-light/60">
                            <TableRow>
                                <TableHead className="font-medium text-lake-ink/70">Ospite</TableHead>
                                <TableHead className="font-medium text-lake-ink/70">Date</TableHead>
                                <TableHead className="font-medium text-lake-ink/70">Sorgente</TableHead>
                                <TableHead className="font-medium text-lake-ink/70">Pagamento</TableHead>
                                <TableHead className="text-right font-medium text-lake-ink/70">Totale</TableHead>
                                <TableHead className="w-[60px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {archivedItems.length === 0 ? (
                                <TableRow><TableCell colSpan={6} className="text-center py-8 text-lake-ink/50">Nessuna prenotazione cancellata.</TableCell></TableRow>
                            ) : (
                                archivedItems.map((b) => (
                                    <TableRow key={b.id} className="bg-rose-50/20 hover:bg-rose-50/40 transition-colors">
                                        <TableCell><div className="font-medium text-lake-ink/70 line-through">{b.guest_name || "Ospite Esterno"}</div><div className="text-xs text-lake-ink/40">{b.guest_email}</div></TableCell>
                                        <TableCell><div className="text-sm text-lake-ink/60 font-mono line-through">{fmtItDate(b.check_in)} → {fmtItDate(b.check_out)}</div></TableCell>
                                        <TableCell><Badge variant="outline" className="opacity-60 text-xs border-lake-border">{b.source}</Badge></TableCell>
                                        <TableCell><Badge variant="outline" className="border-rose-200 text-rose-700 bg-rose-50/50 capitalize font-normal">{b.payment_status?.replace("_", " ")}</Badge></TableCell>
                                        <TableCell className="text-right font-mono text-lake-ink/60 line-through">€{parseFloat(b.total_price || 0).toFixed(2)}</TableCell>
                                        <TableCell><Button size="icon" variant="ghost" className="h-8 w-8 text-lake-ink/70 hover:text-lake-teal" onClick={() => setSelected(b)}><Info className="h-4 w-4" /></Button></TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TabsContent>
            </Tabs>

            {/* Manual Form & Edit Dialog */}
            <Dialog open={isManualOpen} onOpenChange={setIsManualOpen}>
                <DialogContent className="sm:max-w-[500px] rounded-sm border-lake-border p-6 bg-white">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold text-lake-ink">{editTarget ? "Modifica Prenotazione" : "Nuova Prenotazione Manuale"}</DialogTitle>
                        <DialogDescription className="text-lake-ink/60 text-sm">Inserisci o aggiorna i dettagli del soggiorno bloccando le date sul calendario.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleManualSubmit} className="space-y-4 pt-3">
                        <div className="grid gap-2"><Label>Nome Completo Ospite</Label><Input required placeholder="Mario Rossi" value={manualForm.guest_name} onChange={e => setManualForm({ ...manualForm, guest_name: e.target.value })} /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2"><Label>Email</Label><Input type="email" placeholder="mario@esempio.com" value={manualForm.guest_email} onChange={e => setManualForm({ ...manualForm, guest_email: e.target.value })} /></div>
                            <div className="grid gap-2"><Label>Telefono</Label><Input placeholder="+39 333 1234567" value={manualForm.guest_phone} onChange={e => setManualForm({ ...manualForm, guest_phone: e.target.value })} /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2"><Label>Check-in</Label><Input type="date" required value={manualForm.check_in} onChange={e => setManualForm({ ...manualForm, check_in: e.target.value })} /></div>
                            <div className="grid gap-2"><Label>Check-out</Label><Input type="date" required value={manualForm.check_out} onChange={e => setManualForm({ ...manualForm, check_out: e.target.value })} /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2"><Label>Adulti</Label><Input type="number" min="1" required value={manualForm.adults} onChange={e => setManualForm({ ...manualForm, adults: e.target.value })} /></div>
                            <div className="grid gap-2"><Label>Bambini</Label><Input type="number" min="0" required value={manualForm.children} onChange={e => setManualForm({ ...manualForm, children: e.target.value })} /></div>
                        </div>
                        <div className="grid gap-2"><Label>Prezzo Totale (€)</Label><Input required type="number" step="0.01" value={manualForm.total_price} onChange={e => setManualForm({ ...manualForm, total_price: e.target.value })} /></div>
                        <DialogFooter><Button type="submit" disabled={processing} className="w-full bg-emerald-600 hover:bg-emerald-700">{processing ? "Salvataggio..." : "Salva e Aggiorna"}</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
