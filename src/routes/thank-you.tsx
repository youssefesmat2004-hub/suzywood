import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { Layout } from "@/components/site/Layout";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

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
  return (
    <Layout>
      <section className="container mx-auto px-6 py-20 max-w-2xl text-center">
        <CheckCircle2 className="h-14 w-14 mx-auto text-primary" />
        <h1 className="font-serif text-4xl sm:text-5xl mt-6">Thank you for your order</h1>
        {order ? (
          <p className="mt-4 text-sm uppercase tracking-[0.2em] text-muted-foreground">
            Order ID: <span className="text-foreground font-medium">{order}</span>
          </p>
        ) : null}
        <p className="mt-6 text-muted-foreground leading-relaxed">
          Your order is being reviewed. You will receive a confirmation email
          once your payment is verified. We've also sent your order details to
          your inbox.
        </p>
        <div className="mt-10 flex gap-3 justify-center">
          <Button asChild><Link to="/shop">Continue shopping</Link></Button>
          <Button asChild variant="outline"><Link to="/account">My orders</Link></Button>
        </div>
      </section>
    </Layout>
  );
}