import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, Upload, X, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { resolveImage } from "@/lib/images";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  product_count?: number;
};

export const Route = createFileRoute("/admin/categories")({
  component: CategoriesPage,
});

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

async function uploadImage(file: File): Promise<string | null> {
  const ext = file.name.split(".").pop();
  const path = `categories/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("product-images").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) {
    toast.error(error.message);
    return null;
  }
  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  return data.publicUrl;
}

function CategoriesPage() {
  const [items, setItems] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [open, setOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: cats, error }, { data: prods }] = await Promise.all([
      supabase.from("categories").select("*").order("sort_order"),
      supabase.from("products").select("category_id"),
    ]);
    if (error) toast.error(error.message);
    const counts = new Map<string, number>();
    (prods ?? []).forEach((p: { category_id: string }) => {
      counts.set(p.category_id, (counts.get(p.category_id) ?? 0) + 1);
    });
    setItems(
      ((cats ?? []) as CategoryRow[]).map((c) => ({
        ...c,
        product_count: counts.get(c.id) ?? 0,
      })),
    );
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const startNew = () => {
    setEditing({ id: "", name: "", slug: "", description: "", image_url: null, sort_order: items.length });
    setOpen(true);
  };

  const startEdit = (c: CategoryRow) => {
    setEditing({ ...c });
    setOpen(true);
  };

  const remove = async (c: CategoryRow) => {
    const count = c.product_count ?? 0;
    const warning =
      count > 0
        ? `⚠️ Warning: ${count} product${count === 1 ? "" : "s"} ${count === 1 ? "is" : "are"} still using "${c.name}". Deleting will fail unless you reassign them first.\n\nDelete anyway?`
        : `Delete category "${c.name}"? This cannot be undone.`;
    if (!confirm(warning)) return;
    const { error } = await supabase.from("categories").delete().eq("id", c.id);
    if (error) {
      toast.error(`Cannot delete: ${error.message}`);
      return;
    }
    toast.success("Category deleted");
    setItems((prev) => prev.filter((x) => x.id !== c.id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl">Categories</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage product categories shown across the shop.</p>
        </div>
        <Button onClick={startNew}>
          <Plus className="h-4 w-4 mr-2" /> Add Category
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-background border rounded-xl p-4 flex gap-4">
              <Skeleton className="h-20 w-20 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-8 w-24 mt-2" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-background border rounded-xl p-12 text-center text-muted-foreground">
          No categories yet. Create your first one.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((c) => (
            <div key={c.id} className="bg-background border rounded-xl p-4 flex gap-4">
              <div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                {c.image_url ? (
                  <img src={resolveImage(c.image_url)} alt={c.name} className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-serif text-lg leading-tight truncate">{c.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">/{c.slug}</p>
                <p className="text-xs mt-2">
                  <span className={c.product_count ? "text-foreground" : "text-muted-foreground"}>
                    {c.product_count} product{c.product_count === 1 ? "" : "s"}
                  </span>
                </p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" onClick={() => startEdit(c)}>
                    <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(c)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <CategoryDialog
        open={open}
        onOpenChange={setOpen}
        value={editing}
        onChange={setEditing}
        onSaved={() => {
          setOpen(false);
          load();
        }}
      />
    </div>
  );
}

function CategoryDialog({
  open,
  onOpenChange,
  value,
  onChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  value: CategoryRow | null;
  onChange: (c: CategoryRow | null) => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!value) return null;
  const isNew = !value.id;

  const save = async () => {
    if (!value.name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    const payload = {
      name: value.name.trim(),
      slug: value.slug?.trim() || slugify(value.name),
      description: value.description || null,
      image_url: value.image_url,
      sort_order: value.sort_order,
    };
    if (isNew) {
      const { error } = await supabase.from("categories").insert(payload);
      if (error) {
        toast.error(error.message);
        setSaving(false);
        return;
      }
      toast.success("Category created");
    } else {
      const { error } = await supabase.from("categories").update(payload).eq("id", value.id);
      if (error) {
        toast.error(error.message);
        setSaving(false);
        return;
      }
      toast.success("Category updated");
    }
    setSaving(false);
    onSaved();
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    const url = await uploadImage(file);
    setUploading(false);
    if (url) onChange({ ...value, image_url: url });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isNew ? "New Category" : "Edit Category"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Name *</Label>
            <Input
              value={value.name}
              onChange={(e) =>
                onChange({
                  ...value,
                  name: e.target.value,
                  slug: !value.id || !value.slug ? slugify(e.target.value) : value.slug,
                })
              }
              placeholder="e.g. Cribs & Cradles"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Slug (URL)</Label>
            <Input
              value={value.slug}
              onChange={(e) => onChange({ ...value, slug: slugify(e.target.value) })}
              placeholder="cribs-cradles"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Image / Icon (optional)</Label>
            <div className="flex items-start gap-4">
              <div className="h-24 w-24 rounded-lg border-2 border-dashed bg-muted/30 flex items-center justify-center overflow-hidden">
                {value.image_url ? (
                  <img src={resolveImage(value.image_url)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex flex-col gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                />
                <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  <Upload className="h-3.5 w-3.5 mr-2" /> {uploading ? "Uploading…" : "Upload"}
                </Button>
                {value.image_url && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => onChange({ ...value, image_url: null })}>
                    <X className="h-3.5 w-3.5 mr-2" /> Remove
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}