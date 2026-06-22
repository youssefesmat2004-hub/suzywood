import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/site/Layout";
import { Hero } from "@/components/site/Hero";
import { TrustBadges } from "@/components/site/TrustBadges";
import { HowItWorks } from "@/components/site/HowItWorks";
import { InstagramStrip } from "@/components/site/InstagramStrip";
import { FinalCTA } from "@/components/site/FinalCTA";
import { CustomerReviews } from "@/components/site/CustomerReviews";
import { WholeRooms } from "@/components/site/WholeRooms";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/lib/types";
import { asOptions } from "@/lib/types";
import { resolveImage } from "@/lib/images";
import { Heart, Plus, ArrowRight } from "lucide-react";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";
import craft from "@/assets/craft-story.jpg";
import heroImg from "@/assets/hero-nursery.jpg";
import { useSiteContent } from "@/lib/site-content";
import { useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Suzy Wood — Handcrafted Kids Interiors" },
      { name: "description", content: "Crafting safe, beautiful spaces for your little ones. Solid wood, non-toxic, made to order in Cairo." },
      { property: "og:title", content: "Suzy Wood — Handcrafted Kids Interiors" },
      { property: "og:description", content: "Heirloom-quality nursery furniture, made to order." },
      { property: "og:url", content: "https://suzywoodofficial.com/" },
    ],
    links: [
      { rel: "canonical", href: "https://suzywoodofficial.com/" },
      { rel: "preload", as: "image", href: heroImg, fetchpriority: "high" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              name: "Suzy Wood",
              url: "https://suzywoodofficial.com/",
              logo: "https://suzywoodofficial.com/icons/icon-512.png",
              sameAs: ["https://www.instagram.com/suzywoodofficial"],
              contactPoint: [{
                "@type": "ContactPoint",
                telephone: "+20-109-631-3532",
                contactType: "customer service",
                areaServed: "EG",
              }],
            },
            {
              "@type": "WebSite",
              name: "Suzy Wood",
              url: "https://suzywoodofficial.com/",
            },
          ],
        }),
      },
    ],
  }),
  loader: async () => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("is_featured", { ascending: false })
      .order("starting_price")
      .limit(8);
    const ids = (data ?? []).map((p) => p.id);
    const { data: vRows } = ids.length
      ? await supabase.from("product_variants").select("product_id").in("product_id", ids).eq("is_active", true)
      : { data: [] as { product_id: string }[] };
    const withVariants = new Set((vRows ?? []).map((r) => r.product_id));
    const featured = (data ?? []).map((p) => ({ ...(p as Product), has_variants: withVariants.has(p.id) }));
    return { featured: featured as Product[] };
  },
  component: Index,
});

