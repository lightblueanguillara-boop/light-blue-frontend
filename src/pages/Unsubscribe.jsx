import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Header from "../components/site/Header";
import Footer from "../components/site/Footer";
import { api } from "../lib/api";

/** Disiscrizione dalla newsletter tramite il link presente in ogni email marketing. */
export default function Unsubscribe() {
    const [params] = useSearchParams();
    const token = params.get("token");
    const [state, setState] = useState(token ? "ask" : "invalid");

    const confirm = async () => {
        setState("loading");
        try {
            await api.post("/newsletter/unsubscribe", { token });
            setState("done");
        } catch {
            setState("invalid");
        }
    };

    return (
        <div className="bg-lake-cream min-h-screen flex flex-col">
            <Header />
            <section className="flex-1 grid place-items-center px-6 py-24">
                <div className="max-w-lg w-full bg-white border border-lake-border p-12 rounded-sm text-center space-y-5">
                    <h1 className="font-display text-3xl text-lake-ink">Disiscrizione newsletter</h1>
                    {state === "ask" && (
                        <>
                            <p className="text-lake-ink/70">Confermi di non voler più ricevere offerte e novità via email?</p>
                            <button onClick={confirm} data-testid="unsubscribe-confirm" className="px-6 py-3 rounded-sm bg-lake-blue text-white text-sm">Conferma disiscrizione</button>
                        </>
                    )}
                    {state === "loading" && <p className="text-lake-ink/70">Attendere...</p>}
                    {state === "done" && <p className="text-lake-ink/70" data-testid="unsubscribe-done">Fatto: il tuo indirizzo è stato rimosso dalla lista. Non riceverai più email promozionali.</p>}
                    {state === "invalid" && <p className="text-lake-ink/70">Link non valido o scaduto. Per disiscriverti scrivici e provvederemo subito.</p>}
                    <Link to="/" className="inline-block text-sm text-lake-blue underline">Torna alla home</Link>
                </div>
            </section>
            <Footer />
        </div>
    );
}
