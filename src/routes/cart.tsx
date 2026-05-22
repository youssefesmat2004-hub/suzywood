import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/site/Layout";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Cart — Suzy Wood" }] }),
  component: Cart,
});

const SHIPPING = 1000;

function Cart() {
  const { items, remove, setQuantity, subtotal } = useCart();
  const total = subtotal + (items.length > 0 ? SHIPPING : 0);

  return (
    <Layout>
      <section className="container mx-auto px-6 lg:px-10 py-16 max-w-4xl">
        <h1 className="font-serif text-5xl mb-10">Your Cart</h1>
        {items.length === 0 ? (
          <div className="border border-border rounded-2xl p-12 text-center">
            <p className="text-muted-foreground">Your cart is empty.</p>
            <Button asChild className="mt-6"><Link to="/shop">Browse the Collection</Link></Button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-4">
              {items.map((it, idx) => (
                <div key={idx} className="flex gap-4 border border-border rounded-2xl p-4 bg-card">
                  <img src={it.image} alt={it.name} className="h-24 w-24 rounded-xl object-cover" />
                  <div className="flex-1">
                    <p className="font-serif text-lg">{it.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {it.sizeLabel}
                      {it.finishLabel && ` · ${it.finishLabel}`}
                      {it.engraving && ` · "${it.engraving}"`}
                      {it.customSize && ` (+EGP ${it.customSize.surcharge.toLocaleString()} custom)`}
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                      <input type="number" min={1} value={it.quantity} onChange={(e) => setQuantity(idx, Number(e.target.value) || 1)} className="w-16 h-8 rounded-md border border-input px-2 text-sm" />
                      <button onClick={() => remove(idx)} aria-label="Remove" className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                  <p className="font-serif text-lg text-primary">EGP {(it.unitPrice * it.quantity).toLocaleString()}</p>
                </div>
              ))}
            </div>
            <aside className="bg-muted/40 border border-border rounded-2xl p-6 h-fit space-y-4">
              <div className="flex justify-between text-sm"><span>Subtotal</span><span>EGP {subtotal.toLocaleString()}</span></div>
              <div className="flex justify-between text-sm"><span>Shipping</span><span>EGP {SHIPPING.toLocaleString()}</span></div>
              <div className="border-t border-border pt-4 flex justify-between"><span className="font-serif text-lg">Total</span><span className="font-serif text-xl text-primary">EGP {total.toLocaleString()}</span></div>
              <Button asChild size="lg" className="w-full"><Link to="/checkout">Proceed to Checkout</Link></Button>
            </aside>
          </div>
        )}
      </section>
    </Layout>
  );
}
