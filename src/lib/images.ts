import crib from "@/assets/product-crib.jpg";
import changingTable from "@/assets/product-changing-table.jpg";
import gate from "@/assets/product-gate.jpg";
import toddlerBed from "@/assets/product-toddler-bed.jpg";
import detail from "@/assets/product-changing-detail.jpg";
import cribAurora from "@/assets/crib-aurora.jpg";
import cribSoleil from "@/assets/crib-soleil.jpg";
import cribHeritage from "@/assets/crib-heritage.jpg";
import cribRoyal from "@/assets/crib-royal.jpg";
import cribWindsor from "@/assets/crib-windsor.jpg";
import cribClassic from "@/assets/crib-classic.jpg";
import cribMahogany from "@/assets/crib-mahogany.jpg";
import cribEden from "@/assets/crib-eden.jpg";
import cribSeaside from "@/assets/crib-seaside.jpg";
import cribPetite from "@/assets/crib-petite.jpg";

// Map from seeded image_url paths to bundled assets
const map: Record<string, string> = {
  "/src/assets/product-crib.jpg": crib,
  "/src/assets/product-changing-table.jpg": changingTable,
  "/src/assets/product-gate.jpg": gate,
  "/src/assets/product-toddler-bed.jpg": toddlerBed,
  "/src/assets/product-changing-detail.jpg": detail,
  "/src/assets/crib-aurora.jpg": cribAurora,
  "/src/assets/crib-soleil.jpg": cribSoleil,
  "/src/assets/crib-heritage.jpg": cribHeritage,
  "/src/assets/crib-royal.jpg": cribRoyal,
  "/src/assets/crib-windsor.jpg": cribWindsor,
  "/src/assets/crib-classic.jpg": cribClassic,
  "/src/assets/crib-mahogany.jpg": cribMahogany,
  "/src/assets/crib-eden.jpg": cribEden,
  "/src/assets/crib-seaside.jpg": cribSeaside,
  "/src/assets/crib-petite.jpg": cribPetite,
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
