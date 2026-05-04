import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Layout } from "@/components/site/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — Suzy Wood" }] }),
  component: Checkout,
});

const SHIPPING = 1000;

function Checkout() {
  const { items, subtotal, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const total = subtotal + SHIPPING;

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (items.length === 0) return;
    const fd = new FormData(e.currentTarget);
    setSubmitting(true);

    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        user_id: user?.id ?? null,
        customer_name: String(fd.get("name")),
        customer_email: String(fd.get("email")),
        customer_phone: String(fd.get("phone")),
        shipping_address: String(fd.get("address")),
        shipping_city: String(fd.get("city")),
        shipping_governorate: String(fd.get("governorate")),
        shipping_notes: String(fd.get("notes") ?? "") || null,
        subtotal,
        shipping_fee: SHIPPING,
        total,
        payment_method: "pending",
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
      })),
    );

    setSubmitting(false);
    if (itemsError) {
      toast.error("Couldn't save your items", { description: itemsError.message });
      return;
    }
    clear();
    toast.success(`Order ${order.order_number} placed`, { description: "We'll contact you shortly to confirm payment." });
    navigate({ to: "/account" });
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
        <h1 className="font-serif text-5xl mb-10">Checkout</h1>
        <div className="grid lg:grid-cols-3 gap-10">
          <form onSubmit={onSubmit} className="lg:col-span-2 space-y-5 bg-card border border-border rounded-2xl p-8">
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="space-y-1"><Label htmlFor="name">Full name</Label><Input id="name" name="name" required maxLength={100} defaultValue={user?.user_metadata?.full_name ?? ""} /></div>
              <div className="space-y-1"><Label htmlFor="phone">Phone</Label><Input id="phone" name="phone" type="tel" required maxLength={20} defaultValue={user?.user_metadata?.phone ?? ""} /></div>
            </div>
            <div className="space-y-1"><Label htmlFor="email">Email</Label><Input id="email" type="email" name="email" required defaultValue={user?.email ?? ""} /></div>
            <div className="space-y-1"><Label htmlFor="address">Address</Label><Textarea id="address" name="address" required maxLength={500} rows={2} /></div>
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="space-y-1"><Label htmlFor="city">City / Area</Label><Input id="city" name="city" required maxLength={100} placeholder="e.g. New Cairo" /></div>
              <div className="space-y-1"><Label htmlFor="governorate">Governorate</Label><Input id="governorate" name="governorate" required maxLength={100} placeholder="e.g. Cairo" /></div>
            </div>
            <div className="space-y-1"><Label htmlFor="notes">Delivery notes (optional)</Label><Textarea id="notes" name="notes" maxLength={500} rows={2} /></div>

            <div className="rounded-xl bg-muted/50 border border-border p-4 text-sm text-muted-foreground">
              Pay easily via <strong>Instapay</strong> (number <strong>01096313532</strong> or scan our QR on the{" "}
              <Link to="/payment" className="underline text-primary">payment page</Link>). Card payments coming soon —
              we'll contact you on WhatsApp to confirm your order.
            </div>

            <Button type="submit" size="lg" disabled={submitting} className="w-full">
              {submitting ? "Placing order…" : `Place Order — EGP ${total.toLocaleString()}`}
            </Button>
          </form>

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
              <div className="flex justify-between"><span>Shipping</span><span>EGP {SHIPPING.toLocaleString()}</span></div>
              <div className="flex justify-between font-serif text-lg pt-2"><span>Total</span><span className="text-primary">EGP {total.toLocaleString()}</span></div>
            </div>
          </aside>
        </div>
      </section>
    </Layout>
  );
}
