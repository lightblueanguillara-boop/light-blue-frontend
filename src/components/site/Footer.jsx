import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";

export default function Footer() {
    const [info, setInfo] = useState(null);
    useEffect(() => {
        api.get("/villa/info").then((r) => setInfo(r.data)).catch(() => {});
    }, []);
    return (
        <footer className="bg-lake-ink text-lake-cream mt-32">
            <div className="mx-auto max-w-7xl px-6 sm:px-10 py-20">
                <div className="grid md:grid-cols-3 gap-12 mb-16">
                    <div>
                        <p className="overline text-lake-sand">Contatti</p>
                        <div className="mt-4 space-y-1 text-sm text-white/80">
                            <p data-testid="footer-address">{info?.address}</p>
                            <p data-testid="footer-phone">{info?.phone}</p>
                            <p data-testid="footer-email">{info?.email}</p>
                        </div>
                    </div>
                    <div>
                        <p className="overline text-lake-sand">Naviga</p>
                        <ul className="mt-4 space-y-2 text-sm text-white/80">
                            <li><a href="/#about">La Casa</a></li>
                            <li><a href="/#gallery">Galleria</a></li>
                            <li><a href="/#services">Servizi</a></li>
                            <li><a href="/book">Prenota</a></li>
                        </ul>
                    </div>
                    <div>
                        <p className="overline text-lake-sand">Area riservata</p>
                        <a href="/admin/login" className="mt-4 inline-block text-sm text-white/80 underline underline-offset-4" data-testid="footer-admin-link">
                            Accesso proprietario
                        </a>
                    </div>
                </div>
                <div className="font-display text-4xl md:text-6xl tracking-tighter text-white/95 border-t border-white/10 pt-10">
                    {info?.name || "Light Blue"}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-white/50">
                    {info?.cir && <p data-testid="footer-cir">CIN · {info.cir}</p>}
                    {info?.legal_owner_name && <p>{info.legal_owner_name}{info?.legal_owner_tax_id ? ` · ${info.legal_owner_tax_id}` : ""}</p>}
                    {info?.lake && <p>{info.lake}</p>}
                    <p>© {new Date().getFullYear()} · Tutti i diritti riservati</p>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-white/50">
                    <Link to="/privacy" className="underline underline-offset-4 hover:text-white">Informativa privacy</Link>
                    <Link to="/cookie" className="underline underline-offset-4 hover:text-white">Cookie policy</Link>
                    <Link to="/condizioni" className="underline underline-offset-4 hover:text-white">Condizioni di prenotazione</Link>
                </div>
                <p className="mt-6 text-[11px] text-white/35">
                    Foto di copertina: "Anguillara Sabazia dal lago" di Albarubescens,{" "}
                    <a href="https://commons.wikimedia.org/wiki/File:Anguillara_Sabazia_dal_lago_(1).jpg" target="_blank" rel="noopener noreferrer" className="underline">Wikimedia Commons</a>,{" "}
                    <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.it" target="_blank" rel="noopener noreferrer" className="underline">CC BY-SA 4.0</a>.
                </p>
            </div>
        </footer>
    );
}
