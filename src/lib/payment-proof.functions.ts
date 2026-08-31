import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const MAX_BYTES = 10 * 1024 * 1024; // 10MB

const schema = z.object({
  filename: z.string().trim().min(1).max(200),
  mime: z.string().trim().min(1).max(120),
  // base64 (no data: prefix)
  base64: z.string().min(1).max(Math.ceil((MAX_BYTES * 4) / 3) + 1024),
});

/**
 * Public: lets guest shoppers upload a payment screenshot at checkout.
 * The bucket stays private — only admins can read it. This is the only
 * guest write path, and it validates type + size before storing.
 */
export const uploadPaymentProof = createServerFn({ method: "POST" })
  .inputValidator((data) => schema.parse(data))
  .handler(async ({ data }) => {
    const mime = data.mime.toLowerCase();
    if (!mime.startsWith("image/") && mime !== "application/pdf") {
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
    const safeExt = ext && ext.length <= 5 ? ext : mime === "application/pdf" ? "pdf" : "jpg";
    const path = `guest/${crypto.randomUUID()}.${safeExt}`;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.storage
      .from("payment-proofs")
      .upload(path, bytes, { contentType: mime, upsert: false });

    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const, path };
  });
