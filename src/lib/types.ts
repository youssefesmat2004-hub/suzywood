export type Json =
  | string | number | boolean | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Category = {
  id: string;
  slug: string;
  name: string;
  name_ar: string | null;
  description: string | null;
  description_ar: string | null;
  sort_order: number;
};

export type ProductOption = { label: string; value: string };

export type Product = {
  id: string;
  slug: string;
  category_id: string;
  name: string;
  name_ar: string | null;
  tagline: string | null;
  tagline_ar: string | null;
  description: string | null;
  description_ar: string | null;
  starting_price: number;
  sale_price: number | null;
  sale_ends_at: string | null;
  image_url: string | null;
  gallery: Json;
  sizes: Json;
  finishes: Json;
  sizes_ar: Json | null;
  finishes_ar: Json | null;
  materials: string | null;
  materials_ar: string | null;
  safety_info: string | null;
  safety_info_ar: string | null;
  care_info: string | null;
  care_info_ar: string | null;
  lead_time_weeks: number;
  is_featured: boolean;
  is_active: boolean;
  stock_quantity?: number;
  has_variants?: boolean;
  category_slug?: string;
  portable_changing_table_enabled?: boolean | null;
};

export type Review = {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  body: string | null;
  created_at: string;
};

export const asOptions = (v: Json): ProductOption[] =>
  Array.isArray(v) ? (v as ProductOption[]) : [];

export function getActiveSalePrice(item: { sale_price: number | null; sale_ends_at: string | null }): number | null {
  if (!item.sale_price) return null;
  if (item.sale_ends_at && new Date(item.sale_ends_at) <= new Date()) return null;
  return item.sale_price;
}

/** Columns safe to expose to storefront (anonymous) visitors — excludes internal cost fields. */
export const PUBLIC_PRODUCT_COLUMNS =
  "id, slug, category_id, name, name_ar, tagline, tagline_ar, description, description_ar, starting_price, image_url, gallery, sizes, sizes_ar, finishes, finishes_ar, materials, materials_ar, safety_info, safety_info_ar, care_info, care_info_ar, lead_time_weeks, is_featured, is_active, created_at, updated_at, stock_quantity, portable_changing_table_enabled, sale_price, sale_ends_at";

/** Variant columns safe to expose to storefront (anonymous) visitors. */
export const PUBLIC_VARIANT_COLUMNS =
  "id, product_id, name, name_ar, price, stock_quantity, image_url, sort_order, is_active, created_at, updated_at, variant_type, color_hex, sale_price, sale_ends_at";

export function localizedText(lang: "en" | "ar", english: string | null | undefined, arabic: string | null | undefined): string {
  return (lang === "ar" ? arabic?.trim() : english?.trim()) || english?.trim() || "";
}

export function localizedProduct(product: Product, lang: "en" | "ar"): Product {
  if (lang !== "ar") return product;
  return {
    ...product,
    name: localizedText(lang, product.name, product.name_ar),
    tagline: localizedText(lang, product.tagline, product.tagline_ar) || null,
    description: localizedText(lang, product.description, product.description_ar) || null,
    materials: localizedText(lang, product.materials, product.materials_ar) || null,
    safety_info: localizedText(lang, product.safety_info, product.safety_info_ar) || null,
    care_info: localizedText(lang, product.care_info, product.care_info_ar) || null,
    sizes: product.sizes_ar ?? product.sizes,
    finishes: product.finishes_ar ?? product.finishes,
  };
}
