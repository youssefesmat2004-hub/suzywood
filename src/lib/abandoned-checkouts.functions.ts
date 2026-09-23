import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const itemSchema = z.object({
  name: z.string().trim().min(1).max(200),
  quantity: z.number().int().positive().max(100),
  unitPrice: z.number().nonnegative().max(10_000_000),
});

const saveSchema = z.object({
  name: z.string().trim().max(120).default(""),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(40).default(""),
  items: z.array(itemSchema).max(50),
  cartTotal: z.number().nonnegative().max(10_000_000),
  stage: z.enum(["checkout_started", "payment_failed"]),
});

/** Public: a shopper (or a failed submit) records an abandoned checkout. */
export const saveAbandonedCheckout = createServerFn({ method: "POST" })
  .inputValidator((data) => saveSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = data.email.toLowerCase();
    // One open record per email: update the latest, else insert.
    const { data: existing } = await supabaseAdmin
      .from("abandoned_checkouts")
      .select("id")
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const payload = {
      customer_name: data.name,
      email,
      phone: data.phone,
      items: data.items,
      cart_total: data.cartTotal,
      stage: data.stage,
      updated_at: new Date().toISOString(),
    };
    if (existing?.id) {
      await supabaseAdmin.from("abandoned_checkouts").update(payload).eq("id", existing.id);
    } else {
      await supabaseAdmin.from("abandoned_checkouts").insert(payload);
    }
    return { ok: true };
  });

/** Public: called after a successful order to clear any abandoned record. */
export const clearAbandonedCheckout = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        email: z.string().trim().email().max(255),
        phone: z.string().trim().min(4).max(40),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Require BOTH email and phone to match so nobody can wipe others' records.
    await supabaseAdmin
      .from("abandoned_checkouts")
      .delete()
      .eq("email", data.email.toLowerCase())
      .eq("phone", data.phone);
    return { ok: true };
  });

async function requireAdmin(supabase: any, userId: string) {
  const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!isAdmin) throw new Error("Forbidden");
}

export const listAbandonedCheckouts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await requireAdmin(supabase, userId);
    const { data, error } = await supabase
      .from("abandoned_checkouts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data;
  });

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export const sendAbandonedReminder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireAdmin(supabase, userId);

    const { data: row, error } = await supabase
      .from("abandoned_checkouts")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error || !row) throw new Error("Record not found");

    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!LOVABLE_API_KEY || !RESEND_API_KEY) throw new Error("Email not configured");

    const items = Array.isArray(row.items) ? (row.items as any[]) : [];
    const itemCount = items.reduce((n, it) => n + (Number(it.quantity) || 1), 0);
    const itemsRows = items
      .map(
        (it) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #eee;color:#222;font-size:14px;">${Number(it.quantity) || 1}× ${escapeHtml(String(it.name))}</td>
          <td style="padding:10px 0;border-bottom:1px solid #eee;color:#222;font-size:14px;text-align:right;white-space:nowrap;">EGP ${(Number(it.unitPrice) * (Number(it.quantity) || 1)).toLocaleString()}</td>
        </tr>`,
      )
      .join("");

    const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#f6f4ef;font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f4ef;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:560px;width:100%;">
        <tr><td style="padding:28px 32px 8px;">
          <h1 style="margin:0;font-size:22px;color:#1a1a1a;font-weight:normal;">Suzy Wood</h1>
        </td></tr>
        <tr><td style="padding:8px 32px 0;">
          <h2 style="margin:0 0 8px;font-size:20px;color:#1a1a1a;font-weight:normal;">Did something go wrong?</h2>
          <p style="margin:0 0 4px;color:#555;font-size:14px;font-family:Arial,sans-serif;">Hi ${escapeHtml(row.customer_name || "there")},</p>
          <p style="margin:8px 0 16px;color:#555;font-size:14px;line-height:1.6;font-family:Arial,sans-serif;">
            We noticed your recent checkout at Suzy Wood did not complete, and your ${itemCount} item(s) were not processed.
            Did you run into any issue? Just reply to this email or message us on WhatsApp and we'll be happy to help.
          </p>
        </td></tr>
        <tr><td style="padding:8px 32px 0;">
          <h3 style="margin:16px 0 4px;font-size:14px;color:#777;text-transform:uppercase;letter-spacing:1px;font-family:Arial,sans-serif;font-weight:600;">Your items</h3>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif;">
            ${itemsRows}
            <tr>
              <td style="padding:14px 0 0;color:#1a1a1a;font-size:14px;font-weight:600;">Cart total</td>
              <td style="padding:14px 0 0;color:#1a1a1a;font-size:14px;font-weight:600;text-align:right;">EGP ${Number(row.cart_total).toLocaleString()}</td>
            </tr>
          </table>
        </td></tr>
        <tr><td style="padding:24px 32px 32px;">
          <p style="margin:0 0 16px;font-family:Arial,sans-serif;">
            <a href="https://suzywoodofficial.com/shop" style="display:inline-block;background:#1a1a1a;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:14px;">Complete your order</a>
          </p>
          <p style="margin:16px 0 0;color:#555;font-size:14px;line-height:1.6;font-family:Arial,sans-serif;">
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
        to: [row.email],
        subject: "You left something behind — Suzy Wood",
        html,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("Abandoned reminder send failed", res.status, body);
      throw new Error(`Email failed [${res.status}]`);
    }

    await supabase
      .from("abandoned_checkouts")
      .update({ reminder_sent_at: new Date().toISOString() })
      .eq("id", data.id);
    return { ok: true };
  });

export const deleteAbandonedCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireAdmin(supabase, userId);
    const { error } = await supabase.from("abandoned_checkouts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
