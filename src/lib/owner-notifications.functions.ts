import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const OWNER_EMAILS = ["Youssef.esmat2004@gmail.com", "suzzy.wael@gmail.com"];
const FROM = "Suzy Wood <info@suzywoodofficial.com>";
const ADMIN_BASE = "https://suzywoodofficial.com";

async function pushAdmins(payload: { title: string; body: string; url?: string; tag?: string }) {
  try {
    const { sendPushToAdmins } = await import("@/lib/web-push.server");
    await sendPushToAdmins(payload);
  } catch (e) {
    console.error("pushAdmins failed", e);
  }
}

function esc(s: string) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function sendViaResend(subject: string, html: string) {
  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!LOVABLE_API_KEY || !RESEND_API_KEY) {
    console.error("Owner notify: email keys not configured");
    return false;
  }
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
      subject,
      html,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("Owner notify: Resend failed", res.status, body);
    return false;
  }
  return true;
}

function recent(createdAt: string | null | undefined, minutes = 30) {
  if (!createdAt) return false;
  const t = new Date(createdAt).getTime();
  return Number.isFinite(t) && Date.now() - t < minutes * 60 * 1000;
}

export const notifyOwnerNewOrder = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ orderId: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select(
        "id, order_number, customer_name, customer_email, customer_phone, total, subtotal, shipping_fee, upfront_amount, remaining_amount, shipping_city, shipping_governorate, created_at, order_items(product_name, quantity, unit_price, size, finish)",
      )
      .eq("id", data.orderId)
      .single();
    if (error || !order) return { ok: false };
    if (!recent(order.created_at as string)) return { ok: false, skipped: "too_old" };

    // Atomic claim — only one notification per order
    const { data: claim, error: claimErr } = await supabaseAdmin
      .from("orders")
      .update({ owner_notification_sent_at: new Date().toISOString() })
      .eq("id", data.orderId)
      .is("owner_notification_sent_at", null)
      .select("id")
      .maybeSingle();
    if (claimErr || !claim) return { ok: false, skipped: "already_sent" };

    const items = (order.order_items ?? []) as Array<{
      product_name: string; quantity: number; unit_price: number; size: string | null; finish: string | null;
    }>;
    const rows = items.map((it) => {
      const variant = [it.size, it.finish].filter(Boolean).join(" · ");
      const lt = (Number(it.unit_price) * it.quantity).toLocaleString();
      return `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #eee;font-size:14px;color:#222;">
          ${it.quantity}× ${esc(it.product_name)}
          ${variant ? `<div style="color:#777;font-size:12px;">${esc(variant)}</div>` : ""}
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #eee;font-size:14px;text-align:right;">EGP ${lt}</td>
      </tr>`;
    }).join("");

    const link = `${ADMIN_BASE}/admin/orders/${order.id}`;
    const html = `<!doctype html><html><body style="margin:0;padding:0;background:#f6f4ef;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px;background:#f6f4ef;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;max-width:600px;width:100%;">
  <tr><td style="padding:24px 28px 8px;">
    <h1 style="margin:0;font-size:20px;color:#1a1a1a;">🚨 New Website Order Received</h1>
    <p style="margin:8px 0 0;color:#555;font-size:14px;">Order <strong>${esc(order.order_number)}</strong></p>
  </td></tr>
  <tr><td style="padding:8px 28px;">
    <h3 style="margin:16px 0 6px;font-size:13px;color:#777;text-transform:uppercase;letter-spacing:1px;">Customer</h3>
    <p style="margin:0;font-size:14px;color:#222;line-height:1.6;">
      <strong>${esc(order.customer_name)}</strong><br/>
      ${esc(order.customer_email)}<br/>
      ${esc(order.customer_phone)}<br/>
      ${esc(order.shipping_city ?? "")}, ${esc(order.shipping_governorate ?? "")}
    </p>
  </td></tr>
  <tr><td style="padding:8px 28px;">
    <h3 style="margin:16px 0 6px;font-size:13px;color:#777;text-transform:uppercase;letter-spacing:1px;">Items</h3>
    <table width="100%" cellpadding="0" cellspacing="0">${rows}</table>
  </td></tr>
  <tr><td style="padding:8px 28px;">
    <h3 style="margin:16px 0 6px;font-size:13px;color:#777;text-transform:uppercase;letter-spacing:1px;">Pricing</h3>
    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:#222;">
      <tr><td style="padding:4px 0;">Subtotal</td><td style="text-align:right;">EGP ${Number(order.subtotal).toLocaleString()}</td></tr>
      <tr><td style="padding:4px 0;">Shipping</td><td style="text-align:right;">EGP ${Number(order.shipping_fee).toLocaleString()}</td></tr>
      <tr><td style="padding:4px 0;">Upfront (75%)</td><td style="text-align:right;">EGP ${Number(order.upfront_amount ?? 0).toLocaleString()}</td></tr>
      <tr><td style="padding:4px 0;">Remaining on delivery</td><td style="text-align:right;">EGP ${Number(order.remaining_amount ?? 0).toLocaleString()}</td></tr>
      <tr><td style="padding:8px 0 0;font-weight:700;border-top:1px solid #eee;">Total</td><td style="padding:8px 0 0;text-align:right;font-weight:700;border-top:1px solid #eee;">EGP ${Number(order.total).toLocaleString()}</td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:20px 28px 28px;">
    <a href="${link}" style="display:inline-block;background:#1a1a1a;color:#fff;text-decoration:none;padding:12px 20px;border-radius:6px;font-size:14px;">View order in dashboard →</a>
  </td></tr>
</table></td></tr></table></body></html>`;

    const ok = await sendViaResend(`🚨 New Website Order Received — ${order.order_number}`, html);
    if (!ok) {
      await supabaseAdmin.from("orders").update({ owner_notification_sent_at: null }).eq("id", data.orderId);
    }
    const firstItem = items[0];
    const productSummary = firstItem
      ? `${firstItem.product_name}${items.length > 1 ? ` + ${items.length - 1} more` : ""}`
      : `Order ${order.order_number}`;
    await pushAdmins({
      title: "New Order! 🪵",
      body: `${order.customer_name} — ${productSummary}`,
      url: `/admin/orders/${order.id}`,
      tag: `order-${order.id}`,
    });
    return { ok };
  });

