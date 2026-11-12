import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Link, useSearchParams } from "react-router-dom";
import { Calendar as CalendarIcon, List, Plus, Pencil, Search, Info, CreditCard, Hash, Users, Phone, Mail, FileText, Archive, Trash2, AlertCircle, Inbox, Check, XCircle, MessageCircle, Clock } from "lucide-react";
import { api } from "../../lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../../components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { fmtItDate, fmtItDateTime } from "../../lib/date";
import { useRequestActions } from "../../components/admin/RequestActions";

const statusColors = {
    pending: "bg-amber-100 text-amber-700",
    confirmed: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-rose-100 text-rose-700",
    external: "bg-slate-100 text-slate-700",
    request: "bg-sky-100 text-sky-700",
    awaiting_payment: "bg-violet-100 text-violet-700",
    rejected: "bg-rose-100 text-rose-700",
    expired: "bg-slate-200 text-slate-600",
};

const statusLabels = {
    pending: "In attesa di pagamento",
    confirmed: "Confermata",
    cancelled: "Cancellata",
    external: "Esterna",
    request: "Richiesta da valutare",
    awaiting_payment: "Accettata, attende pagamento",
    rejected: "Rifiutata",
    expired: "Scaduta",
};

// Stati che occupano il calendario (stessa lista del backend)
const BLOCKING = ["pending", "confirmed", "external", "request", "awaiting_payment"];
const REQUEST_STATES = ["request", "awaiting_payment"];
const ARCHIVE_STATES = ["cancelled", "rejected", "expired"];
// I blocchi date si gestiscono dal Calendario, non compaiono negli elenchi prenotazioni
const HIDDEN_STATES = ["blocked"];

