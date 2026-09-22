# Run the website check-up now

Run the automatic 5-day check-up immediately, outside its schedule, and report the results.

## What happens

1. Call the protected check-up hook on the live site (`/api/public/hooks/health-check`) using the stored secret key.
2. The check runs the full sweep already built:
   - Key pages load (home, shop, product, cart, checkout, contact, track order, FAQ, custom builds, book, our craft)
   - Store data sanity (products, categories, prices, photos, stock, email sending configured)
   - Every customer input (newsletter, contact, session booking, measurement booking, custom build + photo upload, promo code, order tracking, reviews, wishlist, orders)
   - SEO and AI search (sitemap, robots, llms.txt, titles, descriptions, social tags, structured data, Arabic pages)
3. Test records created during the run are deleted automatically.
4. A branded report email goes to both owner addresses.
5. I report in chat what passed and anything that failed.

## If anything fails

I'll show the failing items here and, with your go-ahead, fix them in a follow-up.

## Note

This does not change the 5-day schedule — it's an extra on-demand run.
