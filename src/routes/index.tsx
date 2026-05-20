import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/site/Layout";
import { ValueBar } from "@/components/site/ValueBar";
import { CustomerReviews } from "@/components/site/CustomerReviews";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/lib/types";
import { asOptions } from "@/lib/types";
import { resolveImage } from "@/lib/images";
import { ArrowUpRight, Plus } from "lucide-react";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";
import hero from "@/assets/hero-nursery.jpg";
import craft from "@/assets/craft-story.jpg";
import cribBanner from "@/assets/crib-aurora.jpg";
import { useSiteContent } from "@/lib/site-content";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Suzy Wood — Handcrafted Kids Interiors" },
      { name: "description", content: "Crafting safe, beautiful spaces for your little ones. Solid wood, non-toxic, made to order in Cairo." },
      { property: "og:title", content: "Suzy Wood — Handcrafted Kids Interiors" },
      { property: "og:description", content: "Heirloom-quality nursery furniture, made to order." },
    ],
  }),
  loader: async () => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .eq("category_id", "c387b0a0-fbb9-48be-b16e-9c2158e9e794")
      .order("is_featured", { ascending: false })
      .order("starting_price");
    return { cribs: (data ?? []) as Product[] };
  },
  component: Index,
});

function Index() {
  const { cribs } = Route.useLoaderData() as { cribs: Product[] };
  const content = useSiteContent();
  const cart = useCart();
  const heroTitle = content.hero_title || "Crafting safe, beautiful spaces for your little ones.";
  const heroSubtitle = content.hero_subtitle || "Solid-wood nursery and toddler furniture, hand-built to order in our studio — designed to live with your family for years, not seasons.";

  const quickAdd = (e: React.MouseEvent, p: Product) => {
    e.preventDefault();
    e.stopPropagation();
    const sizes = asOptions(p.sizes);
    const finishes = asOptions(p.finishes);
    const size = sizes[0];
    const finish = finishes[0];
    cart.add({
      productId: p.id,
      slug: p.slug,
      name: p.name,
      image: resolveImage(p.image_url),
      size: size?.value ?? "",
      sizeLabel: size?.label ?? "",
      finish: finish?.value ?? "",
      finishLabel: finish?.label ?? "",
      engraving: "",
      unitPrice: p.starting_price,
      quantity: 1,
    });
    toast.success("Added to cart", {
      description: `${p.name}${size ? ` · ${size.label}` : ""}${finish ? ` · ${finish.label}` : ""}`,
    });
  };
  return (
    <Layout>
      <section className="relative">
        <div className="container mx-auto px-6 lg:px-10 pt-12 lg:pt-16">
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-5 space-y-7">
              <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-secondary">
                <span className="h-px w-8 bg-secondary" /> Est. 2018 · Cairo
              </span>
              <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl leading-[1.05] text-balance">
                {heroTitle}
              </h1>
              <p className="text-lg text-muted-foreground max-w-md leading-relaxed">
                {heroSubtitle}
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Button asChild size="lg"><Link to="/shop">Shop the Collection</Link></Button>
                <Button asChild size="lg" variant="outline"><Link to="/custom-builds">Request Custom Build</Link></Button>
              </div>
            </div>
            <div className="lg:col-span-7 relative">
              <div className="relative aspect-[5/6] lg:aspect-[4/5] rounded-3xl overflow-hidden shadow-elegant">
                <img src={hero} alt="Beautifully styled neutral-toned nursery with a handcrafted oak crib" width={1920} height={1280} className="h-full w-full object-cover" />
              </div>
              <div className="hidden lg:block absolute -bottom-8 -left-8 bg-card border border-border rounded-2xl p-5 shadow-card max-w-[220px]">
                <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Lead time</p>
                <p className="font-serif text-xl mt-1">3–4 weeks</p>
                <p className="text-xs text-muted-foreground mt-1">From workshop to your nursery</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-20 lg:mt-28"><ValueBar /></div>

      <section className="container mx-auto px-6 lg:px-10 py-24">
        <div className="mb-10 aspect-[16/7] rounded-3xl overflow-hidden shadow-card">
          <img src={cribBanner} alt="Handcrafted nursery crib in a beautifully styled room" className="h-full w-full object-cover" />
        </div>
        <div className="flex flex-wrap items-end justify-between gap-6 mb-12">
          <div className="max-w-xl">
            <p className="text-[11px] uppercase tracking-[0.28em] text-secondary mb-3">Our Cribs</p>
            <h2 className="font-serif text-4xl md:text-5xl">Choose the perfect crib for your nursery.</h2>
          </div>
          <Link to="/shop/category/$slug" params={{ slug: "nursery" }} className="text-sm border-b border-primary pb-0.5 hover:opacity-70">View all cribs →</Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {cribs.map((p) => (
            <Link
              key={p.id}
              to="/shop/$slug"
              params={{ slug: p.slug }}
              className="group flex flex-col bg-card rounded-2xl overflow-hidden shadow-soft hover:shadow-elegant transition-all duration-500 border border-border/60"
            >
              <div className="relative aspect-square overflow-hidden bg-muted">
                <img
                  src={resolveImage(p.image_url)}
                  alt={p.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <button
                  type="button"
                  onClick={(e) => quickAdd(e, p)}
                  aria-label={`Quick add ${p.name} to cart`}
                  className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground shadow-elegant opacity-0 translate-y-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 hover:bg-primary/90 focus:opacity-100 focus:translate-y-0"
                >
                  <Plus className="h-3.5 w-3.5" /> Quick add
                </button>
              </div>
              <div className="p-4 flex items-center justify-between gap-2">
                <div>
                  <h3 className="font-serif text-lg">{p.name}</h3>
                  <p className="text-sm text-primary">EGP {p.starting_price.toLocaleString()}</p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <CustomerReviews />

      <section className="container mx-auto px-6 lg:px-10 py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="aspect-[4/5] rounded-3xl overflow-hidden shadow-card order-2 lg:order-1">
            <img src={craft} alt="Artisan hands shaping solid oak in the Suzy Wood workshop" loading="lazy" width={1280} height={1280} className="h-full w-full object-cover" />
          </div>
          <div className="space-y-6 order-1 lg:order-2 lg:pl-8">
            <p className="text-[11px] uppercase tracking-[0.28em] text-secondary">Our Craft</p>
            <h2 className="font-serif text-4xl md:text-5xl text-balance">Bringing warmth and safety to every home with heirloom-quality wood pieces.</h2>
            <p className="text-muted-foreground leading-relaxed">Every Suzy Wood piece is hand-joined from solid timber by a small team of carpenters in Cairo. We use plant-based, non-toxic finishes and rounded edges throughout.</p>
            <Button asChild variant="outline"><Link to="/our-craft">Read our story</Link></Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
