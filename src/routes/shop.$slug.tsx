import { createFileRoute, Link, notFound, useNavigate, useRouter } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Layout } from "@/components/site/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/lib/types";
import { asOptions } from "@/lib/types";
import { resolveImage, resolveGallery } from "@/lib/images";
import { Reviews } from "@/components/site/Reviews";
import { ProductCard } from "@/components/site/ProductCard";
import { WishlistButton } from "@/components/site/WishlistButton";
import { useCart } from "@/lib/cart";
import { Check, ShoppingBag, Minus, Plus, Ruler, CalendarCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";

type Variant = {
  id: string;
  name: string;
  price: number;
  stock_quantity: number;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  variant_type?: "size" | "fabric_color" | null;
  color_hex?: string | null;
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
        .select("slug,custom_size_enabled,custom_size_surcharge,custom_size_note,name_engraving_enabled,name_engraving_surcharge,name_engraving_note,finish_label,ottoman_addon_enabled,ottoman_addon_price,ottoman_addon_note,portable_changing_table_enabled,portable_changing_table_price,portable_changing_table_note")
        .eq("id", product.category_id)
        .maybeSingle(),
    ]);
    return {
      product,
      variants: (variants ?? []) as Variant[],
      related: (related ?? []) as Product[],
      category: (cat ?? null) as {
        slug: string;
        custom_size_enabled: boolean;
        custom_size_surcharge: number;
        custom_size_note: string | null;
        name_engraving_enabled: boolean;
        name_engraving_surcharge: number;
        name_engraving_note: string | null;
        finish_label: string | null;
        ottoman_addon_enabled: boolean;
        ottoman_addon_price: number;
        ottoman_addon_note: string | null;
        portable_changing_table_enabled: boolean;
        portable_changing_table_price: number;
        portable_changing_table_note: string | null;
      } | null,
    };
  },
  head: ({ loaderData }) => {
    const p = loaderData?.product;
    if (!p) return { meta: [{ title: "Piece not found — Suzy Wood" }] };
    const img = resolveImage(p.image_url);
    const url = `https://suzywoodofficial.com/shop/${p.slug}`;
    const fallbackDesc = `${p.name} — handcrafted in Egypt by Suzy Wood. Solid wood, made-to-order in ${p.lead_time_weeks} weeks. Safe, heirloom-quality furniture for kids' rooms.`;
    const desc = (p.tagline && p.tagline.trim().length >= 50) ? p.tagline : fallbackDesc;
    return {
      meta: [
        { title: `${p.name} — Suzy Wood` },
        { name: "description", content: desc },
        { property: "og:title", content: `${p.name} — Suzy Wood` },
        { property: "og:description", content: desc },
        { property: "og:image", content: img },
        { name: "twitter:image", content: img },
        { property: "og:url", content: url },
        { property: "og:type", content: "product" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: p.name,
            description: p.tagline ?? undefined,
            image: img,
            sku: p.slug,
            brand: { "@type": "Brand", name: "Suzy Wood" },
            offers: {
              "@type": "Offer",
              url,
              priceCurrency: "EGP",
              price: p.starting_price,
              availability: "https://schema.org/InStock",
            },
          }),
        },
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
      slug: string;
      custom_size_enabled: boolean;
      custom_size_surcharge: number;
      custom_size_note: string | null;
      name_engraving_enabled: boolean;
      name_engraving_surcharge: number;
      name_engraving_note: string | null;
      finish_label: string | null;
      ottoman_addon_enabled: boolean;
      ottoman_addon_price: number;
      ottoman_addon_note: string | null;
      portable_changing_table_enabled: boolean;
      portable_changing_table_price: number;
      portable_changing_table_note: string | null;
    } | null;
  };
  const navigate = useNavigate();
  const cart = useCart();
  const sizes = asOptions(product.sizes);
  const finishes = asOptions(product.finishes);
  const gallery = resolveGallery(product.gallery);
  const isSafetyGate = category?.slug === "safety-gates";
  const isToddlerBed = category?.slug === "kids-beds";
  const BED_RAILS_PRICE = 2000;
  const [size, setSize] = useState(sizes[0]?.value ?? "");
  const [finish, setFinish] = useState(finishes[0]?.value ?? "");
  const [engraving, setEngraving] = useState("");
  const [variantId, setVariantId] = useState<string>(variants[0]?.id ?? "");
  const [customMode, setCustomMode] = useState(false);
  const [customWidth, setCustomWidth] = useState<string>("");
  const [customLength, setCustomLength] = useState<string>("");
  const [qty, setQty] = useState(1);
  const [active, setActive] = useState(0);
  const [withOttoman, setWithOttoman] = useState(false);
  const [withPortable, setWithPortable] = useState(false);
  const [withBedRails, setWithBedRails] = useState(false);

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
  const engravingEnabled = !!category?.name_engraving_enabled;
  const engravingSurcharge = Number(category?.name_engraving_surcharge ?? 0);
  const engravingApplied = engravingEnabled && engraving.trim().length > 0;
  const ottomanEnabled = !!category?.ottoman_addon_enabled;
  const ottomanPrice = Number(category?.ottoman_addon_price ?? 0);
  const ottomanApplied = ottomanEnabled && withOttoman;
  const portableEnabled = (product.portable_changing_table_enabled ?? category?.portable_changing_table_enabled) ?? false;
  const portablePrice = Number(category?.portable_changing_table_price ?? 0);
  const portableApplied = portableEnabled && withPortable;
  const bedRailsApplied = isToddlerBed && withBedRails;
  const finishLabel = category?.finish_label?.trim() || "Wood Finish";
  const stock = customMode ? 99 : (selectedVariant ? selectedVariant.stock_quantity : (product.stock_quantity ?? 99));
  const soldOut = !customMode && stock <= 0;
  const basePrice = customMode
    ? product.starting_price + customSurcharge
    : (selectedVariant ? selectedVariant.price : product.starting_price);
  const unitPrice = basePrice
    + (engravingApplied ? engravingSurcharge : 0)
    + (ottomanApplied ? ottomanPrice : 0)
    + (portableApplied ? portablePrice : 0)
    + (bedRailsApplied ? BED_RAILS_PRICE : 0);

  const stockBadge = soldOut
    ? { label: "Sold out", className: "bg-destructive/10 text-destructive" }
    : stock <= 5
      ? { label: `Only ${stock} left`, className: "bg-amber-500/15 text-amber-700" }
      : { label: "In stock", className: "bg-secondary/15 text-secondary" };

  const relatedAnnotated = related.map((p) => ({ ...p, category_slug: category?.slug }));

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
      const bedRailsSuffix = bedRailsApplied ? " + Bed Rails" : "";
      cart.add({
        productId: product.id,
        slug: product.slug,
        name: product.name + ` · ${customLabel}` + bedRailsSuffix,
        image: resolveImage(product.image_url),
        size: customLabel, sizeLabel: customLabel, finish: "", finishLabel: "",
        engraving: engraving.slice(0, 20),
        unitPrice,
        quantity: qty,
        customSize: { widthCm: w, lengthCm: l, surcharge: customSurcharge },
        bedRails: bedRailsApplied,
        bedRailsPrice: bedRailsApplied ? BED_RAILS_PRICE : 0,
        categorySlug: category?.slug,
      });
      toast.success("Added to cart", { description: `${product.name} · ${customLabel} × ${qty}` });
      return;
    }
    const sizeLabel = sizes.find((s) => s.value === size)?.label ?? "";
    const finishLabel = finishes.find((f) => f.value === finish)?.label ?? "";
    const variantSuffix = selectedVariant ? ` · ${selectedVariant.name}` : "";
    const ottomanSuffix = ottomanApplied ? " + Ottoman Leg Rest" : "";
    const portableSuffix = portableApplied ? " + Portable Changing Table" : "";
    const bedRailsSuffix = bedRailsApplied ? " + Bed Rails" : "";
    cart.add({
      productId: product.id,
      slug: product.slug,
      name: product.name + variantSuffix + ottomanSuffix + portableSuffix + bedRailsSuffix,
      image: selectedVariant?.image_url ? resolveImage(selectedVariant.image_url) : resolveImage(product.image_url),
      size: [size || "std", ottomanApplied ? "ottoman" : null, portableApplied ? "portable" : null].filter(Boolean).join("+"),
      sizeLabel: [sizeLabel, ottomanApplied ? "Ottoman Leg Rest" : null, portableApplied ? "Portable Changing Table" : null].filter(Boolean).join(" · "),
      finish, finishLabel,
      engraving: engraving.slice(0, 20),
      unitPrice,
      quantity: qty,
      bedRails: bedRailsApplied,
      bedRailsPrice: bedRailsApplied ? BED_RAILS_PRICE : 0,
      categorySlug: category?.slug,
    });
    toast.success("Added to cart", { description: `${product.name}${variantSuffix}${ottomanSuffix}${portableSuffix}${bedRailsSuffix} × ${qty}`, action: { label: "View cart", onClick: () => navigate({ to: "/cart" }) } });
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
                  <button key={i} onClick={() => setActive(i)} aria-label={`View product image ${i + 1}`} className={`h-20 w-20 rounded-xl overflow-hidden border-2 transition-all ${active === i ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"}`}>
                    <img src={src} alt="" loading="lazy" width={160} height={160} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-7">
            {isSafetyGate ? (
              <SafetyGateRightColumn product={product} />
            ) : (
            <>
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
                {selectedVariant ? "" : "From "}
                {unitPrice === 0 ? "Price upon measurement" : `EGP ${unitPrice.toLocaleString()}`}
              </p>
            </div>

            {product.description && <p className="text-foreground/80 leading-relaxed">{product.description}</p>}

            <div className="space-y-5 pt-2 border-t border-border">
              {variants.some((v) => v.variant_type !== "fabric_color") && (
                <div className="space-y-2 pt-5">
                  <Label>Select Size</Label>
                  <div className="flex flex-wrap gap-2">
                    {variants.filter((v) => v.variant_type !== "fabric_color").map((v) => {
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
                          {v.name} — {Number(v.price) === 0 ? "Price upon measurement" : `EGP ${Number(v.price).toLocaleString()}`}{out ? " (Out of stock)" : ""}
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
              {variants.length > 0 && variants.some((v) => v.variant_type === "fabric_color") && (
                <div className="space-y-3 pt-5">
                  <Label>Fabric Color</Label>
                  <div className="flex flex-wrap gap-3">
                    {variants
                      .filter((v) => v.variant_type === "fabric_color")
                      .map((v) => {
                        const isSel = v.id === variantId;
                        const out = v.stock_quantity <= 0;
                        return (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => { setVariantId(v.id); setCustomMode(false); setActive(0); }}
                            disabled={out}
                            title={`${v.name}${out ? " — Out of stock" : ""}`}
                            aria-label={v.name}
                            className={`relative h-10 w-10 rounded-full border-2 transition-all ${isSel ? "border-primary ring-2 ring-primary/30 ring-offset-2 ring-offset-background" : "border-border hover:border-primary"} ${out ? "opacity-60 cursor-not-allowed" : ""}`}
                            style={{ backgroundColor: v.color_hex ?? "#ccc" }}
                          >
                            {out && (
                              <span className="absolute inset-0 flex items-center justify-center text-destructive font-bold pointer-events-none" aria-hidden>
                                ✕
                              </span>
                            )}
                          </button>
                        );
                      })}
                  </div>
                  {selectedVariant?.variant_type === "fabric_color" && (
                    <p className="text-sm text-muted-foreground">
                      Selected: <span className="text-foreground font-medium">{selectedVariant.name}</span>
                    </p>
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
                  <Label>{finishLabel}</Label>
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
              {engravingEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="engrave">
                    Add child's name for custom engraving (optional)
                    {engravingSurcharge > 0 && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        +{engravingSurcharge.toLocaleString()} EGP
                      </span>
                    )}
                  </Label>
                  <Input id="engrave" value={engraving} onChange={(e) => setEngraving(e.target.value)} maxLength={20} placeholder="e.g. Layla" />
                  {category?.name_engraving_note && (
                    <p className="text-xs text-muted-foreground italic">{category.name_engraving_note}</p>
                  )}
                </div>
              )}

              {ottomanEnabled && (
                <div className="space-y-2">
                  <Label>Add-on</Label>
                  <label className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-colors ${withOttoman ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 accent-primary"
                      checked={withOttoman}
                      onChange={(e) => setWithOttoman(e.target.checked)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-sm">Include matching Ottoman Leg Rest</span>
                        <span className="text-sm text-primary font-medium">
                          {ottomanPrice > 0 ? `+${ottomanPrice.toLocaleString()} EGP` : "Price on request"}
                        </span>
                      </div>
                      {category?.ottoman_addon_note && (
                        <p className="text-xs text-muted-foreground italic mt-1">{category.ottoman_addon_note}</p>
                      )}
                    </div>
                  </label>
                </div>
              )}

              {portableEnabled && (
                <div className="space-y-2">
                  {!ottomanEnabled && <Label>Add-on</Label>}
                  <label className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-colors ${withPortable ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 accent-primary"
                      checked={withPortable}
                      onChange={(e) => setWithPortable(e.target.checked)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-sm">Add a Portable Changing Table</span>
                        <span className="text-sm text-primary font-medium">
                          {portablePrice > 0 ? `+${portablePrice.toLocaleString()} EGP` : "Price on request"}
                        </span>
                      </div>
                      {category?.portable_changing_table_note && (
                        <p className="text-xs text-muted-foreground italic mt-1">{category.portable_changing_table_note}</p>
                      )}
                    </div>
                  </label>
                </div>
              )}

              {isToddlerBed && (
                <div className="space-y-2">
                  {!ottomanEnabled && !portableEnabled && <Label>Add-on</Label>}
                  <label className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-colors ${withBedRails ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 accent-primary"
                      checked={withBedRails}
                      onChange={(e) => setWithBedRails(e.target.checked)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-sm">Add Bed Rails</span>
                        <span className="text-sm text-primary font-medium">+{BED_RAILS_PRICE.toLocaleString()} EGP</span>
                      </div>
                      <p className="text-xs text-muted-foreground italic mt-1">Protective side rails to keep little ones safe at night.</p>
                    </div>
                  </label>
                </div>
              )}

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
              {"\n"}
            </p>
            </>
            )}
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
              {relatedAnnotated.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
}

const AREAS = ["Cairo", "Giza", "Alexandria", "Other"] as const;
const DAYS = ["saturday","sunday","monday","tuesday","wednesday","thursday"] as const;
const SLOTS = [
  { value: "morning", label: "Morning (9am – 12pm)" },
  { value: "afternoon", label: "Afternoon (12pm – 4pm)" },
  { value: "evening", label: "Evening (4pm – 8pm)" },
] as const;

function SafetyGateRightColumn({ product }: { product: Product }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/15 text-secondary text-[11px] uppercase tracking-[0.22em]">
            <Ruler className="h-3 w-3" /> Custom Measurement Required
          </span>
        </div>
        <h1 className="font-serif text-4xl md:text-5xl mt-5">{product.name}</h1>
        {product.tagline && <p className="mt-3 text-muted-foreground">{product.tagline}</p>}
        <p className="mt-6 font-serif text-2xl text-primary">Price upon measurement</p>
      </div>

      {product.description && <p className="text-foreground/80 leading-relaxed">{product.description}</p>}

      <div className="rounded-2xl border border-border bg-muted/30 p-5 space-y-2">
        <p className="text-sm leading-relaxed">
          <strong>This product requires custom measurements.</strong> Our team will visit you to measure your space and give you an exact quote.
        </p>
      </div>

      <div className="space-y-3">
        <p className="text-[11px] uppercase tracking-[0.22em] text-secondary">What's included</p>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2"><Check className="h-4 w-4 text-secondary mt-0.5" /> 250 EGP measurement visit</li>
          <li className="flex items-start gap-2"><Check className="h-4 w-4 text-secondary mt-0.5" /> Expert advice on the best fit</li>
          <li className="flex items-start gap-2"><Check className="h-4 w-4 text-secondary mt-0.5" /> Custom quote within 24 hours</li>
        </ul>
      </div>

      <div className="flex flex-col gap-3 pt-2">
        <Button size="lg" className="w-full" onClick={() => setOpen(true)}>
          <CalendarCheck className="h-4 w-4 mr-2" /> Book your Measurement session now
        </Button>
        <WishlistButton productId={product.id} />
      </div>

      <MeasurementBookingDialog
        open={open}
        onOpenChange={setOpen}
        productId={product.id}
        productName={product.name}
      />
    </>
  );
}

function MeasurementBookingDialog({
  open, onOpenChange, productId, productName,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  productId: string;
  productName: string;
}) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [area, setArea] = useState<string>("Cairo");
  const [address, setAddress] = useState("");
  const [day, setDay] = useState<string>("saturday");
  const [slot, setSlot] = useState<string>("morning");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const reset = () => {
    setFullName(""); setEmail(""); setPhone(""); setArea("Cairo"); setAddress("");
    setDay("saturday"); setSlot("morning"); setNotes(""); setDone(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || fullName.length > 100) return toast.error("Please enter your full name");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return toast.error("Please enter a valid email address");
    if (!/^01[0-9]{9}$/.test(phone)) return toast.error("Phone must be an 11-digit Egyptian number (01XXXXXXXXX)");
    if (address.trim().length < 3) return toast.error("Please enter your full address");
    setSubmitting(true);
    const { data: inserted, error } = await supabase.from("measurement_bookings").insert({
      product_id: productId,
      product_name: productName,
      full_name: fullName.trim(),
      customer_email: email.trim(),
      phone: phone.trim(),
      area,
      address: address.trim(),
      preferred_day: day,
      time_slot: slot,
      notes: notes.trim() || null,
    }).select("id").single();
    setSubmitting(false);
    if (error) {
      toast.error("Couldn't submit booking", { description: error.message });
      return;
    }
    if (inserted?.id) {
      // Fire-and-forget confirmation email — don't block the success screen.
      const { sendBookingReceivedEmail } = await import("@/lib/measurement-booking-emails.functions");
      sendBookingReceivedEmail({ data: { bookingId: inserted.id } }).catch(() => {});
      const { notifyOwnerNewMeasurementBooking } = await import("@/lib/owner-notifications.functions");
      notifyOwnerNewMeasurementBooking({ data: { bookingId: inserted.id } }).catch(() => {});
    }
    setDone(true);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        {done ? (
          <div className="text-center py-6 space-y-4">
            <div className="mx-auto h-12 w-12 rounded-full bg-secondary/15 text-secondary inline-flex items-center justify-center">
              <Sparkles className="h-6 w-6" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-center font-serif text-2xl">Thank you!</DialogTitle>
              <DialogDescription className="text-center">
                We will contact you within 24 hours to confirm your measurement appointment.
              </DialogDescription>
            </DialogHeader>
            <Button onClick={() => { reset(); onOpenChange(false); }} className="mt-2">Close</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl">Book a Measurement</DialogTitle>
              <DialogDescription>For {productName}</DialogDescription>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="mb-name">Full name</Label>
                <Input id="mb-name" value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={100} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mb-phone">Phone number</Label>
                <Input id="mb-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXXXXXXXX" inputMode="tel" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mb-email">Email</Label>
                <Input id="mb-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Area / Governorate</Label>
                  <Select value={area} onValueChange={setArea}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {AREAS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Preferred day</Label>
                  <Select value={day} onValueChange={setDay}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DAYS.map((d) => <SelectItem key={d} value={d} className="capitalize">{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mb-address">Full address</Label>
                <Textarea id="mb-address" value={address} onChange={(e) => setAddress(e.target.value)} rows={2} maxLength={500} required />
              </div>
              <div className="space-y-1.5">
                <Label>Preferred time</Label>
                <Select value={slot} onValueChange={setSlot}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SLOTS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mb-product">Product</Label>
                <Input id="mb-product" value={productName} readOnly className="bg-muted" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mb-notes">Notes (optional)</Label>
                <Textarea id="mb-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} maxLength={2000} />
              </div>
              <Button type="submit" disabled={submitting} size="lg" className="w-full">
                {submitting ? "Submitting..." : "Confirm Booking"}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
