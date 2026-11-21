export type SitemapEntry = { path: string; lastmod?: string | null; changefreq?: string; priority?: string };

function escapeXml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" };
    return entities[character] ?? character;
  });
}

export function buildSitemapXml(baseUrl: string, entries: SitemapEntry[]) {
  const urls = entries.map((entry) => [
    "  <url>",
    `    <loc>${escapeXml(new URL(entry.path, baseUrl).href)}</loc>`,
    entry.lastmod && Number.isFinite(Date.parse(entry.lastmod))
      ? `    <lastmod>${escapeXml(entry.lastmod)}</lastmod>` : null,
    entry.changefreq ? `    <changefreq>${escapeXml(entry.changefreq)}</changefreq>` : null,
    entry.priority ? `    <priority>${escapeXml(entry.priority)}</priority>` : null,
    "  </url>",
  ].filter(Boolean).join("\n"));
  return ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', ...urls, '</urlset>'].join("\n");
}