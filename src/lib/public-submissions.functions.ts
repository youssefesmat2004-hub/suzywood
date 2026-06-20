import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const bookingSchema = z.object({
  full_name: z.string().trim().min(1).max(100),
  phone: z.string().trim().regex(/^01[0-9]{9}$/),
  customer_email: z.string().trim().email().max(255).optional().nullable(),
  contact_method: z.enum(["whatsapp", "phone"]),
  preferred_day: z.enum(["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday"]),
  time_slot: z.enum(["morning", "afternoon", "evening"]),
  notes: z.string().max(2000).nullish(),
});

export const submitBooking = createServerFn({ method: "POST" })
  .inputValidator((data) => bookingSchema.parse(data))
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from("bookings")
      .insert([{
        full_name: data.full_name,
        phone: data.phone,
        customer_email: data.customer_email ?? null,
        contact_method: data.contact_method,
        preferred_day: data.preferred_day,
        time_slot: data.time_slot,
        notes: data.notes ?? null,
      }])
      .select("id")
      .single();
    if (error || !row) return { ok: false as const, error: error?.message ?? "insert_failed" };
    return { ok: true as const, id: row.id };
  });

const customBuildSchema = z.object({
  full_name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(5).max(30),
  room_type: z.enum(["nursery", "toddler", "playroom", "other"]),
  description: z.string().trim().min(10).max(2000),
  inspiration_image_url: z.string().url().max(1024).nullish(),
});

export const submitCustomBuildRequest = createServerFn({ method: "POST" })
  .inputValidator((data) => customBuildSchema.parse(data))
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from("custom_build_requests")
      .insert([{
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        room_type: data.room_type,
        description: data.description,
        inspiration_image_url: data.inspiration_image_url ?? null,
        // user_id is intentionally null for public submissions; never trust a
        // client-supplied user_id. Authenticated linking must be done via a
        // server middleware that derives the id from the session.
        user_id: null,
        status: "new",
      }] as never)
      .select("id")
      .single();
    if (error || !row) return { ok: false as const, error: error?.message ?? "insert_failed" };
    return { ok: true as const, id: row.id };
  });