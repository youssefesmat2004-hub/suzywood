import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { Layout } from "@/components/site/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { getProduct, type Product } from "@/lib/products";
import { Check, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/shop/$slug")({
  loader: ({ params }) => {
    const product = getProduct(params.slug);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => {
    const p = loaderData?.product;
    if (!p) return { meta: [{ title: "Piece not found — Suzy Wood" }] };
    return {
      meta: [
        { title: `${p.name} — Suzy Wood` },
        { name: "description", content: p.tagline },
        { property: "og:title", content: `${p.name} — Suzy Wood` },
        { property: "og:description", content: p.tagline },
        { property: "og:image", content: p.image },
        { name: "twitter:image", content: p.image },
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
  const { product } = Route.useLoaderData() as { product: Product };
  const [active, setActive] = useState(0);
  const [size, setSize] = useState(product.sizes[0].value);
  const [finish, setFinish] = useState(product.finishes[0].value);

  return (
    <Layout>
      <div className="container mx-auto px-6 lg:px-10 py-12 lg:py-16">
        <Link to="/shop" className="text-xs uppercase tracking-[0.22em] text-muted-foreground hover:text-primary">
          ← Back to collection
        </Link>

        <div className="mt-8 grid lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Gallery */}
          <div>
            <div className="aspect-square rounded-3xl overflow-hidden bg-muted shadow-card">
              <img
                src={product.gallery[active]}
                alt={product.name}
                width={1024}
                height={1024}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="mt-4 flex gap-3">
              {product.gallery.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`h-20 w-20 rounded-xl overflow-hidden border-2 transition-all ${
                    active === i ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={src} alt="" loading="lazy" width={160} height={160} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Details */}
          <div className="space-y-7">
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/15 text-secondary text-[11px] uppercase tracking-[0.22em]">
                <Check className="h-3 w-3" />
                Make-to-Order · Ships in 3–4 Weeks
              </span>
              <h1 className="font-serif text-4xl md:text-5xl mt-5">{product.name}</h1>
              <p className="mt-3 text-muted-foreground">{product.tagline}</p>
              <p className="mt-6 font-serif text-3xl text-primary">
                From EGP {product.startingPrice.toLocaleString()}
              </p>
            </div>

            <p className="text-foreground/80 leading-relaxed">{product.description}</p>

            <div className="space-y-5 pt-2 border-t border-border">
              <div className="space-y-2 pt-5">
                <Label>Size</Label>
                <Select value={size} onValueChange={setSize}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {product.sizes.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Wood Finish</Label>
                <Select value={finish} onValueChange={setFinish}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {product.finishes.map((f) => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="engrave">Add baby's name for custom engraving (optional)</Label>
                <Input id="engrave" maxLength={20} placeholder="e.g. Layla" />
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <Button
                size="lg"
                className="w-full"
                onClick={() => toast.success("Added to cart", { description: `${product.name} • ${size} • ${finish}` })}
              >
                <ShoppingBag className="h-4 w-4 mr-2" /> Add to Cart
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full">
                <Link to="/custom-builds">Need a specific size? Request a Custom Build</Link>
              </Button>
            </div>

            <p className="text-xs text-muted-foreground pt-4 border-t border-border">
              Free white-glove delivery to New Cairo & Sheikh Zayed. Delivery across Egypt available.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