function Index() {
  const { featured } = Route.useLoaderData() as { featured: Product[] };
  const content = useSiteContent();
  const cart = useCart();
  const [wished, setWished] = useState<Set<string>>(new Set());
  const heroTitle = content.hero_title;
  const heroSubtitle = content.hero_subtitle || "Handmade wooden baby furniture, built to last a lifetime.";

  const quickAdd = (e: React.MouseEvent, p: Product) => {
    const sizes = asOptions(p.sizes);
    const finishes = asOptions(p.finishes);
    const hasVariants = !!p.has_variants || sizes.length > 1 || finishes.length > 1;
    // If the product has size variants, let the parent <Link> navigate so the
    // customer can pick a size on the product page.
    if (hasVariants) return;
    e.preventDefault();
    e.stopPropagation();
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

  const toggleWish = (e: React.MouseEvent, p: Product) => {
    e.preventDefault();
    e.stopPropagation();
    setWished((prev) => {
      const next = new Set(prev);
      if (next.has(p.id)) next.delete(p.id); else next.add(p.id);
      return next;
    });
  };

  return (
    <Layout>
      <Hero title={heroTitle || undefined} subtitle={heroSubtitle} />

      <TrustBadges />

      {/* Featured products */}
      <section className="container mx-auto px-6 lg:px-10 py-20 md:py-28">
        <div className="flex flex-wrap items-end justify-between gap-6 mb-12" data-reveal>
          <div className="max-w-xl">
            <p className="text-[11px] uppercase tracking-[0.32em] text-secondary mb-3">Featured</p>
            <h2 className="font-serif text-4xl md:text-5xl text-balance">Our Most Loved Pieces</h2>
            <p className="text-muted-foreground mt-3">Premium quality Furniture, made by hand, chosen by families across Egypt.</p>
          </div>
          <Link to="/shop" className="group inline-flex items-center gap-2 text-sm font-medium text-primary hover:gap-3 transition-all">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {featured.map((p, i) => {
            const isWished = wished.has(p.id);
            const hasVariants = !!p.has_variants || asOptions(p.sizes).length > 1 || asOptions(p.finishes).length > 1;
            return (
              <Link
                key={p.id}
                to="/shop/$slug"
                params={{ slug: p.slug }}
                data-reveal
                style={{ transitionDelay: `${(i % 4) * 80}ms` }}
                className="group flex flex-col bg-card rounded-3xl overflow-hidden shadow-soft hover:shadow-elegant transition-all duration-500 border border-border/60 hover-lift"
              >
                <div className="relative aspect-square overflow-hidden bg-muted img-zoom">
                  <img
                    src={resolveImage(p.image_url)}
                    alt={p.name}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={(e) => toggleWish(e, p)}
                    aria-label={isWished ? `Remove ${p.name} from wishlist` : `Add ${p.name} to wishlist`}
                    className="absolute top-3 right-3 inline-flex items-center justify-center rounded-full bg-cream/90 backdrop-blur h-9 w-9 text-wood-deep shadow-soft hover:scale-110 transition-transform"
                  >
                    <Heart className={`h-4 w-4 ${isWished ? "fill-current text-primary" : ""}`} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => quickAdd(e, p)}
                    aria-label={hasVariants ? `Choose size for ${p.name}` : `Add ${p.name} to cart`}
                    className="absolute bottom-3 left-3 right-3 inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-xs font-medium text-primary-foreground shadow-elegant opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 hover:bg-wood focus:opacity-100 focus:translate-y-0"
                  >
                    <Plus className="h-3.5 w-3.5" /> {hasVariants ? "Select Size" : "Add to Cart"}
                  </button>
                </div>
                <div className="p-5">
                  <h3 className="font-serif text-lg leading-tight">{p.name}</h3>
                  <p className="text-sm text-primary mt-1.5 font-medium">EGP {p.starting_price.toLocaleString()}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="container mx-auto px-6 lg:px-10"><div className="wood-grain" /></div>

      <HowItWorks />

      <CustomerReviews />

      <WholeRooms />

      {/* Our craft story */}
      <section className="container mx-auto px-6 lg:px-10 py-20 md:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div data-reveal className="aspect-[4/5] rounded-3xl overflow-hidden shadow-card order-2 lg:order-1 img-zoom">
            <img src={craft} alt="Suzy Wood carpenter hand-shaping a solid wood nursery panel in the Cairo workshop" loading="lazy" className="h-full w-full object-cover" />
          </div>
          <div data-reveal className="space-y-6 order-1 lg:order-2 lg:pl-8">
            <p className="text-[11px] uppercase tracking-[0.32em] text-secondary">Our Craft</p>
            <h2 className="font-serif text-4xl md:text-5xl text-balance">Premium quality furniture with reasonable pricing, made the slow way.</h2>
            <p className="text-muted-foreground leading-relaxed">
              Every Suzy Wood piece is hand-joined from solid timber by a small team of carpenters in Cairo.
              We use plant-based Premium finishes and rounded edges throughout - safe enough for the tiniest hands.
            </p>
            <Button asChild variant="outline" className="border-wood-deep text-wood-deep hover:bg-wood-deep hover:text-cream">
              <Link to="/our-craft">Read our story</Link>
            </Button>
          </div>
        </div>
      </section>

      <InstagramStrip />

      <FinalCTA />
    </Layout>
  );
}
