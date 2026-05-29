import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingBag, Package, DollarSign, Clock, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsAdmin } from "@/lib/admin";
import { LowStockBanner } from "@/components/admin/LowStockBanner";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

const PROFIT_MARGIN = 0.25;

type Stats = { orders: number; pending: number; products: number; revenue: number };

function Dashboard() {
  const { isCarpenter, loading: roleLoading } = useIsAdmin();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({ orders: 0, pending: 0, products: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roleLoading && isCarpenter) {
      navigate({ to: "/admin/orders", replace: true });
      return;
    }
  }, [isCarpenter, roleLoading, navigate]);

  useEffect(() => {
    if (roleLoading || isCarpenter) return;
    (async () => {
      const [ordersRes, pendingRes, productsRes, revenueRes] = await Promise.all([
        supabase.from("orders").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending_payment"),
        supabase.from("products").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("orders").select("total").eq("status", "delivered"),
      ]);
      const revenue = (revenueRes.data ?? []).reduce((s, r: { total: number }) => s + Number(r.total), 0);
      setStats({
        orders: ordersRes.count ?? 0,
        pending: pendingRes.count ?? 0,
        products: productsRes.count ?? 0,
        revenue,
      });
      setLoading(false);
    })();
  }, [roleLoading, isCarpenter]);

  if (isCarpenter) return null;

  const profit = Math.round(stats.revenue * PROFIT_MARGIN);
  const cost = Math.round(stats.revenue * (1 - PROFIT_MARGIN));

  const cards = [
    { label: "Total Orders", value: stats.orders, icon: ShoppingBag, color: "text-blue-600 bg-blue-50" },
    { label: "Total Revenue (EGP)", value: stats.revenue.toLocaleString(), icon: DollarSign, color: "text-purple-600 bg-purple-50" },
    { label: "Profit 25% (EGP)", value: profit.toLocaleString(), icon: TrendingUp, color: "text-green-600 bg-green-50" },
    { label: "Cost 75% (EGP)", value: cost.toLocaleString(), icon: DollarSign, color: "text-slate-600 bg-slate-50" },
    { label: "Total Products", value: stats.products, icon: Package, color: "text-emerald-600 bg-emerald-50" },
    { label: "Pending Orders", value: stats.pending, icon: Clock, color: "text-amber-600 bg-amber-50" },
  ];

  return (
    <div>
      <h1 className="font-serif text-3xl mb-2">Dashboard</h1>
      <p className="text-sm text-muted-foreground mb-8">Overview of your shop.</p>
      <LowStockBanner />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="bg-background border rounded-xl p-5">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${c.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mt-4">{c.label}</p>
              {loading ? (
                <Skeleton className="h-8 w-20 mt-2" />
              ) : (
                <p className="font-serif text-2xl mt-1">{c.value}</p>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <Link to="/admin/orders" className="bg-background border rounded-xl p-6 hover:shadow-card transition-shadow">
          <h3 className="font-serif text-lg">Manage Orders →</h3>
          <p className="text-sm text-muted-foreground mt-1">Update statuses, search by customer or ID.</p>
        </Link>
        <Link to="/admin/products" className="bg-background border rounded-xl p-6 hover:shadow-card transition-shadow">
          <h3 className="font-serif text-lg">Manage Products →</h3>
          <p className="text-sm text-muted-foreground mt-1">Add, edit, delete products and variants.</p>
        </Link>
      </div>
    </div>
  );
}