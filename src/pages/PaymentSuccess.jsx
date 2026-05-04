import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import Header from "../components/site/Header";
import Footer from "../components/site/Footer";
import { api } from "../lib/api";

export default function PaymentSuccess() {
    const [params] = useSearchParams();
    const sessionId = params.get("session_id");
    const [status, setStatus] = useState("checking");
    const [attempts, setAttempts] = useState(0);

    useEffect(() => {
        if (!sessionId) { setStatus("error"); return; }
        let cancelled = false;
        const poll = async (n) => {
            if (n >= 8 || cancelled) { if (!cancelled) setStatus("timeout"); return; }
            try {
                const r = await api.get(`/payments/status/${sessionId}`);
                if (r.data.payment_status === "paid") { setStatus("paid"); return; }
                if (r.data.status === "expired") { setStatus("expired"); return; }
            } catch {}
            setAttempts(n + 1);
            setTimeout(() => poll(n + 1), 2000);
        };
        poll(0);
        return () => { cancelled = true; };
    }, [sessionId]);

    return (
        <div className="bg-lake-cream min-h-screen flex flex-col">
            <Header />
            <section className="flex-1 grid place-items-center px-6 py-24" data-testid="payment-success-page">
                <div className="max-w-lg w-full bg-white border border-lake-border p-12 rounded-sm text-center">
                    {status === "checking" && (
                        <><Loader2 className="w-10 h-10 text-lake-blue animate-spin mx-auto" /><p className="mt-4 text-lake-ink/70">Verifica pagamento in corso... (tentativo {attempts + 1})</p></>
                    )}
                    {status === "paid" && (
                        <>
                            <CheckCircle2 className="w-12 h-12 text-lake-blue mx-auto" strokeWidth={1.2} />
                            <h1 className="font-display text-3xl text-lake-ink mt-6">Prenotazione confermata</h1>
                            <p className="mt-3 text-lake-ink/70">Grazie! Riceverai a breve un'email di conferma con tutti i dettagli.</p>
                            <Link to="/" className="mt-8 inline-block px-6 py-3 rounded-sm bg-lake-blue text-white text-sm" data-testid="success-home-btn">Torna alla home</Link>
                        </>
                    )}
                    {(status === "expired" || status === "timeout" || status === "error") && (
                        <>
                            <XCircle className="w-12 h-12 text-red-500 mx-auto" strokeWidth={1.2} />
                            <h1 className="font-display text-3xl text-lake-ink mt-6">Pagamento non verificato</h1>
                            <p className="mt-3 text-lake-ink/70">Ti contatteremo a breve. Se l'addebito è avvenuto riceverai comunque conferma via email.</p>
                            <Link to="/book" className="mt-8 inline-block px-6 py-3 rounded-sm bg-lake-blue text-white text-sm">Torna alla prenotazione</Link>
                        </>
                    )}
                </div>
            </section>
            <Footer />
        </div>
    );
}
