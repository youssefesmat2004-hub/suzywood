import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export const sendCheckoutPendingEmail = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        orderId: z.string().uuid(),
        // Caller must echo back the InstaPay reference they just submitted.
        // It is a per-order shared secret (only the customer who placed the
        // order knows it), preventing attackers from probing random order
        // UUIDs to trigger emails or leak PII.
        instapayReference: z.string().min(1).max(200),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!LOVABLE_API_KEY || !RESEND_API_KEY) {
      console.error("Email keys not configured");
      return { ok: false };
    }

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select(
        "id, order_number, customer_name, customer_email, total, upfront_amount, remaining_amount, instapay_reference, created_at, confirmation_email_sent_at, order_items(product_name, quantity, unit_price, size, finish)",
      )
      .eq("id", data.orderId)
      .single();

    if (error || !order) {
      console.error("Failed to load order for checkout email", error);
      return { ok: false };
    }

    // Verify the caller actually placed this order by matching the
    // InstaPay reference stored on the order.
    const stored = (order.instapay_reference ?? "").trim();
    const provided = data.instapayReference.trim();
    if (!stored || stored !== provided) {
      console.warn("Checkout email rejected: reference mismatch", { orderId: data.orderId });
      return { ok: false, skipped: "unauthorized" };
    }

    // Anti-spam guard: only send once, and only for orders placed in the last 30 min.
    if (order.confirmation_email_sent_at) {
      return { ok: true, skipped: "already_sent" };
    }
    const createdMs = new Date(order.created_at as string).getTime();
    if (Number.isFinite(createdMs) && Date.now() - createdMs > 30 * 60 * 1000) {
      return { ok: false, skipped: "too_old" };
    }

    // Atomically claim the right to send (prevents concurrent duplicates).
    const { data: claim, error: claimErr } = await supabaseAdmin
      .from("orders")
      .update({ confirmation_email_sent_at: new Date().toISOString() })
      .eq("id", order.id)
      .is("confirmation_email_sent_at", null)
      .select("id")
      .maybeSingle();
    if (claimErr || !claim) {
      return { ok: true, skipped: "race" };
    }

    const itemsRows = (order.order_items ?? [])
      .map((it: any) => {
        const variant = [it.size, it.finish].filter(Boolean).join(" · ");
        const lineTotal = (Number(it.unit_price) * it.quantity).toLocaleString();
        return `
          <tr>
            <td style="padding:12px 0;border-bottom:1px solid #eee;color:#222;font-size:14px;">
              ${it.quantity}× ${escapeHtml(it.product_name)}
              ${variant ? `<div style="color:#777;font-size:12px;margin-top:2px;">${escapeHtml(variant)}</div>` : ""}
            </td>
            <td style="padding:12px 0;border-bottom:1px solid #eee;color:#222;font-size:14px;text-align:right;white-space:nowrap;">EGP ${lineTotal}</td>
          </tr>`;
      })
      .join("");

    const upfront = Number(order.upfront_amount ?? 0);
    const remaining = Number(order.remaining_amount ?? 0);

    const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#f6f4ef;font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f4ef;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:560px;width:100%;">
        <tr><td style="padding:28px 32px 8px;">
          <h1 style="margin:0;font-size:22px;color:#1a1a1a;font-weight:normal;">Suzy Wood</h1>
        </td></tr>
        <tr><td style="padding:8px 32px 0;">
          <h2 style="margin:0 0 8px;font-size:20px;color:#1a1a1a;font-weight:normal;">Thank you! Your order is confirmed.</h2>
          <p style="margin:0 0 4px;color:#555;font-size:14px;font-family:Arial,sans-serif;">Hi ${escapeHtml(order.customer_name)},</p>
          <p style="margin:8px 0 16px;color:#555;font-size:14px;line-height:1.6;font-family:Arial,sans-serif;">
            We've received your order <strong>${escapeHtml(order.order_number)}</strong> and the 75% upfront payment
            ${order.instapay_reference ? `(InstaPay reference <strong>${escapeHtml(order.instapay_reference)}</strong>)` : ""}.
            Our team will contact you shortly to arrange delivery.
          </p>
        </td></tr>
        <tr><td style="padding:8px 32px 0;">
          <h3 style="margin:16px 0 4px;font-size:14px;color:#777;text-transform:uppercase;letter-spacing:1px;font-family:Arial,sans-serif;font-weight:600;">Payment summary</h3>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif;">
            <tr>
              <td style="padding:8px 0;color:#222;font-size:14px;">Amount paid upfront (75%)</td>
              <td style="padding:8px 0;color:#1a1a1a;font-size:14px;text-align:right;font-weight:600;">EGP ${upfront.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#222;font-size:14px;border-bottom:1px solid #eee;">Remaining on delivery (25% + delivery fees)</td>
              <td style="padding:8px 0;color:#1a1a1a;font-size:14px;text-align:right;border-bottom:1px solid #eee;">EGP ${remaining.toLocaleString()}</td>
            </tr>
          </table>
          <p style="margin:12px 0 0;color:#555;font-size:13px;line-height:1.6;font-family:Arial,sans-serif;">
            Please have the remaining amount ready when your order arrives.
          </p>
        </td></tr>
        <tr><td style="padding:8px 32px 0;">
          <h3 style="margin:16px 0 4px;font-size:14px;color:#777;text-transform:uppercase;letter-spacing:1px;font-family:Arial,sans-serif;font-weight:600;">Your items</h3>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif;">
            ${itemsRows}
            <tr>
              <td style="padding:14px 0 0;color:#1a1a1a;font-size:14px;font-weight:600;">Order total</td>
              <td style="padding:14px 0 0;color:#1a1a1a;font-size:14px;font-weight:600;text-align:right;">EGP ${Number(order.total).toLocaleString()}</td>
            </tr>
          </table>
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

    const res = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: "Suzy Wood <onboarding@resend.dev>",
        to: [order.customer_email],
        subject: `Order ${order.order_number} received — Pending Payment`,
        html,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("Resend send failed", res.status, body);
      // Release the claim so the customer (or a retry) can still receive the email.
      await supabaseAdmin
        .from("orders")
        .update({ confirmation_email_sent_at: null })
        .eq("id", order.id);
      return { ok: false };
    }
    return { ok: true };
  });