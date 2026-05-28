import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { sendOrderStatusEmail } from "@/lib/order-emails.functions";
import { useIsAdmin } from "@/lib/admin";

type OrderItem = {
  id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  size: string | null;
  finish: string | null;
  image_url?: string | null;
};

type Order = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_governorate: string;
  shipping_notes: string | null;
  status: string;
  subtotal: number;
  shipping_fee: number;
  total: number;
  upfront_amount: number | null;
  remaining_amount: number | null;
  created_at: string;
  instapay_reference: string | null;
  payment_proof_url: string | null;
  order_items: OrderItem[];
};

const STATUSES = [
  { value: "pending_payment", label: "Pending Payment" },
  { value: "confirmed", label: "Payment Confirmed" },
  { value: "shipped", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered & Completed" },
  { value: "cancelled", label: "Cancelled" },
] as const;

const STATUS_LABELS: Record<string, string> = Object.fromEntries(STATUSES.map((s) => [s.value, s.label]));

const statusColor: Record<string, string> = {
  pending_payment: "bg-amber-100 text-amber-800 border-amber-200",
  confirmed: "bg-blue-100 text-blue-800 border-blue-200",
  in_production: "bg-indigo-100 text-indigo-800 border-indigo-200",
  shipped: "bg-purple-100 text-purple-800 border-purple-200",
  delivered: "bg-emerald-100 text-emerald-800 border-emerald-200",
  cancelled: "bg-rose-100 text-rose-800 border-rose-200",
};

export const Route = createFileRoute("/admin/orders/$id")({
  component: OrderDetailPage,
});

function OrderDetailPage() {
  const { isCarpenter } = useIsAdmin();
  const { id } = Route.useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const sendEmail = useServerFn(sendOrderStatusEmail);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, customer_name, customer_email, customer_phone, shipping_address, shipping_city, shipping_governorate, shipping_notes, status, subtotal, shipping_fee, total, upfront_amount, remaining_amount, created_at, instapay_reference, payment_proof_url, order_items(id, product_id, product_name, quantity, unit_price, size, finish)")
        .eq("id", id)
        .single();
      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }
      const items = (data.order_items ?? []) as OrderItem[];
      const productIds = items.map((i) => i.product_id).filter(Boolean) as string[];
      if (productIds.length) {
        const { data: prods } = await supabase.from("products").select("id, image_url").in("id", productIds);
        const map = new Map((prods ?? []).map((p: any) => [p.id, p.image_url]));
        items.forEach((i) => { if (i.product_id) i.image_url = map.get(i.product_id) ?? null; });
      }
      setOrder({ ...(data as any), order_items: items });
      setLoading(false);
    })();
  }, [id]);

  // Realtime: reflect status changes made elsewhere (e.g. carpenter app)
  useEffect(() => {
    const channel = supabase
      .channel(`admin-order-${id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${id}` },
        (payload) => {
          const n = payload.new as Partial<Order>;
          setOrder((prev) => (prev ? { ...prev, ...n } : prev));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const updateStatus = async (status: string) => {
    if (!order) return;
    setSaving(true);
    const { error } = await supabase.from("orders").update({ status } as never).eq("id", order.id);
    if (error) {
      toast.error(error.message);
      setSaving(false);
      return;
    }
    setOrder({ ...order, status });
    toast.success("Status updated");
    try {
      const result = await sendEmail({ data: { orderId: order.id } });
      if (result?.ok) toast.success("Customer notified by email");
      else if (result?.error) toast.error(`Email not sent: ${result.error}`);
    } catch (e: any) {
      toast.error(`Email not sent: ${e?.message ?? "unknown error"}`);
    }
    setSaving(false);
  };

  if (loading) return <div className="text-sm text-muted-foreground">Loading…</div>;
  if (!order) return (
    <div>
      <Link to="/admin/orders" className="text-sm text-muted-foreground inline-flex items-center gap-2 mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to orders
      </Link>
      <p>Order not found.</p>
    </div>
  );

  return (
    <div>
      <Link to="/admin/orders" className="text-sm text-muted-foreground inline-flex items-center gap-2 mb-4 hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to orders
      </Link>

      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="font-serif text-3xl">Order {order.order_number}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Placed on {new Date(order.created_at).toLocaleString("en-GB")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs rounded-md border px-2 py-1 ${statusColor[order.status] ?? ""}`}>
            {STATUS_LABELS[order.status] ?? order.status}
          </span>
          <select
            value={STATUSES.some((s) => s.value === order.status) ? order.status : "confirmed"}
            onChange={(e) => updateStatus(e.target.value)}
            disabled={saving}
            className="text-sm rounded-md border px-3 py-1.5 bg-background"
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-background border rounded-xl p-6">
            <h2 className="font-serif text-lg mb-4">Items</h2>
            <ul className="divide-y">
              {order.order_items.map((it) => (
                <li key={it.id} className="py-3 flex items-center gap-4">
                  <div className="h-16 w-16 rounded-md bg-muted overflow-hidden flex-shrink-0">
                    {it.image_url ? (
                      <img src={it.image_url} alt={it.product_name} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{it.product_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Qty {it.quantity}
                      {it.size && <> · {it.size}</>}
                      {it.finish && <> · {it.finish}</>}
                    </p>
                  </div>
                  {!isCarpenter && (
                    <div className="text-right">
                      <p className="text-sm">EGP {Number(it.unit_price).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">= EGP {(Number(it.unit_price) * it.quantity).toLocaleString()}</p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
            {!isCarpenter && (
              <div className="mt-4 pt-4 border-t space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>EGP {Number(order.subtotal).toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Delivery fee</span><span>EGP {Number(order.shipping_fee).toLocaleString()}</span></div>
                <div className="flex justify-between font-semibold pt-2 border-t mt-2"><span>Total</span><span>EGP {Number(order.total).toLocaleString()}</span></div>
              </div>
            )}
          </section>

          {!isCarpenter && (
          <section className="bg-background border rounded-xl p-6">
            <h2 className="font-serif text-lg mb-4">Payment</h2>
            {order.upfront_amount != null && order.remaining_amount != null ? (
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div className="rounded-lg border p-4 bg-emerald-50/50">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Paid upfront (75%)</p>
                  <p className="text-xl font-medium mt-1">EGP {Number(order.upfront_amount).toLocaleString()}</p>
                </div>
                <div className="rounded-lg border p-4 bg-amber-50/50">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Due on delivery (25% + delivery)</p>
                  <p className="text-xl font-medium mt-1">EGP {Number(order.remaining_amount).toLocaleString()}</p>
                </div>
              </div>
            ) : null}
            <div className="text-sm space-y-1 mb-4">
              <p>
                <span className="text-muted-foreground">InstaPay reference: </span>
                {order.instapay_reference
                  ? <span className="font-mono">{order.instapay_reference}</span>
                  : <span className="text-muted-foreground italic">none</span>}
              </p>
            </div>
            {order.payment_proof_url ? (
              <a href={order.payment_proof_url} target="_blank" rel="noreferrer" className="inline-block">
                <img src={order.payment_proof_url} alt="Payment screenshot" className="max-h-80 rounded-md border object-cover hover:opacity-90" />
                <span className="block text-xs text-primary mt-1 underline">Open full size</span>
              </a>
            ) : (
              <p className="text-sm text-muted-foreground italic">No payment screenshot uploaded.</p>
            )}
          </section>
          )}
        </div>

        <aside className="space-y-6">
          <section className="bg-background border rounded-xl p-6">
            <h2 className="font-serif text-lg mb-3">Customer</h2>
            <div className="text-sm space-y-1">
              <p className="font-medium">{order.customer_name}</p>
              <p><a href={`mailto:${order.customer_email}`} className="text-primary underline">{order.customer_email}</a></p>
              <p><a href={`tel:${order.customer_phone}`} className="text-primary underline">{order.customer_phone}</a></p>
            </div>
          </section>

          <section className="bg-background border rounded-xl p-6">
            <h2 className="font-serif text-lg mb-3">Shipping address</h2>
            <div className="text-sm space-y-1 text-muted-foreground">
              <p className="text-foreground">{order.shipping_address}</p>
              <p>{order.shipping_city}, {order.shipping_governorate}</p>
              {order.shipping_notes && <p className="italic mt-2">Note: {order.shipping_notes}</p>}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
