## Problem

`src/lib/rooms.ts` imports 10 image files that don't exist:
- `@/assets/whole-rooms/room-b/img-1..5.jpeg`
- `@/assets/whole-rooms/room-c/img-1..5.jpeg`

Only `room-1.jpeg`…`room-11.jpeg` exist in `src/assets/whole-rooms/`. Vite throws `ERR_MODULE_NOT_FOUND`, which surfaces in the preview as **"Lovable proxy error (500)"** whenever the `/rooms/$slug` route (Room Two / Room Three) is loaded.

## Fix

Reuse the existing 11 room images across all three rooms so the file resolves and the page renders. Update `src/lib/rooms.ts`:

1. Remove the 10 broken `b1..b5` and `c1..c5` imports.
2. Split the existing `r1..r11` across the three rooms, e.g.:
   - Room One: `r1, r2, r3, r4`
   - Room Two: `r5, r6, r7`
   - Room Three: `r8, r9, r10, r11`

No other files change. This restores the route immediately.

## Alternative (only if you want unique images per room)

If you'd rather keep separate photo sets per room, you'd need to upload the missing `room-b/img-1..5.jpeg` and `room-c/img-1..5.jpeg` files into `src/assets/whole-rooms/`. Let me know if you'd prefer that path — otherwise I'll proceed with the reuse fix above.
