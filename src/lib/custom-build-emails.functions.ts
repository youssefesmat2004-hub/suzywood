import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ROOM_LABELS: Record<string, string> = {
  nursery: "Nursery",
  toddler: "Toddler Room",
  playroom: "Playroom",
  other: "Other",
};

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const WHATSAPP_NUMBER = "201096313532";

function renderAccepted(opts: {
  customerName: string;
  roomType: string;
  description: string;
  inspirationUrl: string | null;
}) {
  const waLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Hi Suzy Wood, I just got my custom build acceptance email — excited to chat about my ${opts.roomType} build.`,
  )}`;
  const roomLabel = ROOM_LABELS[opts.roomType] ?? opts.roomType;
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
          <h2 style="margin:16px 0 8px;font-size:20px;color:#1a1a1a;">Your custom build is accepted 🪵</h2>
          <p style="margin:0;color:#444;font-size:15px;line-height:1.6;font-family:Arial,sans-serif;">
            Hi ${escapeHtml(opts.customerName)},
          </p>
          <p style="margin:12px 0 0;color:#444;font-size:15px;line-height:1.6;font-family:Arial,sans-serif;">
            Wonderful news — we'd love to bring your custom piece to life. Our team will reach out within
            <strong>24 hours</strong> to walk through the details, finalise dimensions, and confirm pricing.
          </p>
        </td></tr>
        <tr><td style="padding:16px 32px 0;">
          <h3 style="margin:16px 0 8px;font-size:13px;color:#777;text-transform:uppercase;letter-spacing:1px;font-family:Arial,sans-serif;font-weight:600;">Your request</h3>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9f6f1;border-radius:6px;padding:16px;font-family:Arial,sans-serif;">
            <tr><td style="padding:4px 12px;color:#444;font-size:14px;"><strong>Room:</strong> ${escapeHtml(roomLabel)}</td></tr>
            <tr><td style="padding:8px 12px 12px;color:#444;font-size:14px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(opts.description)}</td></tr>
            ${opts.inspirationUrl ? `<tr><td style="padding:0 12px 12px;"><img src="${opts.inspirationUrl}" alt="Your inspiration" style="max-width:100%;border-radius:4px;border:1px solid #eee;"/></td></tr>` : ""}
          </table>
        </td></tr>
        <tr><td style="padding:24px 32px 8px;text-align:center;">
          <a href="${waLink}" style="display:inline-block;background:#25D366;color:#fff;text-decoration:none;padding:14px 28px;border-radius:6px;font-family:Arial,sans-serif;font-size:15px;font-weight:600;">
            Chat with us on WhatsApp
          </a>
        </td></tr>
        <tr><td style="padding:8px 32px 32px;">
          <p style="margin:16px 0 0;color:#555;font-size:14px;line-height:1.6;font-family:Arial,sans-serif;">
            Thank you for trusting us with something so personal — we can't wait to craft it for you.
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

function renderRejected(opts: { customerName: string; roomType: string }) {
  const roomLabel = ROOM_LABELS[opts.roomType] ?? opts.roomType;
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
          <h2 style="margin:16px 0 8px;font-size:20px;color:#1a1a1a;">A note about your custom request</h2>
          <p style="margin:0;color:#444;font-size:15px;line-height:1.6;font-family:Arial,sans-serif;">
            Hi ${escapeHtml(opts.customerName)},
          </p>
          <p style="margin:12px 0 0;color:#444;font-size:15px;line-height:1.6;font-family:Arial,sans-serif;">
            Thank you so much for sharing your ${escapeHtml(roomLabel.toLowerCase())} idea with us. After reviewing it carefully, we're sorry to say we
            aren't able to take on this particular custom build at the moment.
          </p>
          <p style="margin:12px 0 0;color:#444;font-size:15px;line-height:1.6;font-family:Arial,sans-serif;">
            We'd love for you to browse our ready-made collection — many of our standard pieces can be lightly personalised, and we'd be honoured to be part of your space in another way.
          </p>
        </td></tr>
        <tr><td style="padding:24px 32px 8px;text-align:center;">
          <a href="https://www.suzywoodofficial.com/shop" style="display:inline-block;background:#1a1a1a;color:#fff;text-decoration:none;padding:14px 28px;border-radius:6px;font-family:Arial,sans-serif;font-size:15px;font-weight:600;">
            Browse our collection
          </a>
        </td></tr>
        <tr><td style="padding:8px 32px 32px;">
          <p style="margin:16px 0 0;color:#555;font-size:14px;line-height:1.6;font-family:Arial,sans-serif;">
            Thank you for thinking of Suzy Wood — we truly appreciate it.
          </p>
          <p style="margin:16px 0 0;color:#888;font-size:12px;font-family:Arial,sans-serif;">
            With warmth,<br/>The Suzy Wood team
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export const sendCustomBuildStatusEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        requestId: z.string().uuid(),
        kind: z.enum(["accepted", "rejected"]),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");

    const { supabase, userId } = context;

    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Response("Forbidden", { status: 403 });

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: row, error } = await supabaseAdmin
      .from("custom_build_requests")
      .select("id, full_name, email, room_type, description, inspiration_image_url, accepted_email_sent_at, rejected_email_sent_at")
      .eq("id", data.requestId)
      .single();

    if (error || !row) return { ok: false, error: "Request not found" };

    const alreadySent =
      data.kind === "accepted" ? row.accepted_email_sent_at : row.rejected_email_sent_at;
    if (alreadySent) return { ok: true, skipped: true };

    const html =
      data.kind === "accepted"
        ? renderAccepted({
            customerName: row.full_name,
            roomType: row.room_type,
            description: row.description,
            inspirationUrl: row.inspiration_image_url,
          })
        : renderRejected({ customerName: row.full_name, roomType: row.room_type });

    const subject =
      data.kind === "accepted"
        ? "Your Custom Build Request is Accepted! 🪵 - Suzy Wood"
        : "An update on your custom build request — Suzy Wood";

    const res = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: "Suzy Wood <orders@suzywoodofficial.com>",
        to: [row.email],
        subject,
        html,
      }),
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("Resend send failed", res.status, body);
      return { ok: false, error: `Resend error ${res.status}` };
    }

    const nowIso = new Date().toISOString();
    const update =
      data.kind === "accepted"
        ? { accepted_email_sent_at: nowIso }
        : { rejected_email_sent_at: nowIso };
    await supabaseAdmin
      .from("custom_build_requests")
      .update(update)
      .eq("id", data.requestId);

    return { ok: true };
  });