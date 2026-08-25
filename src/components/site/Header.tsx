import { Link } from "@tanstack/react-router";
import { ShoppingBag, Menu, X, Heart, User } from "lucide-react";
import { useState } from "react";
import { Logo } from "./Logo";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { LanguageSwitcher } from "./LanguageSwitcher";

const nav = [
  { to: "/", key: "nav.home", label: "Home" },
  { to: "/shop", key: "nav.shop", label: "Shop" },
  { to: "/our-craft", key: "nav.ourCraft", label: "Our Craft" },
  { to: "/custom-builds", key: "nav.customBuilds", label: "Custom Builds" },
  { to: "/book", key: "nav.bookSession", label: "Book a Session" },
  { to: "/faq", key: "nav.faq", label: "FAQ" },
  { to: "/contact", key: "nav.contact", label: "Contact" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const { count } = useCart();
  const { user } = useAuth();
  const { t } = useI18n();

  return (
    <header className="sticky top-0 z-40 border-b border-border/30 bg-background">
      <div className="container mx-auto flex h-20 items-center justify-between px-6 lg:px-10">
        <Logo />
        <nav className="hidden lg:flex items-center gap-9">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="text-sm tracking-wide text-foreground hover:text-primary transition-colors"
              activeProps={{ className: "text-primary font-medium" }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {t(item.key, item.label)}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <LanguageSwitcher className="hidden sm:inline-flex" />
          {user && (
            <Link
              to="/wishlist"
              aria-label={t("nav.wishlist", "Wishlist")}
              className="hidden sm:flex h-10 w-10 items-center justify-center rounded-full border border-border hover:bg-muted transition-colors"
            >
              <Heart className="h-4 w-4" />
            </Link>
          )}
          <Link
            to={user ? "/account" : "/auth"}
            aria-label={t("nav.account", "Account")}
            className="hidden sm:flex h-10 w-10 items-center justify-center rounded-full border border-border hover:bg-muted transition-colors"
          >
            <User className="h-4 w-4" />
          </Link>
          <Link
            to="/cart"
            aria-label={t("nav.cart", "Cart")}
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border hover:bg-muted transition-colors"
          >
            <ShoppingBag className="h-4 w-4" />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-secondary text-[10px] text-secondary-foreground">
                {count}
              </span>
            )}
          </Link>
          <button
            aria-label={t("nav.menu", "Menu")}
            className="lg:hidden flex h-10 w-10 items-center justify-center rounded-full border border-border"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="lg:hidden border-t border-border bg-background">
          <nav className="container mx-auto flex flex-col px-6 py-4">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="py-3 text-sm text-foreground"
                activeProps={{ className: "text-primary font-medium" }}
                activeOptions={{ exact: item.to === "/" }}
              >
                {t(item.key, item.label)}
              </Link>
            ))}
            <Link to={user ? "/account" : "/auth"} onClick={() => setOpen(false)} className="py-3 text-sm text-foreground">
              {user ? t("nav.myAccount", "My Account") : t("nav.signIn", "Sign In")}
            </Link>
            {user && (
              <Link to="/wishlist" onClick={() => setOpen(false)} className="py-3 text-sm text-foreground">
                {t("nav.wishlist", "Wishlist")}
              </Link>
            )}
            <div className="pt-3 sm:hidden">
              <LanguageSwitcher />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
