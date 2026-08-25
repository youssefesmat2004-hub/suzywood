import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/site/Layout";
import { Hero } from "@/components/site/Hero";
import { TrustBadges } from "@/components/site/TrustBadges";
import { HowItWorks } from "@/components/site/HowItWorks";
import { InstagramStrip } from "@/components/site/InstagramStrip";
import { FinalCTA } from "@/components/site/FinalCTA";
import { CustomerReviews } from "@/components/site/CustomerReviews";
import { WholeRooms } from "@/components/site/WholeRooms";
import { ProductCard } from "@/components/site/ProductCard";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/lib/types";
import { PUBLIC_PRODUCT_COLUMNS } from "@/lib/types";
import { asOptions, getActiveSalePrice } from "@/lib/types";
import { resolveImage } from "@/lib/images";
import { Heart, Plus, ArrowRight, Package } from "lucide-react";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";
import craft from "@/assets/craft-story.jpg";
import heroImg from "@/assets/hero-nursery.jpg";
import { useSiteContent } from "@/lib/site-content";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Suzy Wood — Handcrafted Nursery Furniture in Cairo, Egypt" },
      { name: "description", content: "Handcrafted nursery and kids furniture in Cairo, Egypt. Solid wood, non-toxic finishes, made to order and delivered across Egypt. أثاث غرف أطفال خشب مصنوع يدويًا في القاهرة — سراير أطفال وغرف نوم أطفال حسب الطلب مع التوصيل لكل مصر." },
      { name: "keywords", content: "سرير اطفال خشب, غرف نوم اطفال القاهرة, اثاث اطفال مصر, سرير بيبي, غرف اطفال حسب الطلب, مرتبة سرير اطفال, nursery furniture Cairo, wooden crib Egypt" },
      { property: "og:title", content: "Suzy Wood — Handcrafted Nursery Furniture in Cairo, Egypt" },
      { property: "og:description", content: "Heirloom-quality nursery furniture, handcrafted in Cairo and made to order for families across Egypt. أثاث غرف أطفال يدوي الصنع في القاهرة." },
      { property: "og:url", content: "https://suzywoodofficial.com/" },
      { property: "og:locale", content: "en_US" },
      { property: "og:locale:alternate", content: "ar_EG" },

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
              alternateName: ["سوزي وود", "سوزي وود لأثاث الأطفال"],
              description: "Handcrafted nursery and kids furniture made to order in Cairo, Egypt. أثاث غرف أطفال خشبي مصنوع يدويًا في القاهرة.",
              url: "https://suzywoodofficial.com/",
              logo: "https://suzywoodofficial.com/icons/icon-512.png",
              sameAs: ["https://www.instagram.com/suzywoodofficial"],
              areaServed: [{ "@type": "Country", name: "Egypt" }, { "@type": "City", name: "Cairo" }],
              knowsLanguage: ["ar", "en"],
              contactPoint: [{
                "@type": "ContactPoint",
                telephone: "+20-109-631-3532",
                contactType: "customer service",
                areaServed: "EG",
                availableLanguage: ["ar", "en"],
              }],
            },
            {
              "@type": "WebSite",
              name: "Suzy Wood",
              alternateName: "سوزي وود",
              inLanguage: ["en", "ar"],
              url: "https://suzywoodofficial.com/",
            },

          ],
        }),
      },
    ],
  }),
  loader: async () => {
    const [{ data }, { data: bundleRow }, { data: tentRow }, { data: swingRow }] = await Promise.all([
      supabase
        .from("products")
        .select(PUBLIC_PRODUCT_COLUMNS)
        .eq("is_active", true)
        .order("is_featured", { ascending: false })
        .order("starting_price")
        .limit(8),
      supabase.from("products").select(PUBLIC_PRODUCT_COLUMNS).eq("slug", "tent-swing-bundle").eq("is_active", true).maybeSingle(),
      supabase.from("products").select(PUBLIC_PRODUCT_COLUMNS).eq("slug", "teepetent").eq("is_active", true).maybeSingle(),
      supabase.from("products").select(PUBLIC_PRODUCT_COLUMNS).eq("slug", "theswing").eq("is_active", true).maybeSingle(),
    ]);
    const ids = (data ?? []).map((p) => p.id);
    [bundleRow, tentRow, swingRow].forEach((p) => { if (p && !ids.includes(p.id)) ids.push(p.id); });
    const { data: vRows } = ids.length
      ? await supabase.from("product_variants").select("product_id").in("product_id", ids).eq("is_active", true)
      : { data: [] as { product_id: string }[] };
    const withVariants = new Set((vRows ?? []).map((r) => r.product_id));
    const featured = (data ?? []).map((p) => ({ ...(p as Product), has_variants: withVariants.has(p.id) }));
    const attach = (p: Product | null) => p ? { ...(p as Product), has_variants: withVariants.has(p.id) } : null;
    return {
      featured: featured as Product[],
      bundle: attach(bundleRow as Product | null) as Product | null,
      tent: attach(tentRow as Product | null) as Product | null,
      swing: attach(swingRow as Product | null) as Product | null,
    };
  },
  component: Index,
});

