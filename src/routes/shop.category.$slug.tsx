import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Layout } from "@/components/site/Layout";
import { ProductCard } from "@/components/site/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import type { Category, Product } from "@/lib/types";

export const Route = createFileRoute("/shop/category/$slug")({
  loader: async ({ params }) => {
    const { data: cat } = await supabase.from("categories").select("*").eq("slug", params.slug).maybeSingle();
    if (!cat) throw notFound();
    const { data: products } = await supabase
      .from("products")
      .select("*")
      .eq("category_id", cat.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    const ids = (products ?? []).map((p) => p.id);
    const { data: vRows } = ids.length
      ? await supabase.from("product_variants").select("product_id").in("product_id", ids).eq("is_active", true)
      : { data: [] as { product_id: string }[] };
    const withVariants = new Set((vRows ?? []).map((r) => r.product_id));
    const annotated = (products ?? []).map((p) => ({
      ...(p as Product),
      has_variants: withVariants.has(p.id),
      category_slug: cat.slug,
    }));
    return { category: cat as Category, products: annotated as Product[] };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.category.name ?? "Shop"} — Suzy Wood` },
      { name: "description", content: loaderData?.category.description ?? "Handcrafted wooden furniture for kids." },
    ],
  }),
  component: CategoryPage,
  notFoundComponent: () => (
    <Layout>
      <div className="container mx-auto px-6 py-32 text-center">
        <h1 className="font-serif text-4xl">Category not found</h1>
        <Link to="/shop" className="mt-6 inline-block text-primary border-b border-primary">Back to shop</Link>
      </div>
    </Layout>
  ),
});

function CategoryPage() {
  const { category, products } = Route.useLoaderData() as { category: Category; products: Product[] };
  return (
    <Layout>
      <section className="container mx-auto px-6 lg:px-10 pt-16 pb-8">
        <Link to="/shop" className="text-xs uppercase tracking-[0.22em] text-muted-foreground hover:text-primary">← All categories</Link>
        <h1 className="font-serif text-5xl md:text-6xl mt-4">{category.name}</h1>
        {category.description && <p className="mt-4 max-w-2xl text-muted-foreground">{category.description}</p>}
      </section>
      <section className="container mx-auto px-6 lg:px-10 pb-24">
        {products.length === 0 ? (
          <p className="text-muted-foreground">New pieces in this category coming soon.</p>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>
    </Layout>
  );
}
