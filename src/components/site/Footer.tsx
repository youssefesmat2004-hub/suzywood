import { Link } from "@tanstack/react-router";
import { Instagram, Facebook } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-32 border-t border-border bg-muted/40">
      <div className="container mx-auto px-6 lg:px-10 py-16 grid gap-12 md:grid-cols-4">
        <div className="md:col-span-2 max-w-sm">
          <p className="font-serif text-2xl tracking-tight">Suzy Wood</p>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            Heirloom-quality wooden furniture for nurseries and small humans.
            Made-to-order in our Cairo workshop.
          </p>
          <div className="mt-6 flex gap-3">
            <a aria-label="Instagram" href="#" className="h-9 w-9 flex items-center justify-center rounded-full border border-border hover:bg-primary hover:text-primary-foreground transition-colors">
              <Instagram className="h-4 w-4" />
            </a>
            <a aria-label="Facebook" href="#" className="h-9 w-9 flex items-center justify-center rounded-full border border-border hover:bg-primary hover:text-primary-foreground transition-colors">
              <Facebook className="h-4 w-4" />
            </a>
          </div>
        </div>
        <div>
          <h4 className="text-xs uppercase tracking-[0.22em] text-muted-foreground font-sans">Shop</h4>
          <ul className="mt-4 space-y-3 text-sm">
            <li><Link to="/shop" className="hover:text-primary">All Pieces</Link></li>
            <li><Link to="/custom-builds" className="hover:text-primary">Custom Builds</Link></li>
            <li><Link to="/our-craft" className="hover:text-primary">Our Craft</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs uppercase tracking-[0.22em] text-muted-foreground font-sans">Care</h4>
          <ul className="mt-4 space-y-3 text-sm">
            <li><a href="#" className="hover:text-primary">Shipping & Delivery</a></li>
            <li><a href="#" className="hover:text-primary">Return Policy</a></li>
            <li><a href="#" className="hover:text-primary">FAQs</a></li>
            <li><Link to="/contact" className="hover:text-primary">Contact</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="container mx-auto px-6 lg:px-10 py-6 flex flex-col sm:flex-row justify-between gap-3 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Suzy Wood. Crafted in Cairo.</p>
          <p>Free delivery to New Cairo & Sheikh Zayed.</p>
        </div>
      </div>
    </footer>
  );
}
