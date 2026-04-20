import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layout } from "@/components/site/Layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

type Order = {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
};

export const Route = createFileRoute("/account")({
  head: () => ({ meta: [{ title: "My Account — Suzy Wood" }] }),
  component: Account,
});

function Account() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase.from("orders").select("id, order_number, status, total, created_at").eq("user_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => setOrders((data ?? []) as Order[]));
  }, [user]);

  if (!user) return null;

  return (
    <Layout>
      <section className="container mx-auto px-6 lg:px-10 py-16 max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-4xl">My Account</h1>
            <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
          </div>
          <Button variant="outline" onClick={async () => { await signOut(); navigate({ to: "/" }); }}>Sign out</Button>
        </div>

        <div className="flex gap-3 mb-10">
          <Button asChild variant="outline"><Link to="/wishlist">My Wishlist</Link></Button>
        </div>

        <h2 className="font-serif text-2xl mb-4">Order history</h2>
        {orders.length === 0 ? (
          <div className="border border-border rounded-2xl p-8 text-center text-muted-foreground">
            No orders yet. <Link to="/shop" className="text-primary border-b border-primary">Browse the collection</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => (
              <div key={o.id} className="border border-border rounded-2xl p-5 flex items-center justify-between bg-card">
                <div>
                  <p className="font-mono text-sm">{o.order_number}</p>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(o.created_at).toLocaleDateString()} · {o.status.replace(/_/g, " ")}</p>
                </div>
                <p className="font-serif text-lg text-primary">EGP {Number(o.total).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
}
