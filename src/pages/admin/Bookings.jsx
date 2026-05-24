import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DayPicker } from "react-day-picker";
import { it } from "date-fns/locale";
import "react-day-picker/dist/style.css";
import { Calendar as CalendarIcon, List, Plus, Pencil, Search, X, Info, CreditCard, Hash, Users, Phone, Mail, FileText, Archive, Trash2, AlertCircle } from "lucide-react";
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
    pending: \"bg-amber-100 text-amber-700\",
    confirmed: \"bg-emerald-100 text-emerald-700\",\n    cancelled: \"bg-rose-100 text-rose-700\",\n    external: \"bg-slate-100 text-slate-700\",\n};\n\nexport default function AdminBookings() {\n    const [bookings, setBookings] = useState([]);\n    const [loading, setLoading] = useState(true);\n    const [view, setView] = useState(\"calendar\"); // calendar | list\n    const [search, setSearch] = useState(\"\");\n    const [statusFilter, setStatusFilter] = useState(\"all\");\n\n    // Modals\n    const [showAddManual, setShowAddManual] = useState(false);\n    const [activeBooking, setActiveBooking] = useState(null);\n    const [processing, setProcessing] = useState(false);\n\n    // Form manuale iniziale con il nuovo campo is_refundable\n    const [manualForm, setManualForm] = useState({\n        guest_name: \"\",\n        guest_email: \"\",\n        guest_phone: \"\",\n        check_in: \"\",\n        check_out: \"\",\n        adults: 2,\n        children: 0,\n        total_price: \"\",\n        is_refundable: \"true\", // Gestito come stringa nel componente Select\n        source: \"manual\",\n        notes: \"\"\n    });\n\n    const loadBookings = async () => {\n        setLoading(true);\n        try {\n            const r = await api.get(\"/admin/bookings\");\n            setBookings(r.data);\n        } catch {\n            toast.error(\"Errore caricamento prenotazioni\");\n        } finally {\n            setLoading(false);\n        }\n    };\n\n    useEffect(() => {\n        loadBookings();\n    }, []);\n\n    const handleAddManualSubmit = async (e) => {\n        e.preventDefault();\n        setProcessing(true);\n        try {\n            // Convertiamo is_refundable in booleano reale prima dell'invio\n            const payload = {\n                ...manualForm,\n                is_refundable: manualForm.is_refundable === \"true\"\n            };\n            await api.post(\"/admin/bookings/manual\", payload);\n            toast.success(\"Prenotazione manuale registrata con successo ✓\");\n            setShowAddManual(false);\n            // Reset del form\n            setManualForm({\n                guest_name: \"\",\n                guest_email: \"\",\n                guest_phone: \"\",\n                check_in: \"\",\n                check_out: \"\",\n                adults: 2,\n                children: 0,\n                total_price: \"\",\n                is_refundable: \"true\",\n                source: \"manual\",\n                notes: \"\"\n            });\n            loadBookings();\n        } catch (err) {\n            toast.error(err?.response?.data?.detail || \"Errore durante il salvataggio\");\n        } finally {\n            setProcessing(false);\n        }\n    };\n\n    const handleCancelBooking = async (id) => {\n        if (!confirm(\"Sicuro di voler cancellare questa prenotazione? Verrà calcolato l'eventuale rimborso.\")) return;\n        try {\n            const r = await api.post(`/admin/bookings/${encodeURIComponent(id)}/cancel`);\n            toast.success(`Prenotazione cancellata. Rimborso calcolato: €${r.data.refund_amount}`);\n            loadBookings();\n            if (activeBooking && activeBooking.id === id) setActiveBooking(null);\n        } catch (err) {\n            toast.error(err?.response?.data?.detail || \"Errore durante la cancellazione\");\n        }\n    };\n\n    const filteredBookings = useMemo(() => {\n        return bookings.filter(b => {\n            const matchesSearch = \n                b.guest_name?.toLowerCase().includes(search.toLowerCase()) ||\n                b.id?.toLowerCase().includes(search.toLowerCase()) ||\n                b.guest_email?.toLowerCase().includes(search.toLowerCase());\n            \n            const matchesStatus = statusFilter === \"all\" || b.status === statusFilter;\n            return matchesSearch && matchesStatus;\n        });\n    }, [bookings, search, statusFilter]);\n\n    // Genera i giorni occupati per il calendario\n    const modifiers = useMemo(() => {\n        const bookedDays = [];\n        bookings.forEach(b => {\n            if (b.status !== \"cancelled\") {\n                let cur = new Date(b.check_in);\n                const end = new Date(b.check_out);\n                while (cur < end) {\n                    bookedDays.push(new Date(cur));\n                    cur.setDate(cur.getDate() + 1);\n                }\n            }\n        });\n        return { booked: bookedDays };\n    }, [bookings]);\n\n    return (\n        <div className=\"space-y-6\">\n            <div className=\"flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-lake-border pb-5\">\n                <div>\n                    <h1 className=\"text-xl font-semibold text-lake-ink uppercase tracking-wider\">Prenotazioni</h1>\n                    <p className=\"text-xs text-lake-ink/60 mt-1\">Gestisci il calendario, le prenotazioni manuali e i canali sincronizzati.</p>\n                </div>\n                <Button onClick={() => setShowAddManual(true)} className=\"bg-lake-blue hover:bg-lake-ink text-white rounded-sm flex items-center gap-2 text-xs uppercase tracking-wider h-11 px-5\">\n                    <Plus className=\"w-4 h-4\" /> Nuova Prenotazione\n                </Button>\n            </div>\n\n            <div className=\"flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 border border-lake-border rounded-sm\">\n                <div className=\"flex flex-1 w-full md:max-w-md items-center gap-2 border border-lake-border rounded-sm px-3 h-10 bg-lake-cream/20\">\n                    <Search className=\"w-4 h-4 text-lake-ink/40\" />\n                    <input \n                        type=\"text\" \n                        placeholder=\"Cerca per nome, email o ID...\" \n                        value={search} \n                        onChange={e => setSearch(e.target.value)} \n                        className=\"bg-transparent text-sm outline-none w-full text-lake-ink placeholder:text-lake-ink/30\"\n                    />\n                    {search && <X className=\"w-4 h-4 text-lake-ink/40 cursor-pointer\" onClick={() => setSearch(\"\")} />}\n                </div>\n\n                <div className=\"flex w-full md:w-auto items-center gap-3\">\n                    <Select value={statusFilter} onValueChange={setStatusFilter}>\n                        <SelectTrigger className=\"w-full md:w-44 bg-transparent border-lake-border rounded-sm text-xs h-10\">\n                            <SelectValue placeholder=\"Filtra Stato\" />\n                        </SelectTrigger>\n                        <SelectContent>\n                            <SelectItem value=\"all\">Tutti gli stati</SelectItem>\n                            <SelectItem value=\"confirmed\">Confermate</SelectItem>\n                            <SelectItem value=\"pending\">In Attesa</SelectItem>\n                            <SelectItem value=\"cancelled\">Cancellate</SelectItem>\n                            <SelectItem value=\"external\">Canali Esterni (iCal)</SelectItem>\n                        </SelectContent>\n                    </Select>\n\n                    <div className=\"flex border border-lake-border rounded-sm p-0.5 bg-lake-cream/20 shrink-0\">\n                        <button onClick={() => setView(\"calendar\")} className={`px-3 py-1.5 rounded-sm text-xs flex items-center gap-1.5 transition-all ${view === \"calendar\" ? \"bg-white text-lake-blue shadow-sm font-medium\" : \"text-lake-ink/60 hover:text-lake-ink\"}`}>\n                            <CalendarIcon className=\"w-3.5 h-3.5\" /> Calendario\n                        </button>\n                        <button onClick={() => setView(\"list\")} className={`px-3 py-1.5 rounded-sm text-xs flex items-center gap-1.5 transition-all ${view === \"list\" ? \"bg-white text-lake-blue shadow-sm font-medium\" : \"text-lake-ink/60 hover:text-lake-ink\"}`}>\n                            <List className=\"w-3.5 h-3.5\" /> Lista\n                        </button>\n                    </div>\n                </div>\n            </div>\n\n            <div className=\"grid grid-cols-1 xl:grid-cols-3 gap-6 items-start\">\n                <div className=\"xl:col-span-2 bg-white border border-lake-border rounded-sm p-4\">\n                    {loading ? (\n                        <div className=\"p-10 text-center text-xs text-lake-ink/40 italic\">Caricamento dati in corso...</div>\n                    ) : view === \"calendar\" ? (\n                        <div className=\"flex justify-center p-2 admin-daypicker\">\n                            <DayPicker \n                                locale={it} \n                                mode=\"multiple\"\n                                modifiers={modifiers}\n                                modifiersStyles={{\n                                    booked: { backgroundColor: '#7A93AC', color: 'white', borderRadius: '0px' }\n                                }}\n                                styles={{\n                                    caption: { color: '#1C242C', fontFamily: 'monospace', fontSize: '14px' }\n                                }}\n                            />\n                        </div>\n                    ) : (\n                        <div className=\"overflow-x-auto\">\n                            <Table>\n                                <TableHeader className=\"bg-lake-cream/30\">\n                                    <TableRow>\n                                        <TableHead className=\"text-[10px] uppercase tracking-wider text-lake-ink/70 font-semibold\">Ospite</TableHead>\n                                        <TableHead className=\"text-[10px] uppercase tracking-wider text-lake-ink/70 font-semibold\">Soggiorno</TableHead>\n                                        <TableHead className=\"text-[10px] uppercase tracking-wider text-lake-ink/70 font-semibold\">Stato</TableHead>\n                                        <TableHead className=\"text-[10px] uppercase tracking-wider text-lake-ink/70 font-semibold text-right\">Prezzo</TableHead>\n                                    </TableRow>\n                                </TableHeader>\n                                <TableBody>\n                                    {filteredBookings.length === 0 ? (\n                                        <TableRow>\n                                            <TableCell colSpan={4} className=\"text-center py-8 text-xs text-lake-ink/40 italic\">Nessuna prenotazione trovata.</TableCell>\n                                        </TableRow>\n                                    ) : (\n                                        filteredBookings.map((b) => (\n                                            <TableRow key={b.id} className=\"cursor-pointer hover:bg-lake-cream/10 transition-all\" onClick={() => setActiveBooking(b)}>\n                                                <TableCell className=\"py-3.5\">\n                                                    <div className=\"font-medium text-sm text-lake-ink\">{b.guest_name || \"Blocco Esterno\"}</div>\n                                                    <div className=\"text-[11px] text-lake-ink/50 mt-0.5\">{b.source.toUpperCase()} · id: {b.id.substring(0,8)}...</div>\n                                                </TableCell>\n                                                <TableCell className=\"py-3.5\">\n                                                    <div className=\"text-xs text-lake-ink font-mono\">{fmtItDate(b.check_in)} ➔ {fmtItDate(b.check_out)}</div>\n                                                </TableCell>\n                                                <TableCell className=\"py-3.5\">\n                                                    <Badge className={`rounded-sm font-normal text-[10px] uppercase tracking-wider px-2 py-0.5 border-none shadow-none ${statusColors[b.status] || \"bg-slate-100\"}`}>\n                                                        {b.status === \"external\" ? b.notes || \"iCal\" : b.status}\n                                                    </Badge>\n                                                </TableCell>\n                                                <TableCell className=\"py-3.5 text-right font-medium text-sm text-lake-ink\">\n                                                    {b.total_price > 0 ? `€${Number(b.total_price).toFixed(2)}` : \"—\"}\n                                                </TableCell>\n                                            </TableRow>\n                                        ))\n                                    )}\n                                </TableBody>\n                            </Table>\n                        </div>\n                    )}\n                </div>\n\n                <div className=\"bg-white border border-lake-border rounded-sm p-5 space-y-5 sticky top-6\">\n                    <h3 className=\"text-xs font-semibold text-lake-ink/40 uppercase tracking-widest pb-2 border-b border-lake-border\">Dettaglio Selezione</h3>\n                    {activeBooking ? (\n                        <div className=\"space-y-4 text-lake-ink\">\n                            <div>\n                                <p className=\"text-[10px] uppercase tracking-wider text-lake-ink/40 font-mono\">ID Prenotazione</p>\n                                <p className=\"text-xs font-mono break-all bg-lake-cream/30 p-2 rounded-sm border border-lake-border/50 mt-1\">{activeBooking.id}</p>\n                            </div>\n                            <div className=\"grid grid-cols-2 gap-4\">\n                                <div>\n                                    <p className=\"text-[10px] uppercase tracking-wider text-lake-ink/40\">Check-in</p>\n                                    <p className=\"text-sm font-semibold mt-0.5 font-mono text-lake-blue\">{fmtItDate(activeBooking.check_in)}</p>\n                                </div>\n                                <div>\n                                    <p className=\"text-[10px] uppercase tracking-wider text-lake-ink/40\">Check-out</p>\n                                    <p className=\"text-sm font-semibold mt-0.5 font-mono text-lake-blue\">{fmtItDate(activeBooking.check_out)}</p>\n                                </div>\n                            </div>\n                            <div className=\"border-t border-lake-border/60 pt-3 space-y-2\">\n                                <div className=\"flex justify-between text-xs\">\n                                    <span className=\"text-lake-ink/60\">Ospite:</span>\n                                    <span className=\"font-medium\">{activeBooking.guest_name || \"—\"}</span>\n                                </div>\n                                {activeBooking.guest_email && (\n                                    <div className=\"flex justify-between text-xs\">\n                                        <span className=\"text-lake-ink/60\">Email:</span>\n                                        <span className=\"font-mono text-lake-blue\">{activeBooking.guest_email}</span>\n                                    </div>\n                                )}\n                                {activeBooking.guest_phone && (\n                                    <div className=\"flex justify-between text-xs\">\n                                        <span className=\"text-lake-ink/60\">Telefono:</span>\n                                        <span>{activeBooking.guest_phone}</span>\n                                    </div>\n                                )}\n                                <div className=\"flex justify-between text-xs\">\n                                    <span className=\"text-lake-ink/60\">Canale d'origine:</span>\n                                    <Badge variant=\"outline\" className=\"rounded-sm text-[10px] uppercase font-normal px-1.5 border-lake-border\">{activeBooking.source}</Badge>\n                                </div>\n                                <div className=\"flex justify-between text-xs\">\n                                    <span className=\"text-lake-ink/60\">Tariffazione:</span>\n                                    <Badge variant=\"outline\" className={`rounded-sm text-[10px] uppercase font-normal px-1.5 ${activeBooking.is_refundable ? \"border-emerald-200 bg-emerald-50 text-emerald-700\" : \"border-rose-200 bg-rose-50 text-rose-700\"}`}>\n                                        {activeBooking.is_refundable ? \"Rimborsabile (10d)\" : \"Non Rimborsabile\"}\n                                    </Badge>\n                                </div>\n                            </div>\n\n                            <div className=\"border-t border-lake-border/60 pt-3 space-y-1.5 bg-lake-cream/10 p-3 rounded-sm border border-lake-border/40\">\n                                <div className=\"flex justify-between text-xs\">\n                                    <span className=\"text-lake-ink/60\">Prezzo Totale:</span>\n                                    <span className=\"font-semibold\">€{Number(activeBooking.total_price).toFixed(2)}</span>\n                                </div>\n                                <div className=\"flex justify-between text-xs\">\n                                    <span className=\"text-lake-ink/60\">Acconto Richiesto:</span>\n                                    <span>€{Number(activeBooking.deposit_amount).toFixed(2)}</span>\n                                </div>\n                                <div className=\"flex justify-between text-xs border-t border-dashed border-lake-border/50 pt-1.5 mt-1\">\n                                    <span className=\"text-lake-ink/60\">Stato Pagamento:</span>\n                                    <span className=\"font-medium uppercase text-[11px] font-mono\">{activeBooking.payment_status}</span>\n                                </div>\n                                {activeBooking.refund_amount > 0 && (\n                                    <div className=\"flex justify-between text-xs text-rose-600 font-medium\">\n                                        <span>Rimborsato:</span>\n                                        <span>€{Number(activeBooking.refund_amount).toFixed(2)}</span>\n                                    </div>\n                                )}\n                            </div>\n\n                            {activeBooking.notes && (\n                                <div className=\"bg-lake-cream/30 border border-lake-border/60 p-2.5 rounded-sm\">\n                                    <p className=\"text-[10px] uppercase tracking-wider text-lake-ink/40 font-semibold\">Note interne</p>\n                                    <p className=\"text-xs text-lake-ink/80 mt-1 leading-relaxed whitespace-pre-line\">{activeBooking.notes}</p>\n                                </div>\n                            )}\n\n                            {activeBooking.status !== \"cancelled\" && activeBooking.source !== \"external\" && (\n                                <div className=\"pt-2\">\n                                    <Button \n                                        onClick={() => handleCancelBooking(activeBooking.id)} \n                                        className=\"w-full bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 rounded-sm text-xs uppercase tracking-wider h-10 font-medium flex items-center justify-center gap-1.5 shadow-none\"\n                                    >\n                                        <Trash2 className=\"w-3.5 h-3.5\" /> Cancella Prenotazione\n                                    </Button>\n                                </div>\n                            )}\n                        </div>\n                    ) : (\n                        <div className=\"text-center py-12 border border-dashed border-lake-border rounded-sm bg-lake-cream/5\">\n                            <Info className=\"w-5 h-5 text-lake-ink/20 mx-auto mb-2\" />\n                            <p className=\"text-xs text-lake-ink/40 italic font-light px-4\">Seleziona una prenotazione dalla lista o naviga nel calendario per visualizzare i dettagli completi dell'ospite.</p>\n                        </div>\n                    )}\n                </div>\n            </div>\n\n            {/* Modal di Creazione Prenotazione Manuale */}\n            <Dialog open={showAddManual} onOpenChange={setShowAddManual}>\n                <DialogContent className=\"bg-white rounded-sm border border-lake-border max-w-md w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh]\">\n                    <DialogHeader className=\"border-b border-lake-border pb-3\">\n                        <DialogTitle className=\"text-sm uppercase tracking-wider text-lake-ink font-semibold flex items-center gap-2\">\n                            <Plus className=\"w-4 h-4 text-lake-blue\" /> Nuova Prenotazione Manuale\n                        </DialogTitle>\n                        <DialogDescription className=\"text-[11px] text-lake-ink/50\">\n                            Inserisci un blocco manuale o una prenotazione diretta/telefonica nel sistema.\n                        </DialogDescription>\n                    </DialogHeader>\n                    <form onSubmit={handleAddManualSubmit} className=\"space-y-4 pt-3 text-lake-ink\">\n                        <div className=\"grid gap-1.5\">\n                            <Label className=\"text-xs\">Nome Completo Ospite</Label>\n                            <Input required value={manualForm.guest_name} onChange={e => setManualForm({ ...manualForm, guest_name: e.target.value })} className=\"rounded-sm border-lake-border h-10 text-sm\" placeholder=\"Es: Mario Rossi\" />\n                        </div>\n                        <div className=\"grid grid-cols-2 gap-4\">\n                            <div className=\"grid gap-1.5\">\n                                <Label className=\"text-xs\">Email</Label>\n                                <Input type=\"email\" required value={manualForm.guest_email} onChange={e => setManualForm({ ...manualForm, guest_email: e.target.value })} className=\"rounded-sm border-lake-border h-10 text-sm\" placeholder=\"mario@esempio.com\" />\n                            </div>\n                            <div className=\"grid gap-1.5\">\n                                <Label className=\"text-xs\">Telefono</Label>\n                                <Input type=\"tel\" value={manualForm.guest_phone} onChange={e => setManualForm({ ...manualForm, guest_phone: e.target.value })} className=\"rounded-sm border-lake-border h-10 text-sm\" placeholder=\"+39 333...\" />\n                            </div>\n                        </div>\n                        <div className=\"grid grid-cols-2 gap-4\">\n                            <div className=\"grid gap-1.5\">\n                                <Label className=\"text-xs\">Check-in</Label>\n                                <Input type=\"date\" required value={manualForm.check_in} onChange={e => setManualForm({ ...manualForm, check_in: e.target.value })} className=\"rounded-sm border-lake-border h-10 text-sm font-mono\" />\n                            </div>\n                            <div className=\"grid gap-1.5\">\n                                <Label className=\"text-xs\">Check-out</Label>\n                                <Input type=\"date\" required value={manualForm.check_out} onChange={e => setManualForm({ ...manualForm, check_out: e.target.value })} className=\"rounded-sm border-lake-border h-10 text-sm font-mono\" />\n                            </div>\n                        </div>\n                        <div className=\"grid grid-cols-2 gap-4\">\n                            <div className=\"grid gap-1.5\">\n                                <Label className=\"text-xs\">Adulti</Label>\n                                <Input type=\"number\" min=\"1\" required value={manualForm.adults} onChange={e => setManualForm({ ...manualForm, adults: e.target.value })} className=\"rounded-sm border-lake-border h-10 text-sm\" />\n                            </div>\n                            <div className=\"grid gap-1.5\">\n                                <Label className=\"text-xs\">Bambini</Label>\n                                <Input type=\"number\" min=\"0\" required value={manualForm.children} onChange={e => setManualForm({ ...manualForm, children: e.target.value })} className=\"rounded-sm border-lake-border h-10 text-sm\" />\n                            </div>\n                        </div>\n                        <div className=\"grid gap-1.5\">\n                            <Label className=\"text-xs\">Prezzo Totale Accurato (€)</Label>\n                            <Input required type=\"number\" step=\"0.01\" value={manualForm.total_price} onChange={e => setManualForm({ ...manualForm, total_price: e.target.value })} className=\"rounded-sm border-lake-border h-10 text-sm font-mono\" placeholder=\"0.00\" />\n                        </div>\n                        \n                        {/* NUOVO SELETTORE GRAFICO PER LA TARIFFAZIONE MANUALE */}\n                        <div className=\"grid gap-1.5\">\n                            <Label className=\"text-xs\">Politica di Cancellazione / Tariffa</Label>\n                            <Select \n                                value={manualForm.is_refundable} \n                                onValueChange={(val) => setManualForm({ ...manualForm, is_refundable: val })}\n                            >\n                                <SelectTrigger className=\"w-full border-lake-border rounded-sm text-sm h-10 bg-white\">\n                                    <SelectValue placeholder=\"Seleziona tipo tariffa\" />\n                                </SelectTrigger>\n                                <SelectContent className=\"bg-white border border-lake-border\">\n                                    <SelectItem value=\"true\" className=\"text-sm cursor-pointer\">Rimborsabile (Rimborso 100% fino a 10 giorni prima)</SelectItem>\n                                    <SelectItem value=\"false\" className=\"text-sm cursor-pointer\">Non Rimborsabile (Nessun rimborso sempre)</SelectItem>\n                                </SelectContent>\n                            </Select>\n                        </div>\n\n                        <div className=\"grid gap-1.5\">\n                            <Label className=\"text-xs\">Note Interne / Dettagli accordo</Label>\n                            <textarea value={manualForm.notes} onChange={e => setManualForm({ ...manualForm, notes: e.target.value })} className=\"rounded-sm border border-lake-border text-sm p-2.5 min-h-[60px] outline-none\" placeholder=\"Inserisci qui eventuali dettagli sulla prenotazione...\" />\n                        </div>\n                        <DialogFooter className=\"pt-2 border-t border-lake-border mt-4\">\n                            <Button type=\"submit\" disabled={processing} className=\"w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-sm h-11 text-xs uppercase tracking-widest font-bold\">\n                                {processing ? \"Salvataggio...\" : \"Salva e Invia Email\"}\n                            </Button>\n                        </DialogFooter>\n                    </form>\n                </DialogContent>\n            </Dialog>\n        </div>\n    );\n}\n```

