import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const clean = (s: string) => s.trim().slice(0, 1000);

/** Website-experience review, submitted right after checkout from the thank-you page. */
export const submitExperienceReview = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        orderNumber: z.string().min(3).max(40),
        rating: z.number().int().min(1).max(5),
        comment: z.string().max(1000).optional(),
        name: z.string().max(80).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id, customer_name")
      .eq("order_number", data.orderNumber.trim())
      .maybeSingle();

    if (!order) return { ok: false as const, error: "Order not found" };

    const { data: existing } = await supabaseAdmin
      .from("order_reviews")
      .select("id")
      .eq("order_id", order.id)
      .eq("kind", "experience")
      .maybeSingle();
    if (existing) return { ok: false as const, error: "already_submitted" };

    const { error } = await supabaseAdmin.from("order_reviews").insert({
      order_id: order.id,
      kind: "experience",
      reviewer_name: (data.name?.trim() || order.customer_name || "Customer").slice(0, 80),
      experience_rating: data.rating,
      comment: data.comment ? clean(data.comment) : null,
      is_published: data.rating >= 4,
    } as never);

    if (error) {
      console.error("submitExperienceReview failed", error);
      return { ok: false as const, error: "Could not save review" };
    }
    return { ok: true as const, published: data.rating >= 4 };
  });

/** Validate a one-time review link coming from the delivered-order email. */
export const getReviewInvite = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ token: z.string().min(10).max(80) }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id, order_number, customer_name, order_items(product_id, product_name)")
      .eq("review_token", data.token)
      .maybeSingle();

    if (!order) return { ok: false as const, error: "invalid" };

    const { data: existing } = await supabaseAdmin
      .from("order_reviews")
      .select("id")
      .eq("order_id", order.id)
      .eq("kind", "delivery")
      .maybeSingle();

    const items = ((order as any).order_items ?? []) as Array<{ product_id: string | null; product_name: string }>;

    return {
      ok: true as const,
      alreadyReviewed: Boolean(existing),
      orderNumber: order.order_number,
      customerName: order.customer_name,
      items: items.map((i) => ({ productId: i.product_id, productName: i.product_name })),
    };
  });

/** Product-quality + service review, submitted through the one-time link. */
export const submitDeliveryReview = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        token: z.string().min(10).max(80),
        name: z.string().min(1).max(80),
        productRating: z.number().int().min(1).max(5),
        serviceRating: z.number().int().min(1).max(5),
        comment: z.string().max(1000).optional(),
        productId: z.string().uuid().nullable().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id, order_items(product_id)")
      .eq("review_token", data.token)
      .maybeSingle();

    if (!order) return { ok: false as const, error: "invalid" };

    const { data: existing } = await supabaseAdmin
      .from("order_reviews")
      .select("id")
      .eq("order_id", order.id)
      .eq("kind", "delivery")
      .maybeSingle();
    if (existing) return { ok: false as const, error: "already_submitted" };

    const orderProductIds = (((order as any).order_items ?? []) as Array<{ product_id: string | null }>)
      .map((i) => i.product_id)
      .filter(Boolean) as string[];
    const productId =
      data.productId && orderProductIds.includes(data.productId)
        ? data.productId
        : orderProductIds[0] ?? null;

    const avg = (data.productRating + data.serviceRating) / 2;

    const { error } = await supabaseAdmin.from("order_reviews").insert({
      order_id: order.id,
      product_id: productId,
      kind: "delivery",
      reviewer_name: data.name.trim().slice(0, 80),
      product_rating: data.productRating,
      service_rating: data.serviceRating,
      comment: data.comment ? clean(data.comment) : null,
      is_published: avg >= 4,
    } as never);

    if (error) {
      console.error("submitDeliveryReview failed", error);
      return { ok: false as const, error: "Could not save review" };
    }
    return { ok: true as const, published: avg >= 4 };
  });
