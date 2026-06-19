import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const STATUS_LABELS: Record<string, string> = {
  pending_payment: "Pending Payment",
  confirmed: "Payment Confirmed",
  in_production: "Payment Confirmed",
  shipped: "Out for Delivery",
  delivered: "Delivered & Completed",
  cancelled: "Cancelled",
};

const STATUS_HEADLINES: Record<string, string> = {
  pending_payment: "We're awaiting payment for your order",
  confirmed: "Payment confirmed — we're on it! 🪵",
  in_production: "Payment confirmed — we're on it! 🪵",
  shipped: "Your order is on the way! 🚚",
  delivered: "Your order has arrived — thank you! 🪵",
  cancelled: "Your order has been cancelled",
};

const STATUS_SUBJECTS: Record<string, string> = {
  confirmed: "Payment Confirmed - We're On It! 🪵 - Suzy Wood",
  in_production: "Payment Confirmed - We're On It! 🪵 - Suzy Wood",
  shipped: "Your Order is On the Way! 🚚🪵 - Suzy Wood",
  delivered: "Thank You! Your Order Has Arrived 🪵 - Suzy Wood",
};

const WHATSAPP_URL = "https://wa.me/201096313532";

const STATUS_BODY: Record<string, string> = {
  confirmed:
    "Thank you so much for your payment — we truly appreciate your trust in us. Your order is now being handcrafted by our team, and we'll keep you updated on the progress every step of the way.",
  in_production:
    "Thank you so much for your payment — we truly appreciate your trust in us. Your order is now being handcrafted by our team, and we'll keep you updated on the progress every step of the way.",
  shipped:
    "Great news! Your order is out for delivery and on its way to you. Please have the remaining 25% balance ready to settle on delivery.",
  delivered:
    "Thank you so much for choosing Suzy Wood — it means the world to us. We hope you and your little one absolutely love your new piece. If you have a moment, we'd love to see a photo or hear what you think — your reviews keep our small team going. 💛",
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
  upfront: number | null;
  remaining: number | null;
  isManualOrder?: boolean;
  productDescription?: string | null;
}) {
  const headline =
    STATUS_HEADLINES[opts.status] ??
    `Your order status is now ${STATUS_LABELS[opts.status] ?? opts.status}`;
  const statusLabel = STATUS_LABELS[opts.status] ?? opts.status;
  const customBody = STATUS_BODY[opts.status] ?? null;
  const showWhatsApp = ["confirmed", "in_production", "shipped", "delivered"].includes(opts.status);
  const showPaymentBlock = opts.status !== "delivered" && opts.upfront != null && opts.remaining != null;
  const showItemsBlock = opts.status !== "delivered";
  const remainingNote = opts.status === "shipped" && opts.remaining != null
    ? `<tr><td style="padding:8px 32px 0;">
        <p style="margin:0;color:#1a1a1a;font-size:14px;line-height:1.6;font-family:Arial,sans-serif;background:#faf6ef;padding:14px 16px;border-radius:8px;">
          <strong>Remaining due on delivery (25%):</strong> EGP ${Number(opts.remaining).toLocaleString()}
        </p>
      </td></tr>`
    : "";

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

  const paymentBlock = showPaymentBlock
    ? `
        <tr><td style="padding:8px 32px 0;">
          <h3 style="margin:16px 0 4px;font-size:14px;color:#777;text-transform:uppercase;letter-spacing:1px;font-family:Arial,sans-serif;font-weight:600;">Payment summary</h3>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif;">
            <tr>
              <td style="padding:8px 0;color:#222;font-size:14px;">Paid upfront (75%)</td>
              <td style="padding:8px 0;color:#1a1a1a;font-size:14px;text-align:right;font-weight:600;">EGP ${Number(opts.upfront).toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#222;font-size:14px;border-bottom:1px solid #eee;">Due on delivery (25% + delivery fees)</td>
              <td style="padding:8px 0;color:#1a1a1a;font-size:14px;text-align:right;border-bottom:1px solid #eee;">EGP ${Number(opts.remaining).toLocaleString()}</td>
            </tr>
          </table>
        </td></tr>`
    : "";

  const whatsappBlock = showWhatsApp
    ? `
        <tr><td style="padding:16px 32px 0;" align="center">
          <a href="${WHATSAPP_URL}" style="display:inline-block;margin:8px 0 4px;background:#25D366;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:999px;font-family:Arial,sans-serif;font-size:14px;font-weight:600;">💬 Chat with us on WhatsApp</a>
        </td></tr>`
    : "";

  const descBlock = opts.productDescription
    ? `
        <tr><td style="padding:8px 32px 0;">
          <h3 style="margin:16px 0 4px;font-size:14px;color:#777;text-transform:uppercase;letter-spacing:1px;font-family:Arial,sans-serif;font-weight:600;">Your order</h3>
          <p style="margin:0 0 12px;color:#222;font-size:14px;line-height:1.6;font-family:Arial,sans-serif;white-space:pre-wrap;">${escapeHtml(opts.productDescription)}</p>
        </td></tr>`
    : "";

  const itemsSection = !showItemsBlock
    ? ""
    : opts.productDescription
    ? `
        <tr><td style="padding:8px 32px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif;">
            <tr>
              <td style="padding:14px 0 0;color:#1a1a1a;font-size:14px;font-weight:600;border-top:1px solid #eee;">Total</td>
              <td style="padding:14px 0 0;color:#1a1a1a;font-size:14px;font-weight:600;text-align:right;border-top:1px solid #eee;">EGP ${Number(opts.total).toLocaleString()}</td>
            </tr>
          </table>
        </td></tr>`
    : `
        <tr><td style="padding:8px 32px 0;">
          <h3 style="margin:16px 0 4px;font-size:14px;color:#777;text-transform:uppercase;letter-spacing:1px;font-family:Arial,sans-serif;font-weight:600;">Your items</h3>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif;">
            ${itemsRows}
            <tr>
              <td style="padding:14px 0 0;color:#1a1a1a;font-size:14px;font-weight:600;">Total</td>
              <td style="padding:14px 0 0;color:#1a1a1a;font-size:14px;font-weight:600;text-align:right;">EGP ${Number(opts.total).toLocaleString()}</td>
            </tr>
          </table>
        </td></tr>`;

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
          ${customBody
            ? `<p style="margin:8px 0 16px;color:#555;font-size:14px;line-height:1.6;font-family:Arial,sans-serif;">${escapeHtml(customBody)}</p>
          <p style="margin:0 0 16px;color:#777;font-size:13px;line-height:1.6;font-family:Arial,sans-serif;">Order reference: <strong>${escapeHtml(opts.orderNumber)}</strong></p>`
            : `<p style="margin:8px 0 16px;color:#555;font-size:14px;line-height:1.6;font-family:Arial,sans-serif;">
            We're writing to let you know your order <strong>${escapeHtml(opts.orderNumber)}</strong> is now
            <strong style="color:#1a1a1a;">${escapeHtml(statusLabel)}</strong>.
          </p>`}
        </td></tr>
        ${remainingNote}
        ${paymentBlock}
        ${descBlock}
        ${itemsSection}
        ${whatsappBlock}
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

    const { supabase, userId } = context;

    // Staff-only: only admin or carpenter may dispatch status notifications.
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["admin", "carpenter"]);
    if (!roles?.length) {
      throw new Response("Forbidden", { status: 403 });
    }

    const { data: order, error } = await supabase
      .from("orders")
      .select("id, order_number, customer_name, customer_email, status, total, upfront_amount, remaining_amount, is_manual_order, product_description, order_items(product_name, quantity, unit_price, size, finish)")
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
      upfront: order.upfront_amount != null ? Number(order.upfront_amount) : null,
      remaining: order.remaining_amount != null ? Number(order.remaining_amount) : null,
      isManualOrder: Boolean((order as any).is_manual_order),
      productDescription: (order as any).product_description ?? null,
    });

    const subject =
      STATUS_SUBJECTS[order.status] ??
      `Order ${order.order_number}: ${STATUS_LABELS[order.status] ?? order.status}`;

    const res = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: "Suzy Wood <orders@suzywoodofficial.com>",
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