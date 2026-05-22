# Suzy Wood — World-Class Redesign Plan

The scope is large, so I'll ship it in 5 focused phases. Each phase ends in a working, reviewable state.

---

## Phase 1 — Design system foundation
- Rewrite `src/styles.css` tokens to your palette:
  - cream `#FDF6EC`, wood brown `#A0522D`, beige `#E8D5B7`, walnut `#3E1F00`, sage `#8FAF8A` (all as `oklch`)
  - new gradients, soft shadows, larger border radii
- Add Playfair Display (serif headings) + Inter (body) via `<link>` in `__root.tsx`
- Add scroll-triggered fade/lift utilities + `scroll-behavior: smooth` globally
- Add a brand loading screen that fades out on first mount
- Refresh Button variants (soft glow on hover), Card (lift + shadow)

## Phase 2 — Homepage rebuild
- Announcement bar with shimmer
- Full-screen hero with parallax background + floating crib illustration
- 4 trust badges
- "Our Most Loved Pieces" featured grid (entrance fade-in, hover lift, image zoom, wishlist heart)
- "How It Works" 3-step
- Testimonials auto-scrolling carousel
- Instagram strip (6-tile grid with hover overlay → links to existing IG)
- Final CTA banner → /book

## Phase 3 — Global UX
- Sticky WhatsApp button (pulse) + delayed dismissible "Need help?" popup
- Smooth page transitions (fade + slight rise on route change)
- Lazy-load all product/CMS images, skeleton loaders on Shop & PDP
- Mobile polish pass on every page

## Phase 4 — Shop & Product upgrades
- Shop: wood-texture banner header, sticky filter sidebar (desktop), "New" + "Best Seller" badges, empty state with reset
- Product page: sticky Add-to-Cart on scroll, mobile bottom Add-to-Cart bar, swipeable image gallery, trust badges, wood-grain divider, "You might also like" section

## Phase 5 — AI Product Recommender quiz
- 3-question wizard (age / type / budget) with progress bar + smooth step transitions
- Full-screen on mobile, modal on desktop
- Recommends top 2–3 matching products from existing catalog with Add to Cart
- Entry points: homepage hero secondary CTA + shop page banner

---

## Notes / decisions
- **"Best Seller" badge** will derive from actual `orders` data (top N most-ordered SKUs in last 90 days) so it stays truthful — not hardcoded.
- **"New" badge** = product created in last 30 days.
- **Testimonials**: you asked for 3 fake reviews, but you already have a real `reviews` table seeded. I'll use the highest-rated real reviews instead (more trustworthy + you control them from admin). Tell me if you'd rather I seed 3 generic ones.
- **Loading screen**: shown only on first visit per session (sessionStorage flag) so it doesn't get annoying.
- **Parallax**: pure CSS `translateY` on scroll — no heavy library, keeps mobile smooth.
- **No new dependencies** needed — framer-motion is already installed.

## What I need from you
1. **Approve the plan** (or tell me to reorder/drop phases).
2. **Hero image**: do you have a photo, or should I generate one (warm nursery with a wooden crib)?
3. **Instagram strip**: real IG photos require a token. OK if I use 6 of your existing product photos with an IG-style overlay that links to your IG account?

Once you confirm, I'll start Phase 1 and ship phase-by-phase.