import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Layout } from "@/components/site/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { sendCheckoutPendingEmail } from "@/lib/checkout-emails.functions";
import { toast } from "sonner";
import qrImage from "@/assets/instapay-qr.jpeg";
import { Upload, Check, Tag } from "lucide-react";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — Suzy Wood" }] }),
  component: Checkout,
});

const SHIPPING = 1000;
const INSTAPAY_NUMBER = "01096313532";
const INSTAPAY_HANDLE = "axady@instapay";
const UPFRONT_RATE = 0.75;

type Details = {
  name: string; email: string; phone: string;
  address: string; city: string; governorate: string; notes: string;
};

function Checkout() {
  const { items, subtotal, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const sendPendingEmail = useServerFn(sendCheckoutPendingEmail);
  const [step, setStep] = useState<"details" | "pay">("details");
  const [details, setDetails] = useState<Details | null>(null);
  const [reference, setReference] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoApplying, setPromoApplying] = useState(false);
  const [promo, setPromo] = useState<{ id: string; code: string; discount: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const discount = promo?.discount ?? 0;
  const subtotalAfter = Math.max(0, subtotal - discount);
  const total = subtotalAfter + SHIPPING;
  const upfront = Math.round(subtotalAfter * UPFRONT_RATE);
  const remainingProduct = subtotalAfter - upfront;
  const remainingOnDelivery = remainingProduct + SHIPPING;

  const applyPromo = async () => {
    const code = promoCode.trim().toUpperCase();
    if (!code) return;
    setPromoApplying(true);
    const { data, error } = await supabase
      .from("promo_codes")
      .select("id,code,discount_type,discount_value,min_subtotal,max_uses,used_count,expires_at,is_active")
      .eq("code", code)
      .maybeSingle();
    setPromoApplying(false);
    if (error || !data || !data.is_active) { toast.error("Invalid promo code"); return; }
    if (data.expires_at && new Date(data.expires_at) < new Date()) { toast.error("This code has expired"); return; }
    if (data.max_uses && data.used_count >= data.max_uses) { toast.error("This code is fully used"); return; }
    if (subtotal < Number(data.min_subtotal)) { toast.error(`Minimum subtotal EGP ${Number(data.min_subtotal).toLocaleString()} required`); return; }
    const value = Number(data.discount_value);
    const d = data.discount_type === "percent" ? Math.round((subtotal * value) / 100) : Math.round(value);
    setPromo({ id: data.id, code: data.code, discount: Math.min(d, subtotal) });
    toast.success(`Code ${data.code} applied — EGP ${d.toLocaleString()} off`);
  };

  const onDetailsSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (items.length === 0) return;
    const fd = new FormData(e.currentTarget);
    setDetails({
      name: String(fd.get("name") ?? ""),
      email: String(fd.get("email") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      address: String(fd.get("address") ?? ""),
      city: String(fd.get("city") ?? ""),
      governorate: String(fd.get("governorate") ?? ""),
      notes: String(fd.get("notes") ?? ""),
    });
    setStep("pay");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onConfirmPaid = async () => {
    if (!details) return;
    if (!reference.trim()) {
      toast.error("Please enter your InstaPay transaction ID");
      return;
    }
    setSubmitting(true);

    let proofUrl: string | null = null;
    if (proofFile) {
      const ext = proofFile.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${crypto.randomUUID()}.${ext}`;
      const up = await supabase.storage.from("payment-proofs").upload(path, proofFile, {
        contentType: proofFile.type || "image/jpeg",
        upsert: false,
      });
      if (up.error) {
        setSubmitting(false);
        toast.error("Couldn't upload screenshot", { description: up.error.message });
        return;
      }
      proofUrl = supabase.storage.from("payment-proofs").getPublicUrl(path).data.publicUrl;
    }

    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        user_id: user?.id ?? null,
        customer_name: details.name,
        customer_email: details.email,
        customer_phone: details.phone,
        shipping_address: details.address,
        shipping_city: details.city,
        shipping_governorate: details.governorate,
        shipping_notes: details.notes || null,
        subtotal: subtotalAfter,
        shipping_fee: SHIPPING,
        total,
        upfront_amount: upfront,
        remaining_amount: remainingOnDelivery,
        payment_method: "instapay",
        instapay_reference: reference.trim(),
        payment_proof_url: proofUrl,
        internal_notes: promo ? `Promo: ${promo.code} (-EGP ${promo.discount})` : null,
      })
      .select()
      .single();

    if (error || !order) {
      setSubmitting(false);
      toast.error("Couldn't place your order", { description: error?.message });
      return;
    }

    const { error: itemsError } = await supabase.from("order_items").insert(
      items.map((it) => ({
        order_id: order.id,
        product_id: it.productId,
        product_name: it.name,
        size: it.sizeLabel,
        finish: it.finishLabel,
        engraving: it.engraving || null,
        unit_price: it.unitPrice,
        quantity: it.quantity,
        line_total: it.unitPrice * it.quantity,
        custom_width_cm: it.customSize?.widthCm ?? null,
        custom_length_cm: it.customSize?.lengthCm ?? null,
        custom_surcharge: it.customSize?.surcharge ?? null,
      })),
    );

    setSubmitting(false);
    if (itemsError) {
      toast.error("Couldn't save your items", { description: itemsError.message });
      return;
    }
    if (promo) {
      const { data: cur } = await supabase.from("promo_codes").select("used_count").eq("id", promo.id).maybeSingle();
      if (cur) await supabase.from("promo_codes").update({ used_count: (cur.used_count ?? 0) + 1 }).eq("id", promo.id);
    }
    clear();
    // Fire-and-forget confirmation email
    sendPendingEmail({ data: { orderId: order.id } }).catch((e) =>
      console.error("Pending email failed", e),
    );
    toast.success(`Order ${order.order_number} submitted`, {
      description: "We'll verify your payment and email you once confirmed.",
    });
    navigate({ to: "/thank-you", search: { order: order.order_number } });
  };

  if (items.length === 0) {
    return (
      <Layout>
        <section className="container mx-auto px-6 py-24 text-center">
          <p className="text-muted-foreground">Your cart is empty.</p>
          <Button asChild className="mt-6"><Link to="/shop">Browse the Collection</Link></Button>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="container mx-auto px-6 lg:px-10 py-16 max-w-5xl">
        <h1 className="font-serif text-5xl mb-2">Checkout</h1>
        <p className="text-sm text-muted-foreground mb-10">
          Step {step === "details" ? "1" : "2"} of 2 — {step === "details" ? "Your details" : "InstaPay payment"}
        </p>
        <div className="grid lg:grid-cols-3 gap-10">
          {step === "details" ? (
          <form onSubmit={onDetailsSubmit} className="lg:col-span-2 space-y-5 bg-card border border-border rounded-2xl p-8">
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="space-y-1"><Label htmlFor="name">Full name</Label><Input id="name" name="name" required maxLength={100} defaultValue={details?.name ?? user?.user_metadata?.full_name ?? ""} /></div>
              <div className="space-y-1"><Label htmlFor="phone">Phone</Label><Input id="phone" name="phone" type="tel" required maxLength={20} defaultValue={details?.phone ?? user?.user_metadata?.phone ?? ""} /></div>
            </div>
            <div className="space-y-1"><Label htmlFor="email">Email</Label><Input id="email" type="email" name="email" required defaultValue={details?.email ?? user?.email ?? ""} /></div>
            <div className="space-y-1"><Label htmlFor="address">Address</Label><Textarea id="address" name="address" required maxLength={500} rows={2} defaultValue={details?.address ?? ""} /></div>
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="space-y-1"><Label htmlFor="city">City / Area</Label><Input id="city" name="city" required maxLength={100} placeholder="e.g. New Cairo" defaultValue={details?.city ?? ""} /></div>
              <div className="space-y-1"><Label htmlFor="governorate">Governorate</Label><Input id="governorate" name="governorate" required maxLength={100} placeholder="e.g. Cairo" defaultValue={details?.governorate ?? ""} /></div>
            </div>
            <div className="space-y-1"><Label htmlFor="notes">Delivery notes (optional)</Label><Textarea id="notes" name="notes" maxLength={500} rows={2} defaultValue={details?.notes ?? ""} /></div>

            <div className="rounded-xl bg-muted/50 border border-border p-4 text-sm text-muted-foreground">
              Next step: pay <strong>EGP {upfront.toLocaleString()} (75%)</strong> upfront via{" "}
              <strong>InstaPay</strong> to confirm your order. The remaining{" "}
              <strong>EGP {remainingOnDelivery.toLocaleString()}</strong> (25% + delivery) is paid on delivery.
            </div>

            <Button type="submit" size="lg" className="w-full">
              Continue to payment — Pay 75% now (EGP {upfront.toLocaleString()})
            </Button>
          </form>
          ) : (
          <div className="lg:col-span-2 space-y-5 bg-card border border-border rounded-2xl p-8">
            <div>
              <h2 className="font-serif text-2xl mb-1">Pay with InstaPay</h2>
              <p className="text-sm text-muted-foreground">
                Send exactly <strong className="text-foreground">EGP {upfront.toLocaleString()} (75%)</strong>{" "}
                using the QR below to confirm your order, then enter your transaction ID and upload a screenshot.
                The remaining <strong className="text-foreground">EGP {remainingOnDelivery.toLocaleString()}</strong>{" "}
                (25% + delivery fees) is paid in cash or InstaPay on delivery.
              </p>
            </div>

            <div className="grid sm:grid-cols-[200px_1fr] gap-5 items-start bg-muted/40 border border-border rounded-xl p-5">
              <img src={qrImage} alt="Suzy Wood InstaPay QR code" className="w-full max-w-[200px] rounded-lg" />
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Pay now (75%)</p>
                  <p className="font-serif text-2xl text-primary">EGP {upfront.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Order total EGP {subtotal.toLocaleString()} · Remaining on delivery EGP {remainingOnDelivery.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">InstaPay number</p>
                  <p className="font-medium">{INSTAPAY_NUMBER}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">InstaPay handle</p>
                  <p className="font-medium">{INSTAPAY_HANDLE}</p>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="reference">InstaPay transaction ID for the 75% payment *</Label>
              <Input
                id="reference"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. 1234567890"
                maxLength={100}
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="proof">Screenshot of the 75% payment (optional but recommended)</Label>
              <input
                ref={fileInputRef}
                id="proof"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full justify-start"
              >
                {proofFile ? (
                  <><Check className="h-4 w-4 mr-2" />{proofFile.name}</>
                ) : (
                  <><Upload className="h-4 w-4 mr-2" />Upload screenshot</>
                )}
              </Button>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setStep("details")} disabled={submitting}>
                Back
              </Button>
              <Button
                type="button"
                size="lg"
                onClick={onConfirmPaid}
                disabled={submitting || !reference.trim()}
                className="flex-1"
              >
                {submitting ? "Submitting…" : "I Have Paid - Place Order"}
              </Button>
            </div>
          </div>
          )}

          <aside className="bg-muted/40 border border-border rounded-2xl p-6 h-fit space-y-4">
            <h2 className="font-serif text-xl">Order summary</h2>
            <div className="space-y-3">
              {items.map((it, i) => (
                <div key={i} className="flex justify-between gap-3 text-sm">
                  <span>{it.name} × {it.quantity}</span>
                  <span>EGP {(it.unitPrice * it.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-3 space-y-1 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>EGP {subtotal.toLocaleString()}</span></div>
              {promo && (
                <div className="flex justify-between text-primary">
                  <span>Promo ({promo.code})</span>
                  <span>− EGP {promo.discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between"><span>Shipping</span><span>EGP {SHIPPING.toLocaleString()}</span></div>
              <div className="flex justify-between font-serif text-lg pt-2"><span>Total</span><span className="text-primary">EGP {total.toLocaleString()}</span></div>
            </div>

            <div className="border-t border-border pt-3">
              {promo ? (
                <div className="flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1.5 text-primary"><Tag className="h-3 w-3" />{promo.code} applied</span>
                  <button type="button" className="underline text-muted-foreground" onClick={() => { setPromo(null); setPromoCode(""); }}>Remove</button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="Promo code"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="h-9 text-xs uppercase"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={applyPromo} disabled={promoApplying || !promoCode.trim()}>
                    {promoApplying ? "…" : "Apply"}
                  </Button>
                </div>
              )}
            </div>

            <div className="border-t border-border pt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pay now (75%)</span>
                <span className="font-medium text-primary">EGP {upfront.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Due on delivery (25% + shipping)</span>
                <span className="font-medium">EGP {remainingOnDelivery.toLocaleString()}</span>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </Layout>
  );
}
