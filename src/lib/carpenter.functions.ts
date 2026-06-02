import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const verifyCarpenterPin = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ pin: z.string().min(1).max(20) }).parse(input))
  .handler(async ({ data }) => {
    const expectedPin = process.env.CARPENTER_PIN;
    const email = process.env.CARPENTER_EMAIL;
    const password = process.env.CARPENTER_PASSWORD;

    if (!expectedPin || !email || !password) {
      throw new Error("Carpenter credentials are not configured");
    }

    if (data.pin !== expectedPin) {
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

    return { ok: true as const, email, password };
  });