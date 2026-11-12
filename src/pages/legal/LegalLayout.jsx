import { useEffect, useState } from "react";
import Header from "../../components/site/Header";
import Footer from "../../components/site/Footer";
import { api } from "../../lib/api";

/** Carica i dati pubblici della struttura (nome, titolare, CIN...) per le pagine legali. */
export function useVillaInfo() {
    const [info, setInfo] = useState(null);
    useEffect(() => {
        api.get("/villa/info").then((r) => setInfo(r.data)).catch(() => setInfo({}));
    }, []);
    return info;
}

/** Mostra il valore oppure un segnaposto ben visibile se il dato non è ancora stato inserito dall'admin. */
export function Field({ value }) {
    if (value) return <>{value}</>;
    return <span className="bg-amber-100 text-amber-900 px-1 rounded-sm">[da completare]</span>;
}

export default function LegalLayout({ title, updated, children }) {
    useEffect(() => { window.scrollTo(0, 0); }, []);
    return (
        <div className="bg-lake-cream min-h-screen flex flex-col">
            <Header />
            <main className="flex-1 mx-auto max-w-3xl w-full px-6 sm:px-10 py-16">
                <p className="overline text-lake-blue">Informazioni legali</p>
                <h1 className="font-display text-4xl text-lake-ink mt-3 font-light">{title}</h1>
                {updated && <p className="text-xs text-lake-ink/50 mt-2">Ultimo aggiornamento: {updated}</p>}
                <div className="legal-content mt-10 space-y-6 text-sm leading-relaxed text-lake-ink/85">{children}</div>
            </main>
            <Footer />
        </div>
    );
}
