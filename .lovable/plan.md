## What's happening

The order rows on `/admin/orders` use `<Link>` wrappers inside table cells. They navigate correctly when they load, but the preview is throwing:

> Failed to fetch dynamically imported module … virtual:tanstack-start-client-entry

That's a stale-chunk error: an old build is cached in the browser and the new route chunk it tries to fetch on click no longer exists, so the navigation silently fails — which feels like "the order won't open".

## Fix

1. **Restart the dev server** so the preview serves fresh chunks. This alone resolves the stale-chunk error in 99% of cases.

2. **Make the whole row reliably clickable** (small UX improvement so it doesn't depend on per-cell `<Link>` wrappers):
   - Replace the 5 per-cell `<Link>` wrappers in `src/routes/admin.orders.tsx` with a single `onClick` on the `<tr>` using `useNavigate()` from `@tanstack/react-router`.
   - Keep the `cursor-pointer` + hover styling.
   - Add `role="button"` and keyboard support (`Enter` key) for accessibility.

3. **Tell you to hard-refresh** the preview tab once (Cmd/Ctrl+Shift+R) to drop the cached old bundle.

## Files touched

- `src/routes/admin.orders.tsx` — swap nested Links for a row-level onClick navigate.

No DB or backend changes.
