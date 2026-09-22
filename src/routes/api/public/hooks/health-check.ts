import { createFileRoute } from "@tanstack/react-router";

const OWNER_EMAILS = ["Youssef.esmat2004@gmail.com", "suzzy.wael@gmail.com"];
const FROM = "Suzy Wood <info@suzywoodofficial.com>";
const MARKER = "HEALTHCHECK";

type Check = { area: string; name: string; ok: boolean; detail?: string };

function esc(s: string) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function sendReport(checks: Check[]) {
  const LOVABLE_API_KEY = process.env["LOVABLE_API_KEY"];
  const RESEND_API_KEY = process.env["RESEND_API_KEY"];
  if (!LOVABLE_API_KEY || !RESEND_API_KEY) {
    console.error("health-check: email keys not configured");
    return false;
  }

  const failed = checks.filter((c) => !c.ok);
  const passed = checks.length - failed.length;
  const allGood = failed.length === 0;

  const areas = [...new Set(checks.map((c) => c.area))];
  const sections = areas
    .map((area) => {
      const rows = checks
        .filter((c) => c.area === area)
        .map(
          (c) => `
            <tr>
              <td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:14px;">
                ${c.ok ? "✅" : "❌"} ${esc(c.name)}
              </td>
              <td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:12px;color:#777;">
                ${esc(c.detail ?? "")}
              </td>
            </tr>`,
        )
        .join("");
      return `
        <h3 style="font-family:Georgia,serif;margin:24px 0 8px;color:#3b2417;">${esc(area)}</h3>
        <table style="width:100%;border-collapse:collapse;">${rows}</table>`;
    })
    .join("");

  const html = `
  <div style="background:#faf5ee;padding:24px;font-family:Helvetica,Arial,sans-serif;color:#3b2417;">
    <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:16px;padding:28px;">
      <h1 style="font-family:Georgia,serif;font-size:24px;margin:0 0 4px;">Suzy Wood website check-up</h1>
      <p style="color:#777;font-size:13px;margin:0 0 20px;">${new Date().toLocaleString("en-GB", { timeZone: "Africa/Cairo" })} (Cairo)</p>
      <div style="padding:14px 18px;border-radius:12px;background:${allGood ? "#e8f6ec" : "#fdecec"};border:1px solid ${allGood ? "#bfe3c8" : "#f3bdbd"};">
        <strong style="font-size:16px;color:${allGood ? "#1d6b34" : "#a01d1d"};">
          ${allGood ? "Everything is running smoothly" : `${failed.length} problem${failed.length === 1 ? "" : "s"} found`}
        </strong>
        <div style="font-size:13px;color:#555;margin-top:4px;">${passed} of ${checks.length} checks passed</div>
      </div>
      ${
        allGood
          ? ""
          : `<div style="margin-top:20px;padding:14px 18px;border-radius:12px;background:#fff7f7;">
              <strong style="font-size:14px;">Needs your attention</strong>
              <ul style="font-size:14px;color:#a01d1d;padding-left:18px;margin:8px 0 0;">
                ${failed.map((f) => `<li>${esc(f.area)} — ${esc(f.name)}${f.detail ? `: ${esc(f.detail)}` : ""}</li>`).join("")}
              </ul>
            </div>`
      }
      ${sections}
      <p style="font-size:12px;color:#999;margin-top:28px;">Automatic check-up, runs every 5 days.</p>
    </div>
  </div>`;

  const res = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": RESEND_API_KEY,
    },
    body: JSON.stringify({
      from: FROM,
      to: OWNER_EMAILS,
      subject: allGood
        ? "✅ Suzy Wood check-up: everything is fine"
        : `⚠️ Suzy Wood check-up: ${failed.length} problem${failed.length === 1 ? "" : "s"} found`,
      html,
    }),
  });
  if (!res.ok) {
    console.error("health-check: Resend failed", res.status, await res.text().catch(() => ""));
    return false;
  }
  return true;
}

