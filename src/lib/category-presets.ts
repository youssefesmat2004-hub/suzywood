// Category-driven size presets. Keyed by category SLUG.
// When a product is created under one of these categories, the admin form
// auto-populates variants from this list so we never have to add the same
// sizes by hand.
export const CATEGORY_SIZE_PRESETS: Record<string, string[]> = {
  cribs: ["120 x 60 cm", "140 x 70 cm"],
  "kids-beds": ["100 x 200 cm", "120 x 200 cm", "140 x 200 cm"],
  "play-safety": ["120 x 120 cm — 160 cm Height"],
};

export function getSizePreset(slug: string | null | undefined): string[] {
  if (!slug) return [];
  return CATEGORY_SIZE_PRESETS[slug] ?? [];
}