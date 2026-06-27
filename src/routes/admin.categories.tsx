import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, Upload, X, ImageIcon, GripVertical, ArrowUp, ArrowDown, Crop as CropIcon } from "lucide-react";
import { toast } from "sonner";
import { resolveImage } from "@/lib/images";
import { useImageCropper } from "@/hooks/use-image-cropper";
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
  custom_size_enabled: boolean;
  custom_size_surcharge: number;
  custom_size_note: string | null;
  name_engraving_enabled: boolean;
  name_engraving_surcharge: number;
  name_engraving_note: string | null;
  finish_label: string | null;
  ottoman_addon_enabled: boolean;
  ottoman_addon_price: number;
  ottoman_addon_note: string | null;
  portable_changing_table_enabled: boolean;
  portable_changing_table_price: number;
  portable_changing_table_note: string | null;
  mattress_addon_enabled: boolean;
  mattress_small_price: number;
  mattress_big_price: number;
  mattress_addon_note: string | null;
  product_count?: number;
};

type SizeRow = {
  id?: string;
  label: string;
  price: number;
  sort_order: number;
  is_active: boolean;
  mattress_tier?: "small" | "big" | null;
  _delete?: boolean;
};

export const Route = createFileRoute("/admin/categories")({
  component: CategoriesPage,
});

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

