import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";

export const Route = createFileRoute("/admin/analytics")({
  head: () => ({ meta: [{ title: "Analytics — Suzy Wood Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: AdminAnalytics,
});

type Order = { id: string; total: number; status: string; created_at: string };
type Item = { product_name: string; line_total: number; order_id: string };
type Booking = { status: string; created_at: string };

const RANGES = [
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
  { label: "1 year", value: 365 },
] as const;

const COLORS = ["hsl(var(--primary))", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899"];

function AdminAnalytics() {
  const [days, setDays] = useState<number>(30);
  const [orders, setOrders] = useState<Order[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    (async () => {
      const since = new Date(Date.now() - days * 86400000).toISOString();
      const [ordersRes, bookingsRes] = await Promise.all([
        supabase.from("orders").select("id,total,status,created_at").gte("created_at", since),
        supabase.from("bookings").select("status,created_at").gte("created_at", since),
      ]);
      const ords = (ordersRes.data ?? []) as Order[];
      setOrders(ords);
      setBookings((bookingsRes.data ?? []) as Booking[]);
      if (ords.length) {
        const ids = ords.map((o) => o.id);
        const { data: itemsData } = await supabase
          .from("order_items")
          .select("product_name,line_total,order_id")
          .in("order_id", ids);
        setItems((itemsData ?? []) as Item[]);
      } else {
        setItems([]);
      }
      setLoading(false);
    })();
  }, [days]);

  const revenueByDay = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      map.set(d, 0);
    }
    for (const o of orders) {
      if (o.status === "cancelled") continue;
      const d = o.created_at.slice(0, 10);
      if (map.has(d)) map.set(d, (map.get(d) ?? 0) + Number(o.total));
    }
    return Array.from(map.entries()).map(([date, revenue]) => ({
      date: new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      revenue,
    }));
  }, [orders, days]);

  const statusBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of orders) map.set(o.status, (map.get(o.status) ?? 0) + 1);
    return Array.from(map.entries()).map(([name, value]) => ({
      name: name.replace(/_/g, " "),
      value,
    }));
  }, [orders]);

  const topProducts = useMemo(() => {
    const map = new Map<string, number>();
    for (const it of items) {
      map.set(it.product_name, (map.get(it.product_name) ?? 0) + Number(it.line_total));
    }
    return Array.from(map.entries())
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [items]);

  const bookingFunnel = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of bookings) map.set(b.status, (map.get(b.status) ?? 0) + 1);
    return [
      { stage: "New", count: map.get("new") ?? 0 },
      { stage: "Contacted", count: map.get("contacted") ?? 0 },
      { stage: "Done", count: map.get("done") ?? 0 },
    ];
  }, [bookings]);

  const totalRevenue = orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + Number(o.total), 0);
  const aov = orders.length ? totalRevenue / orders.length : 0;
  const conversion = bookings.length ? (orders.length / bookings.length) * 100 : 0;

  const kpis = [
    { label: "Revenue (EGP)", value: totalRevenue.toLocaleString() },
    { label: "Orders", value: orders.length },
    { label: "Avg Order Value", value: `EGP ${Math.round(aov).toLocaleString()}` },
    { label: "Bookings → Orders", value: `${conversion.toFixed(0)}%` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-serif text-3xl">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">Sales performance over time.</p>
        </div>
        <div className="flex gap-1 rounded-lg border p-1 bg-background">
          {RANGES.map((r) => (
            <Button
              key={r.value}
              size="sm"
              variant={days === r.value ? "default" : "ghost"}
              onClick={() => setDays(r.value)}
            >
              {r.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="bg-background border rounded-xl p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{k.label}</p>
            {loading ? <Skeleton className="h-8 w-24 mt-2" /> : <p className="font-serif text-2xl mt-1">{k.value}</p>}
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Revenue Over Time" loading={loading}>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={revenueByDay}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => `EGP ${v.toLocaleString()}`} />
              <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Orders by Status" loading={loading}>
          {statusBreakdown.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={statusBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {statusBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Top 5 Products by Revenue" loading={loading}>
          {topProducts.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={topProducts} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                <Tooltip formatter={(v: number) => `EGP ${v.toLocaleString()}`} />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Bookings Funnel" loading={loading}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={bookingFunnel}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({ title, loading, children }: { title: string; loading: boolean; children: React.ReactNode }) {
  return (
    <div className="bg-background border rounded-xl p-5">
      <h3 className="font-serif text-lg mb-3">{title}</h3>
      {loading ? <Skeleton className="h-[260px] w-full" /> : children}
    </div>
  );
}

function EmptyChart() {
  return <div className="h-[260px] flex items-center justify-center text-sm text-muted-foreground">No data for this range</div>;
}