/** Tempo rimanente leggibile fino a una scadenza ISO. */
function timeLeft(iso) {
    if (!iso) return "";
    const ms = new Date(iso).getTime() - Date.now();
    if (ms <= 0) return "scaduta";
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return h > 0 ? `${h} h ${m} min` : `${m} min`;
}

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
    const [errorMessage, setErrorMessage] = useState("");

    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [bookingToCancel, setBookingToCancel] = useState(null);
    const [cancelling, setCancelling] = useState(false);

    // Richieste di prenotazione
    const [tab, setTab] = useState(null);

    const [manualForm, setManualForm] = useState({
        guest_name: "", guest_email: "", guest_phone: "", check_in: "", check_out: "", total_price: "", adults: 2, children: 0, notes: "Prenotazione manuale", is_refundable: "true"
    });

    const load = () => api.get("/admin/bookings").then((r) => setItems(r.data)).catch(() => toast.error("Errore caricamento dati"));
    const requestActions = useRequestActions(load);
    const [params, setParams] = useSearchParams();

    // Arrivo dal Calendario: ?new=1&ci=...&co=...  (nuova prenotazione)  oppure  ?open=<id>  (scheda)
    useEffect(() => {
        if (params.get("new")) {
            setErrorMessage("");
            setManualForm({ guest_name: "", guest_email: "", guest_phone: "", check_in: params.get("ci") || "", check_out: params.get("co") || "", total_price: params.get("price") || "", adults: 2, children: 0, notes: "Prenotazione manuale", is_refundable: "true" });
            setManualOpen(true);
            setParams({}, { replace: true });
        }
    }, [params, setParams]);
    useEffect(() => {
        const id = params.get("open");
        if (!id || !items.length) return;
        const b = items.find((x) => x.id === id);
        if (b) {
            if (REQUEST_STATES.includes(b.status)) setTab("requests");
            setSelectedBooking(b);
            setDetailOpen(true);
        }
        setParams({}, { replace: true });
    }, [params, items, setParams]);
    useEffect(() => { load(); }, []);

    const activeItems = useMemo(() => {
        return items.filter((b) => !ARCHIVE_STATES.includes(b.status) && !REQUEST_STATES.includes(b.status) && !HIDDEN_STATES.includes(b.status)).filter((b) => {
            const searchTerm = search.toLowerCase();
            
            const guestName = b.guest_name ? b.guest_name.toLowerCase() : "";
            const guestEmail = b.guest_email ? b.guest_email.toLowerCase() : "";
            const bookingId = b.id ? b.id.toString() : "";
            
            const matchesSearch = guestName.includes(searchTerm) || 
                                  guestEmail.includes(searchTerm) || 
                                  bookingId.includes(searchTerm);

            let matchesStatus = true;
            if (filterStatus !== "all") {
                if (filterStatus === "external") {
                    matchesStatus = b.source === "airbnb" || b.source === "booking";
                } else {
                    matchesStatus = b.status === filterStatus;
                }
            }

            const matchesPayment = filterPayment === "all" || b.payment_status === filterPayment;
            
            let matchesSource = true;
            if (filterSource !== "all") {
                if (filterSource === "external") {
                    matchesSource = b.source === "airbnb" || b.source === "booking" || b.source === "external";
                } else {
                    matchesSource = b.source === filterSource;
                }
            }

            return matchesSearch && matchesStatus && matchesPayment && matchesSource;
        });
    }, [items, search, filterStatus, filterPayment, filterSource]);

    const archivedItems = useMemo(() => {
        return items.filter((b) => ARCHIVE_STATES.includes(b.status)).filter((b) => {
            const searchTerm = search.toLowerCase();
            const guestName = b.guest_name ? b.guest_name.toLowerCase() : "";
            const guestEmail = b.guest_email ? b.guest_email.toLowerCase() : "";
            const bookingId = b.id ? b.id.toString() : "";

            return guestName.includes(searchTerm) || 
                   guestEmail.includes(searchTerm) || 
                   bookingId.includes(searchTerm);
        });
    }, [items, search]);

    const requestItems = useMemo(() => items
        .filter((b) => REQUEST_STATES.includes(b.status))
        .sort((a, b) => (a.status === "request" ? 0 : 1) - (b.status === "request" ? 0 : 1) || (a.created_at < b.created_at ? -1 : 1)),
    [items]);
    const openRequests = requestItems.filter((b) => b.status === "request").length;

    // Apre la scheda "Richieste" se ce ne sono da valutare
    useEffect(() => {
        if (tab === null && items.length) setTab(openRequests > 0 ? "requests" : "list");
    }, [items, openRequests, tab]);

    const update = async (id, patch) => {
        try {
            await api.patch(`/admin/bookings/${id}`, patch);
            toast.success("Aggiornato");
            load();
        } catch { toast.error("Errore durante l'aggiornamento"); }
    };

    const askCancel = (b) => {
        setBookingToCancel(b);
        setCancelDialogOpen(true);
    };

    const confirmCancel = async () => {
        if (!bookingToCancel) return;
        setCancelling(true);
        try {
            const res = await api.delete(`/admin/bookings/${bookingToCancel.id}`);
            if (res.data?.email_sent) {
                toast.success("Prenotazione archiviata. Email di cancellazione inviata all'ospite.");
            } else {
                toast.success("Prenotazione archiviata. Nessuna email inviata (ospite senza indirizzo email).");
            }
            setCancelDialogOpen(false);
            setBookingToCancel(null);
            load();
        } catch {
            toast.error("Errore durante la cancellazione");
        } finally {
            setCancelling(false);
        }
    };

    const handleManualSubmit = async (e) => {
        e.preventDefault();
        setProcessing(true);
        setErrorMessage("");
        try {
            const priceAsNumber = parseFloat(manualForm.total_price) || 0;
            const payload = { 
                ...manualForm, 
                total_price: priceAsNumber,
                adults: parseInt(manualForm.adults),
                children: parseInt(manualForm.children),
                is_refundable: manualForm.is_refundable === "true"
            };
            if (manualForm.id) {
                await api.patch(`/admin/bookings/${manualForm.id}`, payload);
                toast.success("Modificata con successo");
            } else {
                await api.post("/admin/bookings/manual", {
                    ...payload,
                    id: `man-${Date.now()}`,
                    status: "confirmed",
                    payment_status: "fully_paid",
                    source: "manual",
                    created_at: new Date().toISOString()
                });
                toast.success("Registrata con successo");
            }
            setManualOpen(false);
            setManualForm({ guest_name: "", guest_email: "", guest_phone: "", check_in: "", check_out: "", total_price: "", adults: 2, children: 0, notes: "Prenotazione manuale", is_refundable: "true" });
            load();
        } catch (err) { 
            const msg = err?.response?.data?.detail || "Errore nel salvataggio";
            setErrorMessage(msg);
            toast.error(msg);
        } finally { setProcessing(false); }
    };

    const openEdit = (b) => {
        setErrorMessage("");
        setManualForm({ 
            id: b.id, 
            guest_name: b.guest_name || "", 
            guest_email: b.guest_email || "", 
            guest_phone: b.guest_phone || "", 
            check_in: b.check_in || "", 
            check_out: b.check_out || "", 
            total_price: String(b.total_price || 0), 
            adults: b.adults || 2,
            children: b.children || 0,
            notes: b.notes || "",
            is_refundable: b.is_refundable !== undefined ? String(b.is_refundable) : "true"
        });
        setManualOpen(true);
    };

    const openDetail = (b) => {
        setSelectedBooking(b);
        setDetailOpen(true);
    };

    const BookingsTable = ({ rows, showActions = true }) => (
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
                        {showActions && <TableHead className="text-right">Azioni</TableHead>}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={showActions ? 7 : 6} className="text-center py-12 text-lake-ink/40 text-sm italic">
                                Nessuna prenotazione trovata
                            </TableCell>
                        </TableRow>
                    )}
                    {rows.map((b) => (
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
                                {showActions ? (
                                    <Select value={b.status} onValueChange={(v) => update(b.id, { status: v })}>
                                        <SelectTrigger className="w-32 h-8 text-[11px] font-semibold"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pending">In attesa pagamento</SelectItem>
                                            <SelectItem value="confirmed">Confermata</SelectItem>
                                            <SelectItem value="cancelled">Cancellata</SelectItem>
                                            <SelectItem value="external">Esterna</SelectItem>
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <Badge className={`${statusColors[b.status] || ""} border-none text-[10px] uppercase font-bold`}>
                                        {statusLabels[b.status] || b.status}
                                    </Badge>
                                )}
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

                            {showActions && (
                                <TableCell className="text-right">
                                    <div className="flex flex-col items-end gap-1 text-[11px]">
                                        <button onClick={() => openEdit(b)} className="text-lake-ink hover:text-lake-blue flex items-center gap-1 font-bold">
                                            <Pencil className="w-3 h-3" /> MODIFICA
                                        </button>
                                        <button onClick={() => askCancel(b)} className="text-red-500 hover:underline font-bold uppercase tracking-tighter flex items-center gap-1">
                                            <Trash2 className="w-3 h-3" /> ELIMINA
                                        </button>
                                    </div>
                                </TableCell>
                            )}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );

    const RequestsTable = () => (
        <div className="bg-white border border-lake-border rounded-sm overflow-hidden" data-testid="requests-table">
            <Table>
                <TableHeader>
                    <TableRow className="bg-slate-50 uppercase text-[10px] font-bold">
                        <TableHead>Ospite</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Totale</TableHead>
                        <TableHead>Stato</TableHead>
                        <TableHead className="text-right">Azioni</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {requestItems.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center py-12 text-lake-ink/40 text-sm italic">
                                Nessuna richiesta in attesa
                            </TableCell>
                        </TableRow>
                    )}
                    {requestItems.map((b) => {
                        const deadline = b.status === "request" ? b.request_expires_at : b.payment_due_at;
                        return (
                            <TableRow key={b.id} className="hover:bg-slate-50/50 align-top">
                                <TableCell>
                                    <button onClick={() => openDetail(b)} className="text-left">
                                        <span className="font-bold text-lake-ink underline decoration-dotted underline-offset-4">{b.guest_name}</span>
                                        <span className="block text-[11px] text-lake-ink/60">{b.guest_email}</span>
                                        <span className="block text-[11px] text-lake-ink/60">{b.guest_phone}{b.contact_whatsapp ? " · WhatsApp ok" : ""}</span>
                                    </button>
                                    {b.notes && <p className="mt-1 text-[11px] italic text-amber-800 max-w-xs">"{b.notes}"</p>}
                                </TableCell>
                                <TableCell className="text-sm whitespace-nowrap">
                                    {fmtItDate(b.check_in)} → {fmtItDate(b.check_out)}
                                    <span className="block text-[11px] text-lake-ink/50">{b.adults} adulti, {b.children} bambini</span>
                                </TableCell>
                                <TableCell className="text-sm font-bold text-lake-blue">
                                    €{b.total_price}
                                    <span className="block text-[10px] font-normal text-lake-ink/50">{b.is_refundable === false ? "Non rimborsabile" : "Rimborsabile"}</span>
                                </TableCell>
                                <TableCell>
                                    <Badge className={`${statusColors[b.status]} border-none text-[10px] uppercase font-bold`}>{statusLabels[b.status]}</Badge>
                                    <span className="mt-1 flex items-center gap-1 text-[11px] text-lake-ink/60" title={fmtItDateTime(deadline)}>
                                        <Clock className="w-3 h-3" />
                                        {b.status === "request" ? "Rispondi entro " : "Pagamento entro "}{timeLeft(deadline)}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex flex-col items-end gap-1.5 text-[11px] font-bold">
                                        {b.status === "request" && (
                                            <button onClick={() => requestActions.askApprove(b)} data-testid={`approve-${b.id}`} className="flex items-center gap-1 text-emerald-700 hover:underline">
                                                <Check className="w-3.5 h-3.5" /> ACCETTA
                                            </button>
                                        )}
                                        <button onClick={() => requestActions.askReject(b)} data-testid={`reject-${b.id}`} className="flex items-center gap-1 text-rose-600 hover:underline">
                                            <XCircle className="w-3.5 h-3.5" /> RIFIUTA
                                        </button>
                                        {b.guest_phone && (
                                            <button onClick={() => requestActions.openWhatsapp(b)} className="flex items-center gap-1 text-green-700 hover:underline">
                                                <MessageCircle className="w-3.5 h-3.5" /> WHATSAPP
                                            </button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );

    return (
        <div className="p-10" data-testid="admin-bookings-page">
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-8 gap-4">
                <div>
                    <p className="overline text-lake-ink/60 font-bold tracking-widest leading-none">Gestione Proprietà</p>
                    <h1 className="font-display text-4xl text-lake-ink mt-2">Prenotazioni</h1>
                </div>
                <div className="flex gap-2">
                <Link to="/admin/calendar" className="inline-flex items-center px-4 h-10 rounded-sm border border-lake-border text-sm text-lake-ink hover:bg-white">
                    <CalendarIcon className="mr-2 h-4 w-4" /> Calendario
                </Link>
                <Button onClick={() => { setErrorMessage(""); setManualForm({ guest_name: "", guest_email: "", guest_phone: "", check_in: "", check_out: "", total_price: "", adults: 2, children: 0, notes: "Prenotazione manuale", is_refundable: "true" }); setManualOpen(true); }} className="bg-lake-blue hover:bg-lake-blue/90">
                    <Plus className="mr-2 h-4 w-4" /> Nuova Prenotazione
                </Button>
                </div>
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

            <Tabs value={tab || "list"} onValueChange={setTab} className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="requests" data-testid="tab-requests">
                        <Inbox className="mr-2 h-4 w-4" /> Richieste
                        {openRequests > 0 && (
                            <span className="ml-2 bg-sky-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{openRequests}</span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="list"><List className="mr-2 h-4 w-4" /> Lista</TabsTrigger>
                    <TabsTrigger value="archive">
                        <Archive className="mr-2 h-4 w-4" /> Archivio
                        {archivedItems.length > 0 && (
                            <span className="ml-2 bg-rose-100 text-rose-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                {archivedItems.length}
                            </span>
                        )}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="requests">
                    <div className="mb-4 flex items-start gap-2 text-sm text-lake-ink/60">
                        <Info className="w-4 h-4 mt-0.5 shrink-0" />
                        <span>Accettando, l'ospite riceve via email il link di pagamento Stripe. Rifiutando, riceve un'email di cortesia. In entrambi i casi puoi inviargli anche un messaggio WhatsApp già pronto. Le richieste senza risposta scadono da sole e liberano le date.</span>
                    </div>
                    <RequestsTable />
                </TabsContent>

                <TabsContent value="list">
                    <BookingsTable rows={activeItems} showActions={true} />
                </TabsContent>

                <TabsContent value="archive">
                    <div className="mb-4 flex items-center gap-2 text-sm text-lake-ink/60">
                        <Archive className="w-4 h-4" />
                        <span>Prenotazioni cancellate, richieste rifiutate e scadute vengono conservate per storico. Il rimborso delle cancellazioni va gestito su Stripe.</span>
                    </div>
                    <BookingsTable rows={archivedItems} showActions={false} />
                </TabsContent>
            </Tabs>

            {requestActions.dialogs}

            <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                <DialogContent className="sm:max-w-[440px] border-t-4 border-t-rose-400">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-display text-lake-ink flex items-center gap-2">
                            <Trash2 className="w-5 h-5 text-rose-500" /> Cancella prenotazione
                        </DialogTitle>
                        <DialogDescription className="pt-2 space-y-1">
                            {bookingToCancel && (
                                <>
                                    <span className="block font-semibold text-lake-ink">{bookingToCancel.guest_name}</span>
                                    <span className="block text-sm">{fmtItDate(bookingToCancel.check_in)} → {fmtItDate(bookingToCancel.check_out)}</span>
                                </>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-2 space-y-3 text-sm text-lake-ink/80">
                        <p>La prenotazione verrà <strong>archiviata</strong> e all'ospite verrà inviata un'email di cancellazione con indicazione che il rimborso arriverà entro <strong>5 giorni lavorativi</strong>.</p>
                        <p className="text-xs text-lake-ink/50">Il rimborso effettivo su Stripe deve essere eseguito manualmente dal pannello Stripe.</p>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setCancelDialogOpen(false)} disabled={cancelling}>
                            Annulla
                        </Button>
                        <Button onClick={confirmCancel} disabled={cancelling} className="bg-rose-500 hover:bg-rose-600 text-white">
                            {cancelling ? "Cancellazione..." : "Sì, cancella e notifica"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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
                                    <Label className="text-[10px] uppercase text-slate-400 font-bold flex items-center gap-1"><Users className="w-3 h-3" /> Ospite</Label>
                                    <p className="font-bold text-lg text-lake-ink leading-tight">{selectedBooking.guest_name}</p>
                                    <div className="flex flex-col gap-0.5 mt-1">
                                        <span className="text-xs text-slate-500 flex items-center gap-1"><Mail className="w-3 h-3" /> {selectedBooking.guest_email}</span>
                                        <span className="text-xs text-slate-500 flex items-center gap-1"><Phone className="w-3 h-3" /> {selectedBooking.guest_phone || "N/A"}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <Label className="text-[10px] uppercase text-slate-400 font-bold">Ospiti / Fonte</Label>
                                    <p className="font-bold text-xl text-lake-ink">{selectedBooking.adults + selectedBooking.children} Persone</p>
                                    <Badge variant="outline" className="mt-2 uppercase text-[9px] font-black tracking-widest">{selectedBooking.source}</Badge>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 border-b pb-4 text-sm">
                                <div>
                                    <Label className="text-[10px] uppercase text-slate-400 font-bold flex items-center gap-1"><CalendarIcon className="w-3 h-3" /> Soggiorno</Label>
                                    <p className="font-bold text-lake-ink">{fmtItDate(selectedBooking.check_in)}</p>
                                    <p className="font-bold text-lake-ink">{fmtItDate(selectedBooking.check_out)}</p>
                                </div>
                                <div className="text-right">
                                    <Label className="text-[10px] uppercase text-slate-400 font-bold">Totale</Label>
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
                                        {selectedBooking.payment_intent_id || "NON DISPONIBILE"}
                                    </code>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter className="gap-2 sm:gap-0">
                        {selectedBooking?.guest_phone && (
                            <Button variant="outline" onClick={() => { setDetailOpen(false); requestActions.openWhatsapp(selectedBooking); }} className="text-green-700 border-green-200">
                                <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
                            </Button>
                        )}
                        <Button onClick={() => setDetailOpen(false)} className="flex-1 bg-lake-ink hover:bg-lake-ink/90">Chiudi</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={manualOpen} onOpenChange={setManualOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader><DialogTitle>{manualForm.id ? "Modifica Dettagli" : "Nuovo Inserimento Manuale"}</DialogTitle></DialogHeader>
                    <form onSubmit={handleManualSubmit} className="space-y-4 pt-4">
                        {errorMessage && (
                            <div className="bg-destructive/10 text-destructive text-xs p-3 rounded-sm border border-destructive/20 flex items-start gap-2 animate-in fade-in zoom-in-95 duration-150">
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                <div className="font-semibold leading-tight">{errorMessage}</div>
                            </div>
                        )}
                        <div className="grid gap-2"><Label>Nome Ospite</Label><Input required value={manualForm.guest_name} onChange={e => setManualForm({ ...manualForm, guest_name: e.target.value })} /></div>
                        <div className="grid gap-2"><Label>Email</Label><Input type="email" required value={manualForm.guest_email} onChange={e => setManualForm({ ...manualForm, guest_email: e.target.value })} /></div>
                        <div className="grid gap-2"><Label>Telefono</Label><Input type="tel" value={manualForm.guest_phone} onChange={e => setManualForm({ ...manualForm, guest_phone: e.target.value })} placeholder="+39..." /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2"><Label>Check-in</Label><Input type="date" required value={manualForm.check_in} onChange={e => setManualForm({ ...manualForm, check_in: e.target.value })} /></div>
                            <div className="grid gap-2"><Label>Check-out</Label><Input type="date" required value={manualForm.check_out} onChange={e => setManualForm({ ...manualForm, check_out: e.target.value })} /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2"><Label>Adulti</Label><Input type="number" min="1" required value={manualForm.adults} onChange={e => setManualForm({ ...manualForm, adults: e.target.value })} /></div>
                            <div className="grid gap-2"><Label>Bambini</Label><Input type="number" min="0" required value={manualForm.children} onChange={e => setManualForm({ ...manualForm, children: e.target.value })} /></div>
                        </div>
                        
                        <div className="grid gap-2">
                            <Label>Politica di Cancellazione / Tariffa</Label>
                            <select 
                                value={manualForm.is_refundable} 
                                onChange={e => setManualForm({ ...manualForm, is_refundable: e.target.value })}
                                className="flex h-10 w-full rounded-sm border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-lake-blue text-lake-ink"
                            >
                                <option value="true">Rimborsabile (100% fino a 10 giorni prima)</option>
                                <option value="false">Non Rimborsabile</option>
                            </select>
                        </div>

                        <div className="grid gap-2"><Label>Prezzo Totale (€)</Label><Input required type="number" step="0.01" value={manualForm.total_price} onChange={e => setManualForm({ ...manualForm, total_price: e.target.value })} /></div>
                        <DialogFooter><Button type="submit" disabled={processing} className="w-full bg-emerald-600 hover:bg-emerald-700">{processing ? "Salvataggio..." : "Salva e Aggiorna"}</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
