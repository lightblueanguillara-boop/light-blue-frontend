import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
    LayoutDashboard,
    CalendarDays, CalendarRange,
    Inbox,
    Users,
    Mail,
    Settings,
    LogOut,
    Image,
    Menu,
    X,
} from "lucide-react";

const items = [
    { to: "/admin", label: "Panoramica", icon: LayoutDashboard, end: true, testid: "nav-overview" },
    { to: "/admin/calendar", label: "Calendario", icon: CalendarRange, testid: "nav-calendar" },
    { to: "/admin/bookings", label: "Prenotazioni", icon: CalendarDays, testid: "nav-bookings" },
    { to: "/admin/inbox", label: "Inbox", icon: Inbox, testid: "nav-inbox" },
    { to: "/admin/crm", label: "CRM", icon: Users, testid: "nav-crm" },
    { to: "/admin/marketing", label: "Marketing", icon: Mail, testid: "nav-marketing" },
    { to: "/admin/gallery", label: "Media & Galleria", icon: Image, testid: "nav-gallery" },
    { to: "/admin/settings", label: "Impostazioni", icon: Settings, testid: "nav-settings" },
];

export default function AdminLayout() {
    const nav = useNavigate();
    const location = useLocation();
    const email = localStorage.getItem("lv_admin_email");
    const [menuOpen, setMenuOpen] = useState(false);

    // su telefono il menu si chiude quando si cambia pagina
    useEffect(() => { setMenuOpen(false); }, [location.pathname]);

    const logout = () => {
        localStorage.removeItem("lv_admin_token");
        localStorage.removeItem("lv_admin_email");
        nav("/admin/login");
    };

    return (
        <div className="min-h-screen lg:flex bg-lake-cream">
            {/* barra superiore solo su schermi piccoli */}
            <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-lake-cream border-b border-lake-border">
                <Link to="/admin" className="font-display text-lg text-lake-ink">Light Blue <span className="overline ml-1">Admin</span></Link>
                <button onClick={() => setMenuOpen(true)} aria-label="Apri menu" data-testid="admin-menu-btn" className="p-2 -mr-2 text-lake-ink">
                    <Menu size={22} />
                </button>
            </header>

            {menuOpen && <div className="lg:hidden fixed inset-0 z-40 bg-black/30" onClick={() => setMenuOpen(false)} />}

            <aside
                className={`fixed lg:static inset-y-0 left-0 z-50 w-64 shrink-0 border-r border-lake-border bg-lake-cream flex flex-col
                    transition-transform duration-200 ${menuOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
                data-testid="admin-sidebar"
            >
                <div className="flex items-center justify-between border-b border-lake-border">
                    <Link to="/admin" className="px-6 py-6">
                        <p className="font-display text-xl text-lake-ink leading-none">Light Blue</p>
                        <p className="overline mt-1">Admin · Anguillara</p>
                    </Link>
                    <button onClick={() => setMenuOpen(false)} aria-label="Chiudi menu" className="lg:hidden p-4 text-lake-ink/60">
                        <X size={20} />
                    </button>
                </div>
                <nav className="flex-1 p-3 overflow-y-auto">
                    {items.map((it) => (
                        <NavLink
                            key={it.to}
                            to={it.to}
                            end={it.end}
                            data-testid={it.testid}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-2.5 my-1 rounded-sm text-sm transition-all ${
                                    isActive
                                    ? "bg-lake-blue text-white shadow-sm"
                                    : "text-lake-ink hover:bg-white"
                                }`
                            }
                        >
                            <it.icon size={16} strokeWidth={1.5} />
                            {it.label}
                        </NavLink>
                    ))}
                </nav>
                <div className="p-4 border-t border-lake-border">
                    <p className="text-xs text-lake-ink/60 truncate">{email}</p>
                    <button
                        onClick={logout}
                        data-testid="admin-logout-btn"
                        className="mt-2 flex items-center gap-2 text-sm text-lake-ink hover:text-red-500 transition-colors"
                    >
                        <LogOut size={14} /> Esci
                    </button>
                </div>
            </aside>
            <main className="flex-1 min-w-0 overflow-x-clip">
                <Outlet />
            </main>
        </div>
    );
}
