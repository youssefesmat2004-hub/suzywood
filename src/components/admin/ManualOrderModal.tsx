import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { createManualOrder, updateManualOrder, signManualAttachmentUrls } from "@/lib/manual-orders.functions";
import { sendOrderUpdatedEmail } from "@/lib/order-emails.functions";
import { X, Paperclip, Loader2 } from "lucide-react";

const WHATSAPP_ORDER_DEPOSIT_RATE = 0.75;
const WHATSAPP_ORDER_REMAINING_RATE = 1 - WHATSAPP_ORDER_DEPOSIT_RATE;

export const DELIVERY_AREAS: { value: string; label: string }[] = [
  { value: "maadi", label: "Maadi" },
  { value: "zamalek", label: "Zamalek" },
  { value: "dokki", label: "Dokki" },
  { value: "masr-al-gedida", label: "Masr Al Gedida" },
  { value: "nasr-city", label: "Nasr City" },
  { value: "new-cairo", label: "New Cairo" },
  { value: "shorouk-madinty", label: "Shorouk-Madinty" },
  { value: "obour", label: "Obour" },
  { value: "sheikh-zayed", label: "Sheikh Zayed" },
  { value: "other", label: "Other" },
];

export type ManualAttachment = {
  path: string;
  name: string;
  mime?: string;
  size?: number;
};

export type ManualOrderExisting = {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  product_description: string | null;
  subtotal: number;
  shipping_fee: number;
  delivery_area: string | null;
  upfront_amount: number | null;
  remaining_amount: number | null;
  notes: string | null;
  attachments: ManualAttachment[];
  status: "pending_payment" | "confirmed" | "shipped" | "delivered" | string;
};

