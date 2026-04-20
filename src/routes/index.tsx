import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/site/Layout";
import { ValueBar } from "@/components/site/ValueBar";
import { ProductCard } from "@/components/site/ProductCard";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/lib/types";
import hero from "@/assets/hero-nursery.jpg";
import craft from "@/assets/craft-story.jpg";

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
      .eq("is_featured", true)
      .limit(3);
    return { featured: (data ?? []) as Product[] };
  },
  component: Index,
});

function Index() {
  const { featured } = Route.useLoaderData() as { featured: Product[] };
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
                Crafting safe, beautiful spaces for your little&nbsp;ones.
              </h1>
              <p className="text-lg text-muted-foreground max-w-md leading-relaxed">
                Solid-wood nursery and toddler furniture, hand-built to order in our studio — designed to live with your family for years, not seasons.
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
        <div className="flex flex-wrap items-end justify-between gap-6 mb-12">
          <div className="max-w-xl">
            <p className="text-[11px] uppercase tracking-[0.28em] text-secondary mb-3">The Collection</p>
            <h2 className="font-serif text-4xl md:text-5xl">Pieces designed to grow with them.</h2>
          </div>
          <Link to="/shop" className="text-sm border-b border-primary pb-0.5 hover:opacity-70">View all pieces →</Link>
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {featured.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

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
