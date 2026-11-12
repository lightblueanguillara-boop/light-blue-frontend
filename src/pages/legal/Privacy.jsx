import { Link } from "react-router-dom";
import LegalLayout, { Field, useVillaInfo } from "./LegalLayout";

export default function Privacy() {
    const i = useVillaInfo() || {};
    return (
        <LegalLayout title="Informativa privacy" updated="12-11-2026">
            <p>
                Questa informativa spiega come vengono trattati i dati personali raccolti tramite il sito di{" "}
                <strong>{i.name || "Light Blue - Anguillara Sabazia"}</strong>, ai sensi degli artt. 13 e 14 del
                Regolamento (UE) 2016/679 ("GDPR") e del D.Lgs. 196/2003 ("Codice privacy").
            </p>

            <h2>1. Titolare del trattamento</h2>
            <ul>
                <li>Titolare: <Field value={i.legal_owner_name} /></li>
                <li>Codice fiscale / P. IVA: <Field value={i.legal_owner_tax_id} /></li>
                <li>Indirizzo: <Field value={i.legal_owner_address} /></li>
                <li>Email per questioni privacy: <Field value={i.email} /></li>
            </ul>

            <h2>2. Quali dati trattiamo, perché e su quale base giuridica</h2>
            <ul>
                <li>
                    <strong>Prenotazioni</strong>: nome, email, telefono, date del soggiorno, numero di ospiti, note, dati
                    del pagamento (gestiti da Stripe: il sito non vede né conserva i dati della carta). Finalità: gestire
                    la prenotazione, il pagamento, le comunicazioni sul soggiorno ed eventuali rimborsi. Base giuridica:
                    esecuzione del contratto (art. 6.1.b GDPR) e obblighi di legge, ad es. fiscali (art. 6.1.c).
                </li>
                <li>
                    <strong>Richieste dal modulo contatti</strong>: nome, email, telefono (facoltativo) e testo del
                    messaggio. Finalità: rispondere alla richiesta. Base giuridica: misure precontrattuali richieste
                    dall'interessato (art. 6.1.b).
                </li>
                <li>
                    <strong>Newsletter e offerte</strong>: email e nome, solo se hai spuntato la casella facoltativa.
                    Base giuridica: consenso (art. 6.1.a), revocabile in qualsiasi momento con il link di
                    disiscrizione presente in ogni email o scrivendo all'indirizzo sopra indicato.
                </li>
                <li>
                    <strong>Dati tecnici</strong>: indirizzo IP e dati di navigazione registrati nei log del server per
                    sicurezza e prevenzione degli abusi. Base giuridica: legittimo interesse (art. 6.1.f).
                </li>
            </ul>
            <p>
                I dati degli ospiti richiesti dalla legge al momento dell'arrivo (documento d'identità per la
                comunicazione alla Questura tramite "Alloggiati Web", dati statistici ISTAT) sono raccolti in loco e non
                tramite questo sito.
            </p>

            <h2>3. Conferimento dei dati</h2>
            <p>
                I dati contrassegnati come obbligatori sono necessari per prenotare o ricevere risposta: senza di essi
                non è possibile dare seguito alla richiesta. L'iscrizione alla newsletter è facoltativa.
            </p>

            <h2>4. A chi comunichiamo i dati (responsabili del trattamento)</h2>
            <p>I dati sono trattati dal titolare e, per conto suo, dai seguenti fornitori tecnici:</p>
            <ul>
                <li><strong>Railway Corp.</strong>: hosting del sito e del database.</li>
                <li><strong>Stripe Payments Europe Ltd.</strong>: pagamenti online.</li>
                <li><strong>Resend (Plus Five Five, Inc.)</strong>: invio delle email transazionali e della newsletter.</li>
                <li><strong>Cloudinary Ltd.</strong>: archiviazione e distribuzione delle foto del sito.</li>
                <li>
                    <strong>OpenStreetMap Foundation</strong>: solo se scegli di caricare la mappa nella pagina
                    principale, il tuo indirizzo IP viene trasmesso a OpenStreetMap per mostrare la mappa.
                </li>
            </ul>
            <p>
                Alcuni fornitori hanno sede o server negli Stati Uniti. In tali casi il trasferimento avviene sulla base
                della decisione di adeguatezza UE-USA ("Data Privacy Framework") per i fornitori certificati, oppure
                delle Clausole Contrattuali Standard approvate dalla Commissione europea (art. 46 GDPR).
                I dati possono inoltre essere comunicati a consulenti fiscali e ad autorità, quando richiesto dalla
                legge. I dati non sono venduti né diffusi.
            </p>

            <h2>5. Per quanto tempo conserviamo i dati</h2>
            <ul>
                <li>Prenotazioni e documenti contabili: 10 anni, come previsto dalla normativa civilistica e fiscale.</li>
                <li>Richieste dal modulo contatti: fino a 24 mesi dall'ultimo scambio, salvo che diano origine a una prenotazione.</li>
                <li>Newsletter: fino alla revoca del consenso.</li>
                <li>Log tecnici del server: per il periodo strettamente necessario alla sicurezza, di norma non oltre 30 giorni.</li>
            </ul>

            <h2>6. I tuoi diritti</h2>
            <p>
                Puoi chiedere in ogni momento l'accesso ai tuoi dati, la rettifica, la cancellazione, la limitazione
                del trattamento, la portabilità e opporti al trattamento basato sul legittimo interesse (artt. 15-22
                GDPR), scrivendo a <Field value={i.email} />. Puoi revocare il consenso alla newsletter senza
                pregiudicare la liceità del trattamento precedente. Hai inoltre il diritto di proporre reclamo al
                Garante per la protezione dei dati personali (www.garanteprivacy.it).
            </p>

            <h2>7. Processi decisionali automatizzati</h2>
            <p>Non vengono effettuati processi decisionali automatizzati né profilazione.</p>

            <h2>8. Cookie</h2>
            <p>
                Il sito non usa cookie di profilazione né strumenti di analisi o pubblicità. Per i dettagli vedi la{" "}
                <Link to="/cookie">Cookie policy</Link>.
            </p>
        </LegalLayout>
    );
}
