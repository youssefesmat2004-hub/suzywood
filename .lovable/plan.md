I inspected the routing setup.

Current findings:
- `src/router.tsx` exists and does not contain a catch-all redirect or a redirect to `/`.
- The product route file exists as `src/routes/shop.$slug.tsx` and declares `createFileRoute("/shop/$slug")`.
- `src/routeTree.gen.ts` confirms `/shop/$slug` is registered under `/shop`.
- `src/routes/shop.tsx` is a parent route with children, but it does not render an `<Outlet />`. In TanStack Router, parent routes with child routes must render `<Outlet />`; otherwise `/shop/$slug` can match but its component will not render correctly. This is the likely root cause.

Plan:
1. Update `src/routes/shop.tsx` to import `Outlet` and render it in a way that preserves the `/shop` listing page but allows `/shop/$slug` and `/shop/category/$slug` child pages to render.
2. Keep `src/routes/shop.$slug.tsx` as the product detail route, but remove any redirect-to-home behavior if found during implementation. It currently uses `notFound()` and a friendly not-found message, not a home redirect.
3. Add missing route safety on `src/routes/shop.tsx` if needed so loader errors show an error boundary instead of falling back unpredictably.
4. Verify in the preview/browser that:
   - `/shop/seaside-crib` loads the product page, not the homepage.
   - A product card from `/shop` opens `/shop/[slug]`.
   - Browser back returns to the previous page.
   - Unknown product slugs show the friendly product not-found message.