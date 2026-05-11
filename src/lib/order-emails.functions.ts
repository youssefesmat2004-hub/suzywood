import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const STATUS_LABELS: Record<string, string> = {
  pending_payment: "Pending Payment",
  confirmed: "Confirmed",
  in_production: "In Production",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const STATUS_HEADLINES: Record<string, string> = {
  pending_payment: "We're awaiting payment for your order",
  confirmed: "Your order has been confirmed",
  in_production: "Your order is now in production",
  shipped: "Your order has been shipped",
  delivered: "Your order has been delivered",
  cancelled: "Your order has been cancelled",
};

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderEmail(opts: {
  customerName: string;
  orderNumber: string;
  status: string;
  items: Array<{ product_name: string; quantity: number; unit_price: number; size: string | null; finish: string | null }>;
  total: number;
}) {
  const headline = STATUS_HEADLINES[opts.status] ?? `Your order status is now ${STATUS_LABELS[opts.status] ?? opts.status}`;
  const statusLabel = STATUS_LABELS[opts.status] ?? opts.status;

  const itemsRows = opts.items
    .map((it) => {
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

  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f6f4ef;font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f4ef;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:560px;width:100%;">
        <tr><td style="padding:28px 32px 8px;">
          <h1 style="margin:0;font-size:22px;color:#1a1a1a;font-weight:normal;">Suzy Wood</h1>
        </td></tr>
        <tr><td style="padding:8px 32px 0;">
          <h2 style="margin:0 0 8px;font-size:20px;color:#1a1a1a;font-weight:normal;">${escapeHtml(headline)}</h2>
          <p style="margin:0 0 4px;color:#555;font-size:14px;font-family:Arial,sans-serif;">Hi ${escapeHtml(opts.customerName)},</p>
          <p style="margin:8px 0 16px;color:#555;font-size:14px;line-height:1.6;font-family:Arial,sans-serif;">
            We're writing to let you know your order <strong>${escapeHtml(opts.orderNumber)}</strong> is now
            <strong style="color:#1a1a1a;">${escapeHtml(statusLabel)}</strong>.
          </p>
        </td></tr>
        <tr><td style="padding:8px 32px 0;">
          <h3 style="margin:16px 0 4px;font-size:14px;color:#777;text-transform:uppercase;letter-spacing:1px;font-family:Arial,sans-serif;font-weight:600;">Your items</h3>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif;">
            ${itemsRows}
            <tr>
              <td style="padding:14px 0 0;color:#1a1a1a;font-size:14px;font-weight:600;">Total</td>
              <td style="padding:14px 0 0;color:#1a1a1a;font-size:14px;font-weight:600;text-align:right;">EGP ${Number(opts.total).toLocaleString()}</td>
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
}

export const sendOrderStatusEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ orderId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");

    const { supabase } = context;

    const { data: order, error } = await supabase
      .from("orders")
      .select("id, order_number, customer_name, customer_email, status, total, order_items(product_name, quantity, unit_price, size, finish)")
      .eq("id", data.orderId)
      .single();

    if (error || !order) {
      console.error("Failed to load order for email", error);
      return { ok: false, error: "Order not found" };
    }

    const html = renderEmail({
      customerName: order.customer_name,
      orderNumber: order.order_number,
      status: order.status,
      items: (order.order_items ?? []) as any,
      total: Number(order.total),
    });

    const subject = `Order ${order.order_number}: ${STATUS_LABELS[order.status] ?? order.status}`;

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
        subject,
        html,
      }),
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("Resend send failed", res.status, body);
      return { ok: false, error: `Resend error ${res.status}` };
    }

    return { ok: true };
  });