async function uploadImage(file: File | Blob, originalName?: string): Promise<string | null> {
  const fromName = originalName?.split(".").pop();
  const fromType = file.type?.split("/")[1];
  const ext = (fromName || fromType || "jpg").toLowerCase();
  const path = `categories/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("product-images").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || "image/jpeg",
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
    setEditing({
      id: "",
      name: "",
      slug: "",
      description: "",
      image_url: null,
      sort_order: items.length,
      custom_size_enabled: false,
      custom_size_surcharge: 0,
      custom_size_note: null,
      name_engraving_enabled: false,
      name_engraving_surcharge: 0,
      name_engraving_note: null,
      finish_label: null,
      ottoman_addon_enabled: false,
      ottoman_addon_price: 0,
      ottoman_addon_note: null,
      portable_changing_table_enabled: false,
      portable_changing_table_price: 0,
      portable_changing_table_note: null,
    });
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
  const [sizes, setSizes] = useState<SizeRow[]>([]);
  const [sizesLoading, setSizesLoading] = useState(false);
  const cropper = useImageCropper();

  useEffect(() => {
    if (!open || !value?.id) {
      setSizes([]);
      return;
    }
    setSizesLoading(true);
    supabase
      .from("category_sizes")
      .select("*")
      .eq("category_id", value.id)
      .order("sort_order")
      .then(({ data }) => {
        setSizes(((data ?? []) as SizeRow[]).map((s) => ({ ...s, price: Number(s.price) })));
        setSizesLoading(false);
      });
  }, [open, value?.id]);

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
      custom_size_enabled: value.custom_size_enabled,
      custom_size_surcharge: Number(value.custom_size_surcharge) || 0,
      custom_size_note: value.custom_size_note || null,
      name_engraving_enabled: value.name_engraving_enabled,
      name_engraving_surcharge: Number(value.name_engraving_surcharge) || 0,
      name_engraving_note: value.name_engraving_note || null,
      finish_label: value.finish_label?.trim() || null,
      ottoman_addon_enabled: value.ottoman_addon_enabled,
      ottoman_addon_price: Number(value.ottoman_addon_price) || 0,
      ottoman_addon_note: value.ottoman_addon_note || null,
      portable_changing_table_enabled: value.portable_changing_table_enabled,
      portable_changing_table_price: Number(value.portable_changing_table_price) || 0,
      portable_changing_table_note: value.portable_changing_table_note || null,
    };
    let catId = value.id;
    if (isNew) {
      const { data, error } = await supabase.from("categories").insert(payload).select("id").single();
      if (error || !data) {
        toast.error(error.message);
        setSaving(false);
        return;
      }
      catId = data.id;
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

    // Sync size rows
    for (const s of sizes) {
      if (s._delete && s.id) {
        await supabase.from("category_sizes").delete().eq("id", s.id);
      } else if (s._delete) {
        continue;
      } else if (s.id) {
        await supabase.from("category_sizes").update({
          label: s.label,
          price: Number(s.price) || 0,
          sort_order: s.sort_order,
          is_active: s.is_active,
        }).eq("id", s.id);
      } else if (s.label.trim()) {
        await supabase.from("category_sizes").insert({
          category_id: catId,
          label: s.label.trim(),
          price: Number(s.price) || 0,
          sort_order: s.sort_order,
          is_active: s.is_active,
        });
      }
    }

    setSaving(false);
    onSaved();
  };

  const handleUpload = async (file: File) => {
    const cropped = await cropper.open(file, { title: "Crop category image" });
    setUploading(true);
    const url = await uploadImage(cropped ?? file, file.name);
    setUploading(false);
    if (url) onChange({ ...value, image_url: url });
  };

  const recrop = async () => {
    if (!value.image_url) return;
    const cropped = await cropper.open(resolveImage(value.image_url), { title: "Re-crop category image" });
    if (!cropped) return;
    setUploading(true);
    const url = await uploadImage(cropped);
    setUploading(false);
    if (url) onChange({ ...value, image_url: url });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {cropper.dialog}
        <DialogHeader>
          <DialogTitle>{isNew ? "New Category" : "Edit Category"}</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="details">
          <TabsList className="grid grid-cols-6 w-full">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="sizes" disabled={isNew}>Sizes & Pricing</TabsTrigger>
            <TabsTrigger value="custom" disabled={isNew}>Custom Size</TabsTrigger>
            <TabsTrigger value="engraving" disabled={isNew}>Engraving</TabsTrigger>
            <TabsTrigger value="ottoman" disabled={isNew}>Ottoman</TabsTrigger>
            <TabsTrigger value="portable" disabled={isNew}>Portable Table</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 mt-4">
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
            <Label>Colour / Finish picker label (optional)</Label>
            <Input
              value={value.finish_label ?? ""}
              onChange={(e) => onChange({ ...value, finish_label: e.target.value })}
              placeholder="e.g. Pompom Colour"
            />
            <p className="text-xs text-muted-foreground">Overrides the default "Wood Finish" label on product pages.</p>
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
                  <>
                    <Button type="button" variant="ghost" size="sm" onClick={recrop} disabled={uploading}>
                      <CropIcon className="h-3.5 w-3.5 mr-2" /> Crop
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => onChange({ ...value, image_url: null })}>
                      <X className="h-3.5 w-3.5 mr-2" /> Remove
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
          {isNew && (
            <p className="text-xs text-muted-foreground italic">
              Save this category first, then you can add sizes & custom-size options.
            </p>
          )}
          </TabsContent>

          <TabsContent value="sizes" className="space-y-3 mt-4">
            <p className="text-xs text-muted-foreground">
              These sizes are offered to customers on every product in this category. New products auto-load these as variants with the default price.
            </p>
            {sizesLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : (
              <div className="space-y-2">
                {sizes.filter((s) => !s._delete).length === 0 && (
                  <p className="text-sm text-muted-foreground py-4 text-center border rounded-lg">No sizes yet.</p>
                )}
                {sizes.map((s, idx) =>
                  s._delete ? null : (
                    <div key={s.id ?? `new-${idx}`} className="flex items-center gap-2 border rounded-lg p-2">
                      <div className="flex flex-col">
                        <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => {
                          if (idx === 0) return;
                          setSizes((prev) => {
                            const next = [...prev];
                            [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                            return next.map((x, i) => ({ ...x, sort_order: i }));
                          });
                        }}><ArrowUp className="h-3 w-3" /></button>
                        <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => {
                          setSizes((prev) => {
                            if (idx >= prev.length - 1) return prev;
                            const next = [...prev];
                            [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
                            return next.map((x, i) => ({ ...x, sort_order: i }));
                          });
                        }}><ArrowDown className="h-3 w-3" /></button>
                      </div>
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <Input
                        className="flex-1"
                        placeholder="e.g. 120 x 60 cm"
                        value={s.label}
                        onChange={(e) => setSizes((p) => p.map((x, i) => i === idx ? { ...x, label: e.target.value } : x))}
                      />
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          className="w-28"
                          placeholder="Price"
                          value={s.price}
                          onChange={(e) => setSizes((p) => p.map((x, i) => i === idx ? { ...x, price: Number(e.target.value) } : x))}
                        />
                        <span className="text-xs text-muted-foreground">EGP</span>
                      </div>
                      <Switch
                        checked={s.is_active}
                        onCheckedChange={(c) => setSizes((p) => p.map((x, i) => i === idx ? { ...x, is_active: c } : x))}
                      />
                      <Button type="button" variant="ghost" size="icon" onClick={() => setSizes((p) => p.map((x, i) => i === idx ? { ...x, _delete: true } : x))}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ),
                )}
              </div>
            )}
            <Button type="button" variant="outline" size="sm" onClick={() => setSizes((p) => [...p, { label: "", price: 0, sort_order: p.length, is_active: true }])}>
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Add size
            </Button>
          </TabsContent>

          <TabsContent value="custom" className="space-y-4 mt-4">
            <div className="flex items-center justify-between border rounded-lg p-3">
              <div>
                <p className="font-medium text-sm">Enable custom size option</p>
                <p className="text-xs text-muted-foreground">Lets customers request bespoke dimensions for products in this category.</p>
              </div>
              <Switch
                checked={value.custom_size_enabled}
                onCheckedChange={(c) => onChange({ ...value, custom_size_enabled: c })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Surcharge for custom size (EGP)</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={value.custom_size_surcharge}
                onChange={(e) => onChange({ ...value, custom_size_surcharge: Number(e.target.value) })}
                placeholder="e.g. 200"
              />
              <p className="text-xs text-muted-foreground">Added on top of the product's base price.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Note shown to customers</Label>
              <Textarea
                rows={3}
                value={value.custom_size_note ?? ""}
                onChange={(e) => onChange({ ...value, custom_size_note: e.target.value })}
                placeholder="e.g. Our carpenter will build this to your exact measurements"
              />
            </div>
          </TabsContent>

          <TabsContent value="engraving" className="space-y-4 mt-4">
            <div className="flex items-center justify-between border rounded-lg p-3">
              <div>
                <p className="font-medium text-sm">Offer name engraving</p>
                <p className="text-xs text-muted-foreground">Lets customers add a child's name for an extra fee.</p>
              </div>
              <Switch
                checked={value.name_engraving_enabled}
                onCheckedChange={(c) => onChange({ ...value, name_engraving_enabled: c })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Surcharge for name engraving (EGP)</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={value.name_engraving_surcharge}
                onChange={(e) => onChange({ ...value, name_engraving_surcharge: Number(e.target.value) })}
                placeholder="e.g. 250"
              />
              <p className="text-xs text-muted-foreground">Added on top of the product's price when a name is entered.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Note shown to customers</Label>
              <Textarea
                rows={3}
                value={value.name_engraving_note ?? ""}
                onChange={(e) => onChange({ ...value, name_engraving_note: e.target.value })}
                placeholder="e.g. Embroidered by hand. Allow 1 extra week."
              />
            </div>
          </TabsContent>

          <TabsContent value="ottoman" className="space-y-4 mt-4">
            <div className="flex items-center justify-between border rounded-lg p-3">
              <div>
                <p className="font-medium text-sm">Offer Ottoman Leg Rest add-on</p>
                <p className="text-xs text-muted-foreground">Lets customers add a matching ottoman leg rest to any product in this category.</p>
              </div>
              <Switch
                checked={value.ottoman_addon_enabled}
                onCheckedChange={(c) => onChange({ ...value, ottoman_addon_enabled: c })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Ottoman Leg Rest price (EGP)</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={value.ottoman_addon_price}
                onChange={(e) => onChange({ ...value, ottoman_addon_price: Number(e.target.value) })}
                placeholder="e.g. 2500"
              />
              <p className="text-xs text-muted-foreground">Added on top of the product's price when the customer ticks the ottoman option. Leave at 0 if you'll quote later.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Note shown to customers (optional)</Label>
              <Textarea
                rows={3}
                value={value.ottoman_addon_note ?? ""}
                onChange={(e) => onChange({ ...value, ottoman_addon_note: e.target.value })}
                placeholder="e.g. Matching fabric. Adds 1 extra week to lead time."
              />
            </div>
          </TabsContent>

          <TabsContent value="portable" className="space-y-4 mt-4">
            <div className="flex items-center justify-between border rounded-lg p-3">
              <div>
                <p className="font-medium text-sm">Offer Portable Changing Table add-on</p>
                <p className="text-xs text-muted-foreground">Lets customers add a portable changing table to any product in this category.</p>
              </div>
              <Switch
                checked={value.portable_changing_table_enabled}
                onCheckedChange={(c) => onChange({ ...value, portable_changing_table_enabled: c })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Portable changing table price (EGP)</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={value.portable_changing_table_price}
                onChange={(e) => onChange({ ...value, portable_changing_table_price: Number(e.target.value) })}
                placeholder="e.g. 2000"
              />
              <p className="text-xs text-muted-foreground">Added on top of the product's price when the customer ticks the portable changing table option.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Note shown to customers (optional)</Label>
              <Textarea
                rows={3}
                value={value.portable_changing_table_note ?? ""}
                onChange={(e) => onChange({ ...value, portable_changing_table_note: e.target.value })}
                placeholder="e.g. Lightweight padded top, easy to move between rooms."
              />
            </div>
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}