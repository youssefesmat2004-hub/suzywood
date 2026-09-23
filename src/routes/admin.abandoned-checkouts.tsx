import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useIsAdmin } from "@/lib/admin";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listAbandonedCheckouts,
  sendAbandonedReminder,
  deleteAbandonedCheckout,
} from "@/lib/abandoned-checkouts.functions";
import { WhatsAppLink } from "@/lib/whatsapp";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Trash2, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/abandoned-checkouts")({
  head: () => ({ meta: [{ title: "Abandoned Checkouts — Suzy Wood Admin" }, { name: "robots", content: "noindex" }] }),
  component: AbandonedCheckoutsPage,
});

function AbandonedCheckoutsPage() {
  const { isAdmin, loading } = useIsAdmin();
  const queryClient = useQueryClient();
  const listFn = useServerFn(listAbandonedCheckouts);
  const remindFn = useServerFn(sendAbandonedReminder);
  const deleteFn = useServerFn(deleteAbandonedCheckout);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["abandoned-checkouts"],
    queryFn: () => listFn(),
    enabled: isAdmin,
  });

  const remind = useMutation({
    mutationFn: (id: string) => remindFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Reminder email sent");
      queryClient.invalidateQueries({ queryKey: ["abandoned-checkouts"] });
    },
    onError: (e: any) => toast.error("Couldn't send reminder", { description: e?.message }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Removed");
      queryClient.invalidateQueries({ queryKey: ["abandoned-checkouts"] });
    },
    onError: (e: any) => toast.error("Couldn't delete", { description: e?.message }),
  });

  if (loading || isLoading) {
    return (
      <AdminLayout>
        <div className="p-8 text-muted-foreground">Loading…</div>
      </AdminLayout>
    );
  }
  if (!isAdmin) {
    return (
      <AdminLayout>
        <div className="p-8 text-muted-foreground">Admins only.</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-2">
          <ShoppingCart className="h-6 w-6 text-primary" />
          <h1 className="font-serif text-3xl">Abandoned Checkouts</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Customers who entered their details at checkout but didn't finish their order. Send them a reminder by email or chat on WhatsApp.
        </p>

        {rows.length === 0 ? (
          <p className="text-muted-foreground">No abandoned checkouts — everyone finished their order. 🎉</p>
        ) : (
          <div className="space-y-4">
            {rows.map((r: any) => {
              const items = Array.isArray(r.items) ? r.items : [];
              const itemCount = items.reduce((n: number, it: any) => n + (Number(it.quantity) || 1), 0);
              return (
                <Card key={r.id}>
                  <CardContent className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{r.customer_name || "—"}</span>
                          <Badge variant={r.stage === "payment_failed" ? "destructive" : "secondary"}>
                            {r.stage === "payment_failed" ? "Payment failed" : "Left at payment step"}
                          </Badge>
                          {r.reminder_sent_at ? (
                            <Badge variant="outline">Reminded {new Date(r.reminder_sent_at).toLocaleDateString()}</Badge>
                          ) : null}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 break-all">{r.email}{r.phone ? ` · ${r.phone}` : ""}</p>
                        <ul className="text-sm mt-2 space-y-0.5">
                          {items.map((it: any, i: number) => (
                            <li key={i}>
                              {Number(it.quantity) || 1}× {it.name} — EGP {(Number(it.unitPrice) * (Number(it.quantity) || 1)).toLocaleString()}
                            </li>
                          ))}
                        </ul>
                        <p className="text-sm mt-2">
                          <span className="text-muted-foreground">{itemCount} item(s) · Cart total:</span>{" "}
                          <span className="font-medium">EGP {Number(r.cart_total).toLocaleString()}</span>
                          <span className="text-muted-foreground"> · {new Date(r.created_at).toLocaleString()}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <WhatsAppLink
                          phone={r.phone}
                          message={`Hi ${(r.customer_name || "").split(" ")[0] || "there"}! We noticed your checkout at Suzy Wood did not complete and your ${itemCount} item(s) were not processed. Did you run into any issue? We're happy to help.`}
                          label="Chat on WhatsApp"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => remind.mutate(r.id)}
                          disabled={remind.isPending}
                        >
                          <Mail className="h-4 w-4 mr-1" />
                          {r.reminder_sent_at ? "Resend reminder" : "Send reminder"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => remove.mutate(r.id)}
                          disabled={remove.isPending}
                          aria-label="Delete record"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