export function ManualOrderModal({
  onClose,
  onCreated,
  onUpdated,
  existing,
}: {
  onClose: () => void;
  onCreated?: (o: { id: string; order_number: string }) => void;
  onUpdated?: (id: string) => void;
  existing?: ManualOrderExisting;
}) {
  const isEdit = !!existing;
  const createFn = useServerFn(createManualOrder);
  const updateFn = useServerFn(updateManualOrder);
  const sendUpdated = useServerFn(sendOrderUpdatedEmail);
  const signFn = useServerFn(signManualAttachmentUrls);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [attachments, setAttachments] = useState<ManualAttachment[]>(existing?.attachments ?? []);
  const [removedPaths, setRemovedPaths] = useState<string[]>([]);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    customer_name: existing?.customer_name ?? "",
    customer_email: existing?.customer_email ?? "",
    customer_phone: existing?.customer_phone ?? "",
    shipping_address: existing?.shipping_address ?? "",
    product_description: existing?.product_description ?? "",
    product_price: existing ? String(Number(existing.subtotal ?? 0)) : "",
    delivery_area: existing?.delivery_area ?? "",
    delivery_cost: existing ? String(Number(existing.shipping_fee ?? 0)) : "0",
    upfront: existing?.upfront_amount != null ? String(Number(existing.upfront_amount)) : "",
    remaining: existing?.remaining_amount != null ? String(Number(existing.remaining_amount)) : "",
    notes: existing?.notes ?? "",
    status: (existing?.status ?? "pending_payment") as
      | "pending_payment"
      | "confirmed"
      | "shipped"
      | "delivered",
  });

  // Load signed thumbnails for existing image attachments
  useEffect(() => {
    const paths = attachments.map((a) => a.path);
    if (!paths.length) return;
    let cancelled = false;
    (async () => {
      try {
        const { urls } = await signFn({ data: { paths } });
        if (!cancelled) setThumbs((prev) => ({ ...prev, ...urls }));
      } catch (e) { /* ignore */ }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attachments.length]);

  const productPrice = Number(form.product_price);
  const deliveryCost = Number(form.delivery_cost);
  const total = (Number.isFinite(productPrice) ? productPrice : 0)
    + (Number.isFinite(deliveryCost) ? deliveryCost : 0);

  const recalc = (productPriceStr: string, deliveryCostStr: string) => {
    const p = Number(productPriceStr);
    const d = Number(deliveryCostStr);
    const t = (Number.isFinite(p) ? p : 0) + (Number.isFinite(d) ? d : 0);
    if (t > 0) {
      const up = Math.round(t * WHATSAPP_ORDER_DEPOSIT_RATE);
      const rem = Math.round(t * WHATSAPP_ORDER_REMAINING_RATE);
      setForm((f) => ({ ...f, product_price: productPriceStr, delivery_cost: deliveryCostStr, upfront: String(up), remaining: String(rem) }));
    } else {
      setForm((f) => ({ ...f, product_price: productPriceStr, delivery_cost: deliveryCostStr }));
    }
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setUploading(true);
    try {
      const next: ManualAttachment[] = [];
      for (const file of Array.from(files)) {
        if (file.size > 20 * 1024 * 1024) {
          toast.error(`${file.name} is larger than 20MB`);
          continue;
        }
        const safe = file.name.replace(/[^A-Za-z0-9._-]/g, "_");
        const path = `${crypto.randomUUID()}/${safe}`;
        const { error } = await supabase.storage
          .from("manual-order-attachments")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (error) { toast.error(`${file.name}: ${error.message}`); continue; }
        next.push({ path, name: file.name, mime: file.type, size: file.size });
      }
      if (next.length) {
        setAttachments((prev) => [...prev, ...next]);
        // sign new thumbs
        try {
          const { urls } = await signFn({ data: { paths: next.map((n) => n.path) } });
          setThumbs((prev) => ({ ...prev, ...urls }));
        } catch {}
      }
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (path: string) => {
    setAttachments((prev) => prev.filter((a) => a.path !== path));
    setRemovedPaths((prev) => [...prev, path]);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = Number(form.product_price);
    const delivery = Number(form.delivery_cost);
    const upfront = Number(form.upfront);
    const remaining = Number(form.remaining);
    if (!Number.isFinite(price) || price < 0) { toast.error("Enter a valid product price"); return; }
    if (!Number.isFinite(delivery) || delivery < 0) { toast.error("Enter a valid delivery cost"); return; }
    if (!form.delivery_area) { toast.error("Select a delivery area"); return; }
    setSaving(true);
    try {
      if (isEdit && existing) {
        await updateFn({
          data: {
            id: existing.id,
            product_description: form.product_description.trim(),
            total: price,
            delivery_area: form.delivery_area as any,
            delivery_cost: delivery,
            upfront_amount: upfront,
            remaining_amount: remaining,
            notes: form.notes,
            attachments,
            removed_paths: removedPaths,
          },
        });
        toast.success("Order updated");
        if (existing.customer_email) {
          try {
            const r = await sendUpdated({ data: { orderId: existing.id } });
            if (r?.ok) toast.success("Customer notified by email");
            else if (r?.error) toast.error(`Email not sent: ${r.error}`);
          } catch (e: any) {
            toast.error(`Email not sent: ${e?.message ?? "unknown"}`);
          }
        }
        onUpdated?.(existing.id);
      } else {
        const res = await createFn({
          data: {
            customer_name: form.customer_name.trim(),
            customer_email: form.customer_email.trim(),
            customer_phone: form.customer_phone.trim(),
            shipping_address: form.shipping_address.trim(),
            product_description: form.product_description.trim(),
            total: price,
            delivery_area: form.delivery_area as any,
            delivery_cost: delivery,
            upfront_amount: upfront,
            remaining_amount: remaining,
            status: form.status,
            attachments,
          },
        });
        toast.success(`Manual order ${res.order_number} created`);
        onCreated?.({ id: res.id, order_number: res.order_number });
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to save order");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-background rounded-xl shadow-xl w-full max-w-lg my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-serif text-xl">{isEdit ? "Edit WhatsApp Order" : "Add WhatsApp Order"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm">Cancel</button>
        </div>
        <form onSubmit={submit} className="px-6 py-5 space-y-4 text-sm">
          <Field label="Customer name" required>
            <Input required disabled={isEdit} value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} />
          </Field>
          <Field label="Customer email" required>
            <Input type="email" required disabled={isEdit} value={form.customer_email} onChange={(e) => setForm({ ...form, customer_email: e.target.value })} />
          </Field>
          <Field label="Customer phone" required>
            <Input required disabled={isEdit} value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} />
          </Field>
          <Field label="Delivery address" required>
            <textarea
              required
              rows={2}
              disabled={isEdit}
              value={form.shipping_address}
              onChange={(e) => setForm({ ...form, shipping_address: e.target.value })}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm disabled:opacity-60"
            />
          </Field>
          <Field label="Product description" required>
            <textarea
              required
              rows={3}
              placeholder="e.g. Custom crib 130x65cm with drawer"
              value={form.product_description}
              onChange={(e) => setForm({ ...form, product_description: e.target.value })}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Product price (EGP)" required>
            <Input type="number" min={0} required value={form.product_price} onChange={(e) => recalc(e.target.value, form.delivery_cost)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Delivery Area" required>
              <select
                required
                value={form.delivery_area}
                onChange={(e) => setForm({ ...form, delivery_area: e.target.value })}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="">Select area…</option>
                {DELIVERY_AREAS.map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Delivery Cost (EGP)" required>
              <Input type="number" min={0} required value={form.delivery_cost} onChange={(e) => recalc(form.product_price, e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Deposit Amount (75%)">
              <Input type="number" min={0} value={form.upfront} onChange={(e) => setForm({ ...form, upfront: e.target.value })} />
            </Field>
            <Field label="Remaining Amount (25%)">
              <Input type="number" min={0} value={form.remaining} onChange={(e) => setForm({ ...form, remaining: e.target.value })} />
            </Field>
          </div>
          {total > 0 && (
            <div className="rounded-lg bg-muted/60 border px-4 py-3 text-xs space-y-1">
              <div className="flex justify-between"><span className="text-muted-foreground">Product</span><span>EGP {(Number(form.product_price) || 0).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span>EGP {(Number(form.delivery_cost) || 0).toLocaleString()}</span></div>
              <div className="border-t pt-1 mt-1 flex justify-between font-semibold"><span>Total</span><span>EGP {total.toLocaleString()}</span></div>
            </div>
          )}
          {isEdit && (
            <Field label="Internal notes">
              <textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </Field>
          )}
          {!isEdit && (
            <Field label="Order status">
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as typeof form.status })}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="pending_payment">Pending Payment</option>
                <option value="confirmed">Payment Confirmed</option>
                <option value="shipped">Out for Delivery</option>
                <option value="delivered">Delivered</option>
              </select>
            </Field>
          )}

          <Field label="Order Attachments">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs text-primary cursor-pointer hover:underline">
                <Paperclip className="h-4 w-4" />
                {uploading ? <><Loader2 className="h-3 w-3 animate-spin" /> Uploading…</> : "Add files (images, PDFs — up to 20MB each)"}
                <input
                  type="file"
                  multiple
                  accept="image/*,application/pdf,audio/*"
                  disabled={uploading}
                  onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
                  className="hidden"
                />
              </label>
              {attachments.length > 0 && (
                <ul className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {attachments.map((a) => {
                    const isImg = (a.mime ?? "").startsWith("image/");
                    const url = thumbs[a.path];
                    return (
                      <li key={a.path} className="relative rounded-md border bg-muted/40 overflow-hidden group">
                        {isImg && url ? (
                          <img src={url} alt={a.name} className="w-full h-20 object-cover" />
                        ) : (
                          <div className="p-2 h-20 flex flex-col items-center justify-center text-[10px] text-center text-muted-foreground">
                            <Paperclip className="h-4 w-4 mb-1" />
                            <span className="truncate w-full">{a.name}</span>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeAttachment(a.path)}
                          className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-0.5 opacity-90 hover:opacity-100"
                          aria-label={`Remove ${a.name}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </Field>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="text-sm rounded-md border px-4 py-2 hover:bg-muted">Cancel</button>
            <button
              type="submit"
              disabled={saving || uploading}
              className="text-sm rounded-md bg-primary text-primary-foreground px-4 py-2 font-medium disabled:opacity-60"
            >
              {saving ? "Saving…" : isEdit ? "Save changes" : "Create order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-muted-foreground mb-1">
        {label}{required && <span className="text-rose-500"> *</span>}
      </span>
      {children}
    </label>
  );
}