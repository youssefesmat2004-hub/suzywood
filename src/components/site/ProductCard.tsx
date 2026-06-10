import { Link } from "@tanstack/react-router";
import { Plus, Ruler } from "lucide-react";
import type { Product } from "@/lib/types";
import { asOptions } from "@/lib/types";
import { resolveImage } from "@/lib/images";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";

export function ProductCard({ product }: { product: Product }) {
  const cart = useCart();
  const sizes = asOptions(product.sizes);
  const finishes = asOptions(product.finishes);
  const hasVariants = !!product.has_variants || sizes.length > 1 || finishes.length > 1;
  const soldOut = (product.stock_quantity ?? 1) <= 0;
  const isSafetyGate = product.category_slug === "safety-gates";
  const HIDE_FINISHES_LABEL = new Set([
    "cribs",
    "kids-beds",
    "montessori-bed",
    "play-safety",
    "drawers-changing-tables",
  ]);
  const displayFinishes = HIDE_FINISHES_LABEL.has(product.category_slug ?? "") ? [] : finishes;

  const quickAdd = (e: React.MouseEvent) => {
    if (soldOut) return;
    // If the product has size variants, let the parent <Link> navigate to the
    // product page so the customer can pick a size first.
    if (hasVariants) return;
    e.preventDefault();
    e.stopPropagation();
    const size = sizes[0];
    const finish = finishes[0];
    cart.add({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: resolveImage(product.image_url),
      size: size?.value ?? "",
      sizeLabel: size?.label ?? "",
      finish: finish?.value ?? "",
      finishLabel: finish?.label ?? "",
      engraving: "",
      unitPrice: product.starting_price,
      quantity: 1,
    });
    toast.success("Added to cart", { description: product.name });
  };

  return (
    <Link
      to="/shop/$slug"
      params={{ slug: product.slug }}
      className="group flex flex-col bg-card rounded-2xl overflow-hidden shadow-soft hover:shadow-elegant transition-all duration-500 border border-border/60"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-muted">
        <img
          src={resolveImage(product.image_url)}
          alt={product.name}
          loading="lazy"
          width={1024}
          height={1024}
          className={`h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 ${soldOut && !isSafetyGate ? "opacity-70" : ""}`}
        />
        {isSafetyGate && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-secondary text-secondary-foreground text-[10px] uppercase tracking-[0.18em] px-3 py-1">
            <Ruler className="h-3 w-3" /> Custom Measurement Required
          </span>
        )}
        {soldOut && !isSafetyGate && (
          <span className="absolute top-3 left-3 rounded-full bg-foreground/85 text-background text-[10px] uppercase tracking-[0.18em] px-3 py-1">
            Sold out
          </span>
        )}
        {isSafetyGate ? (
          <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground shadow-elegant opacity-0 translate-y-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
            <Ruler className="h-3.5 w-3.5" /> Book measurement
          </span>
        ) : !soldOut && (
          <button
            type="button"
            onClick={quickAdd}
            aria-label={hasVariants ? `Choose size for ${product.name}` : `Quick add ${product.name} to cart`}
            className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground shadow-elegant opacity-0 translate-y-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 hover:bg-primary/90 focus:opacity-100 focus:translate-y-0"
          >
            <Plus className="h-3.5 w-3.5" /> {hasVariants ? "Select size" : "Add to cart"}
          </button>
        )}
      </div>
      <div className="p-6 flex flex-col gap-2">
        <h3 className="font-serif text-2xl">{product.name}</h3>
        <p className="text-sm text-muted-foreground line-clamp-1">{product.tagline}</p>
        {hasVariants && !isSafetyGate && (
          (sizes.length > 1 || displayFinishes.length > 1) && (
            <p className="text-[11px] uppercase tracking-[0.2em] text-secondary">
              Available in multiple {sizes.length > 1 && displayFinishes.length > 1 ? "sizes & finishes" : sizes.length > 1 ? "sizes" : "finishes"}
            </p>
          )
        )}
        <div className="mt-4 flex items-end justify-between">
          {isSafetyGate ? (
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Pricing</p>
              <p className="font-serif text-lg text-primary">Price upon measurement</p>
            </div>
          ) : (
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">From</p>
              <p className="font-serif text-xl text-primary">
                {product.starting_price === 0 ? "Price upon measurement" : `EGP ${product.starting_price.toLocaleString()}`}
              </p>
            </div>
          )}
          <span className="text-xs text-muted-foreground">View details →</span>
        </div>
      </div>
    </Link>
  );
}
