# Fix: Admin pages crash with "Something went wrong"

## Root cause (confirmed)

`src/components/admin/AdminLayout.tsx` subscribes to a realtime channel named
`admin-badges`. When the effect runs a second time (React double-mount / navigating
between admin pages), Supabase returns the already-subscribed channel with the same
name, and calling `.on(...)` after `subscribe()` throws:

```
Error: cannot add `postgres_changes` callbacks for realtime:admin-badges after `subscribe()`
```

This crashes any admin page that uses the layout, including the Reviews page shown in
the screenshot.

## Fix

In `AdminLayout.tsx`:
- Give the realtime channel a unique name per mount (or remove any existing
  `admin-badges` channel before creating it), so a re-run of the effect never touches
  an already-subscribed channel.
- Keep the existing cleanup (`supabase.removeChannel(ch)`).

## Verify

- Sign in as admin in the preview and open `/admin/reviews` plus two other admin pages
  on a phone-sized viewport; confirm no error screen and no console errors.
