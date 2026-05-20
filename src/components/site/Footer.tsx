import { Link } from "@tanstack/react-router";
import { Instagram, Facebook, Phone } from "lucide-react";
import { useSiteContent } from "@/lib/site-content";
import { NewsletterForm } from "./NewsletterForm";

export function Footer() {
  const content = useSiteContent();
  const tagline = content.footer_tagline ?? "Heirloom-quality wooden furniture for nurseries and small humans. Made-to-order in our Cairo workshop.";
  const phone = content.contact_phone ?? "+20 109 631 3532";
  const phoneHref = `tel:${phone.replace(/[^+\d]/g, "")}`;
  return (
    <footer className="mt-32 border-t border-border bg-muted/40">
      <div className="container mx-auto px-6 lg:px-10 py-16">
        <div className="max-w-xl mx-auto text-center">
          <p className="font-serif text-2xl tracking-tight">Suzy Wood</p>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            {tagline}
          </p>
          <a href={phoneHref} className="mt-4 inline-flex items-center gap-2 text-sm hover:text-primary">
            <Phone className="h-3.5 w-3.5" /> {phone}
          </a>
          <div className="mt-6 flex justify-center gap-4">
            <a
              aria-label="Instagram"
              href="https://www.instagram.com/suzywoodofficial?igsh=MWo3MXJjM296aW9oNA=="
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-14 w-14 items-center justify-center rounded-full bg-[oklch(0.38_0.055_50)] text-white shadow-elegant hover:scale-105 transition-transform"
            >
              <Instagram className="h-6 w-6" />
            </a>
            <a
              aria-label="Facebook"
              href="https://www.facebook.com/share/1G52ndaFE6/?mibextid=wwXIfr"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-14 w-14 items-center justify-center rounded-full bg-[oklch(0.38_0.055_50)] text-white shadow-elegant hover:scale-105 transition-transform"
            >
              <Facebook className="h-6 w-6" />
            </a>
            <a
              aria-label="WhatsApp"
              href="https://wa.me/201096313532?text=Hi%20Suzy%20Wood%2C%20I%27d%20like%20to%20ask%20about%20a%20piece."
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-14 w-14 items-center justify-center rounded-full bg-[oklch(0.38_0.055_50)] text-white shadow-elegant hover:scale-105 transition-transform"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
            </a>
          </div>

          <div className="mt-10">
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-3">Join our newsletter</p>
            <NewsletterForm variant="footer" />
          </div>

          <nav className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <Link to="/shop" className="hover:text-primary">Shop</Link>
            <Link to="/our-craft" className="hover:text-primary">Our Craft</Link>
            <Link to="/book" className="hover:text-primary">Book a Session</Link>
            <Link to="/track-order" className="hover:text-primary">Track Order</Link>
            <Link to="/faq" className="hover:text-primary">FAQ</Link>
            <Link to="/contact" className="hover:text-primary">Contact</Link>
            <Link to="/terms" className="hover:text-primary">Terms</Link>
            <Link to="/privacy" className="hover:text-primary">Privacy</Link>
          </nav>
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
