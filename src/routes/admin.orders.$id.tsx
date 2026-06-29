import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Pencil, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { sendOrderStatusEmail } from "@/lib/order-emails.functions";
import { sendOrderUpdatedEmail } from "@/lib/order-emails.functions";
import { signManualAttachmentUrls } from "@/lib/manual-orders.functions";
import { useIsAdmin } from "@/lib/admin";
import { getAreaLabel } from "@/lib/delivery";
import { ManualOrderModal, type ManualAttachment } from "@/components/admin/ManualOrderModal";

type OrderItem = {
  id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  size: string | null;
  finish: string | null;
  image_url?: string | null;
  bed_rails?: boolean | null;
  bed_rails_price?: number | null;
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
  delivery_area: string | null;
  order_size_type: string | null;
  status: string;
  subtotal: number;
  shipping_fee: number;
  total: number;
  upfront_amount: number | null;
  remaining_amount: number | null;
  created_at: string;
  instapay_reference: string | null;
  payment_proof_url: string | null;
  assigned_carpenter: number | null;
  is_manual_order?: boolean | null;
  product_description?: string | null;
  notes?: string | null;
  attachments?: ManualAttachment[] | null;
  last_updated_at?: string | null;
  notified_statuses?: string[] | null;
  update_notified_at?: string | null;
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

const CARPENTERS: { value: number | null; label: string }[] = [
  { value: null, label: "Unassigned" },
  { value: 1, label: "Carpenter 1 — النجار الأول" },
  { value: 2, label: "Carpenter 2 — النجار الثاني" },
  { value: 3, label: "Carpenter 3 — النجار الثالث" },
];

export const Route = createFileRoute("/admin/orders/$id")({
  component: OrderDetailPage,
});

function DeliveryFeeEditor({
  order,
  onSaved,
}: {
  order: { id: string; subtotal: number; upfront_amount: number | null };
  onSaved: (fee: number, total: number, remaining: number) => void;
}) {
  const [value, setValue] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const save = async () => {
    const fee = Math.max(0, Number(value));
    if (!Number.isFinite(fee)) { toast.error("Enter a valid number"); return; }
    setSaving(true);
    const total = Number(order.subtotal) + fee;
    const remaining = total - Number(order.upfront_amount ?? 0);
    const { error } = await supabase
      .from("orders")
      .update({ shipping_fee: fee, total, total_amount: total, remaining_amount: remaining } as never)
      .eq("id", order.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    onSaved(fee, total, remaining);
    toast.success("Delivery fee updated");
  };
  return (
    <span className="inline-flex items-center gap-2">
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="EGP"
        className="w-24 h-8 rounded-md border px-2 text-sm bg-background"
      />
      <button
        type="button"
        disabled={saving || !value}
        onClick={save}
        className="text-xs rounded-md px-2 py-1 bg-primary text-primary-foreground disabled:opacity-50"
      >
        {saving ? "…" : "Set"}
      </button>
    </span>
  );
}

function OrderDetailPage() {
  const { isCarpenter } = useIsAdmin();
  const { id } = Route.useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [proofSignedUrl, setProofSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [attachUrls, setAttachUrls] = useState<Record<string, string>>({});
  const sendEmail = useServerFn(sendOrderStatusEmail);
  const sendUpdated = useServerFn(sendOrderUpdatedEmail);
  const [notifying, setNotifying] = useState(false);
  const [notifyingUpdate, setNotifyingUpdate] = useState(false);
  const signFn = useServerFn(signManualAttachmentUrls);

  useEffect(() => {
    (async () => {
      const { data: orderRow, error: orderErr } = await supabase
        .from("orders")
        .select("id, order_number, customer_name, customer_email, customer_phone, shipping_address, shipping_city, shipping_governorate, shipping_notes, delivery_area, order_size_type, status, subtotal, shipping_fee, total, upfront_amount, remaining_amount, created_at, instapay_reference, payment_proof_url, assigned_carpenter, is_manual_order, product_description, notes, attachments, last_updated_at, notified_statuses, update_notified_at")
        .eq("id", id)
        .single();
      if (orderErr || !orderRow) {
        toast.error(orderErr?.message ?? "Order not found");
        setLoading(false);
        return;
      }
      const { data: itemRows, error: itemsErr } = await supabase
        .from("order_items")
        .select("id, product_id, product_name, quantity, unit_price, size, finish, bed_rails, bed_rails_price")
        .eq("order_id", id);
      if (itemsErr) {
        toast.error(`Couldn't load order items: ${itemsErr.message}`);
        setItemsError(itemsErr.message);
      }
      const items = ((itemRows ?? []) as OrderItem[]).map((i) => ({ ...i }));
      const productIds = items.map((i) => i.product_id).filter(Boolean) as string[];
      if (productIds.length) {
        const { data: prods } = await supabase.from("products").select("id, image_url").in("id", productIds);
        const map = new Map((prods ?? []).map((p: any) => [p.id, p.image_url]));
        items.forEach((i) => { if (i.product_id) i.image_url = map.get(i.product_id) ?? null; });
      }
      setOrder({ ...(orderRow as any), order_items: items });
      setLoading(false);
    })();
  }, [id]);

  // Sign attachment URLs whenever the attachment list changes
  useEffect(() => {
    const list = (order?.attachments ?? []) as ManualAttachment[];
    if (!list.length) { setAttachUrls({}); return; }
    let cancelled = false;
    (async () => {
      try {
        const { urls } = await signFn({ data: { paths: list.map((a) => a.path) } });
        if (!cancelled) setAttachUrls(urls);
      } catch (e) { /* ignore */ }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.attachments]);

  // Resolve payment proof: legacy rows store a full public URL, new rows store a storage path.
  useEffect(() => {
    const v = order?.payment_proof_url;
    if (!v) { setProofSignedUrl(null); return; }
    if (/^https?:\/\//i.test(v)) { setProofSignedUrl(v); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase.storage
        .from("payment-proofs")
        .createSignedUrl(v, 60 * 10);
      if (!cancelled) setProofSignedUrl(data?.signedUrl ?? null);
    })();
    return () => { cancelled = true; };
  }, [order?.payment_proof_url]);

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
    const prevStatus = order.status;
    setSaving(true);
    setOrder({ ...order, status });
    const { data, error } = await supabase
      .from("orders")
      .update({ status } as never)
      .eq("id", order.id)
      .select("id, status")
      .single();
    if (error || !data) {
      toast.error(error?.message ?? "Update was blocked");
      setOrder({ ...order, status: prevStatus });
      setSaving(false);
      return;
    }
    toast.success("Status updated — customer not notified yet");
    setSaving(false);
  };

  const notifyCustomer = async () => {
    if (!order) return;
    const already = (order.notified_statuses ?? []).includes(order.status);
    if (already && !confirm("Customer was already notified for this status. Send again?")) return;
    setNotifying(true);
    try {
      const r = await sendEmail({ data: { orderId: order.id } });
      if (r?.ok) {
        toast.success("Customer notified by email");
        setOrder((o) => o ? { ...o, notified_statuses: Array.from(new Set([...(o.notified_statuses ?? []), o.status])) } : o);
      } else if (r?.error) toast.error(`Email not sent: ${r.error}`);
    } catch (e: any) {
      toast.error(`Email not sent: ${e?.message ?? "unknown error"}`);
    } finally { setNotifying(false); }
  };

  const notifyUpdate = async () => {
    if (!order) return;
    const lastUpd = order.last_updated_at ? new Date(order.last_updated_at).getTime() : 0;
    const lastNotif = order.update_notified_at ? new Date(order.update_notified_at).getTime() : 0;
    const alreadySent = lastNotif >= lastUpd && lastNotif > 0;
    if (alreadySent && !confirm("Customer was already notified of the latest changes. Send again?")) return;
    setNotifyingUpdate(true);
    try {
      const r = await sendUpdated({ data: { orderId: order.id } });
      if (r?.ok) {
        toast.success("Customer notified of changes");
        setOrder((o) => o ? { ...o, update_notified_at: new Date().toISOString() } : o);
      } else if (r?.error) toast.error(`Email not sent: ${r.error}`);
    } catch (e: any) {
      toast.error(`Email not sent: ${e?.message ?? "unknown error"}`);
    } finally { setNotifyingUpdate(false); }
  };

  const updateAssignment = async (value: number | null) => {
    if (!order) return;
    const prev = order.assigned_carpenter;
    setOrder({ ...order, assigned_carpenter: value });
    const { error } = await supabase
      .from("orders")
      .update({ assigned_carpenter: value } as never)
      .eq("id", order.id);
    if (error) {
      toast.error(error.message);
      setOrder({ ...order, assigned_carpenter: prev });
      return;
    }
    toast.success(value === null ? "Order unassigned" : `Assigned to Carpenter ${value}`);
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
            {order.last_updated_at && (
              <> · Updated {new Date(order.last_updated_at).toLocaleString("en-GB")}</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!isCarpenter && order.is_manual_order && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1.5 text-sm rounded-md border px-3 py-1.5 hover:bg-muted"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit order
            </button>
          )}
          <span className={`text-xs rounded-md border px-2 py-1 ${statusColor[order.status] ?? ""}`}>
            {STATUS_LABELS[order.status] ?? order.status}
          </span>
          {order.status === "pending_payment" && (
            <button
              type="button"
              onClick={() => updateStatus("confirmed")}
              disabled={saving}
              className="text-sm rounded-md px-4 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed font-medium"
            >
              {saving ? "Confirming…" : "Confirm payment"}
            </button>
          )}
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

      {((order.attachments ?? []) as ManualAttachment[]).length > 0 && (
        <section className="bg-background border rounded-xl p-4 mb-6">
          <h2 className="font-serif text-base mb-3 flex items-center gap-2">
            <Paperclip className="h-4 w-4" /> Order attachments
          </h2>
          <ul className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {((order.attachments ?? []) as ManualAttachment[]).map((a) => {
              const url = attachUrls[a.path];
              const isImg = (a.mime ?? "").startsWith("image/");
              return (
                <li key={a.path} className="rounded-md border bg-muted/30 overflow-hidden">
                  {isImg && url ? (
                    <a href={url} target="_blank" rel="noreferrer">
                      <img src={url} alt={a.name} className="w-full h-24 object-cover hover:opacity-90" />
                    </a>
                  ) : (
                    <a href={url ?? "#"} target="_blank" rel="noreferrer" className="block p-2 h-24 flex flex-col items-center justify-center text-[11px] text-center text-muted-foreground hover:bg-muted">
                      <Paperclip className="h-4 w-4 mb-1" />
                      <span className="truncate w-full">{a.name}</span>
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {editing && order.is_manual_order && (
        <ManualOrderModal
          existing={{
            id: order.id,
            customer_name: order.customer_name,
            customer_email: order.customer_email,
            customer_phone: order.customer_phone,
            shipping_address: order.shipping_address,
            product_description: order.product_description ?? null,
            subtotal: Number(order.subtotal),
            shipping_fee: Number(order.shipping_fee),
            delivery_area: order.delivery_area,
            upfront_amount: order.upfront_amount,
            remaining_amount: order.remaining_amount,
            notes: order.notes ?? "",
            attachments: (order.attachments ?? []) as ManualAttachment[],
            status: order.status,
          }}
          onClose={() => setEditing(false)}
          onUpdated={async () => {
            setEditing(false);
            // refetch
            const { data: refreshed } = await supabase
              .from("orders")
              .select("id, order_number, customer_name, customer_email, customer_phone, shipping_address, shipping_city, shipping_governorate, shipping_notes, delivery_area, order_size_type, status, subtotal, shipping_fee, total, upfront_amount, remaining_amount, created_at, instapay_reference, payment_proof_url, assigned_carpenter, is_manual_order, product_description, notes, attachments, last_updated_at")
              .eq("id", order.id)
              .single();
            if (refreshed) setOrder((prev) => prev ? { ...prev, ...(refreshed as any) } : prev);
          }}
        />
      )}

      {!isCarpenter && (
        <section className="bg-background border rounded-xl p-4 mb-6 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-serif text-base">Workshop assignment</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Choose which carpenter will build this order. Each carpenter only sees their own dashboard.</p>
          </div>
          <select
            value={order.assigned_carpenter ?? ""}
            onChange={(e) => updateAssignment(e.target.value === "" ? null : Number(e.target.value))}
            className="text-sm rounded-md border px-3 py-1.5 bg-background"
          >
            {CARPENTERS.map((c) => (
              <option key={String(c.value)} value={c.value ?? ""}>
                {c.label}
              </option>
            ))}
          </select>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-background border rounded-xl p-6">
            <h2 className="font-serif text-lg mb-4">Items</h2>
            {itemsError ? (
              <p className="text-sm text-rose-600">Couldn't load items: {itemsError}</p>
            ) : order.order_items.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No items found on this order.</p>
            ) : (
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
                    {it.bed_rails && (
                      <p className="text-xs mt-1 inline-flex items-center gap-1 rounded-md bg-amber-100 text-amber-900 border border-amber-200 px-2 py-0.5">
                        🛏️ Bed Rails included (+EGP {Number(it.bed_rails_price ?? 0).toLocaleString()})
                      </p>
                    )}
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
            )}
            {!isCarpenter && (
              <div className="mt-4 pt-4 border-t space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>EGP {Number(order.subtotal).toLocaleString()}</span></div>
                <div className="flex justify-between items-center gap-3">
                  <span className="text-muted-foreground">
                    Delivery fee
                    {order.delivery_area && <> — {getAreaLabel(order.delivery_area as never)} ({order.order_size_type ?? "big"})</>}
                  </span>
                  {order.delivery_area === "other" ? (
                    <DeliveryFeeEditor
                      order={order}
                      onSaved={(fee, total, remaining) => setOrder({ ...order, shipping_fee: fee, total, remaining_amount: remaining })}
                    />
                  ) : (
                    <span>EGP {Number(order.shipping_fee).toLocaleString()}</span>
                  )}
                </div>
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
            {order.payment_proof_url && proofSignedUrl ? (
              <a href={proofSignedUrl} target="_blank" rel="noreferrer" className="inline-block">
                <img src={proofSignedUrl} alt="Payment screenshot" className="max-h-80 rounded-md border object-cover hover:opacity-90" />
                <span className="block text-xs text-primary mt-1 underline">Open full size</span>
              </a>
            ) : order.payment_proof_url ? (
              <p className="text-sm text-muted-foreground italic">Loading payment screenshot…</p>
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
              {order.delivery_area && (
                <p className="text-foreground">
                  Area: <strong>{getAreaLabel(order.delivery_area as never)}</strong>
                  <span className="text-muted-foreground"> · {order.order_size_type ?? "big"} order</span>
                </p>
              )}
              {order.shipping_notes && <p className="italic mt-2">Note: {order.shipping_notes}</p>}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
