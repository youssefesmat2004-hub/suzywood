import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildSitemapXml } from "./sitemap-xml";

describe("sitemap content timestamps", () => {
  it("does not invent a modification date for static pages", () => {
    const xml = buildSitemapXml("https://suzywoodofficial.com", [{ path: "/faq" }]);
    assert.equal(xml.includes("<lastmod>"), false);
  });
  it("preserves a product's authoritative modification date", () => {
    const xml = buildSitemapXml("https://suzywoodofficial.com", [{ path: "/shop/teepetent", lastmod: "2026-11-20T10:00:00Z" }]);
    assert.ok(xml.includes("<lastmod>2026-11-20T10:00:00Z</lastmod>"));
  });
  it("escapes URLs and excludes invalid dates", () => {
    const xml = buildSitemapXml("https://suzywoodofficial.com", [{ path: "/shop?a=1&b=2", lastmod: "invalid" }]);
    assert.ok(xml.includes("?a=1&amp;b=2"));
    assert.equal(xml.includes("<lastmod>"), false);
  });
});