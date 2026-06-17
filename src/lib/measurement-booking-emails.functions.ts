import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const WHATSAPP_NUMBER = "201096313532";

const DAY_LABELS: Record<string, string> = {
  saturday: "Saturday", sunday: "Sunday", monday: "Monday",
  tuesday: "Tuesday", wednesday: "Wednesday", thursday: "Thursday",
};
const SLOT_LABELS: Record<string, string> = {
  morning: "Morning (9–12)", afternoon: "Afternoon (12–4)", evening: "Evening (4–8)",
};

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function waLink(msg: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
}

function shell(title: string, body: string, ctaHref: string, ctaLabel: string, ctaColor = "#25D366") {
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f6f4ef;font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f4ef;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:560px;width:100%;">
        <tr><td style="padding:32px 32px 8px;text-align:center;">
          <h1 style="margin:0;font-size:24px;color:#1a1a1a;letter-spacing:0.5px;">Suzy Wood</h1>
          <p style="margin:6px 0 0;color:#888;font-size:12px;font-family:Arial,sans-serif;letter-spacing:2px;text-transform:uppercase;">Handcrafted in Egypt</p>
        </td></tr>
        <tr><td style="padding:16px 32px 0;">
          <h2 style="margin:16px 0 12px;font-size:20px;color:#1a1a1a;">${title}</h2>
          ${body}
        </td></tr>
        <tr><td style="padding:24px 32px 8px;text-align:center;">
          <a href="${ctaHref}" style="display:inline-block;background:${ctaColor};color:#fff;text-decoration:none;padding:14px 28px;border-radius:6px;font-family:Arial,sans-serif;font-size:15px;font-weight:600;">${ctaLabel}</a>
        </td></tr>
        <tr><td style="padding:8px 32px 32px;">
          <p style="margin:16px 0 0;color:#888;font-size:12px;font-family:Arial,sans-serif;">With love,<br/>The Suzy Wood team</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function paragraph(text: string) {
  return `<p style="margin:0 0 12px;color:#444;font-size:15px;line-height:1.6;font-family:Arial,sans-serif;">${text}</p>`;
}

function detailBox(rows: Array<[string, string]>) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9f6f1;border-radius:6px;padding:12px;font-family:Arial,sans-serif;margin:8px 0 16px;">
    ${rows.map(([k, v]) => `<tr><td style="padding:6px 12px;color:#444;font-size:14px;"><strong>${k}:</strong> ${v}</td></tr>`).join("")}
  </table>`;
}

function fmtConfirmedDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

type BookingRow = {
  id: string;
  full_name: string;
  customer_email: string | null;
  phone: string;
  product_name: string;
  preferred_day: string;
  time_slot: string;
  confirmed_date: string | null;
  quotation_price: number | null;
  payment_link: string | null;
  received_email_sent_at: string | null;
  confirmed_email_sent_at: string | null;
  quotation_email_sent_at: string | null;
  payment_email_sent_at: string | null;
};

function renderEmail(kind: "received" | "confirmed" | "quotation" | "paid", b: BookingRow): { subject: string; html: string } {
  const name = escapeHtml(b.full_name);
  const wa = waLink(`Hi Suzy Wood, regarding my safety gate measurement booking for ${b.product_name}.`);
  if (kind === "received") {
    const body =
      paragraph(`Hi ${name},`) +
      paragraph(`Thank you for booking a measurement visit for your <strong>${escapeHtml(b.product_name)}</strong>. We've received your request and our team will review and confirm your appointment shortly.`) +
      detailBox([
        ["Preferred day", DAY_LABELS[b.preferred_day] ?? b.preferred_day],
        ["Preferred time", SLOT_LABELS[b.time_slot] ?? b.time_slot],
      ]);
    return {
      subject: "We received your measurement booking! 🪵 - Suzy Wood",
      html: shell("We received your booking 🪵", body, wa, "Chat with us on WhatsApp"),
    };
  }
  if (kind === "confirmed") {
    const when = b.confirmed_date ? fmtConfirmedDate(b.confirmed_date) : `${DAY_LABELS[b.preferred_day] ?? b.preferred_day}, ${SLOT_LABELS[b.time_slot] ?? b.time_slot}`;
    const body =
      paragraph(`Hi ${name},`) +
      paragraph(`Great news — your measurement visit is confirmed. Our team will visit on the date below to take measurements for your safety gate.`) +
      detailBox([["Confirmed visit", escapeHtml(when)], ["Product", escapeHtml(b.product_name)]]);
    return {
      subject: "Your Measurement Visit is Confirmed! 🪵 - Suzy Wood",
      html: shell("Your visit is confirmed 🪵", body, wa, "Chat with us on WhatsApp"),
    };
  }
  if (kind === "quotation") {
    const price = b.quotation_price != null ? `${Number(b.quotation_price).toLocaleString()} EGP` : "—";
    const payment = b.payment_link
      ? (b.payment_link.startsWith("http")
          ? `<a href="${escapeHtml(b.payment_link)}" style="color:#1a5cff;word-break:break-all;">${escapeHtml(b.payment_link)}</a>`
          : escapeHtml(b.payment_link))
      : "Our team will share payment details on WhatsApp.";
    const body =
      paragraph(`Hi ${name},`) +
      paragraph(`Thank you for hosting our measurement visit. Here is your quotation for your <strong>${escapeHtml(b.product_name)}</strong>.`) +
      detailBox([["Total price", price]]) +
      paragraph(`<strong>Payment instructions:</strong><br/>${payment}`) +
      paragraph(`Please complete payment to confirm your order.`);
    return {
      subject: "Your Safety Gate Quotation is Ready 🪵 - Suzy Wood",
      html: shell("Your quotation is ready 🪵", body, wa, "Chat with us on WhatsApp"),
    };
  }
  // paid
  const body =
    paragraph(`Hi ${name},`) +
    paragraph(`Thank you — we've received your payment. Your safety gate order is now <strong>in production</strong>.`) +
    paragraph(`Estimated production & installation timeline: <strong>2–4 weeks</strong>. We'll be in touch on WhatsApp to schedule installation as soon as it's ready.`);
  return {
    subject: "Payment Confirmed - Your Safety Gate Order is Set! 🪵 - Suzy Wood",
    html: shell("Payment confirmed 🪵", body, wa, "Chat with us on WhatsApp"),
  };
}

