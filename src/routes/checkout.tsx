import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
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
import qrImageFallback from "@/assets/instapay-qr.jpeg";
import { Upload, Check, Tag, MessageCircle } from "lucide-react";
import { resolveImage } from "@/lib/images";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — Suzy Wood" }] }),
  component: Checkout,
});

const SHIPPING = 1000;
const INSTAPAY_NUMBER = "01096313532";
const INSTAPAY_HANDLE = "axady@instapay";
const ADMIN_WHATSAPP = "201096313532";
const UPFRONT_RATE = 0.75;
const REMAINING_RATE = 0.25;
const UPFRONT_PERCENT = Math.round(UPFRONT_RATE * 100);
const REMAINING_PERCENT = Math.round(REMAINING_RATE * 100);

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
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrLoadFailed, setQrLoadFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("site_content")
        .select("value")
        .eq("key", "instapay_qr_url")
        .maybeSingle();
      if (cancelled) return;
      const v = (data?.value ?? "").trim();
      setQrUrl(v ? resolveImage(v) : null);
    })();
    return () => { cancelled = true; };
  }, []);
  const discount = promo?.discount ?? 0;
  const subtotalAfter = Math.max(0, subtotal - discount);
  const total = subtotalAfter + SHIPPING;
  const upfront = Math.round(subtotalAfter * UPFRONT_RATE);
  const remainingProduct = Math.max(0, subtotalAfter - upfront);
  const remainingOnDelivery = remainingProduct + SHIPPING;

  const applyPromo = async () => {
    const code = promoCode.trim().toUpperCase();
    if (!code) return;
    setPromoApplying(true);
    const { data, error } = await supabase
      .rpc("validate_promo_code", { _code: code, _subtotal: subtotal })
      .maybeSingle();
    setPromoApplying(false);
    if (error || !data) { toast.error("Invalid or expired promo code"); return; }
    const d = Number(data.discount_amount ?? 0);
    setPromo({ id: data.id, code: data.code, discount: d });
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

    let proofPath: string | null = null;
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
      proofPath = path;
    }

    const { data: rpc, error } = await supabase.rpc("create_order_with_items", {
      _details: {
        name: details.name, email: details.email, phone: details.phone,
        address: details.address, city: details.city,
        governorate: details.governorate, notes: details.notes,
      },
      _items: items.map((it) => ({
        product_id: it.productId,
        product_name: it.name,
        size: it.sizeLabel,
        finish: it.finishLabel,
        engraving: it.engraving || "",
        unit_price: it.unitPrice,
        quantity: it.quantity,
        custom_width_cm: it.customSize?.widthCm ?? "",
        custom_length_cm: it.customSize?.lengthCm ?? "",
        custom_surcharge: it.customSize?.surcharge ?? "",
      })),
      _upfront_rate: UPFRONT_RATE,
      _promo_code: promo?.code ?? "",
      _instapay_reference: reference.trim(),
      _payment_proof_path: proofPath ?? "",
    });

    setSubmitting(false);
    const order = Array.isArray(rpc) ? rpc[0] : rpc;
    if (error || !order) {
      toast.error("Couldn't place your order", { description: error?.message });
      return;
    }
    clear();
    // Fire-and-forget confirmation email
    sendPendingEmail({
      data: { orderId: order.id, instapayReference: reference.trim() },
    }).catch((e) => console.error("Pending email failed", e));
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
              Next step: pay <strong>EGP {upfront.toLocaleString()}</strong> upfront via{" "}
              <strong>InstaPay</strong> — this is {UPFRONT_PERCENT}% of the furniture total after discounts.
              Pay <strong>EGP {remainingOnDelivery.toLocaleString()}</strong> on delivery: {REMAINING_PERCENT}% furniture balance{" "}
              (EGP {remainingProduct.toLocaleString()}) + delivery (EGP {SHIPPING.toLocaleString()}).
            </div>

            <Button type="submit" size="lg" className="w-full">
              Continue to payment — Pay {UPFRONT_PERCENT}% now (EGP {upfront.toLocaleString()})
            </Button>
          </form>
          ) : (
          <div className="lg:col-span-2 space-y-5 bg-card border border-border rounded-2xl p-8">
            <div>
              <h2 className="font-serif text-2xl mb-1">Pay with InstaPay</h2>
              <p className="text-sm text-muted-foreground">
                Send exactly <strong className="text-foreground">EGP {upfront.toLocaleString()}</strong>{" "}
                using the QR below to confirm your order. This is {UPFRONT_PERCENT}% of the furniture total after discounts.
                On delivery, pay <strong className="text-foreground">EGP {remainingOnDelivery.toLocaleString()}</strong>: {REMAINING_PERCENT}% furniture balance{" "}
                (EGP {remainingProduct.toLocaleString()}) + delivery (EGP {SHIPPING.toLocaleString()}).
              </p>
            </div>

            <div className="grid sm:grid-cols-[200px_1fr] gap-5 items-start bg-muted/40 border border-border rounded-xl p-5">
              {qrLoadFailed || qrUrl === null ? (
                qrUrl === null ? (
                  <img
                    src={qrImageFallback}
                    alt="Suzy Wood InstaPay QR code"
                    className="w-full max-w-[200px] rounded-lg"
                  />
                ) : (
                  <div className="w-full max-w-[200px] rounded-lg border border-dashed border-border bg-muted/40 p-4 text-center">
                    <p className="text-sm text-foreground mb-3">
                      Payment QR code temporarily unavailable. Please contact us on WhatsApp.
                    </p>
                    <a
                      href={`https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent("Hi Suzy Wood, the InstaPay QR is not loading on checkout.")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-md bg-[oklch(0.38_0.055_50)] px-3 py-2 text-xs text-white hover:opacity-90"
                    >
                      <MessageCircle className="h-3.5 w-3.5" /> WhatsApp us
                    </a>
                  </div>
                )
              ) : (
                <img
                  src={qrUrl}
                  alt="Suzy Wood InstaPay QR code"
                  className="w-full max-w-[200px] rounded-lg"
                  onError={() => setQrLoadFailed(true)}
                  referrerPolicy="no-referrer"
                />
              )}
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Pay now ({UPFRONT_PERCENT}%)</p>
                  <p className="font-serif text-2xl text-primary">EGP {upfront.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Furniture total after discounts EGP {subtotalAfter.toLocaleString()} · On delivery EGP {remainingOnDelivery.toLocaleString()}
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
              <Label htmlFor="reference">InstaPay transaction ID for the {UPFRONT_PERCENT}% payment *</Label>
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
              <Label htmlFor="proof">Screenshot of the {UPFRONT_PERCENT}% payment (optional but recommended)</Label>
              <input
                ref={fileInputRef}
                id="proof"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  if (f && f.size > 3 * 1024 * 1024) {
                    toast.error("Screenshot is too large", {
                      description: "Please upload an image under 3MB.",
                    });
                    e.target.value = "";
                    return;
                  }
                  setProofFile(f);
                }}
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
                <span className="text-muted-foreground">Pay now ({UPFRONT_PERCENT}% furniture)</span>
                <span className="font-medium text-primary">EGP {upfront.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Furniture balance ({REMAINING_PERCENT}%)</span>
                <span className="font-medium">EGP {remainingProduct.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery</span>
                <span className="font-medium">EGP {SHIPPING.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <span className="text-muted-foreground">Due on delivery</span>
                <span className="font-medium">EGP {remainingOnDelivery.toLocaleString()}</span>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </Layout>
  );
}
