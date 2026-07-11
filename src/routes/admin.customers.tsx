import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Search, MessageCircle, Mail } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { WhatsAppLink, firstName } from "@/lib/whatsapp";

export const Route = createFileRoute("/admin/customers")({
  head: () => ({ meta: [{ title: "Customers — Suzy Wood Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: AdminCustomers,
});

type OrderRow = {
  id: string;
  order_number: string;
  user_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  total: number;
  status: string;
  created_at: string;
};

type Customer = {
  key: string;
  name: string;
  email: string;
  phone: string;
  orderCount: number;
  totalSpent: number;
  lastOrder: string;
  hasAccount: boolean;
  orders: OrderRow[];
};

function AdminCustomers() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Customer | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("orders")
        .select("id,order_number,user_id,customer_name,customer_email,customer_phone,total,status,created_at")
        .order("created_at", { ascending: false });
      setOrders((data ?? []) as OrderRow[]);
      setLoading(false);
    })();
  }, []);

  const customers = useMemo<Customer[]>(() => {
    const map = new Map<string, Customer>();
    for (const o of orders) {
      const key = (o.customer_email || o.customer_phone || o.id).toLowerCase();
      const ex = map.get(key);
      if (ex) {
        ex.orderCount += 1;
        ex.totalSpent += Number(o.total);
        ex.orders.push(o);
        if (new Date(o.created_at) > new Date(ex.lastOrder)) ex.lastOrder = o.created_at;
        if (o.user_id) ex.hasAccount = true;
      } else {
        map.set(key, {
          key,
          name: o.customer_name,
          email: o.customer_email,
          phone: o.customer_phone,
          orderCount: 1,
          totalSpent: Number(o.total),
          lastOrder: o.created_at,
          hasAccount: !!o.user_id,
          orders: [o],
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [orders]);

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.phone.includes(q);
  });

  const exportCsv = () => {
    const rows = [
      ["Name", "Email", "Phone", "Orders", "Total Spent (EGP)", "Last Order", "Has Account"],
      ...filtered.map((c) => [c.name, c.email, c.phone, c.orderCount, c.totalSpent, c.lastOrder, c.hasAccount ? "Yes" : "No"]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `suzy-wood-customers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-serif text-3xl">Customers</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {customers.length} unique customers · EGP {customers.reduce((s, c) => s + c.totalSpent, 0).toLocaleString()} total
          </p>
        </div>
        <Button variant="outline" onClick={exportCsv} disabled={!customers.length}>
          <Download className="h-4 w-4 mr-2" /> Export CSV
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email, phone…" className="pl-9" />
      </div>

      <div className="rounded-xl border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead className="text-right">Orders</TableHead>
              <TableHead className="text-right">Total Spent</TableHead>
              <TableHead>Last Order</TableHead>
              <TableHead>Account</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}><TableCell colSpan={7}><Skeleton className="h-6 w-full" /></TableCell></TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-10">No customers yet</TableCell></TableRow>
            ) : filtered.map((c) => (
              <TableRow key={c.key} className="cursor-pointer" onClick={() => setSelected(c)}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell className="text-xs">
                  <div>{c.email}</div>
                  <div className="font-mono text-muted-foreground">{c.phone}</div>
                </TableCell>
                <TableCell className="text-right">{c.orderCount}</TableCell>
                <TableCell className="text-right font-medium">EGP {c.totalSpent.toLocaleString()}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{new Date(c.lastOrder).toLocaleDateString()}</TableCell>
                <TableCell>
                  {c.hasAccount ? <span className="text-xs text-emerald-600">Yes</span> : <span className="text-xs text-muted-foreground">Guest</span>}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex gap-1">
                    <WhatsAppLink
                      phone={c.phone}
                      message={`Hi ${firstName(c.name)}, this is Suzy Wood — just checking in.`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-emerald-700 hover:bg-emerald-50 transition-colors"
                    />
                    <Button size="sm" variant="ghost" asChild>
                      <a href={`mailto:${c.email}`}>
                        <Mail className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="font-serif text-2xl">{selected.name}</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-1 text-sm">
                <p>{selected.email}</p>
                <p className="font-mono text-muted-foreground">{selected.phone}</p>
                <p className="text-muted-foreground">
                  {selected.orderCount} orders · EGP {selected.totalSpent.toLocaleString()} total
                </p>
              </div>
              <h3 className="font-serif text-lg mt-6 mb-2">Order History</h3>
              <div className="space-y-2">
                {selected.orders.map((o) => (
                  <Link
                    key={o.id}
                    to="/admin/orders/$id"
                    params={{ id: o.id }}
                    className="block p-3 rounded border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm">{o.order_number}</span>
                      <span className="text-sm font-medium">EGP {Number(o.total).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                      <span className="capitalize">{o.status.replace(/_/g, " ")}</span>
                      <span>{new Date(o.created_at).toLocaleDateString()}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}