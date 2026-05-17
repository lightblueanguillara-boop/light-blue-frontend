import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";

export default function Header() {
    const [info, setInfo] = useState(null);
    useEffect(() => { api.get("/villa/info").then((r) => setInfo(r.data)).catch(() => {}); }, []);
    const locality = info?.name?.includes('-') ? info.name.split('-')[1]?.trim() : 'Anguillara Sabazia';
    return (
        <header className="glass-header sticky top-0 z-50" data-testid="public-header">
            <div className="mx-auto max-w-7xl px-6 sm:px-10 py-5 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-3" data-testid="logo-link">
                    <div className="w-9 h-9 rounded-sm bg-lake-blue/10 border border-lake-blue/40 grid place-items-center overflow-hidden p-1.5">
                        <img src="/favicon.ico" alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    <div className="leading-tight">
                        <p className="font-display text-lg tracking-tight text-lake-ink">Light Blue</p>
                        <p className="overline mt-0.5">{locality} · Lago di Bracciano</p>
                    </div>
                </Link>
                <nav className="hidden md:flex items-center gap-10 text-sm text-lake-ink/80">
                    <a href="/#about" className="nav-link" data-testid="nav-about">La Casa</a>
                    <a href="/#gallery" className="nav-link" data-testid="nav-gallery">Galleria</a>
                    <a href="/#services" className="nav-link" data-testid="nav-services">Servizi</a>
                    <a href="/#map" className="nav-link" data-testid="nav-map">Dove siamo</a>
                    <a href="/#contact" className="nav-link" data-testid="nav-contact">Contatti</a>
                </nav>
                <Link
                    to="/book"
                    data-testid="header-book-btn"
                    className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-sm bg-lake-blue text-white text-sm hover:bg-[#678099] transition-colors"
                >
                    Prenota ora
                </Link>
            </div>
        </header>
    );
}
