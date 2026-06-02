import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { timingSafeEqual } from "node:crypto";

export const verifyCarpenterPin = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        pin: z.string().min(1).max(20),
        carpenterId: z.union([z.literal(1), z.literal(2), z.literal(3)]),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const pinEnvName = `CARPENTER_PIN_${data.carpenterId}` as const;
    const expectedPin = process.env[pinEnvName];
    const email = process.env.CARPENTER_EMAIL;
    const password = process.env.CARPENTER_PASSWORD;

    if (!expectedPin || !email || !password) {
      throw new Error("Carpenter credentials are not configured");
    }

    const a = Buffer.from(data.pin);
    const b = Buffer.from(expectedPin);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      await new Promise((r) => setTimeout(r, 200));
      return { ok: false as const };
    }

    // Ensure the shared workshop user exists in Supabase Auth and has the
    // `carpenter` role. Safe to call repeatedly — idempotent.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Look up the user by email. If missing, create it (email-confirmed).
    let userId: string | null = null;
    const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (listErr) throw new Error(listErr.message);
    const existing = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (existing) {
      userId = existing.id;
    } else {
      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: "Workshop" },
      });
      if (createErr || !created.user) {
        throw new Error(createErr?.message ?? "Failed to provision carpenter user");
      }
      userId = created.user.id;
    }

    // Ensure carpenter role row exists.
    const { data: existingRole } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", "carpenter")
      .maybeSingle();
    if (!existingRole) {
      const { error: roleErr } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: userId, role: "carpenter" });
      if (roleErr) throw new Error(roleErr.message);
    }

    // Sign in server-side using the publishable client so we can return
    // only a session (never the raw password) to the browser.
    const { createClient } = await import("@supabase/supabase-js");
    const SUPABASE_URL = process.env.SUPABASE_URL!;
    const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY!;
    const authClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    });
    const { data: signIn, error: signErr } = await authClient.auth.signInWithPassword({
      email,
      password,
    });
    if (signErr || !signIn.session) {
      throw new Error(signErr?.message ?? "Failed to create carpenter session");
    }

    return {
      ok: true as const,
      accessToken: signIn.session.access_token,
      refreshToken: signIn.session.refresh_token,
    };
  });