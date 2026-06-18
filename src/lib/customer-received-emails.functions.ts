import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const FROM = "Suzy Wood <info@suzywoodofficial.com>";
const WHATSAPP_URL = "https://wa.me/201096313532";
const SUBJECT = "We received your request! 🪵 - Suzy Wood";

function esc(s: string | null | undefined) {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

async function sendResend(to: string, html: string) {
  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!LOVABLE_API_KEY || !RESEND_API_KEY) {
    console.error("Customer received email: keys missing");
    return false;
  }
  const res = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": RESEND_API_KEY,
    },
    body: JSON.stringify({ from: FROM, to: [to], subject: SUBJECT, html }),
  });
  if (!res.ok) {
    console.error("Customer received email: Resend failed", res.status, await res.text().catch(() => ""));
    return false;
  }
  return true;
}

function template(name: string, summaryRows: string, extra?: string) {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f6f4ef;font-family:Georgia,'Times New Roman',serif;color:#2b2418;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 12px;background:#f6f4ef;"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;max-width:560px;width:100%;overflow:hidden;">
  <tr><td style="padding:28px 32px 8px;text-align:center;">
    <div style="font-size:13px;letter-spacing:3px;text-transform:uppercase;color:#7a6a52;">Suzy Wood</div>
    <h1 style="margin:14px 0 6px;font-size:24px;color:#2b2418;">We received your request 🪵</h1>
    <p style="margin:0;color:#6b5f4d;font-size:15px;">Thank you, ${esc(name)} — we're so glad you reached out.</p>
  </td></tr>
  <tr><td style="padding:18px 32px 0;">
    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:#3a3225;background:#faf6ef;border-radius:8px;padding:16px;">
      ${summaryRows}
    </table>
  </td></tr>
  ${extra ?? ""}
  <tr><td style="padding:20px 32px 4px;">
    <p style="margin:0;font-size:15px;color:#3a3225;line-height:1.6;">Our team is reviewing your request and will confirm with you shortly. If you'd like to chat right away, message us on WhatsApp.</p>
  </td></tr>
  <tr><td style="padding:18px 32px 28px;text-align:center;">
    <a href="${WHATSAPP_URL}" style="display:inline-block;background:#25D366;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-size:15px;font-weight:600;">💬 Chat with us on WhatsApp</a>
  </td></tr>
  <tr><td style="padding:0 32px 28px;text-align:center;color:#a39377;font-size:12px;">
    Handcrafted with love — Suzy Wood
  </td></tr>
</table></td></tr></table></body></html>`;
}

function row(label: string, value: string | null | undefined) {
  if (!value) return "";
  return `<tr><td style="padding:4px 0;color:#7a6a52;width:130px;"><strong>${esc(label)}</strong></td><td style="padding:4px 0;">${esc(value)}</td></tr>`;
}

// Guidance session booking — only sends if customer supplied an email.
export const sendGuidanceBookingReceivedEmail = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ bookingId: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { data: b, error } = await supabaseAdmin
      .from("bookings")
      .select("id, full_name, customer_email, phone, contact_method, preferred_day, time_slot, notes, customer_notification_sent_at")
      .eq("id", data.bookingId)
      .single();
    if (error || !b) return { ok: false };
    if (!b.customer_email) return { ok: false, skipped: "no_email" };
    if (b.customer_notification_sent_at) return { ok: true, skipped: "already_sent" };

    const { data: claim } = await supabaseAdmin
      .from("bookings")
      .update({ customer_notification_sent_at: new Date().toISOString() })
      .eq("id", data.bookingId)
      .is("customer_notification_sent_at", null)
      .select("id")
      .maybeSingle();
    if (!claim) return { ok: true, skipped: "already_sent" };

    const summary = [
      row("Preferred day", b.preferred_day),
      row("Time slot", b.time_slot),
      row("Contact via", b.contact_method),
      row("Phone", b.phone),
      row("Notes", b.notes),
    ].join("");
    const html = template(b.full_name, summary)
      .replace("${esc(name)}", esc(b.full_name));
    // template is built with the name interpolated inline now; re-render with name
    const finalHtml = renderWithName(b.full_name, summary);
    const ok = await sendResend(b.customer_email, finalHtml);
    if (!ok) await supabaseAdmin.from("bookings").update({ customer_notification_sent_at: null }).eq("id", data.bookingId);
    return { ok };
  });

// Custom build request
export const sendCustomBuildReceivedEmail = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ requestId: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { data: b, error } = await supabaseAdmin
      .from("custom_build_requests")
      .select("id, full_name, email, phone, room_type, description, customer_notification_sent_at")
      .eq("id", data.requestId)
      .single();
    if (error || !b) return { ok: false };
    if (!b.email) return { ok: false, skipped: "no_email" };
    if (b.customer_notification_sent_at) return { ok: true, skipped: "already_sent" };

    const { data: claim } = await supabaseAdmin
      .from("custom_build_requests")
      .update({ customer_notification_sent_at: new Date().toISOString() })
      .eq("id", data.requestId)
      .is("customer_notification_sent_at", null)
      .select("id")
      .maybeSingle();
    if (!claim) return { ok: true, skipped: "already_sent" };

    const summary = [
      row("Room type", b.room_type),
      row("Phone", b.phone),
    ].join("");
    const extra = `<tr><td style="padding:14px 32px 0;">
      <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#7a6a52;margin-bottom:6px;">Your idea</div>
      <p style="margin:0;font-size:14px;color:#3a3225;line-height:1.6;white-space:pre-wrap;background:#faf6ef;padding:14px 16px;border-radius:8px;">${esc(b.description)}</p>
    </td></tr>`;
    const finalHtml = renderWithName(b.full_name, summary, extra);
    const ok = await sendResend(b.email, finalHtml);
    if (!ok) await supabaseAdmin.from("custom_build_requests").update({ customer_notification_sent_at: null }).eq("id", data.requestId);
    return { ok };
  });

function renderWithName(name: string, summaryRows: string, extra?: string) {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f6f4ef;font-family:Georgia,'Times New Roman',serif;color:#2b2418;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 12px;background:#f6f4ef;"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;max-width:560px;width:100%;overflow:hidden;">
  <tr><td style="padding:28px 32px 8px;text-align:center;">
    <div style="font-size:13px;letter-spacing:3px;text-transform:uppercase;color:#7a6a52;">Suzy Wood</div>
    <h1 style="margin:14px 0 6px;font-size:24px;color:#2b2418;">We received your request 🪵</h1>
    <p style="margin:0;color:#6b5f4d;font-size:15px;">Thank you, ${esc(name)} — we're so glad you reached out.</p>
  </td></tr>
  ${summaryRows ? `<tr><td style="padding:18px 32px 0;">
    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:#3a3225;background:#faf6ef;border-radius:8px;padding:16px;">
      ${summaryRows}
    </table>
  </td></tr>` : ""}
  ${extra ?? ""}
  <tr><td style="padding:20px 32px 4px;">
    <p style="margin:0;font-size:15px;color:#3a3225;line-height:1.6;">Our team is reviewing your request and will confirm with you shortly. If you'd like to chat right away, message us on WhatsApp.</p>
  </td></tr>
  <tr><td style="padding:18px 32px 28px;text-align:center;">
    <a href="${WHATSAPP_URL}" style="display:inline-block;background:#25D366;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-size:15px;font-weight:600;">💬 Chat with us on WhatsApp</a>
  </td></tr>
  <tr><td style="padding:0 32px 28px;text-align:center;color:#a39377;font-size:12px;">
    Handcrafted with love — Suzy Wood
  </td></tr>
</table></td></tr></table></body></html>`;
}