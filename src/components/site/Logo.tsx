import { Link } from "@tanstack/react-router";
import logo from "@/assets/suzy-wood-logo.png";

export function Logo() {
  return (
    <Link
      to="/"
      className="flex items-center gap-3 group bg-background rounded-xl px-3 py-1.5 border border-border/40 shadow-soft"
    >
      <img
        src={logo}
        alt="Suzy Wood — Premium Nursery & Toddler Furniture"
        className="h-14 w-auto transition-transform group-hover:scale-105"
      />
    </Link>
  );
}
