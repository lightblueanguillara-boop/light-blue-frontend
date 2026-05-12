import { Link } from "react-router-dom";
import { XCircle } from "lucide-react";
import Header from "../components/site/Header";
import Footer from "../components/site/Footer";

export default function PaymentCancel() {
    return (
        <div className="bg-lake-cream min-h-screen flex flex-col">
            <Header />
            <section className="flex-1 grid place-items-center px-6 py-24" data-testid="payment-cancel-page">
                <div className="max-w-lg w-full bg-white border border-lake-border p-12 rounded-sm text-center">
                    <XCircle className="w-12 h-12 text-lake-ink/70 mx-auto" strokeWidth={1.2} />
                    <h1 className="font-display text-3xl text-lake-ink mt-6">Pagamento annullato</h1>
                    <p className="mt-3 text-lake-ink/70">Nessun addebito è stato effettuato. Puoi riprovare quando vuoi.</p>
                    <Link to="/book" className="mt-8 inline-block px-6 py-3 rounded-sm bg-lake-blue text-white text-sm" data-testid="cancel-retry-btn">Riprova</Link>
                </div>
            </section>
            <Footer />
        </div>
    );
}
