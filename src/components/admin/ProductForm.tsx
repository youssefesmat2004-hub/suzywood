import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { resolveImage } from "@/lib/images";
import { Trash2, Upload, Plus, X, Image as ImageIcon, Crop as CropIcon } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { useImageCropper } from "@/hooks/use-image-cropper";
type Category = { id: string; name: string; slug: string };
type CategorySize = { label: string; price: number };
type Variant = {
  id?: string;
  name: string;
  price: number;
  stock_quantity: number;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  variant_type?: "size" | "fabric_color";
  color_hex?: string | null;
  _delete?: boolean;
};

// Default fabric palette for Nursing Chair (and other upholstered products).
const FABRIC_PALETTE: { name: string; hex: string }[] = [
  { name: "Ivory White", hex: "#F4F4F0" },
  { name: "Natural Beige", hex: "#E6DFD3" },
  { name: "Light Greige", hex: "#D1CCC4" },
  { name: "Ash Grey", hex: "#B5B5B5" },
  { name: "Mustard Yellow", hex: "#C49A45" },
  { name: "Sage Green", hex: "#A9BCA7" },
  { name: "Dusty Blue", hex: "#7E95AD" },
  { name: "Ice Blue", hex: "#D2DBE3" },
  { name: "Steel Blue", hex: "#6B7A8C" },
  { name: "Charcoal Grey", hex: "#5A5C63" },
  { name: "Vanilla Cream", hex: "#EFE9D8" },
  { name: "Pure White", hex: "#FFFFFF" },
  { name: "Snow", hex: "#F5F5F5" },
  { name: "Cream", hex: "#EAE6DF" },
  { name: "Sand", hex: "#D4CBBF" },
  { name: "Taupe", hex: "#A89B90" },
  { name: "Mocha", hex: "#8C776B" },
  { name: "Pale Pink", hex: "#DECDD3" },
  { name: "Dusty Rose", hex: "#B58686" },
  { name: "Terracotta", hex: "#9A5A43" },
  { name: "Mint", hex: "#A6BBAE" },
  { name: "Forest Green", hex: "#3E5950" },
  { name: "Deep Teal", hex: "#29454D" },
  { name: "Dark Emerald", hex: "#1C332A" },
  { name: "Powder Blue", hex: "#9EB3C9" },
  { name: "Slate Blue", hex: "#495C73" },
  { name: "Navy", hex: "#1D273B" },
  { name: "Light Silver", hex: "#D1D3D4" },
  { name: "Medium Grey", hex: "#9D9FA2" },
  { name: "Charcoal Velvet", hex: "#4A4A4C" },
  { name: "Solid Black", hex: "#1A1A1A" },
];

export type ProductFormValue = {
  id?: string;
  name: string;
  slug: string;
  category_id: string;
  tagline: string;
  description: string;
  starting_price: number;
  stock_quantity: number;
  image_url: string | null;
  gallery: string[];
  materials: string;
  care_info: string;
  safety_info: string;
  lead_time_weeks: number;
  is_active: boolean;
  is_featured: boolean;
};

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

