import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Input } from "../../components/ui/input";
import { api } from "../../lib/api";
import { logoUrl } from "../../lib/brand";
import { deviceId } from "../../lib/push";

export default function AdminLogin() {
    // nessuna email precompilata: non va mostrata a chi apre la pagina (la ricorda il browser)
    const [email, setEmail] = useState("");
    const [logoVersion, setLogoVersion] = useState(null);
    useEffect(() => { api.get("/villa/info").then((r) => setLogoVersion(r.data.logo_version || "default")).catch(() => setLogoVersion("default")); }, []);
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const nav = useNavigate();

    const submit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const r = await api.post("/admin/login", { email, password, device_id: deviceId() });
            localStorage.setItem("lv_admin_token", r.data.token);
            localStorage.setItem("lv_admin_email", r.data.email);
            toast.success("Accesso effettuato");
            nav("/admin");
        } catch (e) {
            const d = e?.response?.data?.detail;
            toast.error(typeof d === "string" ? d : "Credenziali non valide");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-lake-cream grid place-items-center p-6">
            <form onSubmit={submit} className="w-full max-w-sm bg-white border border-lake-border rounded-sm p-8 sm:p-10" data-testid="admin-login-form">
                <div className="h-16 mb-6">{logoVersion && <img src={logoUrl(logoVersion, 192)} alt="Light Blue" width="64" height="64" className="w-16 h-16 rounded-full" />}</div>
                <p className="overline">Area riservata</p>
                <h1 className="font-display text-3xl text-lake-ink mt-2">Accedi</h1>
                <div className="mt-8 space-y-3">
                    <Input data-testid="admin-email" type="email" autoComplete="username" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    <Input data-testid="admin-password" type="password" autoComplete="current-password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <button type="submit" disabled={loading} data-testid="admin-login-btn" className="mt-6 w-full py-3 rounded-sm bg-lake-blue text-white text-sm hover:bg-[#678099] disabled:opacity-50">
                    {loading ? "Attendi..." : "Accedi"}
                </button>
            </form>
        </div>
    );
}
