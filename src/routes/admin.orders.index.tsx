import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Search, Plus, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsAdmin } from "@/lib/admin";
import { ManualOrderModal } from "@/components/admin/ManualOrderModal";

type Order = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  status: string;
  total: number;
  created_at: string;
  is_manual_order?: boolean | null;
};

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "pending_payment", label: "Pending Payment" },
  { value: "confirmed", label: "Payment Confirmed" },
  { value: "shipped", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered & Completed" },
  { value: "cancelled", label: "Cancelled" },
] as const;

const STATUS_LABELS: Record<string, string> = {
  pending_payment: "Pending Payment",
  confirmed: "Payment Confirmed",
  in_production: "Payment Confirmed",
  shipped: "Out for Delivery",
  delivered: "Delivered & Completed",
  cancelled: "Cancelled",
};

const statusColor: Record<string, string> = {
  pending_payment: "bg-amber-100 text-amber-800 border-amber-200",
  confirmed: "bg-blue-100 text-blue-800 border-blue-200",
  in_production: "bg-indigo-100 text-indigo-800 border-indigo-200",
  shipped: "bg-purple-100 text-purple-800 border-purple-200",
  delivered: "bg-emerald-100 text-emerald-800 border-emerald-200",
  cancelled: "bg-rose-100 text-rose-800 border-rose-200",
};

export const Route = createFileRoute("/admin/orders/")({
  component: OrdersPage,
});

function OrdersPage() {
  const { isCarpenter, isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [showManual, setShowManual] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, customer_name, customer_email, status, total, created_at, is_manual_order")
        .order("created_at", { ascending: false });
      if (error) toast.error(error.message);
      setOrders((data ?? []) as Order[]);
      setLoading(false);
    })();
  }, []);

  // Realtime: sync new orders and status changes instantly
  useEffect(() => {
    const channel = supabase
      .channel("admin-orders")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload) => {
          const n = payload.new as Order;
          setOrders((prev) => (prev.some((o) => o.id === n.id) ? prev : [n, ...prev]));
          toast.success(`New order ${n.order_number}`);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        (payload) => {
          const n = payload.new as Order;
          setOrders((prev) => prev.map((o) => (o.id === n.id ? { ...o, ...n } : o)));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const fromTs = fromDate ? new Date(fromDate + "T00:00:00").getTime() : null;
    const toTs = toDate ? new Date(toDate + "T23:59:59").getTime() : null;
    return orders.filter((o) => {
      if (statusFilter !== "all") {
        if (statusFilter === "confirmed" && !["confirmed", "in_production"].includes(o.status)) return false;
        if (statusFilter !== "confirmed" && o.status !== statusFilter) return false;
      }
      const ts = new Date(o.created_at).getTime();
      if (fromTs && ts < fromTs) return false;
      if (toTs && ts > toTs) return false;
      if (q && !(
        o.order_number.toLowerCase().includes(q) ||
        o.customer_name.toLowerCase().includes(q) ||
        o.customer_email.toLowerCase().includes(q)
      )) return false;
      return true;
    });
  }, [orders, search, statusFilter, fromDate, toDate]);

  return (
    <div>
      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="font-serif text-3xl mb-2">Orders</h1>
          <p className="text-sm text-muted-foreground">Manage all customer orders.</p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setShowManual(true)}
            className="inline-flex items-center gap-2 rounded-md bg-emerald-600 text-white text-sm font-medium px-4 py-2 hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" /> Add WhatsApp Order
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
              statusFilter === f.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background hover:bg-muted border-border"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 mb-6 items-end">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order ID, name or email…"
            className="pl-9"
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">From</label>
          <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-40" />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">To</label>
          <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-40" />
        </div>
        {(fromDate || toDate) && (
          <button
            onClick={() => { setFromDate(""); setToDate(""); }}
            className="text-xs text-muted-foreground underline px-2 py-2"
          >
            Clear dates
          </button>
        )}
      </div>

      <div className="bg-background border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Order</th>
                <th className="text-left px-4 py-3">Customer</th>
                <th className="text-left px-4 py-3">Date</th>
                {!isCarpenter && <th className="text-right px-4 py-3">Total</th>}
                <th className="text-left px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading && Array.from({ length: 5 }).map((_, i) => (
                <tr key={`sk-${i}`} className="border-t">
                  <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-40 mt-1" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                  {!isCarpenter && <td className="px-4 py-3"><Skeleton className="h-4 w-16 ml-auto" /></td>}
                  <td className="px-4 py-3"><Skeleton className="h-6 w-24" /></td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={isCarpenter ? 4 : 5} className="px-4 py-12 text-center text-muted-foreground">No orders found.</td></tr>
              )}
              {filtered.map((o) => (
                <tr
                  key={o.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate({ to: "/admin/orders/$id", params: { id: o.id } })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      navigate({ to: "/admin/orders/$id", params: { id: o.id } });
                    }
                  }}
                  className="border-t hover:bg-muted/40 cursor-pointer focus:outline-none focus:bg-muted/40"
                >
                  <td className="px-4 py-3 font-mono text-xs">{o.order_number}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span>{o.customer_name}</span>
                      {o.is_manual_order && (
                        <span className="inline-flex items-center gap-1 text-[10px] rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5">
                          <MessageCircle className="h-3 w-3" /> WhatsApp
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">{o.customer_email}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(o.created_at).toLocaleDateString("en-GB")}
                  </td>
                  {!isCarpenter && (
                    <td className="px-4 py-3 text-right font-medium">
                      EGP {Number(o.total).toLocaleString()}
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <span className={`text-xs rounded-md border px-2 py-1 inline-block ${statusColor[o.status] ?? ""}`}>
                      {STATUS_LABELS[o.status] ?? o.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showManual && (
        <ManualOrderModal
          onClose={() => setShowManual(false)}
          onCreated={(o) => {
            setShowManual(false);
            navigate({ to: "/admin/orders/$id", params: { id: o.id } });
          }}
        />
      )}
    </div>
  );
}

