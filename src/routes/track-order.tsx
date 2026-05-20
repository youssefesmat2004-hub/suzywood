import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/site/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Package, Check, Truck, Hammer, CreditCard, Home, Clock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/track-order")({
  head: () => ({
    meta: [
      { title: "Track Your Order — Suzy Wood" },
      { name: "description", content: "Check the status of your Suzy Wood order using your order number and phone." },
      { property: "og:title", content: "Track Your Order — Suzy Wood" },
      { property: "og:description", content: "Check the status of your Suzy Wood order." },
    ],
  }),
  component: TrackOrderPage,
});

type OrderRow = {
  id: string;
  order_number: string;
  status: string;
  customer_name: string;
  customer_phone: string;
  total: number;
  subtotal: number;
  shipping_fee: number;
  upfront_amount: number | null;
  remaining_amount: number | null;
  shipping_city: string;
  shipping_governorate: string;
  created_at: string;
};

const STAGES = [
  { key: "pending_payment", label: "Pending Payment", icon: CreditCard },
  { key: "confirmed", label: "Confirmed", icon: Check },
  { key: "in_production", label: "In Production", icon: Hammer },
  { key: "ready", label: "Ready", icon: Package },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: Home },
];

function normalizePhone(p: string) {
  return p.replace(/[^\d]/g, "").replace(/^20/, "").replace(/^0+/, "");
}

function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<OrderRow | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("id,order_number,status,customer_name,customer_phone,total,subtotal,shipping_fee,upfront_amount,remaining_amount,shipping_city,shipping_governorate,created_at")
      .eq("order_number", orderNumber.trim())
      .maybeSingle();
    setLoading(false);
    if (error || !data) {
      toast.error("Order not found", { description: "Check your order number and try again." });
      setOrder(null);
      return;
    }
    if (normalizePhone(data.customer_phone) !== normalizePhone(phone)) {
      toast.error("Phone doesn't match this order");
      setOrder(null);
      return;
    }
    setOrder(data as OrderRow);
  };

  const currentIdx = order ? Math.max(0, STAGES.findIndex((s) => s.key === order.status)) : -1;

  return (
    <Layout>
      <section className="container mx-auto px-6 py-16 lg:py-24 max-w-3xl">
        <div className="text-center mb-10">
          <h1 className="font-serif text-4xl lg:text-5xl mb-3">Track Your Order</h1>
          <p className="text-muted-foreground">Enter your order number and phone to see live status.</p>
        </div>

        <form onSubmit={onSubmit} className="rounded-3xl border border-border bg-card p-6 sm:p-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="order_number">Order Number</Label>
            <Input id="order_number" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder="SW-260520-1234" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01012345678" required />
          </div>
          <Button type="submit" size="lg" className="w-full h-12" disabled={loading}>
            {loading ? "Looking up…" : "Track Order"}
          </Button>
        </form>

        {order && (
          <div className="mt-10 rounded-3xl border border-border bg-card p-6 sm:p-8 space-y-6">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Order</p>
                <p className="font-serif text-2xl">{order.order_number}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Placed {new Date(order.created_at).toLocaleDateString()} · {order.shipping_city}, {order.shipping_governorate}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Total</p>
                <p className="font-serif text-2xl text-primary">EGP {Number(order.total).toLocaleString()}</p>
              </div>
            </div>

            <ol className="space-y-3">
              {STAGES.map((s, i) => {
                const Icon = s.icon;
                const done = i <= currentIdx;
                const active = i === currentIdx;
                return (
                  <li key={s.key} className={`flex items-center gap-4 rounded-xl border p-4 transition-colors ${done ? "border-primary/40 bg-primary/5" : "border-border bg-muted/30"}`}>
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center ${done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className={`font-medium ${active ? "text-primary" : ""}`}>{s.label}</div>
                      {active && <div className="text-xs text-muted-foreground">Current status</div>}
                    </div>
                    {done && !active && <Check className="h-4 w-4 text-primary" />}
                    {active && <Clock className="h-4 w-4 text-primary animate-pulse" />}
                  </li>
                );
              })}
            </ol>

            <p className="text-xs text-muted-foreground text-center">
              Questions? <a className="underline" href="https://wa.me/201096313532">Message us on WhatsApp</a>.
            </p>
          </div>
        )}
      </section>
    </Layout>
  );
}