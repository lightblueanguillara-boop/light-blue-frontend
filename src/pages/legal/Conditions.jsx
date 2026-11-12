import { Link } from "react-router-dom";
import LegalLayout, { Field, useVillaInfo } from "./LegalLayout";

export default function Conditions() {
    const i = useVillaInfo() || {};
    return (
        <LegalLayout title="Condizioni di prenotazione" updated="12-11-2026">
            <p>
                Le presenti condizioni regolano le prenotazioni effettuate tramite questo sito per l'alloggio{" "}
                <strong>{i.name || "Light Blue - Anguillara Sabazia"}</strong>, situato in <Field value={i.address} />,
                identificato dal Codice Identificativo Nazionale (CIN) <Field value={i.cir} />.
            </p>

            <h2>1. Gestore</h2>
            <p>
                <Field value={i.legal_owner_name} /> — C.F./P. IVA <Field value={i.legal_owner_tax_id} /> —{" "}
                <Field value={i.legal_owner_address} /> — email <Field value={i.email} />
                {i.phone ? <> — tel. {i.phone}</> : null}.
            </p>

            <h2>2. Prenotazione e prezzo</h2>
            <ul>
                <li>
                    Il prezzo mostrato prima del pagamento è il prezzo totale del soggiorno per le date e il numero di
                    ospiti indicati, comprensivo di tutti i costi obbligatori, salvo l'eventuale imposta di soggiorno
                    indicata al punto 4.
                </li>
                <li>
                    La prenotazione è confermata quando il pagamento va a buon fine; riceverai una email di conferma con
                    il riepilogo del soggiorno.
                </li>
                <li>Il pagamento avviene con carta tramite Stripe. Il sito non conserva i dati della carta.</li>
            </ul>

            <h2>3. Tariffe e cancellazione</h2>
            <ul>
                <li>
                    <strong>Tariffa Rimborsabile</strong>: cancellazione gratuita con rimborso del 100% dell'importo
                    pagato se la disdetta arriva almeno 10 giorni prima della data di arrivo. Per disdette successive o
                    in caso di mancata presentazione non è previsto alcun rimborso.
                </li>
                <li>
                    <strong>Tariffa Non Rimborsabile</strong>: prezzo scontato; in caso di cancellazione, modifica o
                    mancata presentazione l'importo pagato non è rimborsabile.
                </li>
                <li>
                    Per disdire scrivi a <Field value={i.email} /> indicando nome e date della prenotazione. I rimborsi
                    dovuti vengono effettuati sullo stesso metodo di pagamento.
                </li>
                <li>
                    Trattandosi di un servizio di alloggio con data determinata, non si applica il diritto di recesso di
                    14 giorni previsto per i contratti a distanza (art. 59, comma 1, lett. n, D.Lgs. 206/2005 - Codice
                    del Consumo). Restano valide le condizioni di cancellazione della tariffa scelta.
                </li>
            </ul>

            <h2>4. Imposta di soggiorno</h2>
            <p>
                {i.tourist_tax_note
                    ? i.tourist_tax_note
                    : "Non è prevista un'imposta di soggiorno aggiuntiva rispetto al prezzo indicato."}
            </p>

            <h2>5. Arrivo e soggiorno</h2>
            <ul>
                <li>
                    All'arrivo è obbligatorio presentare un documento d'identità valido per ogni ospite: per legge il
                    gestore deve comunicare le generalità degli ospiti alla Questura (art. 109 T.U.L.P.S.).
                </li>
                <li>Il numero di ospiti non può superare quello indicato nella prenotazione.</li>
                <li>Gli orari di arrivo e partenza vengono concordati con il gestore dopo la prenotazione.</li>
            </ul>

            <h2>6. Reclami e foro competente</h2>
            <p>
                Per qualsiasi reclamo scrivi a <Field value={i.email} />: risponderemo il prima possibile. Per le
                controversie con i consumatori è competente il giudice del luogo di residenza o domicilio del
                consumatore, come previsto dal Codice del Consumo.
            </p>

            <h2>7. Privacy</h2>
            <p>
                I dati forniti con la prenotazione sono trattati come descritto nell'
                <Link to="/privacy">Informativa privacy</Link>.
            </p>
        </LegalLayout>
    );
}
