## Goal
Make the sticky header visually disappear behind the logo so only "Suzy Wood", the monkeys, and the tagline read on a single seamless cream surface.

## Changes

1. **`src/components/site/Header.tsx`**
   - Change the `<header>` background from `bg-background/85 backdrop-blur-md` (semi-transparent, washed) to solid `bg-background` (the cream token, `var(--cream)`). This matches the logo image's cream backdrop exactly.
   - Soften the divider: replace `border-b border-border/60` with `border-b border-border/30` so the header doesn't look like a separate bar.

2. **`src/components/site/Logo.tsx`**
   - Remove the pill container (`bg-background rounded-xl px-3 py-1.5 border border-border/40 shadow-soft`) now that the header itself is cream — the logo will sit flush on the header with no visible box around it.
   - Keep the size (`h-14`) and hover scale.

## Result
Header and logo share the same `--cream` color with no transparency, border ring, or shadow seam — only the wordmark, monkeys, and tagline are visible against the cream bar.