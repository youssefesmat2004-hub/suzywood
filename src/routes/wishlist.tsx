import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layout } from "@/components/site/Layout";
import { ProductCard } from "@/components/site/ProductCard";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/lib/types";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "Your Wishlist — Suzy Wood" },
      { name: "description", content: "Save your favourite Suzy Wood nursery and toddler pieces to your wishlist and come back to them anytime." },
      { property: "og:title", content: "Your Wishlist — Suzy Wood" },
      { property: "og:description", content: "Saved Suzy Wood pieces in your personal wishlist." },
      { property: "og:url", content: "https://suzywoodofficial.com/wishlist" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "https://suzywoodofficial.com/wishlist" }],
  }),
  component: Wishlist,
});

function Wishlist() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => { if (!loading && !user) navigate({ to: "/auth" }); }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase.from("wishlist_items").select("product_id, products(*)").eq("user_id", user.id)
      .then(({ data }) => setProducts(((data ?? []).map((r: { products: Product | null }) => r.products).filter(Boolean)) as Product[]));
  }, [user]);

  if (!user) return null;

  return (
    <Layout>
      <section className="container mx-auto px-6 lg:px-10 py-16">
        <h1 className="font-serif text-5xl">My Wishlist</h1>
        {products.length === 0 ? (
          <p className="mt-8 text-muted-foreground">Nothing saved yet. <Link to="/shop" className="text-primary border-b border-primary">Browse pieces</Link></p>
        ) : (
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>
    </Layout>
  );
}
