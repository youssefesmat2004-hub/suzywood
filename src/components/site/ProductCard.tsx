import { Link } from "@tanstack/react-router";
import { Product } from "@/lib/products";
import { ArrowUpRight } from "lucide-react";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      to="/shop/$slug"
      params={{ slug: product.slug }}
      className="group flex flex-col bg-card rounded-2xl overflow-hidden shadow-soft hover:shadow-elegant transition-all duration-500 border border-border/60"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-muted">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          width={1024}
          height={1024}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </div>
      <div className="p-6 flex flex-col gap-2">
        <h3 className="font-serif text-2xl">{product.name}</h3>
        <p className="text-sm text-muted-foreground">{product.tagline}</p>
        <div className="mt-4 flex items-end justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">From</p>
            <p className="font-serif text-xl text-primary">EGP {product.startingPrice.toLocaleString()}</p>
          </div>
          <span className="inline-flex items-center gap-1 text-sm text-primary border-b border-primary/40 pb-0.5 group-hover:border-primary transition-colors">
            Explore Options
            <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
