import crib from "@/assets/product-crib.jpg";
import changingTable from "@/assets/product-changing-table.jpg";
import gate from "@/assets/product-gate.jpg";
import toddlerBed from "@/assets/product-toddler-bed.jpg";
import detail from "@/assets/product-changing-detail.jpg";

// Map from seeded image_url paths to bundled assets
const map: Record<string, string> = {
  "/src/assets/product-crib.jpg": crib,
  "/src/assets/product-changing-table.jpg": changingTable,
  "/src/assets/product-gate.jpg": gate,
  "/src/assets/product-toddler-bed.jpg": toddlerBed,
  "/src/assets/product-changing-detail.jpg": detail,
};

export function resolveImage(path?: string | null): string {
  if (!path) return crib;
  if (path.startsWith("http")) return path;
  return map[path] ?? crib;
}

export function resolveGallery(gallery: unknown): string[] {
  if (!Array.isArray(gallery)) return [];
  return gallery.map((p) => resolveImage(typeof p === "string" ? p : null));
}
