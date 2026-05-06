import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, CalendarDays, Inbox, Users, Mail, Settings, LogOut } from "lucide-react";

const items = [
    { to: "/admin", label: "Panoramica", icon: LayoutDashboard, end: true, testid: "nav-overview" },
    { to: "/admin/bookings", label: "Prenotazioni", icon: CalendarDays, testid: "nav-bookings" },
    { to: "/admin/inbox", label: "Inbox", icon: Inbox, testid: "nav-inbox" },
    { to: "/admin/crm", label: "CRM", icon: Users, testid: "nav-crm" },
    { to: "/admin/marketing", label: "Marketing", icon: Mail, testid: "nav-marketing" },
    { to: "/admin/settings", label: "Impostazioni", icon: Settings, testid: "nav-settings" },
];

export default function AdminLayout() {
    const nav = useNavigate();
    const email = localStorage.getItem("lv_admin_email");
    const logout = () => {
        localStorage.removeItem("lv_admin_token");
        localStorage.removeItem("lv_admin_email");
        nav("/admin/login");
    };
    return (
        <div className="min-h-screen flex bg-lake-cream">
            <aside className="w-64 border-r border-lake-border bg-lake-cream flex flex-col" data-testid="admin-sidebar">
                <Link to="/admin" className="px-6 py-6 border-b border-lake-border">
                    <p className="font-display text-xl text-lake-ink leading-none">Light Blue</p>
                    <p className="overline mt-1">Admin · Anguillara</p>
                </Link>
                <nav className="flex-1 p-3">
                    {items.map((it) => (
                        <NavLink
                            key={it.to}
                            to={it.to}
                            end={it.end}
                            data-testid={it.testid}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-2.5 my-1 rounded-sm text-sm ${isActive ? "bg-lake-blue text-white" : "text-lake-ink hover:bg-white"}`
                            }
                        >
                            <it.icon size={16} strokeWidth={1.5} />
                            {it.label}
                        </NavLink>
                    ))}
                </nav>
                <div className="p-4 border-t border-lake-border">
                    <p className="text-xs text-lake-ink/60 truncate">{email}</p>
                    <button onClick={logout} data-testid="admin-logout-btn" className="mt-2 flex items-center gap-2 text-sm text-lake-ink hover:text-red-500">
                        <LogOut size={14} /> Esci
                    </button>
                </div>
            </aside>
            <main className="flex-1 min-w-0">
                <Outlet />
            </main>
        </div>
    );
}
