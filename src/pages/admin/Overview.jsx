import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { api } from "../../lib/api";

const MESI = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];

function Stat({ label, value, testid }) {
    return (
        <div className="bg-white border border-lake-border rounded-sm p-4 sm:p-6" data-testid={testid}>
            <p className="overline !text-[10px] sm:!text-xs leading-snug">{label}</p>
            <p className="font-display text-2xl sm:text-3xl text-lake-ink mt-2 sm:mt-3">{value}</p>
        </div>
    );
}

export default function AdminOverview() {
    const [data, setData] = useState(null);
    useEffect(() => {
        api.get("/admin/analytics").then((r) => {
            // etichette dei mesi in italiano (dal backend arrivano anno e mese)
            const monthly = r.data.monthly.map((m) => ({
                ...m,
                short: `${MESI[m.month - 1].slice(0, 3)} ${String(m.year).slice(2)}`,
                long: `${MESI[m.month - 1]} ${m.year}`,
            }));
            setData({ ...r.data, monthly });
        });
    }, []);
    if (!data) return <div className="p-4 sm:p-10 text-lake-ink/50 italic">Caricamento...</div>;
    return (
        <div className="p-4 sm:p-10" data-testid="admin-overview-page">
            <p className="overline">Panoramica</p>
            <h1 className="font-display text-3xl sm:text-4xl text-lake-ink mt-2">Dashboard</h1>

            {data.totals.open_requests > 0 && (
                <Link to="/admin/bookings" className="mt-8 flex items-center justify-between gap-4 bg-sky-50 border border-sky-200 rounded-sm p-5 hover:bg-sky-100 transition-colors" data-testid="open-requests-banner">
                    <span className="text-sky-900">
                        <strong>{data.totals.open_requests}</strong> {data.totals.open_requests === 1 ? "richiesta di prenotazione da valutare" : "richieste di prenotazione da valutare"}
                    </span>
                    <span className="text-sm font-semibold text-sky-700 underline">Apri le richieste →</span>
                </Link>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-6 sm:mt-10">
                <Stat label="Guadagni 12 mesi" value={`€${data.totals.revenue.toFixed(0)}`} testid="stat-revenue" />
                <Stat label="Notti prenotate" value={data.totals.nights} testid="stat-nights" />
                <Stat label="Prenotazioni confermate" value={data.totals.confirmed_bookings} testid="stat-confirmed" />
                <Stat label="Messaggi nuovi" value={data.totals.new_messages} testid="stat-messages" />
            </div>

            <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 mt-6 sm:mt-8">
                <div className="bg-white border border-lake-border rounded-sm p-4 sm:p-6" data-testid="chart-revenue">
                    <p className="overline">Guadagni mensili</p>
                    <div className="h-56 sm:h-64 mt-4 -ml-3 sm:ml-0">
                        <ResponsiveContainer>
                            <BarChart data={data.monthly}>
                                <CartesianGrid stroke="#E5E0D8" strokeDasharray="3 3" />
                                <XAxis dataKey="short" stroke="#5C6A79" fontSize={11} interval="preserveStartEnd" />
                                <YAxis stroke="#5C6A79" fontSize={11} width={40} />
                                <Tooltip labelFormatter={(_, p) => p?.[0]?.payload?.long || ""} />
                                <Bar dataKey="revenue" fill="#7A93AC" radius={[2, 2, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="bg-white border border-lake-border rounded-sm p-4 sm:p-6" data-testid="chart-occupancy">
                    <p className="overline">Occupazione (notti)</p>
                    <div className="h-56 sm:h-64 mt-4 -ml-3 sm:ml-0">
                        <ResponsiveContainer>
                            <LineChart data={data.monthly}>
                                <CartesianGrid stroke="#E5E0D8" strokeDasharray="3 3" />
                                <XAxis dataKey="short" stroke="#5C6A79" fontSize={11} interval="preserveStartEnd" />
                                <YAxis stroke="#5C6A79" fontSize={11} width={40} />
                                <Tooltip labelFormatter={(_, p) => p?.[0]?.payload?.long || ""} />
                                <Line type="monotone" dataKey="nights" stroke="#2A333C" strokeWidth={2} dot={{ r: 3, fill: '#D3C7B6' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
