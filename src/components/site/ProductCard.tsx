import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import type { Product } from "@/lib/types";
import { asOptions } from "@/lib/types";
import { resolveImage } from "@/lib/images";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";

export function ProductCard({ product }: { product: Product }) {
  const cart = useCart();
  const sizes = asOptions(product.sizes);
  const finishes = asOptions(product.finishes);
  const hasVariants = sizes.length > 1 || finishes.length > 1;
  const soldOut = (product.stock_quantity ?? 1) <= 0;

  const quickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (soldOut) return;
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
          className={`h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 ${soldOut ? "opacity-70" : ""}`}
        />
        {soldOut && (
          <span className="absolute top-3 left-3 rounded-full bg-foreground/85 text-background text-[10px] uppercase tracking-[0.18em] px-3 py-1">
            Sold out
          </span>
        )}
        {!soldOut && (
          <button
            type="button"
            onClick={quickAdd}
            aria-label={`Quick add ${product.name} to cart`}
            className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground shadow-elegant opacity-0 translate-y-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 hover:bg-primary/90 focus:opacity-100 focus:translate-y-0"
          >
            <Plus className="h-3.5 w-3.5" /> Add to cart
          </button>
        )}
      </div>
      <div className="p-6 flex flex-col gap-2">
        <h3 className="font-serif text-2xl">{product.name}</h3>
        <p className="text-sm text-muted-foreground line-clamp-1">{product.tagline}</p>
        {hasVariants && (
          <p className="text-[11px] uppercase tracking-[0.2em] text-secondary">
            Available in multiple {sizes.length > 1 && finishes.length > 1 ? "sizes & finishes" : sizes.length > 1 ? "sizes" : "finishes"}
          </p>
        )}
        <div className="mt-4 flex items-end justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">From</p>
            <p className="font-serif text-xl text-primary">EGP {product.starting_price.toLocaleString()}</p>
          </div>
          <span className="text-xs text-muted-foreground">View details →</span>
        </div>
      </div>
    </Link>
  );
}
