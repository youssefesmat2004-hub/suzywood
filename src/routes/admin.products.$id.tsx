import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ProductForm, type ProductFormValue } from "@/components/admin/ProductForm";

export const Route = createFileRoute("/admin/products/$id")({
  component: EditProduct,
});

function EditProduct() {
  const { id } = Route.useParams();
  const [data, setData] = useState<ProductFormValue | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: row, error: err } = await supabase.from("products").select("*").eq("id", id).single();
      if (err || !row) {
        setError(err?.message ?? "Not found");
        return;
      }
      setData({
        id: row.id,
        name: row.name,
        slug: row.slug,
        category_id: row.category_id,
        tagline: row.tagline ?? "",
        description: row.description ?? "",
        starting_price: Number(row.starting_price),
        stock_quantity: row.stock_quantity ?? 0,
        image_url: row.image_url,
        gallery: Array.isArray(row.gallery) ? (row.gallery as string[]) : [],
        materials: row.materials ?? "",
        care_info: row.care_info ?? "",
        safety_info: row.safety_info ?? "",
        lead_time_weeks: row.lead_time_weeks ?? 4,
        is_active: row.is_active,
        is_featured: row.is_featured,
        portable_changing_table_enabled: row.portable_changing_table_enabled ?? null,
      });
    })();
  }, [id]);

  return (
    <div>
      <Link to="/admin/products" className="inline-flex items-center gap-1 text-sm text-muted-foreground mb-4 hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to products
      </Link>
      <h1 className="font-serif text-3xl mb-6">Edit Product</h1>
      {error && <p className="text-destructive">{error}</p>}
      {!data && !error && <p className="text-muted-foreground">Loading…</p>}
      {data && <ProductForm initial={data} productId={id} />}
    </div>
  );
}