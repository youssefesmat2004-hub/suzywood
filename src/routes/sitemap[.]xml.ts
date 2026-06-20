import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

const BASE_URL = "https://suzywoodofficial.com";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const getSitemapData = createServerFn({ method: "GET" }).handler(async () => {
  const [
    { data: products },
    { data: categories },
    { data: rooms },
  ] = await Promise.all([
    supabase.from("products").select("slug, updated_at").eq("is_active", true),
    supabase.from("categories").select("slug, updated_at").eq("is_active", true),
    supabase.from("rooms").select("slug, updated_at"),
  ]);

  return {
    products: products ?? [],
    categories: categories ?? [],
    rooms: rooms ?? [],
  };
});

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const { products, categories, rooms } = await getSitemapData();

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
          })),
          ...rooms.map((r) => ({
            path: `/rooms/${r.slug}`,
            changefreq: "monthly" as const,
            priority: "0.7",
          })),
        ];

        const today = new Date().toISOString().split("T")[0];

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            `    <lastmod>${e.lastmod ?? today}</lastmod>`,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n")
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

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