export const notifyOwnerNewBooking = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ bookingId: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { data: b, error } = await supabaseAdmin
      .from("bookings")
      .select("id, full_name, phone, contact_method, preferred_day, time_slot, notes, created_at, owner_notification_sent_at")
      .eq("id", data.bookingId)
      .single();
    if (error || !b) return { ok: false };
    if (!recent(b.created_at as string, 10)) return { ok: false, skipped: "too_old" };
    if (b.owner_notification_sent_at) return { ok: false, skipped: "already_sent" };

    const { data: claim, error: claimErr } = await supabaseAdmin
      .from("bookings")
      .update({ owner_notification_sent_at: new Date().toISOString() })
      .eq("id", data.bookingId)
      .is("owner_notification_sent_at", null)
      .select("id")
      .maybeSingle();
    if (claimErr || !claim) return { ok: false, skipped: "already_sent" };

    const link = `${ADMIN_BASE}/admin/bookings`;
    const html = `<!doctype html><html><body style="margin:0;padding:0;background:#f6f4ef;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px;background:#f6f4ef;"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;max-width:560px;width:100%;">
  <tr><td style="padding:24px 28px 8px;">
    <h1 style="margin:0;font-size:20px;color:#1a1a1a;">📅 New Session Booking Confirmed</h1>
  </td></tr>
  <tr><td style="padding:8px 28px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:#222;line-height:1.7;">
      <tr><td><strong>Name:</strong></td><td>${esc(b.full_name)}</td></tr>
      <tr><td><strong>Phone:</strong></td><td>${esc(b.phone)}</td></tr>
      <tr><td><strong>Preferred contact:</strong></td><td>${esc(b.contact_method)}</td></tr>
      <tr><td><strong>Day:</strong></td><td>${esc(b.preferred_day)}</td></tr>
      <tr><td><strong>Time slot:</strong></td><td>${esc(b.time_slot)}</td></tr>
      ${b.notes ? `<tr><td valign="top"><strong>Notes:</strong></td><td>${esc(b.notes)}</td></tr>` : ""}
    </table>
  </td></tr>
  <tr><td style="padding:20px 28px 28px;">
    <a href="${link}" style="display:inline-block;background:#1a1a1a;color:#fff;text-decoration:none;padding:12px 20px;border-radius:6px;font-size:14px;">Open bookings dashboard →</a>
  </td></tr>
</table></td></tr></table></body></html>`;

    const ok = await sendViaResend(`📅 New Session Booking — ${b.full_name}`, html);
    if (!ok) {
      await supabaseAdmin.from("bookings").update({ owner_notification_sent_at: null }).eq("id", data.bookingId);
    }
    await pushAdmins({
      title: "New Booking 🪵",
      body: `${b.full_name} — ${b.preferred_day} (${b.time_slot})`,
      url: "/admin/bookings",
      tag: `booking-${b.id}`,
    });
    return { ok };
  });

