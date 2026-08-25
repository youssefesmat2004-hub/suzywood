# Complete Arabic Storefront Translation

## Why the previous translation was unsuccessful

The translation system itself is active: selecting Arabic saves the preference, changes the document to `lang="ar"` and `dir="rtl"`, applies the Cairo font, and translates dictionary-backed interface text.

However, the live Arabic homepage is still mixed-language because:

- Product names, taglines, descriptions, option labels, and review content come directly from the database in English. The current product/category types and public queries expose only English fields, with no Arabic content path.
- Several dynamic store-managed values deliberately fall back to translated defaults only in selected places; other database content is rendered unchanged.
- Some customer-facing literals and accessibility labels remain outside the translation dictionaries.
- The homepage renders links inside an already-linked product card. This invalid nested-link markup causes a React hydration failure, so the server-rendered page is discarded and rebuilt in the browser. It is not the primary translation gap, but it makes language rendering less reliable.
- SEO metadata remains a single bilingual/English-first document rather than locale-specific Arabic metadata and URLs.

## Implementation plan

1. **Make catalog content bilingual**
   - Add Arabic fields for product and category names, taglines, descriptions, materials, safety, care, and customer-visible option labels.
   - Preserve English as the default and use English as a fallback whenever an Arabic field is empty.
   - Add these fields to the admin product/category editors so Arabic copy can be entered and maintained.

2. **Localize all dynamic storefront content**
   - Introduce shared locale-aware helpers for products, categories, variants, rooms, and store-managed content.
   - Use those helpers consistently on the homepage, collection pages, product pages, cart, checkout, wishlist, account/order views, and customer-facing forms.
   - Keep brand names and user-authored reviews unchanged unless an Arabic version is explicitly stored.

3. **Finish the static translation audit**
   - Replace remaining customer-facing English literals, placeholders, validation messages, toasts, dialog text, and ARIA labels with complete English/Arabic dictionary entries.
   - Check pluralized and interpolated strings so names, quantities, prices, and delivery details read naturally in Arabic.

4. **Fix RTL behavior and page stability**
   - Replace the nested homepage links with valid interactive markup to eliminate the confirmed hydration error.
   - Verify directional spacing, alignment, icons, controls, product selectors, dialogs, and mobile navigation in RTL without changing the English layout.
   - Keep English as the first-visit and server-rendered default, while restoring a saved Arabic preference after hydration safely.

5. **Improve Arabic discoverability**
   - Add locale-aware Arabic titles/descriptions and structured data without duplicating meta tags.
   - Keep canonical behavior coherent and ensure crawlers can identify English and Arabic content correctly.

6. **Validate end to end**
   - Test every public storefront route in English and Arabic on mobile and desktop.
   - Check for untranslated UI text, layout overflow, hydration/runtime errors, language persistence across navigation and refresh, and a clean preview build.

## Technical details

- Database changes will use additive nullable Arabic columns, explicit grants matching existing access, and existing row-level security rules.
- Locale selection remains client-controlled with English as the default; missing Arabic catalog values fall back safely to English rather than showing blank content.
- Admin-only screens remain English unless separately requested; this plan covers the customer-facing storefront and the admin fields needed to maintain Arabic catalog copy.
