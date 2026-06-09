import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const FROM = "Suzy Wood <info@suzywoodofficial.com>";

function esc(s: string) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const DAY_LABELS: Record<string, string> = {
  saturday: "Saturday", sunday: "Sunday", monday: "Monday",
  tuesday: "Tuesday", wednesday: "Wednesday", thursday: "Thursday",
};
const SLOT_LABELS: Record<string, string> = {
  morning: "Morning (9am – 12pm)",
  afternoon: "Afternoon (12pm – 4pm)",
  evening: "Evening (4pm – 8pm)",
};

function recent(createdAt: string | null | undefined, minutes = 30) {
  if (!createdAt) return false;
  const t = new Date(createdAt).getTime();
  return Number.isFinite(t) && Date.now() - t < minutes * 60 * 1000;
}

async function sendViaResend(to: string, subject: string, html: string) {
  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!LOVABLE_API_KEY || !RESEND_API_KEY) {
    console.error("Booking confirm: email keys not configured");
    return false;
  }
  const res = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": RESEND_API_KEY,
    },
    body: JSON.stringify({ from: FROM, to: [to], subject, html }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("Booking confirm: Resend failed", res.status, body);
    return false;
  }
  return true;
}

function wrap(headline: string, bodyHtml: string) {
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f6f4ef;font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f4ef;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:560px;width:100%;">
        <tr><td style="padding:28px 32px 8px;">
          <h1 style="margin:0;font-size:22px;color:#1a1a1a;font-weight:normal;">Suzy Wood</h1>
        </td></tr>
        <tr><td style="padding:8px 32px 0;">
          <h2 style="margin:0 0 8px;font-size:20px;color:#1a1a1a;font-weight:normal;">${esc(headline)}</h2>
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding:24px 32px 32px;">
          <p style="margin:16px 0 0;color:#555;font-size:14px;line-height:1.6;font-family:Arial,sans-serif;">
            Thank you for choosing Suzy Wood — we're so grateful to be part of your story.
          </p>
          <p style="margin:16px 0 0;color:#888;font-size:12px;font-family:Arial,sans-serif;">
            With love,<br/>The Suzy Wood team
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export const sendBookingConfirmationEmail = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ bookingId: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { data: b, error } = await supabaseAdmin
      .from("bookings")
      .select("id, full_name, phone, contact_method, preferred_day, time_slot, notes, customer_email, customer_notification_sent_at, created_at" as never)
      .eq("id", data.bookingId)
      .maybeSingle();
    if (error || !b) return { ok: false as const };
    const row = b as any;
    if (!row.customer_email) return { ok: true as const, skipped: "no_email" };
    if (row.customer_notification_sent_at) return { ok: true as const, skipped: "already_sent" };
    if (!recent(row.created_at)) return { ok: false as const, skipped: "too_old" };

    const { data: claim } = await supabaseAdmin
      .from("bookings")
      .update({ customer_notification_sent_at: new Date().toISOString() } as never)
      .eq("id", row.id)
      .is("customer_notification_sent_at" as never, null)
      .select("id")
      .maybeSingle();
    if (!claim) return { ok: true as const, skipped: "race" };

    const dayLabel = DAY_LABELS[row.preferred_day] ?? row.preferred_day;
    const slotLabel = SLOT_LABELS[row.time_slot] ?? row.time_slot;
    const methodLabel = row.contact_method === "whatsapp" ? "WhatsApp" : "Phone Call";

    const body = `
      <p style="margin:0 0 4px;color:#555;font-size:14px;font-family:Arial,sans-serif;">Hi ${esc(row.full_name)},</p>
      <p style="margin:8px 0 16px;color:#555;font-size:14px;line-height:1.6;font-family:Arial,sans-serif;">
        Thank you for booking a free guidance session with Suzy Wood. We've received your request and our team will reach out to you on <strong>${esc(methodLabel)}</strong> shortly to confirm the details.
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif;border-top:1px solid #eee;margin-top:8px;">
        <tr><td style="padding:10px 0;color:#777;font-size:13px;">Preferred day</td><td style="padding:10px 0;color:#1a1a1a;font-size:13px;text-align:right;">${esc(dayLabel)}</td></tr>
        <tr><td style="padding:10px 0;color:#777;font-size:13px;border-top:1px solid #eee;">Preferred time</td><td style="padding:10px 0;color:#1a1a1a;font-size:13px;text-align:right;border-top:1px solid #eee;">${esc(slotLabel)}</td></tr>
        <tr><td style="padding:10px 0;color:#777;font-size:13px;border-top:1px solid #eee;">Contact via</td><td style="padding:10px 0;color:#1a1a1a;font-size:13px;text-align:right;border-top:1px solid #eee;">${esc(methodLabel)} — ${esc(row.phone)}</td></tr>
      </table>`;

    const ok = await sendViaResend(row.customer_email, "Your free session is booked — Suzy Wood", wrap("Your free session is booked", body));
    if (!ok) {
      await supabaseAdmin
        .from("bookings")
        .update({ customer_notification_sent_at: null } as never)
        .eq("id", row.id);
      return { ok: false as const };
    }
    return { ok: true as const };
  });