function Index() {
  const { featured, bundle, tent, swing } = Route.useLoaderData() as { featured: Product[]; bundle: Product | null; tent: Product | null; swing: Product | null };
  const content = useSiteContent();
  const cart = useCart();
  const [wished, setWished] = useState<Set<string>>(new Set());
  const { t, lang } = useI18n();
  // Store-managed hero copy is authored in English; fall back to translated defaults in Arabic.
  const heroTitle = lang === "ar" ? undefined : content.hero_title;
  const heroSubtitle = (lang === "ar" ? "" : content.hero_subtitle) || t("shop.heroSubtitleDefault", "Handmade wooden baby furniture, built to last a lifetime — delivered across Egypt.");

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
    const salePrice = getActiveSalePrice(p);
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
      unitPrice: salePrice ?? p.starting_price,
      quantity: 1,
    });
    toast.success(t("shop.addedToCart", "Added to cart"), {
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

      {/* Tent + Swing promotion — tent first, swing second */}
      {(tent || swing || bundle) && (
        <section className="container mx-auto px-6 lg:px-10 py-12 md:py-16">
          <div className="flex flex-wrap items-end justify-between gap-6 mb-8" data-reveal>
            <div className="max-w-xl">
              <p className="text-[11px] uppercase tracking-[0.32em] text-secondary mb-3 flex items-center gap-2">
                <Package className="h-3.5 w-3.5" /> {t("shop.bundleAndSave", "Bundle & Save")}
              </p>
              <h2 className="font-serif text-4xl md:text-5xl text-balance">{t("shop.tentSwingBundleTitle", "Tent + Swing Bundle")}</h2>
              <p className="text-muted-foreground mt-3">
                {t("shop.tentSwingBundleDesc", "Get our cozy Teepee Tent and The Swing together for EGP 4,750 — a perfect pair for playtime.")}
              </p>
            </div>
            {bundle && (
              <Link to="/shop/$slug" params={{ slug: bundle.slug }} className="group inline-flex items-center gap-2 text-sm font-medium text-primary hover:gap-3 transition-all">
                {t("shop.viewBundle", "View bundle")} <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {tent && (
              <ProductCard
                product={tent}
                badge={<>{t("shop.tentBadge", "Tent")}</>}
                footer={
                  <span className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-medium text-primary-foreground hover:bg-wood transition-colors">
                    {t("shop.shopTent", "Shop Tent")} <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                }
              />
            )}
            {swing && (
              <ProductCard
                product={swing}
                badge={<>{t("shop.swingBadge", "Swing")}</>}
                footer={
                  <span className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-medium text-primary-foreground hover:bg-wood transition-colors">
                    {t("shop.shopSwing", "Shop Swing")} <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                }
              />
            )}
            {bundle && (
              <div className="sm:col-span-2 lg:col-span-1">
                <ProductCard product={bundle} badge={<>{t("shop.bundleBadge", "Bundle & Save")}</>} />
              </div>
            )}
          </div>
        </section>
      )}

      {/* Featured products */}
      <section className="container mx-auto px-6 lg:px-10 py-20 md:py-28">
        <div className="flex flex-wrap items-end justify-between gap-6 mb-12" data-reveal>
          <div className="max-w-xl">
            <p className="text-[11px] uppercase tracking-[0.32em] text-secondary mb-3">{t("shop.featuredLabel", "Featured")}</p>
            <h2 className="font-serif text-4xl md:text-5xl text-balance">{t("shop.mostLovedTitle", "Our Most Loved Pieces")}</h2>
            <p className="text-muted-foreground mt-3">{t("shop.mostLovedSubtitle", "Premium quality Furniture, made by hand, chosen by families across Egypt.")}</p>
          </div>
          <Link to="/shop" className="group inline-flex items-center gap-2 text-sm font-medium text-primary hover:gap-3 transition-all">
            {t("common.viewAll", "View all")} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {featured.map((p, i) => {
            const isWished = wished.has(p.id);
            const hasVariants = !!p.has_variants || asOptions(p.sizes).length > 1 || asOptions(p.finishes).length > 1;
            const salePrice = getActiveSalePrice(p);
            const displayPrice = salePrice ?? p.starting_price;
            const isOnSale = salePrice !== null;
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
                  {isOnSale && (
                    <span className="absolute top-3 start-3 rounded-full bg-destructive text-destructive-foreground text-[10px] uppercase tracking-[0.18em] px-3 py-1 shadow-card">
                      {t("shop.saleSave33", "Sale — Save 33%")}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => toggleWish(e, p)}
                    aria-label={isWished ? t("shop.removeFromWishlist", "Remove {name} from wishlist").replace("{name}", p.name) : t("shop.addToWishlist", "Add {name} to wishlist").replace("{name}", p.name)}
                    className="absolute top-3 end-3 inline-flex items-center justify-center rounded-full bg-cream/90 backdrop-blur h-9 w-9 text-wood-deep shadow-soft hover:scale-110 transition-transform"
                  >
                    <Heart className={`h-4 w-4 ${isWished ? "fill-current text-primary" : ""}`} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => quickAdd(e, p)}
                    aria-label={hasVariants ? t("shop.chooseSizeFor", "Choose size for {name}").replace("{name}", p.name) : t("shop.addToCartFor", "Add {name} to cart").replace("{name}", p.name)}
                    className="absolute bottom-3 start-3 end-3 inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-xs font-medium text-primary-foreground shadow-elegant opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 hover:bg-wood focus:opacity-100 focus:translate-y-0"
                  >
                    <Plus className="h-3.5 w-3.5" /> {hasVariants ? t("shop.selectSize", "Select Size") : t("common.addToCart", "Add to Cart")}
                  </button>
                </div>
                <div className="p-5">
                  <h3 className="font-serif text-lg leading-tight">{p.name}</h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    <p className="text-sm text-primary font-medium">EGP {displayPrice.toLocaleString()}</p>
                    {isOnSale && (
                      <p className="text-xs text-muted-foreground line-through">EGP {p.starting_price.toLocaleString()}</p>
                    )}
                  </div>
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
            <p className="text-[11px] uppercase tracking-[0.32em] text-secondary">{t("shop.ourCraftLabel", "Our Craft")}</p>
            <h2 className="font-serif text-4xl md:text-5xl text-balance">{t("shop.craftTitle", "Premium quality furniture with reasonable pricing, made the slow way.")}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t("shop.craftDesc", "Every Suzy Wood piece is hand-joined from solid timber by a small team of carpenters in Cairo. We use plant-based Premium finishes and rounded edges throughout - safe enough for the tiniest hands.")}
            </p>
            <Button asChild variant="outline" className="border-wood-deep text-wood-deep hover:bg-wood-deep hover:text-cream">
              <Link to="/our-craft">{t("shop.readOurStory", "Read our story")}</Link>
            </Button>
          </div>
        </div>
      </section>

      <InstagramStrip />

      <FinalCTA />
    </Layout>
  );
}
