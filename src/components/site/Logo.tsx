import { Link } from "@tanstack/react-router";

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-3 group">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-serif text-lg shadow-soft transition-transform group-hover:scale-105">
        sw
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-serif text-xl tracking-tight">Suzy Wood</span>
        <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground mt-0.5">
          Handcrafted Kids Interiors
        </span>
      </span>
    </Link>
  );
}
