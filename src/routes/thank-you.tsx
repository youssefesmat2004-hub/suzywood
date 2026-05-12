import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Layout } from "@/components/site/Layout";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const searchSchema = z.object({
  order: z.string().optional(),
});

export const Route = createFileRoute("/thank-you")({
  head: () => ({ meta: [
    { title: "Thank you — Suzy Wood" },
    { name: "description", content: "Your Suzy Wood order has been received and is pending payment verification." },
  ] }),
  validateSearch: (s) => searchSchema.parse(s),
  component: ThankYou,
});

function ThankYou() {
  const { order } = Route.useSearch();
  const [data, setData] = useState<{
    upfront_amount: number | null;
    remaining_amount: number | null;
    total: number;
  } | null>(null);

  useEffect(() => {
    if (!order) return;
    supabase
      .from("orders")
      .select("upfront_amount, remaining_amount, total")
      .eq("order_number", order)
      .maybeSingle()
      .then(({ data }) => data && setData(data as any));
  }, [order]);

  return (
    <Layout>
      <section className="container mx-auto px-6 py-20 max-w-2xl text-center">
        <CheckCircle2 className="h-14 w-14 mx-auto text-primary" />
        <h1 className="font-serif text-4xl sm:text-5xl mt-6">Thank you! Your order is confirmed.</h1>
        {order ? (
          <p className="mt-4 text-sm uppercase tracking-[0.2em] text-muted-foreground">
            Order ID: <span className="text-foreground font-medium">{order}</span>
          </p>
        ) : null}
        {data && data.upfront_amount != null && data.remaining_amount != null ? (
          <div className="mt-8 mx-auto max-w-md text-left bg-muted/40 border border-border rounded-2xl p-6 space-y-3">
            <h2 className="font-serif text-xl text-center mb-2">Payment summary</h2>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Amount paid now (70%)</span>
              <span className="font-medium text-primary">EGP {Number(data.upfront_amount).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Due on delivery (30% + delivery fees)</span>
              <span className="font-medium">EGP {Number(data.remaining_amount).toLocaleString()}</span>
            </div>
          </div>
        ) : null}
        <p className="mt-6 text-muted-foreground leading-relaxed">
          Our team will contact you shortly to arrange delivery. Please have the
          remaining amount ready upon delivery. A confirmation email with your
          order details has been sent to your inbox.
        </p>
        <div className="mt-10 flex gap-3 justify-center">
          <Button asChild><Link to="/shop">Continue shopping</Link></Button>
          <Button asChild variant="outline"><Link to="/account">My orders</Link></Button>
        </div>
      </section>
    </Layout>
  );
}