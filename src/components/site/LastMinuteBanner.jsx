import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, ArrowRight } from "lucide-react";
import { api } from "../../lib/api";
import { fmtItDate } from "../../lib/date";

export default function LastMinuteBanner() {
    const [data, setData] = useState(null);
    useEffect(() => { api.get("/villa/last-minute").then((r) => setData(r.data)).catch(() => {}); }, []);
    if (!data?.enabled || !data.ranges?.length) return null;
    return (
        <section className="bg-lake-sand/40 border-y border-lake-border" data-testid="last-minute-banner">
            <div className="mx-auto max-w-7xl px-6 sm:px-10 py-10 grid md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-5">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-lake-blue" strokeWidth={1.8} />
                        <p className="overline">Last Minute · -{data.discount_percent}%</p>
                    </div>
                    <h3 className="font-display text-2xl text-lake-ink mt-2">{data.title}</h3>
                    <p className="text-sm text-lake-ink/65 mt-1">{data.subtitle}</p>
                </div>
                <div className="md:col-span-5 flex flex-wrap gap-2">
                    {data.ranges.slice(0, 4).map((r, i) => (
                        <Link
                            key={i}
                            to={`/book?from=${r.check_in}&to=${r.check_out}`}
                            data-testid={`last-minute-range-${i}`}
                            className="px-4 py-2.5 bg-white border border-lake-border rounded-sm hover:border-lake-blue hover:-translate-y-0.5 transition-all text-sm"
                        >
                            <span className="text-lake-ink font-medium">{fmtItDate(r.check_in)} → {fmtItDate(r.check_out)}</span>
                            <span className="text-lake-ink/50 ml-2 text-xs">{r.nights} notti</span>
                        </Link>
                    ))}
                </div>
                <div className="md:col-span-2 md:text-right">
                    <Link
                        to="/book"
                        data-testid="last-minute-cta"
                        className="inline-flex items-center gap-2 px-5 py-3 bg-lake-blue text-white text-sm rounded-sm hover:bg-[#678099] transition-colors"
                    >
                        Prenota <ArrowRight size={14} />
                    </Link>
                </div>
            </div>
        </section>
    );
}
