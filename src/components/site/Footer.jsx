import { useEffect, useState } from "react";
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
                    {info?.cir && <p data-testid="footer-cir">CIR · {info.cir}</p>}
                    {info?.lake && <p>{info.lake}</p>}
                    <p>© {new Date().getFullYear()} · Tutti i diritti riservati</p>
                </div>
            </div>
        </footer>
    );
}
