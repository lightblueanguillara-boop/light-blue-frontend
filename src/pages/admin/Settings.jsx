import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { Trash2, Plus, Webhook, Sparkles } from "lucide-react";
import { Switch } from "../../components/ui/switch";
import { fmtItDateTime } from "../../lib/date";
import { api } from "../../lib/api";

export default function AdminSettings() {
    const [s, setS] = useState(null);
    const [saving, setSaving] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
    const [pwdSaving, setPwdSaving] = useState(false);

    const changePassword = async () => {
        if (pwd.next.length < 10) { toast.error("La nuova password deve avere almeno 10 caratteri"); return; }
        if (pwd.next !== pwd.confirm) { toast.error("Le due password non coincidono"); return; }
        setPwdSaving(true);
        try {
            const r = await api.post("/admin/password", { current_password: pwd.current, new_password: pwd.next });
            if (r.data?.token) localStorage.setItem("lv_admin_token", r.data.token);
            toast.success("Password aggiornata");
            setPwd({ current: "", next: "", confirm: "" });
        } catch (e) {
            toast.error(e?.response?.data?.detail || "Errore nel cambio password");
        } finally { setPwdSaving(false); }
    };

    useEffect(() => { api.get("/admin/settings").then((r) => setS(r.data)); }, []);

    if (!s) return <div className="p-4 sm:p-10 text-lake-ink/50 italic">Caricamento...</div>;
    const update = (patch) => setS({ ...s, ...patch });

    const save = async () => {
        setSaving(true);
        try { await api.put("/admin/settings", s); toast.success("Impostazioni salvate"); }
        catch (e) { const d = e?.response?.data?.detail; toast.error(typeof d === "string" ? `Non salvato: ${d}` : "Errore nel salvataggio"); }
        finally { setSaving(false); }
    };

    const syncIcal = async () => {
        setSyncing(true);
        try { const r = await api.post("/admin/ical/sync"); toast.success(`${r.data.imported} eventi importati`); }
        catch (e) { toast.error(e?.response?.data?.detail || "Errore sincronizzazione"); }
        finally { setSyncing(false); }
    };

    const addRate = () => {
        const rates = [...(s.seasonal_rates || []), { id: crypto.randomUUID(), name: "Nuovo periodo", start_date: "07-01", end_date: "08-31", price_per_night: 350, priority: 2 }];
        update({ seasonal_rates: rates });
    };
    const updateRate = (i, patch) => {
        const rates = [...s.seasonal_rates];
        rates[i] = { ...rates[i], ...patch };
        update({ seasonal_rates: rates });
    };
    const removeRate = (i) => {
        const rates = [...s.seasonal_rates]; rates.splice(i, 1); update({ seasonal_rates: rates });
    };

    const backendUrl = process.env.REACT_APP_BACKEND_URL;
    const exportUrl = `${backendUrl}/api/ical/export.ics`;

    return (
        <div className="p-4 sm:p-10 space-y-6 sm:space-y-10" data-testid="admin-settings-page">
            <div>
                <p className="overline">Impostazioni</p>
                <h1 className="font-display text-3xl sm:text-4xl text-lake-ink mt-2">Configurazione</h1>
            </div>

            <div className="bg-white border border-lake-border rounded-sm p-5 sm:p-8 grid md:grid-cols-2 gap-5">
                <div className="md:col-span-2"><p className="font-display text-xl text-lake-ink">Dati villa</p></div>
                <div><Label>Nome</Label><Input data-testid="s-villa-name" value={s.villa_name || ""} onChange={(e) => update({ villa_name: e.target.value })} /></div>
                <div><Label>Email contatto</Label><Input data-testid="s-villa-email" value={s.villa_email || ""} onChange={(e) => update({ villa_email: e.target.value })} /></div>
                <div><Label>Telefono</Label><Input data-testid="s-villa-phone" value={s.villa_phone || ""} onChange={(e) => update({ villa_phone: e.target.value })} /></div>
                <div><Label>Indirizzo</Label><Input data-testid="s-villa-address" value={s.villa_address || ""} onChange={(e) => update({ villa_address: e.target.value })} /></div>
                <div><Label>Lago / Località</Label><Input data-testid="s-villa-lake" value={s.villa_lake || ""} onChange={(e) => update({ villa_lake: e.target.value })} /></div>
                <div><Label>Codice CIN (Codice Identificativo Nazionale)</Label><Input data-testid="s-villa-cir" value={s.villa_cir || ""} onChange={(e) => update({ villa_cir: e.target.value })} /></div>
                <div className="md:col-span-2"><Label>Descrizione</Label><Textarea rows={4} data-testid="s-villa-desc" value={s.villa_description || ""} onChange={(e) => update({ villa_description: e.target.value })} /></div>
            </div>

            <div className="bg-white border border-lake-border rounded-sm p-5 sm:p-8 space-y-5" data-testid="s-booking-mode">
                <div>
                    <p className="font-display text-xl text-lake-ink">Modalità di prenotazione</p>
                    <p className="text-sm text-lake-ink/60 mt-1">Scegli come gli ospiti prenotano dal sito.</p>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                    {[
                        { v: "request", t: "Su richiesta", d: "L'ospite invia una richiesta, tu la accetti o rifiuti dal pannello. Se accetti riceve il link per pagare." },
                        { v: "instant", t: "Immediata", d: "L'ospite paga subito con Stripe e la prenotazione è confermata automaticamente." },
                    ].map((o) => (
                        <button type="button" key={o.v} onClick={() => update({ booking_mode: o.v })} data-testid={`mode-${o.v}`}
                            className={`text-left p-4 rounded-sm border-2 transition-all ${(s.booking_mode || "request") === o.v ? "border-lake-blue bg-lake-blue/5" : "border-lake-border hover:border-lake-border/70"}`}>
                            <p className="font-bold text-lake-ink">{o.t}</p>
                            <p className="text-sm text-lake-ink/65 mt-1">{o.d}</p>
                        </button>
                    ))}
                </div>
                {(s.booking_mode || "request") === "request" && (
                    <div className="grid md:grid-cols-2 gap-5">
                        <div>
                            <Label>Ore per rispondere a una richiesta (date bloccate)</Label>
                            <Input type="number" min={1} max={168} data-testid="s-hold-hours" value={s.request_hold_hours ?? 24} onChange={(e) => update({ request_hold_hours: parseInt(e.target.value || 0) })} />
                            <p className="text-xs text-lake-ink/50 mt-1">Scaduto il tempo senza risposta, la richiesta si chiude e le date si liberano (1-168 ore).</p>
                        </div>
                        <div>
                            <Label>Ore per pagare dopo l'accettazione</Label>
                            <Input type="number" min={1} max={24} data-testid="s-payment-hours" value={s.payment_link_hours ?? 24} onChange={(e) => update({ payment_link_hours: parseInt(e.target.value || 0) })} />
                            <p className="text-xs text-lake-ink/50 mt-1">Durata del link di pagamento Stripe (massimo 24 ore, limite di Stripe).</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-white border border-lake-border rounded-sm p-5 sm:p-8 grid md:grid-cols-2 gap-5" data-testid="s-legal">
                <div className="md:col-span-2">
                    <p className="font-display text-xl text-lake-ink">Dati legali (privacy e condizioni)</p>
                    <p className="text-sm text-lake-ink/60 mt-1">Compaiono nell'Informativa privacy, nelle Condizioni di prenotazione e nel footer. Il titolare è la persona o la società che gestisce l'affitto.</p>
                </div>
                <div><Label>Titolare (nome e cognome o ragione sociale)</Label><Input data-testid="s-legal-owner" value={s.legal_owner_name || ""} onChange={(e) => update({ legal_owner_name: e.target.value })} /></div>
                <div><Label>Codice fiscale o Partita IVA</Label><Input data-testid="s-legal-taxid" value={s.legal_owner_tax_id || ""} onChange={(e) => update({ legal_owner_tax_id: e.target.value })} /></div>
                <div className="md:col-span-2"><Label>Indirizzo del titolare (residenza o sede)</Label><Input data-testid="s-legal-address" value={s.legal_owner_address || ""} onChange={(e) => update({ legal_owner_address: e.target.value })} /></div>
                <div className="md:col-span-2"><Label>Imposta di soggiorno (testo mostrato agli ospiti, vuoto se non prevista)</Label><Textarea rows={2} data-testid="s-legal-tourist-tax" placeholder="Es.: Imposta di soggiorno di € X a persona per notte, da pagare in loco. Esenti i minori di 10 anni." value={s.tourist_tax_note || ""} onChange={(e) => update({ tourist_tax_note: e.target.value })} /></div>
            </div>

            <div className="bg-white border border-lake-border rounded-sm p-5 sm:p-8 grid md:grid-cols-3 gap-5">
                <div className="md:col-span-3"><p className="font-display text-xl text-lake-ink">Tariffe e politiche</p></div>
                <div><Label>Prezzo notte base (€)</Label><Input data-testid="s-price" type="number" value={s.default_price_per_night} onChange={(e) => update({ default_price_per_night: parseFloat(e.target.value || 0) })} /></div>
                <div><Label>% Acconto</Label><Input data-testid="s-deposit" type="number" value={s.deposit_percent} onChange={(e) => update({ deposit_percent: parseFloat(e.target.value || 0) })} /></div>
                <div>
                    <Label>% Sconto Tariffa Non Rimborsabile</Label>
                    <Input 
                        data-testid="s-non-refundable-discount" 
                        type="number" 
                        step="0.1"
                        value={s.non_refundable_discount_percent ?? 5} 
                        onChange={(e) => update({ non_refundable_discount_percent: parseFloat(e.target.value || 0) })} 
                    />
                    <p className="text-xs text-lake-ink/60 mt-1">
                        Sconto applicato alla tariffa non rimborsabile. Esempio: con 5% di sconto, una notte a €100 diventa €95.
                    </p>
                </div>
            </div>

            <div className="bg-white border border-lake-border rounded-sm p-8">
                <div className="flex items-center justify-between">
                    <div><p className="font-display text-xl text-lake-ink">Tariffe stagionali</p><p className="text-xs text-lake-ink/60 mt-1">Formato date: MM-DD (ricorrente) oppure YYYY-MM-DD (unica). Priorità più alta vince sulle sovrapposizioni.</p></div>
                    <button onClick={addRate} data-testid="add-rate-btn" className="px-4 py-2 rounded-sm border border-lake-border text-sm flex items-center gap-2"><Plus size={14} /> Aggiungi periodo</button>
                </div>
                <div className="mt-6 space-y-3">
                    {(s.seasonal_rates || []).map((r, i) => (
                        <div key={r.id || i} className="grid grid-cols-2 md:grid-cols-6 gap-3 items-end p-3 md:p-0 border md:border-0 border-lake-border rounded-sm" data-testid={`rate-row-${i}`}>
                            <div className="col-span-2 md:col-span-1"><Label>Nome</Label><Input value={r.name} onChange={(e) => updateRate(i, { name: e.target.value })} /></div>
                            <div><Label>Inizio</Label><Input placeholder="MM-DD" value={r.start_date} onChange={(e) => updateRate(i, { start_date: e.target.value })} /></div>
                            <div><Label>Fine</Label><Input placeholder="MM-DD" value={r.end_date} onChange={(e) => updateRate(i, { end_date: e.target.value })} /></div>
                            <div><Label>Prezzo/notte €</Label><Input type="number" value={r.price_per_night} onChange={(e) => updateRate(i, { price_per_night: parseFloat(e.target.value || 0) })} /></div>
                            <div><Label>Priorità</Label><Input type="number" value={r.priority} onChange={(e) => updateRate(i, { priority: parseInt(e.target.value || 1) })} /></div>
                            <button onClick={() => removeRate(i)} data-testid={`delete-rate-${i}`} aria-label="Elimina periodo" className="h-10 flex items-center justify-center gap-2 text-sm text-red-500 border md:border-0 border-red-200 hover:bg-red-50 rounded-sm"><Trash2 size={16} /><span className="md:hidden">Elimina</span></button>
                        </div>
                    ))}
                    {(!s.seasonal_rates || s.seasonal_rates.length === 0) && <p className="text-sm text-lake-ink/60">Nessuna tariffa stagionale definita (verrà applicato il prezzo base).</p>}
                </div>
            </div>

            <div className="bg-white border border-lake-border rounded-sm p-5 sm:p-8 space-y-5">
                <p className="font-display text-xl text-lake-ink">Channel Manager — iCal</p>
                <div><Label>URL iCal Airbnb (PLACEHOLDER)</Label><Input data-testid="s-ical-airbnb" placeholder="https://www.airbnb.com/calendar/ical/..." value={s.ical_airbnb_url || ""} onChange={(e) => update({ ical_airbnb_url: e.target.value })} /></div>
                <div><Label>URL iCal Booking.com (PLACEHOLDER)</Label><Input data-testid="s-ical-booking" placeholder="https://ical.booking.com/v1/export?t=..." value={s.ical_booking_url || ""} onChange={(e) => update({ ical_booking_url: e.target.value })} /></div>
                <div>
                    <Label>URL iCal del sito (da condividere con Airbnb/Booking)</Label>
                    <div className="flex gap-2 mt-1">
                        <Input readOnly value={exportUrl} data-testid="s-ical-export" />
                        <button onClick={() => { navigator.clipboard.writeText(exportUrl); toast.success("Copiato"); }} className="px-4 py-2 rounded-sm border border-lake-border text-sm">Copia</button>
                    </div>
                </div>
                <button onClick={syncIcal} disabled={syncing} data-testid="sync-ical-btn" className="px-5 py-2.5 rounded-sm bg-lake-sand text-lake-ink text-sm disabled:opacity-50">
                    {syncing ? "Sincronizzazione..." : "Sincronizza ora (importa blocchi)"}
                </button>
                {s.last_ical_sync_at && (
                    <p className="text-xs text-lake-ink/60" data-testid="last-sync-info">
                        Ultima sincronizzazione automatica: {fmtItDateTime(s.last_ical_sync_at)} · {s.last_ical_sync_count || 0} eventi importati
                    </p>
                )}
                <p className="text-xs text-lake-ink/60">Sincronizzazione automatica ogni 6 ore quando almeno un URL è configurato.</p>
            </div>

            <div className="bg-white border border-lake-border rounded-sm p-5 sm:p-8 space-y-5" data-testid="settings-last-minute">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-lake-blue" strokeWidth={1.5} />
                    <p className="font-display text-xl text-lake-ink">Banner Last Minute</p>
                </div>
                <p className="text-xs text-lake-ink/60">Mostra in homepage le date libere nei prossimi giorni con uno sconto. Aiuta a riempire la bassa stagione.</p>
                <div className="flex items-center gap-3">
                    <Switch
                        data-testid="s-lm-enabled"
                        checked={!!s.last_minute_enabled}
                        onCheckedChange={(v) => update({ last_minute_enabled: v })}
                    />
                    <Label className="cursor-pointer" onClick={() => update({ last_minute_enabled: !s.last_minute_enabled })}>
                        {s.last_minute_enabled ? "Attivo in homepage" : "Disattivato"}
                    </Label>
                </div>
                <div className="grid md:grid-cols-3 gap-5">
                    <div><Label>Sconto % visualizzato</Label><Input data-testid="s-lm-discount" type="number" value={s.last_minute_discount_percent ?? 15} onChange={(e) => update({ last_minute_discount_percent: parseFloat(e.target.value || 0) })} /></div>
                    <div><Label>Finestra (giorni)</Label><Input data-testid="s-lm-window" type="number" value={s.last_minute_window_days ?? 14} onChange={(e) => update({ last_minute_window_days: parseInt(e.target.value || 0) })} /></div>
                </div>
                <div><Label>Titolo banner</Label><Input data-testid="s-lm-title" value={s.last_minute_title || ""} onChange={(e) => update({ last_minute_title: e.target.value })} /></div>
                <div><Label>Sottotitolo</Label><Input data-testid="s-lm-subtitle" value={s.last_minute_subtitle || ""} onChange={(e) => update({ last_minute_subtitle: e.target.value })} /></div>
            </div>

            <div className="bg-white border border-lake-border rounded-sm p-5 sm:p-8 space-y-3" data-testid="settings-stripe-webhook">
                <div className="flex items-center gap-2">
                    <Webhook className="w-5 h-5 text-lake-blue" strokeWidth={1.5} />
                    <p className="font-display text-xl text-lake-ink">Stripe Webhook</p>
                </div>
                <p className="text-sm text-lake-ink/65 leading-relaxed">
                    Per ricevere automaticamente le conferme di pagamento (anche per metodi asincroni come SEPA o bonifici), configura un webhook nella tua dashboard Stripe puntando a:
                </p>
                <div className="flex gap-2">
                    <Input readOnly value={`${backendUrl}/api/webhook/stripe`} data-testid="s-stripe-webhook-url" />
                    <button
                        onClick={() => { navigator.clipboard.writeText(`${backendUrl}/api/webhook/stripe`); toast.success("Copiato"); }}
                        className="px-4 py-2 rounded-sm border border-lake-border text-sm"
                    >Copia</button>
                </div>
                <p className="text-xs text-lake-ink/60 leading-relaxed">
                    Eventi da abilitare: <code className="bg-lake-cream px-1.5 py-0.5 rounded-sm">checkout.session.completed</code>, <code className="bg-lake-cream px-1.5 py-0.5 rounded-sm">checkout.session.async_payment_succeeded</code>, <code className="bg-lake-cream px-1.5 py-0.5 rounded-sm">checkout.session.expired</code>.
                    Una volta creato, copia il <strong>Signing secret</strong> (whsec_...) e impostalo nelle variabili del servizio backend su Railway come <code className="bg-lake-cream px-1.5 py-0.5 rounded-sm">STRIPE_WEBHOOK_SECRET</code>. Senza il secret il webhook rifiuta le richieste e le conferme arrivano solo tramite la verifica dalla pagina di ritorno.
                </p>
            </div>

            <div className="sticky bottom-0 z-20 -mx-4 sm:mx-0 px-4 sm:px-0 py-3 bg-lake-cream/95 backdrop-blur border-t sm:border-0 border-lake-border">
                <button onClick={save} disabled={saving} data-testid="save-settings-btn" className="w-full sm:w-auto px-8 py-3.5 rounded-sm bg-lake-blue text-white text-sm shadow-sm disabled:opacity-50">
                    {saving ? "Salvataggio..." : "Salva impostazioni"}
                </button>
            </div>

            <div className="bg-white border border-lake-border rounded-sm p-5 sm:p-8 grid md:grid-cols-3 gap-5" data-testid="settings-password">
                <div className="md:col-span-3">
                    <p className="font-display text-xl text-lake-ink">Cambia password</p>
                    <p className="text-sm text-lake-ink/60 mt-1">Minimo 10 caratteri. Dopo il cambio, le sessioni aperte su altri dispositivi vengono chiuse.</p>
                </div>
                <div><Label>Password attuale</Label><Input type="password" autoComplete="current-password" value={pwd.current} onChange={(e) => setPwd({ ...pwd, current: e.target.value })} /></div>
                <div><Label>Nuova password</Label><Input type="password" autoComplete="new-password" value={pwd.next} onChange={(e) => setPwd({ ...pwd, next: e.target.value })} /></div>
                <div><Label>Ripeti nuova password</Label><Input type="password" autoComplete="new-password" value={pwd.confirm} onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })} /></div>
                <div className="md:col-span-3">
                    <button onClick={changePassword} disabled={pwdSaving || !pwd.current || !pwd.next} data-testid="change-password-btn" className="px-6 py-3 rounded-sm border border-lake-blue text-lake-blue text-sm disabled:opacity-50">
                        {pwdSaving ? "Aggiornamento..." : "Aggiorna password"}
                    </button>
                </div>
            </div>
        </div>
    );
}
