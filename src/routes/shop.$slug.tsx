import { createFileRoute, Link, notFound, useNavigate, useRouter } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Layout } from "@/components/site/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/lib/types";
import { asOptions } from "@/lib/types";
import { resolveImage, resolveGallery } from "@/lib/images";
import { Reviews } from "@/components/site/Reviews";
import { ProductCard } from "@/components/site/ProductCard";
import { WishlistButton } from "@/components/site/WishlistButton";
import { useCart } from "@/lib/cart";
import { Check, ShoppingBag, Minus, Plus } from "lucide-react";
import { toast } from "sonner";

type Variant = {
  id: string;
  name: string;
  price: number;
  stock_quantity: number;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
};

function ProductError({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();

  return (
    <Layout>
      <div className="container mx-auto px-6 py-32 text-center">
        <h1 className="font-serif text-4xl">This product could not load</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">Please try again in a moment.</p>
        {import.meta.env.DEV && <p className="mt-3 text-xs text-destructive">{error.message}</p>}
        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Try again
          </button>
          <Link to="/shop" className="text-primary border-b border-primary">Back to collection</Link>
        </div>
      </div>
    </Layout>
  );
}

export const Route = createFileRoute("/shop/$slug")({
  loader: async ({ params }) => {
    const { data } = await supabase.from("products").select("*").eq("slug", params.slug).eq("is_active", true).maybeSingle();
    if (!data) throw notFound();
    const product = data as Product;
    const [{ data: variants }, { data: related }, { data: cat }] = await Promise.all([
      supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", product.id)
        .eq("is_active", true)
        .order("sort_order"),
      supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .eq("category_id", product.category_id)
        .neq("id", product.id)
        .limit(4),
      supabase
        .from("categories")
        .select("custom_size_enabled,custom_size_surcharge,custom_size_note")
        .eq("id", product.category_id)
        .maybeSingle(),
    ]);
    return {
      product,
      variants: (variants ?? []) as Variant[],
      related: (related ?? []) as Product[],
      category: (cat ?? null) as {
        custom_size_enabled: boolean;
        custom_size_surcharge: number;
        custom_size_note: string | null;
      } | null,
    };
  },
  head: ({ loaderData }) => {
    const p = loaderData?.product;
    if (!p) return { meta: [{ title: "Piece not found — Suzy Wood" }] };
    const img = resolveImage(p.image_url);
    return {
      meta: [
        { title: `${p.name} — Suzy Wood` },
        { name: "description", content: p.tagline ?? "" },
        { property: "og:title", content: `${p.name} — Suzy Wood` },
        { property: "og:description", content: p.tagline ?? "" },
        { property: "og:image", content: img },
        { name: "twitter:image", content: img },
      ],
    };
  },
  component: ProductPage,
  errorComponent: ProductError,
  notFoundComponent: () => (
    <Layout>
      <div className="container mx-auto px-6 py-32 text-center">
        <h1 className="font-serif text-4xl">Piece not found</h1>
        <Link to="/shop" className="mt-6 inline-block text-primary border-b border-primary">Back to collection</Link>
      </div>
    </Layout>
  ),
});

function ProductPage() {
  const { product, variants, related, category } = Route.useLoaderData() as {
    product: Product;
    variants: Variant[];
    related: Product[];
    category: {
      custom_size_enabled: boolean;
      custom_size_surcharge: number;
      custom_size_note: string | null;
    } | null;
  };
  const navigate = useNavigate();
  const cart = useCart();
  const sizes = asOptions(product.sizes);
  const finishes = asOptions(product.finishes);
  const gallery = resolveGallery(product.gallery);
  const [size, setSize] = useState(sizes[0]?.value ?? "");
  const [finish, setFinish] = useState(finishes[0]?.value ?? "");
  const [engraving, setEngraving] = useState("");
  const [variantId, setVariantId] = useState<string>(variants[0]?.id ?? "");
  const [customMode, setCustomMode] = useState(false);
  const [customWidth, setCustomWidth] = useState<string>("");
  const [customLength, setCustomLength] = useState<string>("");
  const [qty, setQty] = useState(1);
  const [active, setActive] = useState(0);

  const selectedVariant = useMemo(
    () => (customMode ? null : variants.find((v) => v.id === variantId) ?? null),
    [variants, variantId, customMode],
  );

  // Combine product gallery with variant image (variant image leads when selected)
  const images = useMemo(() => {
    const base = gallery.length > 0 ? gallery : [resolveImage(product.image_url)];
    if (selectedVariant?.image_url) {
      const variantImg = resolveImage(selectedVariant.image_url);
      return [variantImg, ...base.filter((s) => s !== variantImg)];
    }
    return base;
  }, [gallery, selectedVariant, product.image_url]);

  const customSurcharge = Number(category?.custom_size_surcharge ?? 0);
  const customEnabled = !!category?.custom_size_enabled;
  const stock = customMode ? 99 : (selectedVariant ? selectedVariant.stock_quantity : (product.stock_quantity ?? 99));
  const soldOut = !customMode && stock <= 0;
  const unitPrice = customMode
    ? product.starting_price + customSurcharge
    : (selectedVariant ? selectedVariant.price : product.starting_price);

  const stockBadge = soldOut
    ? { label: "Sold out", className: "bg-destructive/10 text-destructive" }
    : stock <= 5
      ? { label: `Only ${stock} left`, className: "bg-amber-500/15 text-amber-700" }
      : { label: "In stock", className: "bg-secondary/15 text-secondary" };

  const addToCart = () => {
    if (soldOut) return;
    if (customMode) {
      const w = Number(customWidth);
      const l = Number(customLength);
      if (!w || !l || w <= 0 || l <= 0) {
        toast.error("Enter width and length in cm");
        return;
      }
      const customLabel = `Custom: ${w} x ${l} cm`;
      cart.add({
        productId: product.id,
        slug: product.slug,
        name: product.name + ` · ${customLabel}`,
        image: resolveImage(product.image_url),
        size: customLabel, sizeLabel: customLabel, finish: "", finishLabel: "",
        engraving: engraving.slice(0, 20),
        unitPrice,
        quantity: qty,
        customSize: { widthCm: w, lengthCm: l, surcharge: customSurcharge },
      });
      toast.success("Added to cart", { description: `${product.name} · ${customLabel} × ${qty}` });
      return;
    }
    const sizeLabel = sizes.find((s) => s.value === size)?.label ?? "";
    const finishLabel = finishes.find((f) => f.value === finish)?.label ?? "";
    const variantSuffix = selectedVariant ? ` · ${selectedVariant.name}` : "";
    cart.add({
      productId: product.id,
      slug: product.slug,
      name: product.name + variantSuffix,
      image: selectedVariant?.image_url ? resolveImage(selectedVariant.image_url) : resolveImage(product.image_url),
      size, sizeLabel, finish, finishLabel,
      engraving: engraving.slice(0, 20),
      unitPrice,
      quantity: qty,
    });
    toast.success("Added to cart", { description: `${product.name}${variantSuffix} × ${qty}`, action: { label: "View cart", onClick: () => navigate({ to: "/cart" }) } });
  };

  return (
    <Layout>
      <div className="container mx-auto px-6 lg:px-10 py-12 lg:py-16">
        <Link to="/shop" className="text-xs uppercase tracking-[0.22em] text-muted-foreground hover:text-primary">← Back to collection</Link>

        <div className="mt-8 grid lg:grid-cols-2 gap-12 lg:gap-16">
          <div>
            <div className="aspect-square rounded-3xl overflow-hidden bg-muted shadow-card">
              <img src={images[active] ?? images[0]} alt={product.name} width={1024} height={1024} className="h-full w-full object-cover" />
            </div>
            {images.length > 1 && (
              <div className="mt-4 flex gap-3">
                {images.map((src, i) => (
                  <button key={i} onClick={() => setActive(i)} className={`h-20 w-20 rounded-xl overflow-hidden border-2 transition-all ${active === i ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"}`}>
                    <img src={src} alt="" loading="lazy" width={160} height={160} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-7">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/15 text-secondary text-[11px] uppercase tracking-[0.22em]">
                  <Check className="h-3 w-3" /> Make-to-Order · {product.lead_time_weeks} Weeks
                </span>
                <span className={`px-3 py-1 rounded-full text-[11px] uppercase tracking-[0.22em] ${stockBadge.className}`}>
                  {stockBadge.label}
                </span>
              </div>
              <h1 className="font-serif text-4xl md:text-5xl mt-5">{product.name}</h1>
              {product.tagline && <p className="mt-3 text-muted-foreground">{product.tagline}</p>}
              <p className="mt-6 font-serif text-3xl text-primary">
                {selectedVariant ? "" : "From "}EGP {unitPrice.toLocaleString()}
              </p>
            </div>

            {product.description && <p className="text-foreground/80 leading-relaxed">{product.description}</p>}

            <div className="space-y-5 pt-2 border-t border-border">
              {variants.length > 0 && (
                <div className="space-y-2 pt-5">
                  <Label>Select Size</Label>
                  <div className="flex flex-wrap gap-2">
                    {variants.map((v) => {
                      const isSel = !customMode && v.id === variantId;
                      const out = v.stock_quantity <= 0;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => { setVariantId(v.id); setCustomMode(false); setActive(0); }}
                          disabled={out}
                          className={`px-4 py-2 rounded-full border text-sm transition-colors ${isSel ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"} ${out ? "opacity-50 line-through cursor-not-allowed" : ""}`}
                        >
                          {v.name} — EGP {Number(v.price).toLocaleString()}{out ? " (Out of stock)" : ""}
                        </button>
                      );
                    })}
                    {customEnabled && (
                      <button
                        type="button"
                        onClick={() => setCustomMode(true)}
                        className={`px-4 py-2 rounded-full border text-sm transition-colors ${customMode ? "border-primary bg-primary text-primary-foreground" : "border-dashed border-border hover:border-primary"}`}
                      >
                        ✏️ Custom Size — +{customSurcharge.toLocaleString()} EGP
                      </button>
                    )}
                  </div>
                  {customMode && (
                    <div className="mt-3 rounded-xl border border-dashed border-primary/40 bg-muted/30 p-4 space-y-3">
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Width (cm)</Label>
                          <Input type="number" min={1} value={customWidth} onChange={(e) => setCustomWidth(e.target.value)} placeholder="e.g. 110" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Length (cm)</Label>
                          <Input type="number" min={1} value={customLength} onChange={(e) => setCustomLength(e.target.value)} placeholder="e.g. 55" />
                        </div>
                      </div>
                      {category?.custom_size_note && (
                        <p className="text-xs text-muted-foreground italic">{category.custom_size_note}</p>
                      )}
                      {customWidth && customLength && (
                        <p className="text-xs">
                          Custom size: <strong>{customWidth} x {customLength} cm</strong> — Additional charge: <strong>{customSurcharge.toLocaleString()} EGP</strong>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
              {sizes.length > 0 && (
                <div className={`space-y-2 ${variants.length === 0 ? "pt-5" : ""}`}>
                  <Label>Size</Label>
                  <div className="flex flex-wrap gap-2">
                    {sizes.map((s) => (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => setSize(s.value)}
                        className={`px-4 py-2 rounded-full border text-sm transition-colors ${size === s.value ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"}`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {finishes.length > 0 && (
                <div className="space-y-2">
                  <Label>Wood Finish</Label>
                  <div className="flex flex-wrap gap-2">
                    {finishes.map((f) => (
                      <button
                        key={f.value}
                        type="button"
                        onClick={() => setFinish(f.value)}
                        className={`px-4 py-2 rounded-full border text-sm transition-colors ${finish === f.value ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"}`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="engrave">Add baby's name for custom engraving (optional)</Label>
                <Input id="engrave" value={engraving} onChange={(e) => setEngraving(e.target.value)} maxLength={20} placeholder="e.g. Layla" />
              </div>

              <div className="space-y-2">
                <Label>Quantity</Label>
                <div className="inline-flex items-center rounded-full border border-border">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    disabled={qty <= 1 || soldOut}
                    className="h-10 w-10 inline-flex items-center justify-center hover:bg-muted disabled:opacity-40 rounded-l-full"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-12 text-center text-sm tabular-nums">{qty}</span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    onClick={() => setQty((q) => Math.min(stock || 99, q + 1))}
                    disabled={soldOut || qty >= stock}
                    className="h-10 w-10 inline-flex items-center justify-center hover:bg-muted disabled:opacity-40 rounded-r-full"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <div className="flex gap-3">
                {soldOut ? (
                  <Button size="lg" className="flex-1" disabled variant="secondary">
                    Sold Out
                  </Button>
                ) : (
                  <Button size="lg" className="flex-1" onClick={addToCart}>
                    <ShoppingBag className="h-4 w-4 mr-2" /> Add to Cart
                  </Button>
                )}
                <WishlistButton productId={product.id} />
              </div>
              <Button asChild size="lg" variant="outline" className="w-full">
                <Link to="/custom-builds">Need a specific size? Request a Custom Build</Link>
              </Button>
            </div>

            <p className="text-xs text-muted-foreground pt-4 border-t border-border">
              Flat 1,000 EGP delivery across all governorates of Egypt.
            </p>
          </div>
        </div>

        <div className="mt-20">
          <Tabs defaultValue="safety">
            <TabsList>
              <TabsTrigger value="safety">Safety & Materials</TabsTrigger>
              <TabsTrigger value="care">Care</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>
            <TabsContent value="safety" className="pt-6 max-w-3xl space-y-4 text-foreground/80 leading-relaxed">
              {product.materials && (<><h3 className="font-serif text-xl">Materials</h3><p>{product.materials}</p></>)}
              {product.safety_info && (<><h3 className="font-serif text-xl mt-6">Safety</h3><p>{product.safety_info}</p></>)}
            </TabsContent>
            <TabsContent value="care" className="pt-6 max-w-3xl text-foreground/80 leading-relaxed">
              <p>{product.care_info ?? "Wipe with a damp cloth. Keep out of direct sunlight."}</p>
            </TabsContent>
            <TabsContent value="reviews" className="pt-6 max-w-3xl">
              <Reviews productId={product.id} />
            </TabsContent>
          </Tabs>
        </div>

        {related.length > 0 && (
          <section className="mt-24 pt-12 border-t border-border">
            <div className="flex items-end justify-between gap-4 mb-8">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-secondary mb-2">You may also like</p>
                <h2 className="font-serif text-3xl md:text-4xl">More from this collection</h2>
              </div>
              <Link to="/shop" className="text-sm border-b border-primary pb-0.5 hover:opacity-70">View all →</Link>
            </div>
            <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
              {related.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
}
