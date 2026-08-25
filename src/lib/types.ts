export type Json =
  | string | number | boolean | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sort_order: number;
};

export type ProductOption = { label: string; value: string };

export type Product = {
  id: string;
  slug: string;
  category_id: string;
  name: string;
  tagline: string | null;
  description: string | null;
  starting_price: number;
  sale_price: number | null;
  sale_ends_at: string | null;
  image_url: string | null;
  gallery: Json;
  sizes: Json;
  finishes: Json;
  materials: string | null;
  safety_info: string | null;
  care_info: string | null;
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
  "id, slug, category_id, name, tagline, description, starting_price, image_url, gallery, sizes, finishes, materials, safety_info, care_info, lead_time_weeks, is_featured, is_active, created_at, updated_at, stock_quantity, portable_changing_table_enabled, sale_price, sale_ends_at";

/** Variant columns safe to expose to storefront (anonymous) visitors. */
export const PUBLIC_VARIANT_COLUMNS =
  "id, product_id, name, price, stock_quantity, image_url, sort_order, is_active, created_at, updated_at, variant_type, color_hex, sale_price, sale_ends_at";
