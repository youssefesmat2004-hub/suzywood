import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Public: returns the VAPID public key so the browser can subscribe.
export const getWebPushPublicKey = createServerFn({ method: "GET" })
  .handler(async () => {
    const { getVapidKeys } = await import("@/lib/web-push.server");
    const k = await getVapidKeys();
    return { publicKey: k.publicKey };
  });

const subSchema = z.object({
  endpoint: z.string().url().max(2048),
  p256dh: z.string().min(1).max(255),
  auth: z.string().min(1).max(255),
  user_agent: z.string().max(512).optional().nullable(),
});

// Auth required. Only admin users may register a subscription for push.
export const savePushSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => subSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Response("Forbidden", { status: 403 });

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("push_subscriptions")
      .upsert(
        {
          user_id: userId,
          endpoint: data.endpoint,
          p256dh: data.p256dh,
          auth: data.auth,
          user_agent: data.user_agent ?? null,
          last_used_at: new Date().toISOString(),
        } as never,
        { onConflict: "endpoint" },
      );
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  });

export const removePushSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ endpoint: z.string().url() }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("push_subscriptions")
      .delete()
      .eq("user_id", context.userId)
      .eq("endpoint", data.endpoint);
    return { ok: true };
  });