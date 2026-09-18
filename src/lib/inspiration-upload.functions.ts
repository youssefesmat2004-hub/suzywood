import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const MAX_BYTES = 5 * 1024 * 1024; // 5MB

const schema = z.object({
  filename: z.string().trim().min(1).max(200),
  mime: z.string().trim().min(1).max(120),
  // base64 (no data: prefix)
  base64: z.string().min(1).max(Math.ceil((MAX_BYTES * 4) / 3) + 1024),
});

/**
 * Public: lets guests attach an inspiration photo to a custom build request.
 * Storage policies only allow authenticated uploads, so guests go through this
 * validated server endpoint (type + size checked) instead of the browser client.
 */
export const uploadInspirationImage = createServerFn({ method: "POST" })
  .inputValidator((data) => schema.parse(data))
  .handler(async ({ data }) => {
    const mime = data.mime.toLowerCase();
    if (!mime.startsWith("image/")) {
      return { ok: false as const, error: "unsupported_file_type" };
    }

    let bytes: Uint8Array;
    try {
      const bin = atob(data.base64);
      bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    } catch {
      return { ok: false as const, error: "invalid_file" };
    }
    if (bytes.byteLength === 0 || bytes.byteLength > MAX_BYTES) {
      return { ok: false as const, error: "file_too_large" };
    }

    const ext = (data.filename.split(".").pop() ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const safeExt = ext && ext.length <= 5 ? ext : "jpg";
    const path = `guest/${crypto.randomUUID()}.${safeExt}`;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.storage
      .from("inspiration-images")
      .upload(path, bytes, { contentType: mime, upsert: false });
    if (error) return { ok: false as const, error: error.message };

    const url = supabaseAdmin.storage.from("inspiration-images").getPublicUrl(path).data.publicUrl;
    return { ok: true as const, url };
  });
