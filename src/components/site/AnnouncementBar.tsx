import { Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";

export function AnnouncementBar() {
  const { t } = useI18n();
  return (
    <div className="relative overflow-hidden bg-gradient-wood text-cream">
      <div className="container mx-auto px-6 lg:px-10 py-2.5 text-center text-[12px] md:text-[13px] tracking-wide">
        <Link
          to="/shop/$slug"
          params={{ slug: "teepetent" }}
          className="inline-flex flex-wrap justify-center items-center gap-2 hover:underline underline-offset-2 font-medium"
        >
          <span className="inline-flex items-center rounded-full bg-primary text-primary-foreground px-2 py-0.5 text-[10px] uppercase tracking-wider">
            {t("components.annBadge", "47% Off")}
          </span>
          {t("components.annText", "Teepee Tent EGP 2,000 (was EGP 3,750) · Tent + Swing Bundle EGP 4,250 (was EGP 4,750) — Shop now")}
        </Link>
      </div>
      <div className="pointer-events-none absolute inset-0 animate-shimmer opacity-60" />
    </div>
  );
}
