import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../../components/ui/select";
import { Trash2, Plus, Webhook, Sparkles, Info } from "lucide-react";
import { Switch } from "../../components/ui/switch";
import { fmtItDateTime } from "../../lib/date";
import { api } from "../../lib/api";

export default function AdminSettings() {
    const [s, setS] = useState(null);
    const [saving, setSaving] = useState(false);
    const [syncing, setSyncing] = useState(false);

    useEffect(() => { api.get("/admin/settings").then((r) => setS(r.data)); }, []);

    if (!s) return <div className="p-10">Caricamento...</div>;
    const update = (patch) => setS({ ...s, ...patch });

    const save = async () => {
        setSaving(true);
        try { await api.put("/admin/settings", s); toast.success("Impostazioni salvate"); }
        catch { toast.error("Errore"); }
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

    // Mappatura dinamica delle spiegazioni basata sulla logica di email_helpers.py
    const policyDetails = {
        flexible: "Rimborso completo (100%) se l'ospite disdice almeno 24 ore prima del check-in. Nessun rimborso nelle ultime 24 ore.",
        moderate: "Rimborso completo (100%) fino a 7 giorni prima del check-in. Rimborso del 50% tra 1 e 7 giorni prima. Nessun rimborso nelle ultime 24 ore.",
        strict: "Rimborso completo (100%) solo entro 48 ore dalla prenotazione E almeno 14 giorni prima del check-in. Rimborso del 50% fino a 7 giorni prima."
    };

    return (
        <div className="p-10 space-y-10" data-testid="admin-settings-page">
            <div>
                <p className="overline">Impostazioni</p>
                <h1 className="font-display text-4xl text-lake-ink mt-2">Configurazione</h1>
            </div>

            <div className="bg-white border border-lake-border rounded-sm p-8 grid md:grid-cols-2 gap-5">
                <div className="md:col-span-2"><p className="font-display text-xl text-lake-ink">Dati villa</p></div>
                <div><Label>Nome</Label><Input data-testid="s-villa-name" value={s.villa_name || ""} onChange={(e) => update({ villa_name: e.target.value })} /></div>
                <div><Label>Email contatto</Label><Input data-testid="s-villa-email" value={s.villa_email || ""} onChange={(e) => update({ villa_email: e.target.value })} /></div>
                <div><Label>Telefono</Label><Input data-testid="s-villa-phone" value={s.villa_phone || ""} onChange={(e) => update({ villa_phone: e.target.value })} /></div>
                <div><Label>Indirizzo</Label><Input data-testid="s-villa-address" value={s.villa_address || ""} onChange={(e) => update({ villa_address: e.target.value })} /></div>
                <div><Label>Lago / Località</Label><Input data-testid="s-villa-lake" value={s.villa_lake || ""} onChange={(e) => update({ villa_lake: e.target.value })} /></div>
                <div><Label>Codice CIR</Label><Input data-testid="s-villa-cir" value={s.villa_cir || ""} onChange={(e) => update({ villa_cir: e.target.value })} /></div>
                <div className="md:col-span-2"><Label>Descrizione</Label><Textarea rows={4} data-testid="s-villa-desc" value={s.villa_description || ""} onChange={(e) => update({ villa_description: e.target.value })} /></div>
            </div>

            <div className="bg-white border border-lake-border rounded-sm p-8 grid md:grid-cols-3 gap-5">
                <div className="md:col-span-3"><p className="font-display text-xl text-lake-ink">Tariffe e politiche</p></div>
                <div><Label>Prezzo notte base (€)</Label><Input data-testid="s-price" type="number" value={s.default_price_per_night} onChange={(e) => update({ default_price_per_night: parseFloat(e.target.value || 0) })} /></div>
                <div><Label>% Acconto</Label><Input data-testid="s-deposit" type="number" value={s.deposit_percent} onChange={(e) => update({ deposit_percent: parseFloat(e.target.value || 0) })} /></div>
                <div className="space-y-2">
                    <Label>Politica cancellazione default</Label>
                    <Select value={s.default_cancellation_policy} onValueChange={(v) => update({ default_cancellation_policy: v })}>
                        <SelectTrigger data-testid="s-cancel-policy"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="flexible">Flessibile (24h)</SelectItem>
                            <SelectItem value="moderate">Moderata (7 giorni)</SelectItem>
                            <SelectItem value="strict">Rigorosa (14 giorni)</SelectItem>
                        </SelectContent>
                    </Select>
                    {/* Testo dinamico di spiegazione */}
                    <div className="flex gap-2 p-3 bg-lake-cream/50 rounded-sm border border-lake-border/50">
                        <Info size={14} className="text-lake-blue shrink-0 mt-0.5" />
                        <p className="text-[11px] leading-normal text-lake-ink/70 italic">
                            {policyDetails[s.default_cancellation_policy] || "Seleziona una politica per visualizzare i dettagli."}
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-lake-border rounded-sm p-8">
                <div className="flex items-center justify-between">
                    <div><p className="font-display text-xl text-lake-ink">Tariffe stagionali</p><p className="text-xs text-lake-ink/60 mt-1">Formato date: MM-DD (ricorrente) oppure YYYY-MM-DD (unica). Priorità più alta vince sulle sovrapposizioni.</p></div>
                    <button onClick={addRate} data-testid="add-rate-btn" className="px-4 py-2 rounded-sm border border-lake-border text-sm flex items-center gap-2"><Plus size={14} /> Aggiungi periodo</button>
                </div>
                <div className="mt-6 space-y-3">
                    {(s.seasonal_rates || []).map((r, i) => (
                        <div key={r.id || i} className="grid md:grid-cols-6 gap-3 items-end" data-testid={`rate-row-${i}`}>
                            <div><Label>Nome</Label><Input value={r.name} onChange={(e) => updateRate(i, { name: e.target.value })} /></div>
                            <div><Label>Inizio</Label><Input placeholder="MM-DD" value={r.start_date} onChange={(e) => updateRate(i, { start_date: e.target.value })} /></div>
                            <div><Label>Fine</Label><Input placeholder="MM-DD" value={r.end_date} onChange={(e) => updateRate(i, { end_date: e.target.value })} /></div>
                            <div><Label>Prezzo/notte €</Label><Input type="number" value={r.price_per_night} onChange={(e) => updateRate(i, { price_per_night: parseFloat(e.target.value || 0) })} /></div>
                            <div><Label>Priorità</Label><Input type="number" value={r.priority} onChange={(e) => updateRate(i, { priority: parseInt(e.target.value || 1) })} /></div>
                            <button onClick={() => removeRate(i)} data-testid={`delete-rate-${i}`} className="p-2 text-red-500 hover:bg-red-50 rounded-sm"><Trash2 size={16} /></button>
                        </div>
                    ))}
                    {(!s.seasonal_rates || s.seasonal_rates.length === 0) && <p className="text-sm text-lake-ink/60">Nessuna tariffa stagionale definita (verrà applicato il prezzo base).</p>}
                </div>
            </div>

            <div className="bg-white border border-lake-border rounded-sm p-8 space-y-5">
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

            <div className="bg-white border border-lake-border rounded-sm p-8 space-y-5" data-testid="settings-last-minute">
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

            <div className="bg-white border border-lake-border rounded-sm p-8 space-y-3" data-testid="settings-stripe-webhook">
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
                    Eventi da abilitare: <code className="bg-lake-cream px-1.5 py-0.5 rounded-sm">checkout.session.completed</code>, <code className="bg-lake-cream px-1.5 py-0.5 rounded-sm">checkout.session.async_payment_succeeded</code>.
                    Una volta creato, copia il <strong>Signing secret</strong> (whsec_...) e impostalo nel file <code className="bg-lake-cream px-1.5 py-0.5 rounded-sm">backend/.env</code> come <code className="bg-lake-cream px-1.5 py-0.5 rounded-sm">STRIPE_WEBHOOK_SECRET</code>, poi riavvia il backend. In assenza del secret il sistema usa polling come fallback (già funzionante).
                </p>
            </div>

            <button onClick={save} disabled={saving} data-testid="save-settings-btn" className="px-8 py-3.5 rounded-sm bg-lake-blue text-white text-sm disabled:opacity-50">
                {saving ? "Salvataggio..." : "Salva impostazioni"}
            </button>
        </div>
    );
}