export const notifyOwnerNewCustomBuild = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ requestId: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { data: b, error } = await supabaseAdmin
      .from("custom_build_requests")
      .select("id, full_name, email, phone, room_type, description, inspiration_image_url, created_at, owner_notification_sent_at")
      .eq("id", data.requestId)
      .single();
    if (error || !b) return { ok: false };
    if (!recent(b.created_at as string, 10)) return { ok: false, skipped: "too_old" };
    if (b.owner_notification_sent_at) return { ok: false, skipped: "already_sent" };

    const { data: claim, error: claimErr } = await supabaseAdmin
      .from("custom_build_requests")
      .update({ owner_notification_sent_at: new Date().toISOString() })
      .eq("id", data.requestId)
      .is("owner_notification_sent_at", null)
      .select("id")
      .maybeSingle();
    if (claimErr || !claim) return { ok: false, skipped: "already_sent" };
    const link = `${ADMIN_BASE}/admin/custom-builds`;
    const html = `<!doctype html><html><body style="margin:0;padding:0;background:#f6f4ef;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px;background:#f6f4ef;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;max-width:600px;width:100%;">
  <tr><td style="padding:24px 28px 8px;">
    <h1 style="margin:0;font-size:20px;color:#1a1a1a;">🛠️ New Custom Build Request</h1>
  </td></tr>
  <tr><td style="padding:8px 28px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:#222;line-height:1.7;">
      <tr><td><strong>Name:</strong></td><td>${esc(b.full_name)}</td></tr>
      <tr><td><strong>Email:</strong></td><td>${esc(b.email)}</td></tr>
      <tr><td><strong>Phone:</strong></td><td>${esc(b.phone)}</td></tr>
      <tr><td><strong>Room type:</strong></td><td>${esc(b.room_type)}</td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:8px 28px;">
    <h3 style="margin:16px 0 6px;font-size:13px;color:#777;text-transform:uppercase;letter-spacing:1px;">Description</h3>
    <p style="margin:0;font-size:14px;color:#222;line-height:1.6;white-space:pre-wrap;">${esc(b.description)}</p>
  </td></tr>
  ${b.inspiration_image_url ? `<tr><td style="padding:16px 28px 0;">
    <h3 style="margin:0 0 6px;font-size:13px;color:#777;text-transform:uppercase;letter-spacing:1px;">Inspiration photo</h3>
    <a href="${esc(b.inspiration_image_url)}"><img src="${esc(b.inspiration_image_url)}" alt="Inspiration" style="max-width:100%;border-radius:8px;border:1px solid #eee;"/></a>
  </td></tr>` : ""}
  <tr><td style="padding:20px 28px 28px;">
    <a href="${link}" style="display:inline-block;background:#1a1a1a;color:#fff;text-decoration:none;padding:12px 20px;border-radius:6px;font-size:14px;">Open custom builds dashboard →</a>
  </td></tr>
</table></td></tr></table></body></html>`;

    const ok = await sendViaResend(`🛠️ New Custom Build Request — ${b.full_name}`, html);
    if (!ok) {
      await supabaseAdmin.from("custom_build_requests").update({ owner_notification_sent_at: null }).eq("id", data.requestId);
    }
    await pushAdmins({
      title: "New Custom Build Request 🪵",
      body: `${b.full_name} — ${b.room_type}`,
      url: "/admin/custom-builds",
      tag: `custom-${b.id}`,
    });
    return { ok };
  });

