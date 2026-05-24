# Add image cropping everywhere

Let users crop any image — on upload (before it's saved) and on existing images (re-crop in place) — with a free-form rectangular selection.

## What you'll see

- After picking a file in any image uploader, a **Crop** dialog opens with the image and a draggable/resizable rectangle. Buttons: **Skip** (upload original) and **Crop & Upload**.
- Every already-uploaded image gets a small **Crop** button (alongside the existing Remove/Clear). Clicking it opens the same dialog; saving uploads the cropped version and swaps the URL.
- Selection is fully free — any aspect ratio, any size.

## Where it applies

All image upload surfaces in the app:

1. **Admin → Product form** — main image, gallery images, variant images (upload + re-crop)
2. **Admin → Content** — any image fields (hero, etc.)
3. **Admin → Categories** — if/where images are uploaded
4. **Customer-facing**:
   - **Payment proof** upload on the payment page
   - **Custom build inspiration images** on the custom build form

## Technical approach

1. Add dependency `react-image-crop`.
2. New shared component `src/components/ui/image-crop-dialog.tsx` — shadcn Dialog + `<ReactCrop>`, free aspect, **Skip** and **Crop & Upload** actions. Accepts a File or URL.
3. New hook `src/hooks/use-image-cropper.tsx` — exposes `{ open, dialog }`; mount `{dialog}` once then `await open(fileOrUrl)` returns a `Blob` (or `null` if skipped).
4. New helper `src/lib/upload-image.ts` — centralizes Supabase Storage upload (used today only inside ProductForm) so all surfaces share one path.
5. Wire each upload site:
   - New file selection → cropper → upload.
   - Existing image → add a small **Crop** icon button → fetch URL → cropper → upload → replace stored URL.

## Out of scope

- No rotation, filters, or fixed aspect presets (free crop only).
- No bulk re-cropping of historical images.
- No server-side processing — cropping is done in the browser before upload.
