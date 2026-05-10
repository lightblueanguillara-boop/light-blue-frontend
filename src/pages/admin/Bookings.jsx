import React, { useState, useEffect } from 'react';
import { 
    Plus, Search, Filter, Calendar as CalendarIcon, 
    List, MoreHorizontal, Mail, Phone, Users, 
    Info, Pencil, Trash2, CheckCircle2, Clock, AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { DayPicker } from 'react-day-picker';

// CORREZIONE IMPORT: Usiamo ../ invece di ../../ come richiesto da Railway
import { getBookings, createBooking, updateBooking, deleteBooking } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { 
    Dialog, DialogContent, DialogHeader, DialogTitle, 
    DialogDescription, DialogFooter, DialogTrigger 
} from '../components/ui/dialog';
import { 
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '../components/ui/select';
import { 
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

const statusColors = {
    pending: "bg-amber-100 text-amber-700 border-amber-200",
    confirmed: "bg-emerald-100 text-emerald-700 border-emerald-200",
    cancelled: "bg-rose-100 text-rose-700 border-rose-200",
    external: "bg-sky-100 text-sky-700 border-sky-200"
};

export default function Booking() {
    const [bookings, setBookings] = useState([]);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    
    // Stato per il nuovo form
    const [formData, setFormData] = useState({
        guest_name: '',
        guest_email: '',
        guest_phone: '', // CAMPO TELEFONO AGGIUNTO
        check_in: '',
        check_out: '',
        total_price: '',
        status: 'pending',
        source: 'manual'
    });

    useEffect(() => {
        loadBookings();
    }, []);

    const loadBookings = async () => {
        try {
            const data = await getBookings();
            setBookings(data);
        } catch (err) {
            console.error("Errore caricamento:", err);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await createBooking(formData);
            setIsCreateOpen(false);
            loadBookings();
            setFormData({ guest_name: '', guest_email: '', guest_phone: '', check_in: '', check_out: '', total_price: '', status: 'pending', source: 'manual' });
        } catch (err) {
            alert("Errore durante la creazione");
        }
    };

    const filtered = bookings.filter(b => {
        const matchesSearch = b.guest_name.toLowerCase().includes(search.toLowerCase()) || 
                             (b.guest_phone && b.guest_phone.includes(search));
        const matchesStatus = filterStatus === "all" || b.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const fmtItDate = (d) => format(new Date(d), 'dd MMM yyyy', { locale: it });

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-lake-ink tracking-tight">Prenotazioni</h1>
                    <p className="text-slate-500 text-sm">Gestisci i tuoi ospiti e le disponibilità.</p>
                </div>

                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-lake-blue hover:bg-lake-blue/90 text-white font-bold px-6 shadow-lg shadow-lake-blue/20">
                            <Plus className="w-4 h-4 mr-2" /> NUOVA PRENOTAZIONE
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <form onSubmit={handleCreate}>
                            <DialogHeader>
                                <DialogTitle>Inserisci Nuova Prenotazione</DialogTitle>
                                <DialogDescription>Aggiungi manualmente un ospite al calendario.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Nome Ospite</Label>
                                        <Input required value={formData.guest_name} onChange={e => setFormData({...formData, guest_name: e.target.value})} placeholder="Mario Rossi" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Telefono</Label>
                                        <Input value={formData.guest_phone} onChange={e => setFormData({...formData, guest_phone: e.target.value})} placeholder="+39..." />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input type="email" value={formData.guest_email} onChange={e => setFormData({...formData, guest_email: e.target.value})} placeholder="mario@esempio.com" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Check-in</Label>
                                        <Input type="date" required value={formData.check_in} onChange={e => setFormData({...formData, check_in: e.target.value})} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Check-out</Label>
                                        <Input type="date" required value={formData.check_out} onChange={e => setFormData({...formData, check_out: e.target.value})} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Prezzo Totale (€)</Label>
                                    <Input type="number" required value={formData.total_price} onChange={e => setFormData({...formData, total_price: e.target.value})} placeholder="0.00" />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" className="w-full bg-lake-blue text-white">SALVA PRENOTAZIONE</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex flex-col md:flex-row gap-4 bg-white p-4 border border-lake-border rounded-sm shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input placeholder="Cerca ospite o telefono..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-10" />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-44 text-xs h-10"><SelectValue placeholder="Stato" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tutti gli stati</SelectItem>
                        <SelectItem value="pending">In attesa</SelectItem>
                        <SelectItem value="confirmed">Confermate</SelectItem>
                        <SelectItem value="cancelled">Cancellate</SelectItem>
                    </SelectContent>
                </Select>
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
                            <TableRow key={b.id} className="hover:bg-slate-50/50">
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-lake-ink">{b.guest_name}</span>
                                        <span className="text-[10px] text-slate-500 uppercase">{b.guest_email}</span>
                                        {b.guest_phone && (
                                            <span className="text-[9px] text-lake-blue font-semibold flex items-center gap-1">
                                                <Phone className="w-2 h-2"/> {b.guest_phone}
                                            </span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-sm italic text-slate-600">
                                    {fmtItDate(b.check_in)} → {fmtItDate(b.check_out)}
                                </TableCell>
                                <TableCell className="text-sm font-bold text-lake-blue">€{b.total_price}</TableCell>
                                <TableCell>
                                    <Badge className={`${statusColors[b.status]} border-none text-[10px] uppercase font-bold`}>
                                        {b.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm" onClick={() => deleteBooking(b.id).then(loadBookings)} className="text-red-500 hover:text-red-700">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
