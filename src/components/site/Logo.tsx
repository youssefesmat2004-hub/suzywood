import { Link } from "@tanstack/react-router";
import logo from "@/assets/suzy-wood-logo.png";
import { useI18n } from "@/lib/i18n";

export function Logo() {
  const { t } = useI18n();
  return (
    <Link to="/" className="flex items-center gap-3 group">
      <img
        src={logo}
        alt={t("components.logoAlt", "Suzy Wood — Premium Baby & Toddlers Furniture")}
        className="h-14 w-auto transition-transform group-hover:scale-105"
      />
    </Link>
  );
}
