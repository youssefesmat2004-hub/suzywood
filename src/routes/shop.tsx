import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/site/Layout";
import { ProductCard } from "@/components/site/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import type { Category, Product } from "@/lib/types";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Shop the Collection — Suzy Wood" },
      { name: "description", content: "Browse handcrafted, made-to-order nursery and toddler furniture from Suzy Wood." },
    ],
  }),
  loader: async () => {
    const [{ data: categories }, { data: products }] = await Promise.all([
      supabase.from("categories").select("*").order("sort_order"),
      supabase.from("products").select("*").eq("is_active", true).order("created_at", { ascending: false }),
    ]);
    return {
      categories: (categories ?? []) as Category[],
      products: (products ?? []) as Product[],
    };
  },
  component: Shop,
});

function Shop() {
  const { categories, products } = Route.useLoaderData();
  return (
    <Layout>
      <section className="container mx-auto px-6 lg:px-10 pt-16 pb-8">
        <p className="text-[11px] uppercase tracking-[0.28em] text-secondary mb-3">The Collection</p>
        <h1 className="font-serif text-5xl md:text-6xl max-w-3xl">Every piece, made to order.</h1>
        <p className="mt-5 max-w-xl text-muted-foreground">Choose your size, finish and personalisation. Each piece ships in 3–4 weeks from our Cairo studio.</p>
        <div className="mt-8 flex flex-wrap gap-2">
          <Link to="/shop" className="px-4 py-2 rounded-full border border-primary text-sm bg-primary text-primary-foreground">All</Link>
          {categories.map((c) => (
            <Link key={c.id} to="/shop/category/$slug" params={{ slug: c.slug }} className="px-4 py-2 rounded-full border border-border text-sm hover:border-primary">
              {c.name}
            </Link>
          ))}
        </div>
      </section>
      <section className="container mx-auto px-6 lg:px-10 pb-24">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>
    </Layout>
  );
}