---

### 📂 2. BACKEND: `light_blue_anguillara-main/routers/admin/bookings.py`
Nel backend abbiamo intercettato il valore booleano `is_refundable` inviato dal corpo della richiesta (se assente, impostiamo `True` come comportamento sicuro di ripiego), salvandolo direttamente nel dizionario che viene scritto su MongoDB.

```python
"""Bookings CRUD + refund + balance-reminder."""
import asyncio
import logging
import uuid
import urllib.parse
from datetime import datetime, timezone
from typing import Optional

import stripe
from fastapi import APIRouter, Depends, HTTPException

from auth import get_current_admin
from db import db, get_settings, STRIPE_API_KEY
from email_helpers import (
    send_email_async, 
    email_balance_reminder_html, 
    email_booking_confirmation_html, 
    email_cancellation_html,
    email_modification_confirmation_html,
    _it_date
)
from models import Booking, BookingUpdate, RefundRequest
from pricing import compute_refund_amount

router = APIRouter()
stripe.api_key = STRIPE_API_KEY

@router.get("/admin/bookings")
async def list_bookings(admin=Depends(get_current_admin)):
    return await db.bookings.find({}, {'_id': 0}).sort('created_at', -1).to_list(10000)

@router.post("/admin/bookings/manual")
async def create_manual_booking(payload: dict, admin=Depends(get_current_admin)):
    """Crea una prenotazione manuale e invia email di conferma all'ospite."""
    try:
        total_price = float(payload.get('total_price', 0))
        deposit_amount = float(payload.get('deposit_amount', 0))

        # Estrazione degli ospiti dal payload inviato dal front-end
        adults = int(payload.get('adults', 2))
        children = int(payload.get('children', 0))

        # ESTRAZIONE DEL NUOVO CAMPO IS_REFUNDABLE DALLE IMPOSTAZIONI MANUALI
        is_refundable = bool(payload.get('is_refundable', True))

        settings = await get_settings()

        # Se l'acconto non è esplicitamente calcolato, usa la percentuale dei settings
        if deposit_amount <= 0:
            dep_pct = float(settings.get('deposit_percent', 30.0))
            deposit_amount = round((total_price * dep_pct) / 100.0, 2)

        new_booking = {
            "id": f"bk_{uuid.uuid4().hex[:12]}",
            "guest_name": payload.get('guest_name', 'Blocco Manuale'),
            "guest_email": payload.get('guest_email', 'admin@lightblue.it'),
            "guest_phone": payload.get('guest_phone'),
            "check_in": payload.get('check_in'),
            "check_out": payload.get('check_out'),
            "adults": adults,
            "children": children,
            "total_price": total_price,
            "deposit_amount": deposit_amount,
            "payment_choice": "deposit",
            "is_refundable": is_refundable, # Salva la scelta impostata manualmente dall'admin
            "status": "confirmed",
            "payment_status": "unpaid",
            "source": payload.get('source', 'manual'),
            "notes": payload.get('notes', ''),
            "consent_newsletter": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }

        await db.bookings.insert_one(new_booking)

        # Rimuove l'identificatore MongoDB interno per la risposta ed evitare conflitti
        if '_id' in new_booking:
            del new_booking['_id']

        # Invio asincrono dell'email di conferma allineato alla scelta rimborsabile/non rimborsabile
        asyncio.create_task(
            send_email_async(
                new_booking['guest_email'],
                f"Conferma Prenotazione — {settings.get('villa_name','Light Blue')}",
                email_booking_confirmation_html(new_booking, settings)
            )
        )

        return new_booking

    except Exception as e:
        logging.exception("Error creating manual booking")
        raise HTTPException(status_code=400, detail=f"Errore creazione prenotazione: {str(e)}")

@router.post("/admin/bookings/{booking_id}/cancel")
async def admin_cancel_booking(booking_id: str, admin=Depends(get_current_admin)):
    """Cancella una prenotazione lato amministratore calcolando il rimborso esatto."""
    decoded_id = urllib.parse.unquote(booking_id)

    b = await db.bookings.find_one({'id': decoded_id})
    if not b:
        raise HTTPException(404, 'Booking not found')

    if b.get('status') == 'cancelled':
        return {'ok': True, 'refund_amount': b.get('refund_amount', 0.0), 'msg': 'Already cancelled'}

    # Calcolo dinamico del rimborso basato sulla regola dei 10 giorni o Tariffa Non Rimborsabile
    ref_res = compute_refund_amount(b)
    refund_amount = ref_res.get('refund', 0.0)

    # Se c'era un pagamento Stripe registrato ed è previsto un rimborso monetario, procedi via API Stripe
    pi = b.get('payment_intent_id')
    if pi and refund_amount > 0:
        try:
            stripe.Refund.create(
                payment_intent=pi,
                amount=int(refund_amount * 100),
                reason='requested_by_customer',
            )
        except Exception as e:
            logging.exception('Stripe refund failed')
            raise HTTPException(500, f'Rimborso Stripe fallito ma registrato localmente: {e}')

    await db.bookings.update_one(
        {'id': decoded_id},
        {'$set': {
            'status': 'cancelled',
            'payment_status': 'refunded' if refund_amount > 0 else b.get('payment_status', 'unpaid'),
            'refund_amount': refund_amount,
            'refund_at': datetime.now(timezone.utc).isoformat(),
        }},
    )

    # Invia email di notifica cancellazione all'ospite
    settings = await get_settings()
    b['status'] = 'cancelled'
    b['refund_amount'] = refund_amount
    asyncio.create_task(
        send_email_async(
            b['guest_email'],
            f"Annullamento Prenotazione — {settings.get('villa_name','Light Blue')}",
            email_cancellation_html(b, settings)
        )
    )

    return {'ok': True, 'refund_amount': refund_amount}

@router.post("/admin/bookings/{booking_id}/balance-reminder")
async def balance_reminder(booking_id: str, admin=Depends(get_current_admin)):
    decoded_id = urllib.parse.unquote(booking_id)

    b = await db.bookings.find_one({'id': decoded_id}, {'_id': 0})
    if not b:
        raise HTTPException(404, 'Booking not found')

    settings = await get_settings()

    ok = await send_email_async(
        b['guest_email'],
        f"Promemoria saldo — {settings.get('villa_name','Light Blue')}",
        email_balance_reminder_html(b, settings),
    )

    await db.bookings.update_one(
        {'id': decoded_id},
        {'$set': {'last_reminder_at': datetime.now(timezone.utc).isoformat()}}
    )
    return {'ok': ok}
