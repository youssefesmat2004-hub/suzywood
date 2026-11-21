import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/site/Layout";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { areAllItemsOrderable, isOrderingAllowed } from "@/lib/store-hold";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Cart — Suzy Wood" },
      { name: "description", content: "Review the handcrafted pieces in your Suzy Wood cart and continue to secure checkout with delivery across Egypt." },
      { property: "og:title", content: "Your Cart — Suzy Wood" },
      { property: "og:description", content: "Review your selected Suzy Wood pieces before checkout." },
      { property: "og:url", content: "https://suzywoodofficial.com/cart" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "https://suzywoodofficial.com/cart" }],
  }),
  component: Cart,
});

function Cart() {
  const { items, remove, setQuantity } = useCart();
  const { t } = useI18n();
  const allItemsOrderable = areAllItemsOrderable(items);

  return (
    <Layout>
      <section className="container mx-auto px-6 lg:px-10 py-16 max-w-4xl">
        <h1 className="font-serif text-5xl mb-10">{t("cart.title", "Your Cart")}</h1>
        {items.length === 0 ? (
          <div className="border border-border rounded-2xl p-12 text-center">
            <p className="text-muted-foreground">{t("checkout.cartEmpty", "Your cart is empty.")}</p>
            <Button asChild className="mt-6"><Link to="/shop">{t("checkout.browseCollection", "Browse the Collection")}</Link></Button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-4">
              {items.map((it, idx) => {
                const orderable = isOrderingAllowed(it.slug);
                return (
                  <div key={idx} className="flex gap-4 border border-border rounded-2xl p-4 bg-card">
                    <img src={it.image} alt={it.name} className="h-24 w-24 rounded-xl object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="font-serif text-lg">{it.name}</p>
                      {!orderable && (
                        <p className="mt-1 text-xs font-medium text-destructive">{t("checkout.orderingPaused", "Price update in progress")}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {it.sizeLabel}
                        {it.finishLabel && ` · ${it.finishLabel}`}
                        {it.engraving && ` · "${it.engraving}"`}
                        {it.customSize && ` · ${t("checkout.customSize", "Custom size")}`}
                      </p>
                      <div className="mt-3 flex items-center gap-3">
                        <input aria-label={t("checkout.quantityAria", "Quantity")} type="number" min={1} value={it.quantity} onChange={(e) => setQuantity(idx, Number(e.target.value) || 1)} className="w-16 h-8 rounded-md border border-input px-2 text-sm" />
                        <button onClick={() => remove(idx)} aria-label={t("checkout.removeAria", "Remove")} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <aside className="bg-muted/40 border border-border rounded-2xl p-6 h-fit space-y-4">
              <h2 className="font-serif text-xl">{t("checkout.orderSummary", "Order summary")}</h2>
              <p className="text-sm text-muted-foreground">{t("checkout.pricesHiddenNotice", "Prices are hidden while we update our catalog. The payment amount for available items is shown at checkout.")}</p>
              <p className="text-xs text-muted-foreground">{t("checkout.deliveryNote", "Delivery fee calculated at checkout based on your area.")}</p>
              {allItemsOrderable ? (
                <Button asChild size="lg" className="w-full"><Link to="/checkout">{t("checkout.proceedToCheckout", "Proceed to Checkout")}</Link></Button>
              ) : (
                <div className="space-y-3 border-t border-border pt-4">
                  <p className="text-sm text-muted-foreground">{t("checkout.removePausedItems", "Remove paused items to check out with the tent, bundle, swing, or rocking chair.")}</p>
                  <Button size="lg" className="w-full" disabled>{t("checkout.checkoutUnavailable", "Checkout unavailable")}</Button>
                </div>
              )}
            </aside>
          </div>
        )}
      </section>
    </Layout>
  );
}
