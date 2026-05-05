import { Link } from "@tanstack/react-router";
import { Instagram, Facebook, Phone, Mail } from "lucide-react";
import { useSiteContent } from "@/lib/site-content";

export function Footer() {
  const content = useSiteContent();
  const tagline = content.footer_tagline ?? "Heirloom-quality wooden furniture for nurseries and small humans. Made-to-order in our Cairo workshop.";
  const email = content.contact_email ?? "studio@suzywood.com";
  const phone = content.contact_phone ?? "+20 100 000 0000";
  const phoneHref = `tel:${phone.replace(/[^+\d]/g, "")}`;
  return (
    <footer className="mt-32 border-t border-border bg-muted/40">
      <div className="container mx-auto px-6 lg:px-10 py-16 grid gap-12 md:grid-cols-4">
        <div className="md:col-span-2 max-w-sm">
          <p className="font-serif text-2xl tracking-tight">Suzy Wood</p>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            {tagline}
          </p>
          <div className="mt-6 space-y-2 text-sm">
            <a href={phoneHref} className="flex items-center gap-2 hover:text-primary"><Phone className="h-3.5 w-3.5" /> {phone}</a>
            <a href={`mailto:${email}`} className="flex items-center gap-2 hover:text-primary"><Mail className="h-3.5 w-3.5" /> {email}</a>
          </div>
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
          <h4 className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Shop</h4>
          <ul className="mt-4 space-y-3 text-sm">
            <li><Link to="/shop" className="hover:text-primary">All Pieces</Link></li>
            <li><Link to="/shop/category/$slug" params={{ slug: "nursery" }} className="hover:text-primary">Nursery</Link></li>
            <li><Link to="/shop/category/$slug" params={{ slug: "kids-beds" }} className="hover:text-primary">Kids Beds</Link></li>
            <li><Link to="/shop/category/$slug" params={{ slug: "storage-study" }} className="hover:text-primary">Storage & Study</Link></li>
            <li><Link to="/shop/category/$slug" params={{ slug: "play-safety" }} className="hover:text-primary">Play & Safety</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Care</h4>
          <ul className="mt-4 space-y-3 text-sm">
            <li><Link to="/custom-builds" className="hover:text-primary">Custom Builds</Link></li>
            <li><Link to="/our-craft" className="hover:text-primary">Our Craft</Link></li>
            <li><Link to="/contact" className="hover:text-primary">Contact</Link></li>
            <li><Link to="/payment" className="hover:text-primary">Pay with Instapay</Link></li>
            <li><span className="text-muted-foreground">Shipping: 1,000 EGP nationwide</span></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="container mx-auto px-6 lg:px-10 py-6 flex flex-col sm:flex-row justify-between gap-3 text-xs text-muted-foreground">
          <p>© 2025 Suzy Wood. Crafted in Cairo.</p>
          <p>Delivery across all governorates of Egypt.</p>
        </div>
      </div>
    </footer>
  );
}
