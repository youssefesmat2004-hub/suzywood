import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth";
import { CartProvider } from "@/lib/cart";
import { BrandLoader } from "@/components/site/BrandLoader";
import { WhatsAppWidget } from "@/components/site/WhatsAppWidget";
import { useReveal } from "@/hooks/use-reveal";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-serif text-7xl text-primary">404</h1>
        <h2 className="mt-4 text-xl font-serif">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">The page you're looking for doesn't exist.</p>
        <div className="mt-6">
          <Link to="/" className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">Return Home</Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Suzy Wood — Handcrafted Kids Interiors" },
      { name: "description", content: "Heirloom-quality, handcrafted nursery and toddler furniture made to order in Cairo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:title", content: "Suzy Wood — Handcrafted Kids Interiors" },
      { name: "twitter:title", content: "Suzy Wood — Handcrafted Kids Interiors" },
      { property: "og:description", content: "Heirloom-quality, handcrafted nursery and toddler furniture made to order in Cairo." },
      { name: "twitter:description", content: "Heirloom-quality, handcrafted nursery and toddler furniture made to order in Cairo." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/ee700a9f-4938-4be4-a277-9bb9a733a37d/id-preview-9e14d270--11bfc074-06ec-4994-b934-707592e10ec4.lovable.app-1776683618592.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/ee700a9f-4938-4be4-a277-9bb9a733a37d/id-preview-9e14d270--11bfc074-06ec-4994-b934-707592e10ec4.lovable.app-1776683618592.png" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Inter:wght@300;400;500;600;700&display=swap",
      },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  useReveal();
  return (
    <AuthProvider>
      <CartProvider>
        <BrandLoader />
        <Outlet />
        <WhatsAppWidget />
        <Toaster />
      </CartProvider>
    </AuthProvider>
  );
}