export const notifyOwnerNewMeasurementBooking = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ bookingId: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { data: b, error } = await supabaseAdmin
      .from("measurement_bookings")
      .select("id, full_name, customer_email, phone, product_name, area, address, preferred_day, time_slot, notes, created_at, owner_notification_sent_at")
      .eq("id", data.bookingId)
      .single();
    if (error || !b) return { ok: false };
    if (!recent(b.created_at as string, 10)) return { ok: false, skipped: "too_old" };
    if (b.owner_notification_sent_at) return { ok: false, skipped: "already_sent" };

    const { data: claim, error: claimErr } = await supabaseAdmin
      .from("measurement_bookings")
      .update({ owner_notification_sent_at: new Date().toISOString() })
      .eq("id", data.bookingId)
      .is("owner_notification_sent_at", null)
      .select("id")
      .maybeSingle();
    if (claimErr || !claim) return { ok: false, skipped: "already_sent" };

    const link = `${ADMIN_BASE}/admin/measurement-bookings`;
    const html = `<!doctype html><html><body style="margin:0;padding:0;background:#f6f4ef;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px;background:#f6f4ef;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;max-width:600px;width:100%;">
  <tr><td style="padding:24px 28px 8px;">
    <h1 style="margin:0;font-size:20px;color:#1a1a1a;">📐 New Measurement Booking</h1>
    <p style="margin:8px 0 0;color:#555;font-size:14px;">${esc(b.product_name ?? "Safety gate / custom measurement")}</p>
  </td></tr>
  <tr><td style="padding:8px 28px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:#222;line-height:1.7;">
      <tr><td><strong>Name:</strong></td><td>${esc(b.full_name)}</td></tr>
      <tr><td><strong>Email:</strong></td><td>${esc(b.customer_email ?? "—")}</td></tr>
      <tr><td><strong>Phone:</strong></td><td>${esc(b.phone)}</td></tr>
      <tr><td><strong>Area:</strong></td><td>${esc(b.area)}</td></tr>
      <tr><td valign="top"><strong>Address:</strong></td><td>${esc(b.address)}</td></tr>
      <tr><td><strong>Preferred day:</strong></td><td>${esc(b.preferred_day)}</td></tr>
      <tr><td><strong>Time slot:</strong></td><td>${esc(b.time_slot)}</td></tr>
      ${b.notes ? `<tr><td valign="top"><strong>Notes:</strong></td><td>${esc(b.notes)}</td></tr>` : ""}
    </table>
  </td></tr>
  <tr><td style="padding:20px 28px 28px;">
    <a href="${link}" style="display:inline-block;background:#1a1a1a;color:#fff;text-decoration:none;padding:12px 20px;border-radius:6px;font-size:14px;">Open measurement bookings →</a>
  </td></tr>
</table></td></tr></table></body></html>`;

    const ok = await sendViaResend(`📐 New Measurement Booking — ${b.full_name}`, html);
    if (!ok) {
      await supabaseAdmin.from("measurement_bookings").update({ owner_notification_sent_at: null }).eq("id", data.bookingId);
    }
    await pushAdmins({
      title: "New Measurement Booking 🪵",
      body: `${b.full_name} — ${b.product_name ?? "Safety gate"}`,
      url: "/admin/measurement-bookings",
      tag: `measure-${b.id}`,
    });
    return { ok };
  });