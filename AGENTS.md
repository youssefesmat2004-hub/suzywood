# Architecture rules

- Keep sitemap XML serialization in `src/lib/sitemap-xml.ts`; use authoritative page timestamps only, paginate public content queries, and return an error rather than an incomplete sitemap when a query fails.
- Use a product's pre-sized share rendition only when its source photo still matches the current product image, so admin photo updates never share an unrelated picture.