async function sendResend(to: string, subject: string, html: string) {
  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
  if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");
  const res = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": RESEND_API_KEY,
    },
    body: JSON.stringify({
      from: "Suzy Wood <orders@suzywoodofficial.com>",
      to: [to],
      subject,
      html,
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("Resend send failed", res.status, body);
    return { ok: false as const, error: `Resend error ${res.status}` };
  }
  return { ok: true as const };
}

const SELECT_COLS =
  "id, full_name, customer_email, phone, product_name, preferred_day, time_slot, confirmed_date, quotation_price, payment_link, received_email_sent_at, confirmed_email_sent_at, quotation_email_sent_at, payment_email_sent_at";

const SENT_COL: Record<string, keyof BookingRow> = {
  received: "received_email_sent_at",
  confirmed: "confirmed_email_sent_at",
  quotation: "quotation_email_sent_at",
  paid: "payment_email_sent_at",
};

// Public — called right after the customer submits the booking. Only sends the
// "received" email, once, if it has not been sent yet.
export const sendBookingReceivedEmail = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ bookingId: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("measurement_bookings")
      .select(SELECT_COLS)
      .eq("id", data.bookingId)
      .single();
    if (error || !row) return { ok: false, error: "Booking not found" };
    const b = row as unknown as BookingRow;
    if (b.received_email_sent_at) return { ok: true, skipped: true };
    if (!b.customer_email) return { ok: false, error: "No email on file" };
    const { subject, html } = renderEmail("received", b);
    const res = await sendResend(b.customer_email, subject, html);
    if (!res.ok) return res;
    await supabaseAdmin
      .from("measurement_bookings")
      .update({ received_email_sent_at: new Date().toISOString() })
      .eq("id", data.bookingId);
    return { ok: true };
  });

// Admin-only — sends one of the workflow emails.
export const sendMeasurementBookingEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({
      bookingId: z.string().uuid(),
      kind: z.enum(["confirmed", "quotation", "paid"]),
    }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Response("Forbidden", { status: 403 });

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("measurement_bookings")
      .select(SELECT_COLS)
      .eq("id", data.bookingId)
      .single();
    if (error || !row) return { ok: false, error: "Booking not found" };
    const b = row as unknown as BookingRow;
    if (!b.customer_email) return { ok: false, error: "No email on file for this booking" };
    const sentCol = SENT_COL[data.kind];
    if (b[sentCol]) return { ok: true, skipped: true };
    if (data.kind === "confirmed" && !b.confirmed_date) {
      return { ok: false, error: "Set a confirmed date before sending" };
    }
    if (data.kind === "quotation" && b.quotation_price == null) {
      return { ok: false, error: "Enter a quotation price before sending" };
    }
    const { subject, html } = renderEmail(data.kind, b);
    const res = await sendResend(b.customer_email, subject, html);
    if (!res.ok) return res;
    await supabaseAdmin
      .from("measurement_bookings")
      .update({ [sentCol]: new Date().toISOString() })
      .eq("id", data.bookingId);
    return { ok: true };
  });