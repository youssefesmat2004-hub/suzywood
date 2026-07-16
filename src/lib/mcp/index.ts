import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listProducts from "./tools/list-products";
import listMyOrders from "./tools/list-my-orders";
import getOrder from "./tools/get-order";
import sendContactMessage from "./tools/send-contact-message";

// Direct Supabase issuer — the `.lovable.cloud` proxy is rejected by mcp-js.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "suzywood-mcp",
  title: "Suzy Wood",
  version: "0.1.0",
  instructions:
    "Tools for Suzy Wood (handcrafted nursery furniture). Browse the product catalog with `list_products`, review your own orders with `list_my_orders` / `get_order`, and reach the team with `send_contact_message`. All tools act as the signed-in user; admins see broader data through the app's row-level policies.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listProducts, listMyOrders, getOrder, sendContactMessage],
});