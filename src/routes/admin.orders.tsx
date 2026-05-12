import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Search, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { sendOrderStatusEmail } from "@/lib/order-emails.functions";

type OrderItem = {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  size: string | null;
  finish: string | null;
};

type Order = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  status: string;
  total: number;
  upfront_amount: number | null;
  remaining_amount: number | null;
  created_at: string;
  instapay_reference: string | null;
  payment_proof_url: string | null;
  order_items: OrderItem[];
};

const STATUSES = [
  "pending_payment",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
] as const;
type OrderStatus = (typeof STATUSES)[number];

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

export const Route = createFileRoute("/admin/orders")({
  component: OrdersPage,
});

function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const sendEmail = useServerFn(sendOrderStatusEmail);

  const load = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("id, order_number, customer_name, customer_email, customer_phone, status, total, created_at, instapay_reference, payment_proof_url, order_items(id, product_name, quantity, unit_price, size, finish)")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setOrders((data ?? []) as Order[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter(
      (o) =>
        o.order_number.toLowerCase().includes(q) ||
        o.customer_name.toLowerCase().includes(q) ||
        o.customer_email.toLowerCase().includes(q),
    );
  }, [orders, search]);

  const updateStatus = async (id: string, status: OrderStatus) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    toast.success("Status updated");
    try {
      const result = await sendEmail({ data: { orderId: id } });
      if (result?.ok) {
        toast.success("Customer notified by email");
      } else if (result?.error) {
        toast.error(`Email not sent: ${result.error}`);
      }
    } catch (e: any) {
      toast.error(`Email not sent: ${e?.message ?? "unknown error"}`);
    }
  };

  return (
    <div>
      <h1 className="font-serif text-3xl mb-2">Orders</h1>
      <p className="text-sm text-muted-foreground mb-6">Manage all customer orders.</p>

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by order ID, customer name or email…"
          className="pl-9"
        />
      </div>

      <div className="bg-background border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 w-8" />
                <th className="text-left px-4 py-3">Order</th>
                <th className="text-left px-4 py-3">Customer</th>
                <th className="text-left px-4 py-3">Date</th>
                <th className="text-right px-4 py-3">Total</th>
                <th className="text-left px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">Loading…</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">No orders found.</td></tr>
              )}
              {filtered.map((o) => (
                <>
                  <tr key={o.id} className="border-t hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <button onClick={() => setExpanded(expanded === o.id ? null : o.id)} className="p-1">
                        {expanded === o.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </button>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{o.order_number}</td>
                    <td className="px-4 py-3">
                      <div>{o.customer_name}</div>
                      <div className="text-xs text-muted-foreground">{o.customer_email}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(o.created_at).toLocaleDateString("en-GB")}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      EGP {Number(o.total).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={o.status}
                        onChange={(e) => updateStatus(o.id, e.target.value as OrderStatus)}
                        className={`text-xs rounded-md border px-2 py-1.5 ${statusColor[o.status] ?? ""}`}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>{s.replace("_", " ")}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                  {expanded === o.id && (
                    <tr key={`${o.id}-detail`} className="bg-muted/20">
                      <td colSpan={6} className="px-8 py-4">
                        <div className="grid gap-4 md:grid-cols-3">
                          <div>
                            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Items</p>
                            <ul className="space-y-1 text-sm">
                              {o.order_items?.map((it) => (
                                <li key={it.id} className="flex justify-between gap-4">
                                  <span>
                                    {it.quantity}× {it.product_name}
                                    {it.size && <span className="text-muted-foreground"> · {it.size}</span>}
                                    {it.finish && <span className="text-muted-foreground"> · {it.finish}</span>}
                                  </span>
                                  <span>EGP {(Number(it.unit_price) * it.quantity).toLocaleString()}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Contact</p>
                            <p className="text-sm">{o.customer_phone}</p>
                            <p className="text-sm">{o.customer_email}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">InstaPay payment</p>
                            <p className="text-sm">
                              <span className="text-muted-foreground">Reference: </span>
                              {o.instapay_reference ? (
                                <span className="font-mono">{o.instapay_reference}</span>
                              ) : (
                                <span className="text-muted-foreground italic">none</span>
                              )}
                            </p>
                            {o.payment_proof_url ? (
                              <a
                                href={o.payment_proof_url}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-2 inline-block"
                              >
                                <img
                                  src={o.payment_proof_url}
                                  alt="Payment screenshot"
                                  className="h-32 w-auto rounded-md border border-border object-cover hover:opacity-90"
                                />
                                <span className="block text-xs text-primary mt-1 underline">Open full size</span>
                              </a>
                            ) : (
                              <p className="text-sm text-muted-foreground italic mt-1">No screenshot uploaded</p>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}