## Problem

`src/routes/admin.tsx` is the layout for everything under `/admin`, including `/admin/login`. Its `AdminGate` requires the user to already be signed in as admin/carpenter before rendering `<Outlet />`. That means on a fresh client (no Supabase session), `/admin/login` itself is gated, so it just shows "Checking access…" forever — the login form never renders, and the user can't sign in.

This is most visible when opening the PWA installed to the home screen: it has its own storage and no existing session, so it lands on the gate with no way out.

## Fix

Edit `src/routes/admin.tsx` so the gate skips for the login route:

1. Read the current pathname with `useRouterState({ select: s => s.location.pathname })`.
2. If pathname is `/admin/login`, render `<Outlet />` directly (no `AdminLayout` wrapper, no gate, no push setup).
3. For all other admin paths, keep current behavior:
   - While auth is loading or role check is loading → "Checking access…"
   - If not signed in → `navigate("/admin/login", replace: true)`
   - If signed in but not staff → `navigate("/admin/login", replace: true)`
   - Otherwise → render `AdminLayout` with `<Outlet />` and `AdminPushSetup` (admin-only).
4. Guard the redirect so we don't push `/admin/login` when we're already on it (avoids redundant navigations during the initial loading flicker).

No other files need to change. Login page (`admin.login.tsx`) continues to handle "already signed in as admin → go to /admin" itself.

## Why not move login outside `/admin/`

Keeping the URL `/admin/login` matches existing links, bookmarks, and the PWA's manifest scope. A pathname check inside the gate is the smallest, safest change.
