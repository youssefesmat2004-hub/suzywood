import { Link } from "@tanstack/react-router";
import { ShoppingBag, Menu, X } from "lucide-react";
import { useState } from "react";
import { Logo } from "./Logo";

const nav = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop Collection" },
  { to: "/our-craft", label: "Our Craft" },
  { to: "/custom-builds", label: "Custom Builds" },
  { to: "/contact", label: "Contact" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="container mx-auto flex h-20 items-center justify-between px-6 lg:px-10">
        <Logo />
        <nav className="hidden lg:flex items-center gap-9">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="text-sm tracking-wide text-foreground/75 hover:text-primary transition-colors"
              activeProps={{ className: "text-primary font-medium" }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <button
            aria-label="Cart"
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border hover:bg-muted transition-colors"
          >
            <ShoppingBag className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-secondary text-[10px] text-secondary-foreground">
              0
            </span>
          </button>
          <button
            aria-label="Menu"
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
                className="py-3 text-sm text-foreground/80"
                activeProps={{ className: "text-primary font-medium" }}
                activeOptions={{ exact: item.to === "/" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
