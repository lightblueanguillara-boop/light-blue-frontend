import { Link } from "react-router-dom";
import LegalLayout, { Field, useVillaInfo } from "./LegalLayout";

export default function Cookie() {
    const i = useVillaInfo() || {};
    return (
        <LegalLayout title="Cookie policy" updated="12-11-2026">
            <p>
                Questa pagina descrive i cookie e le tecnologie simili usate dal sito, ai sensi dell'art. 122 del
                D.Lgs. 196/2003 e delle Linee guida del Garante privacy sui cookie (10 giugno 2021).
            </p>

            <h2>In sintesi</h2>
            <p>
                <strong>Il sito non usa cookie di profilazione, di marketing o di statistica</strong>, né di prima né di
                terza parte. Per questo motivo non viene mostrato alcun banner di consenso: le uniche tecnologie usate
                sono strettamente necessarie al funzionamento del servizio e non richiedono consenso.
            </p>

            <h2>Tecnologie tecniche usate</h2>
            <ul>
                <li>
                    <strong>Archiviazione locale del browser ("localStorage")</strong>: usata solo nell'area riservata al
                    gestore per mantenere l'accesso dopo il login (chiavi <code>lv_admin_token</code> e{" "}
                    <code>lv_admin_email</code>). Non viene usata per i visitatori del sito.
                </li>
            </ul>

            <h2>Servizi esterni</h2>
            <ul>
                <li>
                    <strong>Pagamento con Stripe</strong> (solo su tua azione): quando confermi una prenotazione vieni indirizzato alla pagina di
                    pagamento di Stripe, che può usare propri cookie tecnici e antifrode. Si applica la{" "}
                    <a href="https://stripe.com/it/privacy" target="_blank" rel="noopener noreferrer">privacy policy di Stripe</a>.
                </li>
                <li>
                    <strong>Mappa OpenStreetMap</strong>: la mappa nella pagina principale è caricata dai server di
                    OpenStreetMap, che ricevono il tuo indirizzo IP; secondo quanto dichiarato da OpenStreetMap non
                    vengono usati cookie di profilazione. Si applica la{" "}
                    <a href="https://osmfoundation.org/wiki/Privacy_Policy" target="_blank" rel="noopener noreferrer">privacy policy di OpenStreetMap Foundation</a>.
                </li>
            </ul>

            <h2>Font e risorse</h2>
            <p>
                Caratteri tipografici, immagini dell'interfaccia e script sono ospitati direttamente dal sito: non
                vengono caricati da Google Fonts o da altri servizi esterni. Le foto della galleria sono servite
                tramite Cloudinary, che opera come fornitore tecnico senza usare cookie.
            </p>

            <h2>Come gestire i cookie</h2>
            <p>
                Puoi cancellare in qualsiasi momento i dati salvati dal sito dalle impostazioni del tuo browser.
                Per qualsiasi domanda scrivi a <Field value={i.email} />. Vedi anche l'
                <Link to="/privacy">Informativa privacy</Link>.
            </p>
        </LegalLayout>
    );
}