export const sendMeasurementBookingConfirmationEmail = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ bookingId: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { data: b, error } = await supabaseAdmin
      .from("measurement_bookings")
      .select("id, product_name, full_name, phone, area, address, preferred_day, time_slot, notes, customer_email, customer_notification_sent_at, created_at" as never)
      .eq("id", data.bookingId)
      .maybeSingle();
    if (error || !b) return { ok: false as const };
    const row = b as any;
    if (!row.customer_email) return { ok: true as const, skipped: "no_email" };
    if (row.customer_notification_sent_at) return { ok: true as const, skipped: "already_sent" };
    if (!recent(row.created_at)) return { ok: false as const, skipped: "too_old" };

    const { data: claim } = await supabaseAdmin
      .from("measurement_bookings")
      .update({ customer_notification_sent_at: new Date().toISOString() } as never)
      .eq("id", row.id)
      .is("customer_notification_sent_at" as never, null)
      .select("id")
      .maybeSingle();
    if (!claim) return { ok: true as const, skipped: "race" };

    const dayLabel = DAY_LABELS[row.preferred_day] ?? row.preferred_day;
    const slotLabel = SLOT_LABELS[row.time_slot] ?? row.time_slot;

    const body = `
      <p style="margin:0 0 4px;color:#555;font-size:14px;font-family:Arial,sans-serif;">Hi ${esc(row.full_name)},</p>
      <p style="margin:8px 0 16px;color:#555;font-size:14px;line-height:1.6;font-family:Arial,sans-serif;">
        Thank you for booking a measurement visit for <strong>${esc(row.product_name)}</strong>. We've received your request and our team will contact you within 24 hours to confirm the appointment.
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif;border-top:1px solid #eee;margin-top:8px;">
        <tr><td style="padding:10px 0;color:#777;font-size:13px;">Product</td><td style="padding:10px 0;color:#1a1a1a;font-size:13px;text-align:right;">${esc(row.product_name)}</td></tr>
        <tr><td style="padding:10px 0;color:#777;font-size:13px;border-top:1px solid #eee;">Area</td><td style="padding:10px 0;color:#1a1a1a;font-size:13px;text-align:right;border-top:1px solid #eee;">${esc(row.area)}</td></tr>
        <tr><td style="padding:10px 0;color:#777;font-size:13px;border-top:1px solid #eee;">Address</td><td style="padding:10px 0;color:#1a1a1a;font-size:13px;text-align:right;border-top:1px solid #eee;">${esc(row.address)}</td></tr>
        <tr><td style="padding:10px 0;color:#777;font-size:13px;border-top:1px solid #eee;">Preferred day</td><td style="padding:10px 0;color:#1a1a1a;font-size:13px;text-align:right;border-top:1px solid #eee;">${esc(dayLabel)}</td></tr>
        <tr><td style="padding:10px 0;color:#777;font-size:13px;border-top:1px solid #eee;">Preferred time</td><td style="padding:10px 0;color:#1a1a1a;font-size:13px;text-align:right;border-top:1px solid #eee;">${esc(slotLabel)}</td></tr>
        <tr><td style="padding:10px 0;color:#777;font-size:13px;border-top:1px solid #eee;">Phone</td><td style="padding:10px 0;color:#1a1a1a;font-size:13px;text-align:right;border-top:1px solid #eee;">${esc(row.phone)}</td></tr>
      </table>`;

    const ok = await sendViaResend(row.customer_email, `Measurement visit booked — ${row.product_name}`, wrap("Measurement visit booked", body));
    if (!ok) {
      await supabaseAdmin
        .from("measurement_bookings")
        .update({ customer_notification_sent_at: null } as never)
        .eq("id", row.id);
      return { ok: false as const };
    }
    return { ok: true as const };
  });