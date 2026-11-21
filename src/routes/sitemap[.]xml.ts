import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { rooms } from "@/lib/rooms";
import { buildSitemapXml, type SitemapEntry } from "@/lib/sitemap-xml";

const BASE_URL = "https://suzywoodofficial.com";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        let products: { slug: string; updated_at: string | null }[] = [];
        let categories: { slug: string }[] = [];
        try {
          const pageSize = 500;
          await Promise.all([
            (async () => {
              for (let offset = 0; ; offset += pageSize) {
                const { data, error } = await supabase.from("products").select("slug, updated_at").eq("is_active", true).order("id").range(offset, offset + pageSize - 1);
                if (error) throw error;
                const page = data ?? [];
                products.push(...page);
                if (page.length < pageSize) break;
              }
            })(),
            (async () => {
              for (let offset = 0; ; offset += pageSize) {
                const { data, error } = await supabase.from("categories").select("slug").order("id").range(offset, offset + pageSize - 1);
                if (error) throw error;
                const page = data ?? [];
                categories.push(...page);
                if (page.length < pageSize) break;
              }
            })(),
          ]);
        } catch (error) {
          console.error("Sitemap public content query failed", error);
          return new Response("Sitemap temporarily unavailable", { status: 503, headers: { "Cache-Control": "no-store", "Retry-After": "300" } });
        }

        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/shop", changefreq: "weekly", priority: "0.9" },
          { path: "/our-craft", changefreq: "monthly", priority: "0.8" },
          { path: "/custom-builds", changefreq: "monthly", priority: "0.8" },
          { path: "/contact", changefreq: "monthly", priority: "0.7" },
          { path: "/faq", changefreq: "monthly", priority: "0.6" },
          { path: "/book", changefreq: "monthly", priority: "0.6" },
          { path: "/track-order", changefreq: "monthly", priority: "0.6" },
          { path: "/terms", changefreq: "yearly", priority: "0.3" },
          { path: "/privacy", changefreq: "yearly", priority: "0.3" },
          ...categories.map((c) => ({
            path: `/shop/category/${c.slug}`,
            changefreq: "weekly" as const,
            priority: "0.8",
          })),
          ...products.map((p) => ({
            path: `/shop/${p.slug}`,
            changefreq: "weekly" as const,
            priority: "0.9",
            lastmod: p.updated_at,
          })),
          ...rooms.map((r) => ({
            path: `/rooms/${r.slug}`,
            changefreq: "monthly" as const,
            priority: "0.7",
          })),
        ];

        const xml = buildSitemapXml(BASE_URL, entries);

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
