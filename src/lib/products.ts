import crib from "@/assets/product-crib.jpg";
import changingTable from "@/assets/product-changing-table.jpg";
import gate from "@/assets/product-gate.jpg";
import toddlerBed from "@/assets/product-toddler-bed.jpg";
import detail from "@/assets/product-changing-detail.jpg";

export type Product = {
  slug: string;
  name: string;
  tagline: string;
  startingPrice: number;
  image: string;
  gallery: string[];
  description: string;
  sizes: { label: string; value: string }[];
  finishes: { label: string; value: string }[];
};

export const products: Product[] = [
  {
    slug: "signature-crib",
    name: "The Signature Crib",
    tagline: "Heirloom oak crib, made to last generations.",
    startingPrice: 18500,
    image: crib,
    gallery: [crib, detail],
    description:
      "Hand-joined from solid European oak with rounded teething rails, three mattress heights, and a non-toxic plant-based finish. A piece designed to grow with your child and pass between siblings.",
    sizes: [
      { label: 'Standard 60 × 120 cm', value: 'standard' },
      { label: 'Grand 70 × 140 cm', value: 'grand' },
    ],
    finishes: [
      { label: 'Natural Oak', value: 'oak' },
      { label: 'Matte White', value: 'white' },
      { label: 'Sage Green', value: 'sage' },
    ],
  },
  {
    slug: "custom-changing-table",
    name: "Customizable Changing Table",
    tagline: "A calm corner for every routine.",
    startingPrice: 9800,
    image: changingTable,
    gallery: [changingTable, detail],
    description:
      "Open shelving and a soft-close drawer in a silhouette that converts to a console once the changing days are over. Crafted to your chosen size and finish.",
    sizes: [
      { label: 'Standard 80 cm', value: 'standard' },
      { label: 'Double 120 cm', value: 'double' },
    ],
    finishes: [
      { label: 'Natural Oak', value: 'oak' },
      { label: 'Matte White', value: 'white' },
      { label: 'Sage Green', value: 'sage' },
    ],
  },
  {
    slug: "safety-gate",
    name: "Heirloom Safety Gate",
    tagline: "Quiet protection, beautifully built.",
    startingPrice: 4200,
    image: gate,
    gallery: [gate, detail],
    description:
      "A pressure-mounted oak gate with a one-handed magnetic latch — designed to disappear into your home rather than interrupt it.",
    sizes: [
      { label: 'Doorway 75–85 cm', value: 'door' },
      { label: 'Wide 85–105 cm', value: 'wide' },
    ],
    finishes: [
      { label: 'Natural Oak', value: 'oak' },
      { label: 'Matte White', value: 'white' },
      { label: 'Sage Green', value: 'sage' },
    ],
  },
  {
    slug: "toddler-bed",
    name: "The Little Bed",
    tagline: "Their first big-kid bed.",
    startingPrice: 12400,
    image: toddlerBed,
    gallery: [toddlerBed, detail],
    description:
      "Low to the floor with gently curved guard rails. Made in solid oak with a finish safe enough for the youngest hands and mouths.",
    sizes: [
      { label: 'Toddler 70 × 140 cm', value: 'toddler' },
      { label: 'Junior 90 × 180 cm', value: 'junior' },
    ],
    finishes: [
      { label: 'Natural Oak', value: 'oak' },
      { label: 'Matte White', value: 'white' },
      { label: 'Sage Green', value: 'sage' },
    ],
  },
];

export const getProduct = (slug: string) => products.find((p) => p.slug === slug);
