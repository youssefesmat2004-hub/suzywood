import { TreePine, Hammer, Truck, Star } from "lucide-react";

const items = [
  { Icon: TreePine, label: "100% Natural Wood", sub: "Solid timber only" },
  { Icon: Hammer, label: "Handcrafted in Egypt", sub: "Made to order in Cairo" },
  { Icon: Truck, label: "Fast Delivery", sub: "Across all governorates" },
  { Icon: Star, label: "5-Star Rated", sub: "Loved by Egyptian moms" },
];

export function TrustBadges() {
  return (
    <section className="container mx-auto px-6 lg:px-10 py-14 md:py-20">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {items.map(({ Icon, label, sub }, i) => (
          <div
            key={label}
            data-reveal
            style={{ transitionDelay: `${i * 90}ms` }}
            className="group bg-card border border-border/60 rounded-2xl p-5 md:p-6 text-center hover-lift shadow-soft"
          >
            <div className="mx-auto h-12 w-12 rounded-full bg-gradient-warm border border-border/60 flex items-center justify-center text-primary transition-transform duration-500 group-hover:rotate-6">
              <Icon className="h-5 w-5" />
            </div>
            <p className="font-serif text-base md:text-lg mt-3">{label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
