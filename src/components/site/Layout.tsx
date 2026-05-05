import { Header } from "./Header";
import { Footer } from "./Footer";
import { WhatsAppButton } from "./WhatsAppButton";
import { useSiteContent } from "@/lib/site-content";

export function Layout({ children }: { children: React.ReactNode }) {
  const content = useSiteContent();
  const banner = content.announcement_banner?.trim();
  return (
    <div className="min-h-screen flex flex-col">
      {banner && (
        <div className="bg-primary text-primary-foreground text-center text-xs sm:text-sm py-2 px-4">
          {banner}
        </div>
      )}
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