export const Route = createFileRoute("/api/public/hooks/health-check")({
  server: {
    handlers: {
      POST: async ({ request }) => runCheck(request),
      GET: async ({ request }) => runCheck(request),
    },
  },
});

async function runCheck(request: Request) {
  const secret = process.env["HEALTHCHECK_SECRET"];
  const url = new URL(request.url);
  const provided =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? url.searchParams.get("key") ?? "";
  if (!secret || provided !== secret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const origin = url.origin;
  const checks: Check[] = [];
  const add = (area: string, name: string, ok: boolean, detail?: string) =>
    checks.push({ area, name, ok, ...(detail ? { detail } : {}) });

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // ---------- 1. Pages load ----------
  const sampleProduct = await supabaseAdmin
    .from("products")
    .select("slug, name, starting_price, image_url")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  const productSlug = sampleProduct.data?.slug ?? null;
  const pages: Array<[string, string]> = [
    ["Homepage", "/"],
    ["Shop", "/shop"],
    ["Cart", "/cart"],
    ["Checkout", "/checkout"],
    ["Contact", "/contact"],
    ["Track order", "/track-order"],
    ["FAQ", "/faq"],
    ["Custom builds", "/custom-builds"],
    ["Book a session", "/book"],
    ["Our craft", "/our-craft"],
  ];
  if (productSlug) pages.push(["Product page", `/shop/${productSlug}`]);

  const pageBodies: Record<string, string> = {};
  for (const [label, path] of pages) {
    try {
      const res = await fetch(`${origin}${path}`, { headers: { "User-Agent": "SuzyWoodHealthCheck" } });
      const body = await res.text();
      pageBodies[path] = body;
      const looksBroken = /Something went wrong|Unexpected Application Error/i.test(body);
      add("Pages", label, res.ok && !looksBroken, res.ok ? (looksBroken ? "page shows an error" : `${res.status}`) : `HTTP ${res.status}`);
    } catch (e) {
      add("Pages", label, false, String(e));
    }
  }

  // ---------- 2. Store data ----------
  const [prodCount, catCount, activeProducts] = await Promise.all([
    supabaseAdmin.from("products").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("categories").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("products").select("id, name, starting_price, image_url, stock_quantity").eq("is_active", true),
  ]);

  add("Store data", "Products table reachable", !prodCount.error, prodCount.error?.message ?? `${prodCount.count} products`);
  add("Store data", "Categories table reachable", !catCount.error, catCount.error?.message ?? `${catCount.count} categories`);

  const active = activeProducts.data ?? [];
  add("Store data", "At least one product on sale", active.length > 0, `${active.length} active`);
  // price 0 is intentional for "price upon measurement" products, so only flag missing prices
  const noPrice = active.filter((p: any) => p.starting_price === null || p.starting_price === undefined);
  add("Store data", "All products have a price", noPrice.length === 0, noPrice.map((p: any) => p.name).slice(0, 5).join(", "));
  const noImage = active.filter((p: any) => !p.image_url);
  add("Store data", "All products have a photo", noImage.length === 0, noImage.map((p: any) => p.name).slice(0, 5).join(", "));
  const outOfStock = active.filter((p: any) => Number(p.stock_quantity ?? 0) <= 0);
  add("Store data", "Nothing fully out of stock", outOfStock.length === 0, outOfStock.map((p: any) => p.name).slice(0, 5).join(", "));

  add(
    "Store data",
    "Email sending configured",
    Boolean(process.env["LOVABLE_API_KEY"] && process.env["RESEND_API_KEY"]),
    "order and booking emails",
  );

  // ---------- 3. Customer inputs ----------
  const stamp = Date.now();
  const testEmail = `healthcheck+${stamp}@suzywoodofficial.com`;
  const cleanup: Array<() => Promise<void>> = [];

  // Newsletter
  {
    const { data, error } = await supabaseAdmin
      .from("newsletter_subscribers")
      .insert({ email: testEmail, full_name: `${MARKER} test` } as never)
      .select("id")
      .maybeSingle();
    add("Customer forms", "Newsletter sign-up", !error, error?.message);
    if (data?.id) cleanup.push(async () => { await supabaseAdmin.from("newsletter_subscribers").delete().eq("id", data.id); });
  }

  // Contact message
  {
    const { data, error } = await supabaseAdmin
      .from("contact_messages")
      .insert({ full_name: `${MARKER} test`, email: testEmail, phone: "01000000000", message: `${MARKER} automatic test` } as never)
      .select("id")
      .maybeSingle();
    add("Customer forms", "Contact message", !error, error?.message);
    if (data?.id) cleanup.push(async () => { await supabaseAdmin.from("contact_messages").delete().eq("id", data.id); });
  }

  // Session booking
  {
    const { data, error } = await supabaseAdmin
      .from("bookings")
      .insert({
        full_name: `${MARKER} test`,
        phone: "01000000000",
        contact_method: "whatsapp",
        preferred_day: "sunday",
        time_slot: "morning",
        notes: `${MARKER} automatic test`,
        status: "new",
      } as never)
      .select("id")
      .maybeSingle();
    add("Customer forms", "Session booking", !error, error?.message);
    if (data?.id) cleanup.push(async () => { await supabaseAdmin.from("bookings").delete().eq("id", data.id); });
  }

  // Measurement booking
  {
    const { data, error } = await supabaseAdmin
      .from("measurement_bookings")
      .insert({
        product_name: `${MARKER} test`,
        full_name: `${MARKER} test`,
        phone: "01000000000",
        area: "Maadi",
        address: `${MARKER} test address`,
        preferred_day: "sunday",
        time_slot: "morning",
        notes: `${MARKER} automatic test`,
        status: "new",
      } as never)
      .select("id")
      .maybeSingle();
    add("Customer forms", "Measurement booking", !error, error?.message);
    if (data?.id) cleanup.push(async () => { await supabaseAdmin.from("measurement_bookings").delete().eq("id", data.id); });
  }

  // Custom build request
  {
    const { data, error } = await supabaseAdmin
      .from("custom_build_requests")
      .insert({
        full_name: `${MARKER} test`,
        email: testEmail,
        phone: "01000000000",
        room_type: "Nursery",
        description: `${MARKER} automatic test`,
        status: "new",
      } as never)
      .select("id")
      .maybeSingle();
    add("Customer forms", "Custom build request", !error, error?.message);
    if (data?.id) cleanup.push(async () => { await supabaseAdmin.from("custom_build_requests").delete().eq("id", data.id); });
  }

  // Photo upload storage
  {
    const path = `healthcheck/${stamp}.txt`;
    const { error } = await supabaseAdmin.storage
      .from("inspiration-images")
      .upload(path, new Blob([MARKER], { type: "text/plain" }), { upsert: true });
    add("Customer forms", "Photo upload (custom builds)", !error, error?.message);
    if (!error) cleanup.push(async () => { await supabaseAdmin.storage.from("inspiration-images").remove([path]); });
  }

  // Promo code validation
  {
    const { error } = await supabaseAdmin.rpc("validate_promo_code", { _code: "HEALTHCHECKNONE", _subtotal: 1000 });
    add("Customer forms", "Promo code check", !error, error?.message);
  }

  // Order tracking lookup
  {
    const { error } = await supabaseAdmin.rpc("lookup_order_for_tracking", {
      _order_number: "SW-HEALTHCHECK",
      _phone: "01000000000",
    });
    add("Customer forms", "Order tracking lookup", !error, error?.message);
  }

  // Reviews table (experience + delivery reviews write here)
  {
    const { error } = await supabaseAdmin
      .from("order_reviews")
      .select("id", { count: "exact", head: true });
    add("Customer forms", "Reviews system", !error, error?.message);
  }

  // Wishlist table
  {
    const { error } = await supabaseAdmin.from("wishlist_items").select("id", { count: "exact", head: true });
    add("Customer forms", "Wishlist", !error, error?.message);
  }

  // Orders table (checkout target)
  {
    const { error } = await supabaseAdmin.from("orders").select("id", { count: "exact", head: true });
    add("Customer forms", "Checkout / orders", !error, error?.message);
  }

  // ---------- 3b. Real test order for every product, with every extra ----------
  {
    const [cats, prods, csizes, variants] = await Promise.all([
      supabaseAdmin.rpc("admin_categories"),
      supabaseAdmin.from("products").select("id, name, category_id, starting_price, sale_price, portable_changing_table_enabled").eq("is_active", true),
      supabaseAdmin.from("category_sizes").select("category_id, label, mattress_tier").eq("is_active", true),
      supabaseAdmin.from("product_variants").select("product_id, name, price, variant_type").eq("is_active", true),
    ]);

    const catMap = new Map<string, any>(((cats.data as any[]) ?? []).map((c: any) => [c.id, c]));
    const sizesByCat = new Map<string, any[]>();
    for (const s of ((csizes.data as any[]) ?? [])) {
      const list = sizesByCat.get(s.category_id) ?? [];
      list.push(s);
      sizesByCat.set(s.category_id, list);
    }
    const variantsByProduct = new Map<string, any[]>();
    for (const v of ((variants.data as any[]) ?? [])) {
      const list = variantsByProduct.get(v.product_id) ?? [];
      list.push(v);
      variantsByProduct.set(v.product_id, list);
    }

    const orderIds: string[] = [];
    const failedOrders: string[] = [];
    const productList = ((prods.data as any[]) ?? []);

    for (const p of productList) {
      const c = catMap.get(p.category_id);
      if (!c) continue;
      let price = Number(p.sale_price ?? p.starting_price ?? 0);
      const all = variantsByProduct.get(p.id) ?? [];
      const sizeVariants = all.filter((v) => v.variant_type === "size").sort((a, b) => Number(b.price) - Number(a.price));
      let sizeLabel = "";
      if (sizeVariants[0]) {
        sizeLabel = sizeVariants[0].name;
        price = Number(sizeVariants[0].price);
      }

      const tier = (sizesByCat.get(c.id) ?? []).find((s) => s.label === sizeLabel)?.mattress_tier ?? "big";
      let mattress = false;
      let mattressPrice = 0;
      if (c.mattress_addon_enabled) {
        mattress = true;
        mattressPrice = Number(tier === "small" ? c.mattress_small_price : c.mattress_big_price);
        price += mattressPrice;
      }
      let engraving = "";
      if (c.name_engraving_enabled) {
        engraving = "TEST";
        price += Number(c.name_engraving_surcharge ?? 0);
      }
      if (c.ottoman_addon_enabled) price += Number(c.ottoman_addon_price ?? 0);
      if (p.portable_changing_table_enabled || c.portable_changing_table_enabled) price += Number(c.portable_changing_table_price ?? 0);
      if (c.lights_addon_enabled) price += Number(c.lights_addon_price ?? 0);
      if (c.pompom_addon_enabled) price += Number(c.pompom_addon_price ?? 0);
      let customW = 0;
      let customL = 0;
      let customS = 0;
      if (c.custom_size_enabled) {
        customW = 100;
        customL = 200;
        customS = Number(c.custom_size_surcharge ?? 0);
        price += customS;
      }
      const finish = all.find((v) => v.variant_type !== "size")?.name ?? "";

      const { data, error } = await supabaseAdmin.rpc("create_order_with_items", {
        _details: {
          name: `${MARKER} order test`,
          email: "healthcheck@suzywoodofficial.com",
          phone: "01000000000",
          address: MARKER,
          city: "Cairo",
          governorate: "Cairo",
          notes: `${MARKER} automatic order test`,
        },
        _items: [
          {
            product_id: p.id,
            product_name: p.name,
            size: sizeLabel,
            finish,
            engraving,
            unit_price: price,
            quantity: 2,
            custom_width_cm: customW,
            custom_length_cm: customL,
            custom_surcharge: customS,
            bed_rails: false,
            bed_rails_price: 0,
            mattress,
            mattress_price: mattressPrice,
          },
        ],
        _upfront_rate: 0.75,
        _promo_code: "",
        _instapay_reference: MARKER,
        _payment_proof_path: "",
        _delivery_area: "Maadi",
        _order_size_type: "big",
      } as never);

      const row = Array.isArray(data) ? (data as any[])[0] : null;
      if (error || !row?.id) failedOrders.push(`${p.name}: ${error?.message ?? "no order created"}`);
      else orderIds.push(row.id);
    }

    add(
      "Real orders",
      "Every product can be ordered with all extras",
      failedOrders.length === 0 && productList.length > 0,
      failedOrders.length ? failedOrders.slice(0, 5).join(" | ") : `${orderIds.length}/${productList.length} products ordered`,
    );

    if (orderIds.length) {
      cleanup.push(async () => {
        await supabaseAdmin.from("order_items").delete().in("order_id", orderIds);
        await supabaseAdmin.from("orders").delete().in("id", orderIds);
      });
    }
  }



  for (const fn of cleanup) {
    try { await fn(); } catch (e) { console.error("health-check cleanup failed", e); }
  }

  // ---------- 4. SEO & AI search ----------
  for (const [label, path, must] of [
    ["Sitemap", "/sitemap.xml", "<urlset"],
    ["Robots file", "/robots.txt", "Sitemap"],
    ["AI answers file (llms.txt)", "/llms.txt", ""],
  ] as Array<[string, string, string]>) {
    try {
      const res = await fetch(`${origin}${path}`);
      const body = await res.text();
      add("SEO & AI search", label, res.ok && (!must || body.includes(must)), res.ok ? (must && !body.includes(must) ? "content looks wrong" : "") : `HTTP ${res.status}`);
    } catch (e) {
      add("SEO & AI search", label, false, String(e));
    }
  }

  const seoPages: Array<[string, string]> = [["Homepage", "/"], ["Shop", "/shop"]];
  if (productSlug) seoPages.push(["Product page", `/shop/${productSlug}`]);
  for (const [label, path] of seoPages) {
    const body = pageBodies[path] ?? (await fetch(`${origin}${path}`).then((r) => r.text()).catch(() => ""));
    const hasTitle = /<title>[^<]{10,}<\/title>/i.test(body) && !/Lovable (App|Generated)/i.test(body);
    const hasDesc = /name="description"\s+content="[^"]{20,}"/i.test(body);
    const hasOg = /property="og:title"/i.test(body) && /property="og:description"/i.test(body);
    add("SEO & AI search", `${label} — title`, hasTitle);
    add("SEO & AI search", `${label} — description`, hasDesc);
    add("SEO & AI search", `${label} — social preview tags`, hasOg);
  }

  {
    const home = pageBodies["/"] ?? "";
    add("SEO & AI search", "Business info for Google/AI (homepage)", /application\/ld\+json/i.test(home));
  }
  if (productSlug) {
    const prod = pageBodies[`/shop/${productSlug}`] ?? "";
    add("SEO & AI search", "Product info for Google/AI", /application\/ld\+json/i.test(prod) && /"Product"/.test(prod));
  }

  // Arabic version
  try {
    const res = await fetch(`${origin}/?lang=ar`, { headers: { "Accept-Language": "ar" } });
    const body = await res.text();
    add("SEO & AI search", "Arabic pages load", res.ok && /[\u0600-\u06FF]/.test(body), res.ok ? "" : `HTTP ${res.status}`);
  } catch (e) {
    add("SEO & AI search", "Arabic pages load", false, String(e));
  }

  const emailed = await sendReport(checks);
  const failed = checks.filter((c) => !c.ok);

  return new Response(
    JSON.stringify({
      ok: failed.length === 0,
      total: checks.length,
      failed: failed.length,
      emailed,
      failures: failed,
    }),
    { headers: { "Content-Type": "application/json" } },
  );
}
