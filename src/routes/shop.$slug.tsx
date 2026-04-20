import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Layout } from "@/components/site/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/lib/types";
import { asOptions } from "@/lib/types";
import { resolveImage, resolveGallery } from "@/lib/images";
import { Reviews } from "@/components/site/Reviews";
import { WishlistButton } from "@/components/site/WishlistButton";
import { useCart } from "@/lib/cart";
import { Check, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/shop/$slug")({
  loader: async ({ params }) => {
    const { data } = await supabase.from("products").select("*").eq("slug", params.slug).eq("is_active", true).maybeSingle();
    if (!data) throw notFound();
    return { product: data as Product };
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
  const { product } = Route.useLoaderData();
  const navigate = useNavigate();
  const cart = useCart();
  const sizes = asOptions(product.sizes);
  const finishes = asOptions(product.finishes);
  const gallery = resolveGallery(product.gallery);
  const [active, setActive] = useState(0);
  const [size, setSize] = useState(sizes[0]?.value ?? "");
  const [finish, setFinish] = useState(finishes[0]?.value ?? "");
  const [engraving, setEngraving] = useState("");

  const addToCart = () => {
    const sizeLabel = sizes.find((s) => s.value === size)?.label ?? "";
    const finishLabel = finishes.find((f) => f.value === finish)?.label ?? "";
    cart.add({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: resolveImage(product.image_url),
      size, sizeLabel, finish, finishLabel,
      engraving: engraving.slice(0, 20),
      unitPrice: product.starting_price,
      quantity: 1,
    });
    toast.success("Added to cart", { description: `${product.name}`, action: { label: "View cart", onClick: () => navigate({ to: "/cart" }) } });
  };

  return (
    <Layout>
      <div className="container mx-auto px-6 lg:px-10 py-12 lg:py-16">
        <Link to="/shop" className="text-xs uppercase tracking-[0.22em] text-muted-foreground hover:text-primary">← Back to collection</Link>

        <div className="mt-8 grid lg:grid-cols-2 gap-12 lg:gap-16">
          <div>
            <div className="aspect-square rounded-3xl overflow-hidden bg-muted shadow-card">
              <img src={gallery[active] ?? resolveImage(product.image_url)} alt={product.name} width={1024} height={1024} className="h-full w-full object-cover" />
            </div>
            {gallery.length > 1 && (
              <div className="mt-4 flex gap-3">
                {gallery.map((src, i) => (
                  <button key={i} onClick={() => setActive(i)} className={`h-20 w-20 rounded-xl overflow-hidden border-2 transition-all ${active === i ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"}`}>
                    <img src={src} alt="" loading="lazy" width={160} height={160} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-7">
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/15 text-secondary text-[11px] uppercase tracking-[0.22em]">
                <Check className="h-3 w-3" /> Make-to-Order · Ships in {product.lead_time_weeks} Weeks
              </span>
              <h1 className="font-serif text-4xl md:text-5xl mt-5">{product.name}</h1>
              {product.tagline && <p className="mt-3 text-muted-foreground">{product.tagline}</p>}
              <p className="mt-6 font-serif text-3xl text-primary">From EGP {product.starting_price.toLocaleString()}</p>
            </div>

            {product.description && <p className="text-foreground/80 leading-relaxed">{product.description}</p>}

            <div className="space-y-5 pt-2 border-t border-border">
              {sizes.length > 0 && (
                <div className="space-y-2 pt-5">
                  <Label>Size</Label>
                  <Select value={size} onValueChange={setSize}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {sizes.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {finishes.length > 0 && (
                <div className="space-y-2">
                  <Label>Wood Finish</Label>
                  <Select value={finish} onValueChange={setFinish}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {finishes.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="engrave">Add baby's name for custom engraving (optional)</Label>
                <Input id="engrave" value={engraving} onChange={(e) => setEngraving(e.target.value)} maxLength={20} placeholder="e.g. Layla" />
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <div className="flex gap-3">
                <Button size="lg" className="flex-1" onClick={addToCart}>
                  <ShoppingBag className="h-4 w-4 mr-2" /> Add to Cart
                </Button>
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
      </div>
    </Layout>
  );
}
