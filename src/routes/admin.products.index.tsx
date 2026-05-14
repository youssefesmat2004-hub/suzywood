import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2, Search, Star, AlertTriangle } from "lucide-react";
import { resolveImage } from "@/lib/images";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  starting_price: number;
  stock_quantity: number;
  image_url: string | null;
  is_active: boolean;
  is_featured: boolean;
  category_id: string;
};

export const Route = createFileRoute("/admin/products/")({
  component: ProductsPage,
});

function ProductsPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("id,name,slug,starting_price,stock_quantity,image_url,is_active,is_featured,category_id")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setProducts((data ?? []) as ProductRow[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setProducts((p) => p.filter((x) => x.id !== id));
    toast.success("Product deleted");
  };

  const toggleField = async (id: string, field: "is_active" | "is_featured", value: boolean) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
    const update = field === "is_active" ? { is_active: value } : { is_featured: value };
    const { error } = await supabase.from("products").update(update).eq("id", id);
    if (error) {
      toast.error(error.message);
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: !value } : p)));
      return;
    }
    toast.success(
      field === "is_active"
        ? value ? "Product is now visible" : "Product hidden from website"
        : value ? "Marked as featured" : "Removed from featured",
    );
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl">Products</h1>
          <p className="text-sm text-muted-foreground mt-1">Add, edit and manage all your products.</p>
        </div>
        <Button asChild>
          <Link to="/admin/products/new"><Plus className="h-4 w-4 mr-2" /> Add Product</Link>
        </Button>
      </div>

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products…" className="pl-9" />
      </div>

      {loading ? (
        <div className="text-muted-foreground">Loading…</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <div key={p.id} className="bg-background border rounded-xl overflow-hidden flex flex-col">
              <div className="aspect-square bg-muted relative">
                {p.image_url && (
                  <img src={resolveImage(p.image_url)} alt={p.name} className="w-full h-full object-cover" />
                )}
                <div className="absolute top-2 left-2 flex flex-col gap-1.5">
                  {!p.is_active && (
                    <span className="text-[10px] uppercase tracking-wider bg-muted-foreground/90 text-background px-2 py-0.5 rounded">Hidden</span>
                  )}
                  {p.is_featured && (
                    <span className="text-[10px] uppercase tracking-wider bg-primary text-primary-foreground px-2 py-0.5 rounded inline-flex items-center gap-1">
                      <Star className="h-3 w-3" /> Featured
                    </span>
                  )}
                  {p.stock_quantity === 0 ? (
                    <span className="text-[10px] uppercase tracking-wider bg-destructive text-destructive-foreground px-2 py-0.5 rounded">Sold out</span>
                  ) : p.stock_quantity < 5 ? (
                    <span className="text-[10px] uppercase tracking-wider bg-amber-500 text-white px-2 py-0.5 rounded inline-flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Low stock
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-serif text-lg leading-tight">{p.name}</h3>
                <p className="text-sm text-primary mt-1">EGP {Number(p.starting_price).toLocaleString()}</p>
                <p className={`text-xs mt-1 ${p.stock_quantity === 0 ? "text-destructive" : p.stock_quantity < 5 ? "text-amber-600 font-medium" : "text-muted-foreground"}`}>
                  Stock: {p.stock_quantity}
                  {p.stock_quantity > 0 && p.stock_quantity < 5 && " — low!"}
                </p>

                <div className="mt-4 space-y-2 border-t pt-3">
                  <label className="flex items-center justify-between text-sm cursor-pointer">
                    <span className="text-muted-foreground">Visible on site</span>
                    <Switch checked={p.is_active} onCheckedChange={(v) => toggleField(p.id, "is_active", v)} />
                  </label>
                  <label className="flex items-center justify-between text-sm cursor-pointer">
                    <span className="text-muted-foreground">Featured on homepage</span>
                    <Switch checked={p.is_featured} onCheckedChange={(v) => toggleField(p.id, "is_featured", v)} />
                  </label>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button asChild size="sm" variant="outline" className="flex-1">
                    <Link to="/admin/products/$id" params={{ id: p.id }}>
                      <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit
                    </Link>
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(p.id, p.name)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center text-muted-foreground py-12">No products yet.</div>
          )}
        </div>
      )}
    </div>
  );
}