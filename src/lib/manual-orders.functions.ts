import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const STATUSES = ["pending_payment", "confirmed", "shipped", "delivered"] as const;
const DELIVERY_AREAS = [
  "maadi","zamalek","dokki","masr-al-gedida","nasr-city",
  "new-cairo","shorouk-madinty","obour","sheikh-zayed","other",
] as const;

const attachmentSchema = z.object({
  path: z.string().min(1).max(500),
  name: z.string().min(1).max(255),
  mime: z.string().max(120).optional().default(""),
  size: z.number().nonnegative().max(50_000_000).optional().default(0),
});

const schema = z.object({
  customer_name: z.string().trim().min(1).max(120),
  customer_email: z.string().trim().email().max(255),
  customer_phone: z.string().trim().min(4).max(40),
  shipping_address: z.string().trim().min(1).max(500),
  product_description: z.string().trim().min(1).max(2000),
  total: z.number().nonnegative().max(10_000_000),
  upfront_amount: z.number().nonnegative().max(10_000_000),
  remaining_amount: z.number().nonnegative().max(10_000_000),
  delivery_area: z.enum(DELIVERY_AREAS),
  delivery_cost: z.number().nonnegative().max(10_000_000),
  status: z.enum(STATUSES),
  attachments: z.array(attachmentSchema).max(30).optional().default([]),
});

export const createManualOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => schema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: isAdmin, error: roleErr } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (roleErr) throw new Error(roleErr.message);
    if (!isAdmin) throw new Response("Forbidden", { status: 403 });

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .insert({
        customer_name: data.customer_name,
        customer_email: data.customer_email,
        customer_phone: data.customer_phone,
        shipping_address: data.shipping_address,
        shipping_city: "",
        shipping_governorate: "",
        subtotal: data.total,
        shipping_fee: data.delivery_cost,
        delivery_area: data.delivery_area,
        delivery_cost: data.delivery_cost,
        total: data.total + data.delivery_cost,
        total_amount: data.total + data.delivery_cost,
        upfront_amount: data.upfront_amount,
        deposit_amount: data.upfront_amount,
        remaining_amount: data.remaining_amount,
        status: data.status,
        payment_method: "whatsapp",
        payment_status: data.status === "pending_payment" ? "pending" : "paid",
        is_manual_order: true,
        product_description: data.product_description,
        notes: "Manual WhatsApp order",
        attachments: data.attachments ?? [],
      } as never)
      .select("id, order_number")
      .single();

    if (error || !order) throw new Error(error?.message ?? "Failed to create order");

    const { error: itemErr } = await supabaseAdmin.from("order_items").insert({
      order_id: order.id,
      product_name: data.product_description.slice(0, 200),
      unit_price: data.total,
      quantity: 1,
      line_total: data.total,
      bed_rails: false,
      bed_rails_price: 0,
    } as never);
    if (itemErr) {
      console.error("Manual order item insert failed", itemErr);
    }

    return { ok: true, id: order.id, order_number: order.order_number };
  });

const updateSchema = z.object({
  id: z.string().uuid(),
  product_description: z.string().trim().min(1).max(2000),
  total: z.number().nonnegative().max(10_000_000),
  upfront_amount: z.number().nonnegative().max(10_000_000),
  remaining_amount: z.number().nonnegative().max(10_000_000),
  delivery_area: z.enum(DELIVERY_AREAS),
  delivery_cost: z.number().nonnegative().max(10_000_000),
  notes: z.string().max(2000).optional().default(""),
  attachments: z.array(attachmentSchema).max(30).optional().default([]),
  removed_paths: z.array(z.string().min(1).max(500)).max(50).optional().default([]),
});

export const updateManualOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => updateSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: isAdmin, error: roleErr } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (roleErr) throw new Error(roleErr.message);
    if (!isAdmin) throw new Response("Forbidden", { status: 403 });

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Ensure this is a manual order
    const { data: existing, error: exErr } = await supabaseAdmin
      .from("orders")
      .select("id, is_manual_order")
      .eq("id", data.id)
      .single();
    if (exErr || !existing) throw new Error(exErr?.message ?? "Order not found");
    if (!(existing as any).is_manual_order) throw new Response("Not a manual order", { status: 400 });

    const total = data.total + data.delivery_cost;

    const { error } = await supabaseAdmin
      .from("orders")
      .update({
        product_description: data.product_description,
        subtotal: data.total,
        shipping_fee: data.delivery_cost,
        delivery_area: data.delivery_area,
        delivery_cost: data.delivery_cost,
        total,
        total_amount: total,
        upfront_amount: data.upfront_amount,
        deposit_amount: data.upfront_amount,
        remaining_amount: data.remaining_amount,
        notes: data.notes,
        attachments: data.attachments ?? [],
        last_updated_at: new Date().toISOString(),
      } as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);

    // Best-effort cleanup of removed storage objects
    if (data.removed_paths.length) {
      await supabaseAdmin.storage
        .from("manual-order-attachments")
        .remove(data.removed_paths)
        .catch((e) => console.error("Failed to remove attachment files", e));
    }

    return { ok: true, id: data.id };
  });

export const signManualAttachmentUrls = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ paths: z.array(z.string().min(1).max(500)).max(50) }).parse(data)
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["admin", "carpenter"]);
    if (!roles?.length) throw new Response("Forbidden", { status: 403 });

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const out: Record<string, string> = {};
    for (const p of data.paths) {
      const { data: s } = await supabaseAdmin.storage
        .from("manual-order-attachments")
        .createSignedUrl(p, 60 * 30);
      if (s?.signedUrl) out[p] = s.signedUrl;
    }
    return { urls: out };
  });