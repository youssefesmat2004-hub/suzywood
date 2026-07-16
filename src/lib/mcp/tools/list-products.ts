import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function userClient(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "list_products",
  title: "List products",
  description: "List active products in the Suzy Wood catalog. Optionally filter by a search term against product name or slug.",
  inputSchema: {
    search: z.string().trim().optional().describe("Optional name/slug substring filter"),
    limit: z.number().int().min(1).max(50).optional().describe("Max rows (default 20)"),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ search, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    let q = userClient(ctx)
      .from("products")
      .select("id, name, slug, tagline, starting_price, lead_time_weeks, stock_quantity, is_featured")
      .eq("is_active", true)
      .order("is_featured", { ascending: false })
      .limit(limit ?? 20);
    if (search) q = q.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return { content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: { products: data ?? [] } };
  },
});