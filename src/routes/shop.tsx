import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Layout } from "@/components/site/Layout";
import { ProductCard } from "@/components/site/ProductCard";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
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

type SortKey = "newest" | "price_asc" | "price_desc";

function Shop() {
  const { categories, products } = Route.useLoaderData() as { categories: Category[]; products: Product[] };
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("newest");

  const filtered = useMemo(() => {
    let list = products;
    if (categoryId !== "all") list = list.filter((p) => p.category_id === categoryId);
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((p) => p.name.toLowerCase().includes(q) || (p.tagline ?? "").toLowerCase().includes(q));
    if (sort === "price_asc") list = [...list].sort((a, b) => a.starting_price - b.starting_price);
    else if (sort === "price_desc") list = [...list].sort((a, b) => b.starting_price - a.starting_price);
    return list;
  }, [products, categoryId, query, sort]);

  return (
    <Layout>
      <section className="container mx-auto px-6 lg:px-10 pt-16 pb-8">
        <p className="text-[11px] uppercase tracking-[0.28em] text-secondary mb-3">The Collection</p>
        <h1 className="font-serif text-5xl md:text-6xl max-w-3xl">Every piece, made to order.</h1>
        <p className="mt-5 max-w-xl text-muted-foreground">Choose your size, finish and personalisation. Each piece ships in 3–4 weeks, made to order.</p>

        <div className="mt-10 flex flex-wrap gap-2">
          <button
            onClick={() => setCategoryId("all")}
            className={`px-4 py-2 rounded-full border text-sm transition-colors ${categoryId === "all" ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary"}`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategoryId(c.id)}
              className={`px-4 py-2 rounded-full border text-sm transition-colors ${categoryId === c.id ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary"}`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products…"
              className="pl-9"
            />
          </div>
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="price_asc">Price: Low to High</SelectItem>
              <SelectItem value="price_desc">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      <section className="container mx-auto px-6 lg:px-10 pb-24">
        {filtered.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">No products match your search.</p>
        ) : (
          <div className="grid gap-6 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>
    </Layout>
  );
}
