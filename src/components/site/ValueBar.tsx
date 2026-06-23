import { Leaf, TreePine, Hammer } from "lucide-react";

const items = [
  { icon: TreePine, label: "100% Solid Wood" },
  { icon: Leaf, label: "Non-Toxic Finishes" },
  { icon: Hammer, label: "Handcrafted to Order" },
];

export function ValueBar() {
  return (
    <section className="border-y border-border bg-muted/50">
      <div className="container mx-auto px-6 lg:px-10 py-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
        {items.map((it) => (
          <div key={it.label} className="flex items-center justify-center gap-3">
            <it.icon className="h-5 w-5 text-secondary" />
            <span className="text-sm tracking-wide uppercase text-foreground">{it.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
