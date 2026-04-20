import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/site/Layout";
import { ProductCard } from "@/components/site/ProductCard";
import { products } from "@/lib/products";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Shop the Collection — Suzy Wood" },
      { name: "description", content: "Browse handcrafted, made-to-order nursery and toddler furniture from Suzy Wood." },
      { property: "og:title", content: "Shop the Collection — Suzy Wood" },
      { property: "og:description", content: "Handcrafted, solid-wood pieces for nurseries and toddler rooms." },
    ],
  }),
  component: Shop,
});

function Shop() {
  return (
    <Layout>
      <section className="container mx-auto px-6 lg:px-10 pt-16 pb-12">
        <p className="text-[11px] uppercase tracking-[0.28em] text-secondary mb-3">The Collection</p>
        <h1 className="font-serif text-5xl md:text-6xl max-w-3xl">Every piece, made to order.</h1>
        <p className="mt-5 max-w-xl text-muted-foreground">
          Choose your size, finish and personalisation. Each piece ships in 3–4 weeks from our Cairo studio.
        </p>
      </section>
      <section className="container mx-auto px-6 lg:px-10 pb-24">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => <ProductCard key={p.slug} product={p} />)}
        </div>
      </section>
    </Layout>
  );
}
