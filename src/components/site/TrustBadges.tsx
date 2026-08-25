import { TreePine, Hammer, Shield, Star } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function TrustBadges() {
  const { t } = useI18n();
  const items = [
    { Icon: TreePine, label: t("components.tbItem1Label", "100% Natural Wood"), sub: t("components.tbItem1Sub", "Solid timber only") },
    { Icon: Hammer, label: t("components.tbItem2Label", "Handcrafted in Egypt"), sub: t("components.tbItem2Sub", "Made to order in Cairo") },
    { Icon: Shield, label: t("components.tbItem3Label", "Safe & Sturdy"), sub: t("components.tbItem3Sub", "Built for little ones") },
    { Icon: Star, label: t("components.tbItem4Label", "5-Star Rated"), sub: t("components.tbItem4Sub", "Loved by Egyptian moms") },
  ];
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
