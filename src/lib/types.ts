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
