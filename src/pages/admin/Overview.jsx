import { useEffect, useState } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { api } from "../../lib/api";

function Stat({ label, value, testid }) {
    return (
        <div className="bg-white border border-lake-border rounded-sm p-6" data-testid={testid}>
            <p className="overline">{label}</p>
            <p className="font-display text-3xl text-lake-ink mt-3">{value}</p>
        </div>
    );
}

export default function AdminOverview() {
    const [data, setData] = useState(null);
    useEffect(() => { api.get("/admin/analytics").then((r) => setData(r.data)); }, []);
    if (!data) return <div className="p-10">Caricamento...</div>;
    return (
        <div className="p-10" data-testid="admin-overview-page">
            <p className="overline">Panoramica</p>
            <h1 className="font-display text-4xl text-lake-ink mt-2">Dashboard</h1>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
                <Stat label="Guadagni 12 mesi" value={`€${data.totals.revenue.toFixed(0)}`} testid="stat-revenue" />
                <Stat label="Notti prenotate" value={data.totals.nights} testid="stat-nights" />
                <Stat label="Prenotazioni confermate" value={data.totals.confirmed_bookings} testid="stat-confirmed" />
                <Stat label="Messaggi nuovi" value={data.totals.new_messages} testid="stat-messages" />
            </div>

            <div className="grid lg:grid-cols-2 gap-6 mt-8">
                <div className="bg-white border border-lake-border rounded-sm p-6" data-testid="chart-revenue">
                    <p className="overline">Guadagni mensili</p>
                    <div className="h-64 mt-4">
                        <ResponsiveContainer>
                            <BarChart data={data.monthly}>
                                <CartesianGrid stroke="#E5E0D8" strokeDasharray="3 3" />
                                <XAxis dataKey="label" stroke="#5C6A79" fontSize={11} />
                                <YAxis stroke="#5C6A79" fontSize={11} />
                                <Tooltip />
                                <Bar dataKey="revenue" fill="#7A93AC" radius={[2, 2, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="bg-white border border-lake-border rounded-sm p-6" data-testid="chart-occupancy">
                    <p className="overline">Occupazione (notti)</p>
                    <div className="h-64 mt-4">
                        <ResponsiveContainer>
                            <LineChart data={data.monthly}>
                                <CartesianGrid stroke="#E5E0D8" strokeDasharray="3 3" />
                                <XAxis dataKey="label" stroke="#5C6A79" fontSize={11} />
                                <YAxis stroke="#5C6A79" fontSize={11} />
                                <Tooltip />
                                <Line type="monotone" dataKey="nights" stroke="#2A333C" strokeWidth={2} dot={{ r: 3, fill: '#D3C7B6' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
