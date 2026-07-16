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
  name: "get_order",
  title: "Get order details",
  description: "Return full details (including line items) for one order by its order_number. RLS restricts to the order's owner or admin.",
  inputSchema: {
    order_number: z.string().trim().min(1).describe("Order number, e.g. SW-1024"),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ order_number }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const supabase = userClient(ctx);
    const { data: order, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("order_number", order_number)
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!order) return { content: [{ type: "text", text: "Order not found or not accessible" }], isError: true };
    return { content: [{ type: "text", text: JSON.stringify(order) }], structuredContent: { order } };
  },
});