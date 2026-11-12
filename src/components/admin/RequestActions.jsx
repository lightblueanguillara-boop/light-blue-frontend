import { useState } from "react";
import { toast } from "sonner";
import { MessageCircle, Copy } from "lucide-react";
import { api } from "../../lib/api";
import { fmtItDate } from "../../lib/date";
import { whatsappUrl } from "../../lib/whatsapp";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";

/**
 * Azioni sulle richieste di prenotazione (accetta, rifiuta, messaggio WhatsApp),
 * condivise tra la pagina Prenotazioni e il Calendario.
 *
 *   const actions = useRequestActions(load);
 *   actions.askApprove(b); actions.askReject(b); actions.openWhatsapp(b);
 *   ...{actions.dialogs}
 */
export function useRequestActions(onChange) {
    const [decision, setDecision] = useState(null); // { type: "approve" | "reject", booking }
    const [rejectReason, setRejectReason] = useState("");
    const [deciding, setDeciding] = useState(false);
    const [waResult, setWaResult] = useState(null); // { booking, text, title }
    const load = () => onChange && onChange();

    const decide = async () => {
        if (!decision) return;
        setDeciding(true);
        try {
            const { type, booking } = decision;
            const r = type === "approve"
                ? await api.post(`/admin/bookings/${booking.id}/approve`)
                : await api.post(`/admin/bookings/${booking.id}/reject`, { reason: rejectReason });
            toast.success(type === "approve"
                ? "Richiesta accettata: link di pagamento inviato via email all'ospite"
                : "Richiesta rifiutata: l'ospite è stato avvisato via email");
            setDecision(null);
            setRejectReason("");
            setWaResult({
                booking: r.data.booking,
                text: r.data.whatsapp_text,
                title: type === "approve" ? "Richiesta accettata" : "Richiesta rifiutata",
            });
            load();
        } catch (err) {
            const d = err?.response?.data?.detail;
            toast.error(typeof d === "string" ? d : "Operazione non riuscita");
        } finally {
            setDeciding(false);
        }
    };

    const openWhatsapp = async (b) => {
        try {
            const r = await api.get(`/admin/bookings/${b.id}/whatsapp`);
            setWaResult({ booking: b, text: r.data.text, title: "Messaggio WhatsApp" });
        } catch {
            toast.error("Impossibile preparare il messaggio");
        }
    };

    const askApprove = (b) => setDecision({ type: "approve", booking: b });
    const askReject = (b) => { setRejectReason(""); setDecision({ type: "reject", booking: b }); };

    const dialogs = (
        <>
        <Dialog open={!!decision} onOpenChange={(o) => !o && setDecision(null)}>
            <DialogContent className={`sm:max-w-[460px] border-t-4 ${decision?.type === "approve" ? "border-t-emerald-500" : "border-t-rose-400"}`}>
                <DialogHeader>
                    <DialogTitle className="text-xl font-display text-lake-ink">
                        {decision?.type === "approve" ? "Accetta richiesta" : "Rifiuta richiesta"}
                    </DialogTitle>
                    {decision && (
                        <DialogDescription className="pt-2">
                            <span className="block font-semibold text-lake-ink">{decision.booking.guest_name}</span>
                            <span className="block text-sm">{fmtItDate(decision.booking.check_in)} → {fmtItDate(decision.booking.check_out)} · €{decision.booking.total_price}</span>
                        </DialogDescription>
                    )}
                </DialogHeader>
                {decision?.type === "approve" ? (
                    <p className="text-sm text-lake-ink/80">All'ospite verrà inviata un'email con il <strong>link di pagamento</strong>. La prenotazione sarà confermata automaticamente quando avrà pagato; se non paga entro la scadenza, le date si liberano.</p>
                ) : (
                    <div className="space-y-2">
                        <p className="text-sm text-lake-ink/80">All'ospite verrà inviata un'email di cortesia e le date torneranno libere.</p>
                        <Label className="text-xs">Motivo (facoltativo, verrà mostrato all'ospite)</Label>
                        <Textarea rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Es.: la casa non è disponibile in quelle date." />
                    </div>
                )}
                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => setDecision(null)} disabled={deciding}>Annulla</Button>
                    <Button onClick={decide} disabled={deciding} data-testid="confirm-decision" className={decision?.type === "approve" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-rose-500 hover:bg-rose-600 text-white"}>
                        {deciding ? "Attendere..." : decision?.type === "approve" ? "Accetta e invia link" : "Rifiuta e avvisa"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <Dialog open={!!waResult} onOpenChange={(o) => !o && setWaResult(null)}>
            <DialogContent className="sm:max-w-[480px] border-t-4 border-t-green-600" data-testid="whatsapp-dialog">
                <DialogHeader>
                    <DialogTitle className="text-xl font-display text-lake-ink">{waResult?.title}</DialogTitle>
                    <DialogDescription>Messaggio WhatsApp pronto per {waResult?.booking?.guest_name}. Puoi modificarlo prima di aprire WhatsApp.</DialogDescription>
                </DialogHeader>
                {waResult && (() => {
                    const url = whatsappUrl(waResult.booking.guest_phone, waResult.text);
                    return (
                        <div className="space-y-3">
                            <Textarea rows={6} value={waResult.text} onChange={(e) => setWaResult({ ...waResult, text: e.target.value })} />
                            {!waResult.booking.contact_whatsapp && (
                                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 p-2 rounded-sm">L'ospite non ha dato il consenso a essere contattato su WhatsApp: l'email è già stata inviata, usa WhatsApp solo se necessario.</p>
                            )}
                            {!url && <p className="text-xs text-rose-600">Numero di telefono non valido o mancante.</p>}
                            <div className="flex flex-wrap gap-2">
                                {url && (
                                    <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-sm bg-green-600 hover:bg-green-700 text-white text-sm font-semibold">
                                        <MessageCircle className="w-4 h-4" /> Apri WhatsApp
                                    </a>
                                )}
                                {waResult.booking.payment_url && (
                                    <button onClick={() => { navigator.clipboard.writeText(waResult.booking.payment_url); toast.success("Link di pagamento copiato"); }} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-sm border border-lake-border text-sm">
                                        <Copy className="w-4 h-4" /> Copia link pagamento
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })()}
                <DialogFooter><Button variant="outline" onClick={() => setWaResult(null)}>Chiudi</Button></DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    );

    return { askApprove, askReject, openWhatsapp, dialogs };
}