async function uploadImage(file: File | Blob, originalName?: string): Promise<string | null> {
  if ((file as File).size && (file as File).size > 5 * 1024 * 1024) {
    toast.error("Image is too large", { description: "Please upload an image under 5MB." });
    return null;
  }
  const fromName = originalName?.split(".").pop();
  const fromType = file.type?.split("/")[1];
  const ext = (fromName || fromType || "jpg").toLowerCase();
  const path = `${crypto.randomUUID()}.${ext}`;
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

export function ProductForm({ initial, productId }: { initial?: ProductFormValue; productId?: string }) {
  const navigate = useNavigate();
  const cropper = useImageCropper();
  const [categories, setCategories] = useState<Category[]>([]);
  const [v, setV] = useState<ProductFormValue>(
    initial ?? {
      name: "",
      slug: "",
      category_id: "",
      tagline: "",
      description: "",
      starting_price: 0,
      stock_quantity: 0,
      image_url: null,
      gallery: [],
      materials: "",
      care_info: "",
      safety_info: "",
      lead_time_weeks: 4,
      is_active: true,
      is_featured: false,
    },
  );
  const [variants, setVariants] = useState<Variant[]>([]);
  const [categorySizes, setCategorySizes] = useState<CategorySize[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const mainInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const selectedCategorySlug = categories.find((c) => c.id === v.category_id)?.slug ?? "";
  const isUpholstered =
    selectedCategorySlug === "nursing-chair" || selectedCategorySlug === "nursing-chairs";

  useEffect(() => {
    supabase.from("categories").select("id,name,slug").order("sort_order").then(({ data }) => {
      setCategories((data ?? []) as Category[]);
      if (!initial && data && data.length && !v.category_id) {
        setV((cur) => ({ ...cur, category_id: data[0].id }));
      }
    });
    if (productId) {
      supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", productId)
        .order("sort_order")
        .then(({ data }) => setVariants((data ?? []) as Variant[]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  // Load size catalog for the selected category from the DB.
  useEffect(() => {
    if (!v.category_id) {
      setCategorySizes([]);
      return;
    }
    supabase
      .from("category_sizes")
      .select("label,price,is_active")
      .eq("category_id", v.category_id)
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => {
        setCategorySizes(((data ?? []) as Array<{ label: string; price: number }>).map((r) => ({ label: r.label, price: Number(r.price) })));
      });
  }, [v.category_id]);

  // Auto-fill variants from category sizes (only on NEW products when no
  // variants have been added yet — never overwrite existing/edited variants).
  useEffect(() => {
    if (productId) return;
    if (categorySizes.length === 0) return;
    const liveVariants = variants.filter((x) => !x._delete);
    // Skip auto size fill for upholstered (fabric color) categories.
    if (isUpholstered) return;
    const presetLabels = categorySizes.map((s) => s.label);
    const isEmptyOrPresetMatch =
      liveVariants.length === 0 ||
      liveVariants.every((x) => !x.id && x.stock_quantity === 0 && (!x.name.trim() || presetLabels.includes(x.name)));
    if (!isEmptyOrPresetMatch) return;
    setVariants(
      categorySizes.map((s, i) => ({
        name: s.label,
        price: s.price || v.starting_price,
        stock_quantity: 0,
        image_url: null,
        sort_order: i,
        is_active: true,
        variant_type: "size",
        color_hex: null,
      })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categorySizes, productId, isUpholstered]);

  const handleMainUpload = async (file: File) => {
    setUploadingMain(true);
    const cropped = await cropper.open(file, { title: "Crop main image" });
    const url = await uploadImage(cropped ?? file, file.name);
    setUploadingMain(false);
    if (url) setV({ ...v, image_url: url });
  };

  const recropMain = async () => {
    if (!v.image_url) return;
    const cropped = await cropper.open(resolveImage(v.image_url), { title: "Re-crop main image" });
    if (!cropped) return;
    setUploadingMain(true);
    const url = await uploadImage(cropped);
    setUploadingMain(false);
    if (url) setV({ ...v, image_url: url });
  };

  const handleGalleryUpload = async (files: FileList) => {
    setUploadingGallery(true);
    const urls: string[] = [];
    for (const f of Array.from(files)) {
      const cropped = await cropper.open(f, { title: "Crop gallery image" });
      const u = await uploadImage(cropped ?? f, f.name);
      if (u) urls.push(u);
    }
    setUploadingGallery(false);
    setV({ ...v, gallery: [...v.gallery, ...urls] });
  };

  const recropGallery = async (idx: number) => {
    const current = v.gallery[idx];
    if (!current) return;
    const cropped = await cropper.open(resolveImage(current), { title: "Re-crop gallery image" });
    if (!cropped) return;
    const url = await uploadImage(cropped);
    if (url) setV({ ...v, gallery: v.gallery.map((u, i) => (i === idx ? url : u)) });
  };

  const handleVariantImage = async (idx: number, file: File) => {
    const cropped = await cropper.open(file, { title: "Crop variant image" });
    const url = await uploadImage(cropped ?? file, file.name);
    if (url) {
      setVariants((prev) => prev.map((x, i) => (i === idx ? { ...x, image_url: url } : x)));
    }
  };

  const recropVariant = async (idx: number) => {
    const current = variants[idx]?.image_url;
    if (!current) return;
    const cropped = await cropper.open(resolveImage(current), { title: "Re-crop variant image" });
    if (!cropped) return;
    const url = await uploadImage(cropped);
    if (url) setVariants((prev) => prev.map((x, i) => (i === idx ? { ...x, image_url: url } : x)));
  };

  const addVariant = () => {
    setVariants([
      ...variants,
      {
        name: "",
        price: v.starting_price,
        stock_quantity: 0,
        image_url: null,
        sort_order: variants.length,
        is_active: true,
        variant_type: isUpholstered ? "fabric_color" : "size",
        color_hex: isUpholstered ? "#F4F4F0" : null,
      },
    ]);
  };

  const addAllFabricPresets = () => {
    const existingNames = new Set(
      variants.filter((x) => !x._delete && x.variant_type === "fabric_color").map((x) => x.name.toLowerCase()),
    );
    const toAdd = FABRIC_PALETTE.filter((c) => !existingNames.has(c.name.toLowerCase()));
    if (toAdd.length === 0) {
      toast.info("All preset colors are already added");
      return;
    }
    setVariants((prev) => [
      ...prev,
      ...toAdd.map((c, i) => ({
        name: c.name,
        price: v.starting_price,
        stock_quantity: 0,
        image_url: null,
        sort_order: prev.length + i,
        is_active: true,
        variant_type: "fabric_color" as const,
        color_hex: c.hex,
      })),
    ]);
    toast.success(`Added ${toAdd.length} fabric colors`);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!v.name.trim()) return toast.error("Name is required");
    if (!v.category_id) return toast.error("Category is required");
    setSaving(true);
    const slug = v.slug || slugify(v.name);
    const payload = {
      name: v.name,
      slug,
      category_id: v.category_id,
      tagline: v.tagline || null,
      description: v.description || null,
      starting_price: Number(v.starting_price),
      stock_quantity: Number(v.stock_quantity),
      image_url: v.image_url,
      gallery: v.gallery,
      materials: v.materials || null,
      care_info: v.care_info || null,
      safety_info: v.safety_info || null,
      lead_time_weeks: Number(v.lead_time_weeks),
      is_active: v.is_active,
      is_featured: v.is_featured,
    };

    let pid = productId;
    if (pid) {
      const { error } = await supabase.from("products").update(payload).eq("id", pid);
      if (error) {
        setSaving(false);
        toast.error(error.message);
        return;
      }
    } else {
      const { data, error } = await supabase.from("products").insert(payload).select("id").single();
      if (error || !data) {
        setSaving(false);
        toast.error(error?.message ?? "Failed to create");
        return;
      }
      pid = data.id;
    }

    // Variants sync
    for (const variant of variants) {
      if (variant._delete && variant.id) {
        await supabase.from("product_variants").delete().eq("id", variant.id);
      } else if (variant.id) {
        await supabase.from("product_variants").update({
          name: variant.name,
          price: Number(variant.price),
          stock_quantity: Number(variant.stock_quantity),
          image_url: variant.image_url,
          sort_order: variant.sort_order,
          is_active: variant.is_active,
          variant_type: variant.variant_type ?? "size",
          color_hex: variant.variant_type === "fabric_color" ? (variant.color_hex ?? null) : null,
        }).eq("id", variant.id);
      } else if (!variant._delete && variant.name.trim()) {
        await supabase.from("product_variants").insert({
          product_id: pid,
          name: variant.name,
          price: Number(variant.price),
          stock_quantity: Number(variant.stock_quantity),
          image_url: variant.image_url,
          sort_order: variant.sort_order,
          is_active: variant.is_active,
          variant_type: variant.variant_type ?? "size",
          color_hex: variant.variant_type === "fabric_color" ? (variant.color_hex ?? null) : null,
        });
      }
    }

    setSaving(false);
    toast.success(productId ? "Product updated" : "Product created");
    navigate({ to: "/admin/products" });
  };

  return (
    <form onSubmit={submit} className="space-y-8 max-w-4xl">
      {cropper.dialog}
      <section className="bg-background border rounded-xl p-6 space-y-4">
        <h2 className="font-serif text-xl">Basics</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Name *</Label>
            <Input value={v.name} onChange={(e) => setV({ ...v, name: e.target.value, slug: v.slug || slugify(e.target.value) })} required />
          </div>
          <div className="space-y-1.5">
            <Label>Slug (URL)</Label>
            <Input value={v.slug} onChange={(e) => setV({ ...v, slug: slugify(e.target.value) })} />
          </div>
          <div className="space-y-1.5">
            <Label>Category *</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={v.category_id}
              onChange={(e) => setV({ ...v, category_id: e.target.value })}
              required
            >
              <option value="">Select…</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Tagline</Label>
            <Input value={v.tagline} onChange={(e) => setV({ ...v, tagline: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Starting Price (EGP) *</Label>
            <Input type="number" min={0} step="0.01" value={v.starting_price} onChange={(e) => setV({ ...v, starting_price: Number(e.target.value) })} required />
          </div>
          <div className="space-y-1.5">
            <Label>Stock Quantity</Label>
            <Input type="number" min={0} value={v.stock_quantity} onChange={(e) => setV({ ...v, stock_quantity: Number(e.target.value) })} />
          </div>
          <div className="space-y-1.5">
            <Label>Lead time (weeks)</Label>
            <Input type="number" min={0} value={v.lead_time_weeks} onChange={(e) => setV({ ...v, lead_time_weeks: Number(e.target.value) })} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Description</Label>
          <Textarea rows={4} value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} />
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="space-y-1.5"><Label>Materials</Label><Input value={v.materials} onChange={(e) => setV({ ...v, materials: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Care info</Label><Input value={v.care_info} onChange={(e) => setV({ ...v, care_info: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Safety info</Label><Input value={v.safety_info} onChange={(e) => setV({ ...v, safety_info: e.target.value })} /></div>
        </div>
        <div className="flex gap-6 pt-2">
          <label className="flex items-center gap-2"><Switch checked={v.is_active} onCheckedChange={(c) => setV({ ...v, is_active: c })} /><span className="text-sm">Active (visible on shop)</span></label>
          <label className="flex items-center gap-2"><Switch checked={v.is_featured} onCheckedChange={(c) => setV({ ...v, is_featured: c })} /><span className="text-sm">Featured</span></label>
        </div>
      </section>

      <section className="bg-background border rounded-xl p-6 space-y-4">
        <h2 className="font-serif text-xl">Images</h2>
        <div>
          <Label>Main image</Label>
          <div className="mt-2 flex items-start gap-4">
            <div className="h-32 w-32 rounded-lg border-2 border-dashed flex items-center justify-center bg-muted/30 overflow-hidden">
              {v.image_url ? (
                <img src={resolveImage(v.image_url)} alt="" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <input
                ref={mainInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => e.target.files?.[0] && handleMainUpload(e.target.files[0])}
              />
              <Button type="button" variant="outline" size="sm" onClick={() => mainInputRef.current?.click()} disabled={uploadingMain}>
                <Upload className="h-3.5 w-3.5 mr-2" /> {uploadingMain ? "Uploading…" : "Upload"}
              </Button>
              {v.image_url && (
                <>
                  <Button type="button" variant="ghost" size="sm" onClick={recropMain} disabled={uploadingMain}>
                    <CropIcon className="h-3.5 w-3.5 mr-2" /> Crop
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setV({ ...v, image_url: null })}>
                    <X className="h-3.5 w-3.5 mr-2" /> Remove
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        <div>
          <Label>Gallery</Label>
          <div className="mt-2 flex flex-wrap gap-3">
            {v.gallery.map((url, i) => (
              <div key={i} className="relative h-24 w-24 rounded-lg overflow-hidden border group">
                <img src={resolveImage(url)} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => recropGallery(i)}
                  className="absolute top-1 left-1 h-5 w-5 rounded-full bg-background/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Crop"
                >
                  <CropIcon className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setV({ ...v, gallery: v.gallery.filter((_, j) => j !== i) })}
                  className="absolute top-1 right-1 h-5 w-5 rounded-full bg-background/90 flex items-center justify-center"
                  title="Remove"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="h-24 w-24 rounded-lg border-2 border-dashed flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary"
            >
              {uploadingGallery ? "…" : <Plus className="h-5 w-5" />}
            </button>
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => e.target.files && handleGalleryUpload(e.target.files)}
            />
          </div>
        </div>
      </section>

      <section className="bg-background border rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-xl">{isUpholstered ? "Fabric Colors" : "Variants"}</h2>
            <p className="text-xs text-muted-foreground mt-1">
              {isUpholstered
                ? "Each fabric color is its own variant with price, stock, swatch image and hex color."
                : "Sizes auto-load from the selected category. Each variant has its own price, stock, and optional image."}
            </p>
          </div>
          <div className="flex gap-2">
            {isUpholstered && (
              <Button type="button" variant="outline" size="sm" onClick={addAllFabricPresets}>
                <Plus className="h-3.5 w-3.5 mr-1.5" /> Add preset palette
              </Button>
            )}
            <Button type="button" variant="outline" size="sm" onClick={addVariant}>
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Add {isUpholstered ? "Color" : "Variant"}
            </Button>
          </div>
        </div>
        {variants.filter((x) => !x._delete).length === 0 && (
          <p className="text-sm text-muted-foreground">
            {isUpholstered
              ? "No fabric colors yet. Click \"Add preset palette\" to load the full color set."
              : "No variants. Add one if this product has size/color/material options."}
          </p>
        )}
        <div className="space-y-3">
          {variants.map((variant, idx) =>
            variant._delete ? null : (
              <div key={variant.id ?? `new-${idx}`} className="border rounded-lg p-4 grid sm:grid-cols-12 gap-3 items-start">
                <VariantImage
                  variant={variant}
                  onUpload={(f) => handleVariantImage(idx, f)}
                  onClear={() => setVariants((p) => p.map((x, i) => i === idx ? { ...x, image_url: null } : x))}
                  onRecrop={() => recropVariant(idx)}
                />
                <div className={`${variant.variant_type === "fabric_color" ? "sm:col-span-3" : "sm:col-span-4"} space-y-1`}>
                  <Label className="text-xs">{variant.variant_type === "fabric_color" ? "Color name" : "Variant name"}</Label>
                  <Input
                    placeholder={variant.variant_type === "fabric_color" ? "e.g. Baby Blue" : "e.g. Size: M / Walnut"}
                    value={variant.name}
                    onChange={(e) => setVariants((p) => p.map((x, i) => i === idx ? { ...x, name: e.target.value } : x))}
                  />
                </div>
                {variant.variant_type === "fabric_color" && (
                  <div className="sm:col-span-1 space-y-1">
                    <Label className="text-xs">Color</Label>
                    <input
                      type="color"
                      value={variant.color_hex ?? "#ffffff"}
                      onChange={(e) =>
                        setVariants((p) =>
                          p.map((x, i) => (i === idx ? { ...x, color_hex: e.target.value.toUpperCase() } : x)),
                        )
                      }
                      className="h-10 w-full rounded border border-input cursor-pointer bg-transparent"
                      title={variant.color_hex ?? ""}
                    />
                  </div>
                )}
                <div className="sm:col-span-2 space-y-1">
                  <Label className="text-xs">Price</Label>
                  <Input type="number" min={0} value={variant.price} onChange={(e) => setVariants((p) => p.map((x, i) => i === idx ? { ...x, price: Number(e.target.value) } : x))} />
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <Label className="text-xs">Stock</Label>
                  <Input type="number" min={0} value={variant.stock_quantity} onChange={(e) => setVariants((p) => p.map((x, i) => i === idx ? { ...x, stock_quantity: Number(e.target.value) } : x))} />
                </div>
                <div className="sm:col-span-2 flex items-end justify-end h-full">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setVariants((p) => p.map((x, i) => i === idx ? { ...x, _delete: true } : x))}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ),
          )}
        </div>
      </section>

      <div className="flex gap-3">
        <Button type="submit" disabled={saving}>{saving ? "Saving…" : productId ? "Save Changes" : "Create Product"}</Button>
        <Button type="button" variant="outline" onClick={() => navigate({ to: "/admin/products" })}>Cancel</Button>
      </div>
    </form>
  );
}

function VariantImage({ variant, onUpload, onClear, onRecrop }: { variant: Variant; onUpload: (f: File) => void; onClear: () => void; onRecrop: () => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="sm:col-span-2">
      <Label className="text-xs">Image</Label>
      <div className="mt-1 h-16 w-16 rounded-lg border bg-muted/30 overflow-hidden relative group">
        {variant.image_url ? (
          <>
            <img src={resolveImage(variant.image_url)} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50 text-white text-[10px] opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1">
              <button type="button" onClick={onRecrop} className="px-1.5 py-0.5 rounded bg-white/20 hover:bg-white/30">
                Crop
              </button>
              <button type="button" onClick={onClear} className="px-1.5 py-0.5 rounded bg-white/20 hover:bg-white/30">
                Clear
              </button>
            </div>
          </>
        ) : (
          <button type="button" onClick={() => ref.current?.click()} className="w-full h-full flex items-center justify-center text-muted-foreground">
            <Upload className="h-4 w-4" />
          </button>
        )}
        <input ref={ref} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />
      </div>
    </div>
  );
}