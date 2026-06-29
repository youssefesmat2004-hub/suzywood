import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/carpenter-payments")({
  head: () => ({
    meta: [
      { title: "Carpenter Payments — Suzy Wood Admin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: CarpenterPaymentsPage,
});

type Row = {
  id: string;
  order_number: string;
  assigned_carpenter: number | null;
  total: number;
  actual_carpenter_cost: number | null;
  carpenter_cost_override: number | null;
  carpenter_payment_status: string | null;
  carpenter_paid_at: string | null;
  status: string;
  created_at: string;
  product_name: string;
};

const CARPENTER_LABELS: Record<string, string> = {
  "1": "Carpenter 1 — النجار الأول",
  "2": "Carpenter 2 — النجار الثاني",
  "3": "Carpenter 3 — النجار الثالث",
  unassigned: "Unassigned",
};

function CarpenterPaymentsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [busyBulk, setBusyBulk] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data: orders, error } = await supabase
      .from("orders")
      .select(
        "id, order_number, assigned_carpenter, total, actual_carpenter_cost, carpenter_cost_override, carpenter_payment_status, carpenter_paid_at, status, created_at"
      )
      .neq("status", "cancelled")
      .order("created_at", { ascending: false });
    if (error) { toast.error(error.message); setLoading(false); return; }
    const ids = (orders ?? []).map((o: any) => o.id);
    const itemMap = new Map<string, string>();
    if (ids.length) {
      const { data: items } = await supabase
        .from("order_items")
        .select("order_id, product_name")
        .in("order_id", ids);
      for (const it of items ?? []) {
        if (!itemMap.has((it as any).order_id)) {
          itemMap.set((it as any).order_id, (it as any).product_name);
        }
      }
    }
    setRows((orders ?? []).map((o: any) => ({
      ...o,
      product_name: itemMap.get(o.id) ?? "—",
    })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, Row[]>();
    for (const r of rows) {
      const k = r.assigned_carpenter == null ? "unassigned" : String(r.assigned_carpenter);
      const arr = map.get(k) ?? [];
      arr.push(r);
      map.set(k, arr);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [rows]);

  const totalOwedAll = rows
    .filter((r) => r.carpenter_payment_status !== "paid")
    .reduce((s, r) => s + Number(r.carpenter_cost_override ?? r.actual_carpenter_cost ?? 0), 0);
  const totalPaidAll = rows
    .filter((r) => r.carpenter_payment_status === "paid")
    .reduce((s, r) => s + Number(r.carpenter_cost_override ?? r.actual_carpenter_cost ?? 0), 0);

  const markPaid = async (id: string, paid: boolean) => {
    setBusyId(id);
    const now = paid ? new Date().toISOString() : null;
    const { error } = await supabase
      .from("orders")
      .update({
        carpenter_payment_status: paid ? "paid" : "unpaid",
        carpenter_paid_at: now,
      } as never)
      .eq("id", id);
    setBusyId(null);
    if (error) { toast.error(error.message); return; }
    setRows((prev) => prev.map((r) => r.id === id
      ? { ...r, carpenter_payment_status: paid ? "paid" : "unpaid", carpenter_paid_at: now }
      : r));
    toast.success(paid ? "Marked as paid" : "Marked unpaid");
  };

  const markAllPaidFor = async (key: string, list: Row[]) => {
    const unpaid = list.filter((r) => r.carpenter_payment_status !== "paid");
    if (unpaid.length === 0) return;
    if (!confirm(`Mark ${unpaid.length} order(s) as paid for ${CARPENTER_LABELS[key]}?`)) return;
    setBusyBulk(key);
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("orders")
      .update({ carpenter_payment_status: "paid", carpenter_paid_at: now } as never)
      .in("id", unpaid.map((r) => r.id));
    setBusyBulk(null);
    if (error) { toast.error(error.message); return; }
    setRows((prev) => prev.map((r) =>
      unpaid.some((u) => u.id === r.id)
        ? { ...r, carpenter_payment_status: "paid", carpenter_paid_at: now }
        : r));
    toast.success(`Marked ${unpaid.length} order(s) paid`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl">Carpenter Payments</h1>
        <p className="text-sm text-muted-foreground mt-1">Track what you owe each carpenter and what you've already paid.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi label="Total owed (unpaid)" value={`EGP ${Math.round(totalOwedAll).toLocaleString()}`} tone="amber" />
        <Kpi label="Total paid" value={`EGP ${Math.round(totalPaidAll).toLocaleString()}`} tone="emerald" />
        <Kpi label="Grand total carpenter cost" value={`EGP ${Math.round(totalOwedAll + totalPaidAll).toLocaleString()}`} tone="neutral" />
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : grouped.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">No orders yet.</p>
      ) : (
        grouped.map(([key, list]) => {
          const owed = list
            .filter((r) => r.carpenter_payment_status !== "paid")
            .reduce((s, r) => s + Number(r.carpenter_cost_override ?? r.actual_carpenter_cost ?? 0), 0);
          const paid = list
            .filter((r) => r.carpenter_payment_status === "paid")
            .reduce((s, r) => s + Number(r.carpenter_cost_override ?? r.actual_carpenter_cost ?? 0), 0);
          return (
            <section key={key} className="bg-background border rounded-xl overflow-hidden">
              <header className="flex items-center justify-between gap-3 flex-wrap px-5 py-3 border-b bg-muted/30">
                <div>
                  <h2 className="font-serif text-lg">{CARPENTER_LABELS[key] ?? key}</h2>
                  <p className="text-xs text-muted-foreground">
                    Owed <strong className="text-amber-700">EGP {Math.round(owed).toLocaleString()}</strong> · Paid <strong className="text-emerald-700">EGP {Math.round(paid).toLocaleString()}</strong> · {list.length} order(s)
                  </p>
                </div>
                {owed > 0 && (
                  <button
                    type="button"
                    disabled={busyBulk === key}
                    onClick={() => markAllPaidFor(key, list)}
                    className="text-sm rounded-md bg-emerald-600 text-white px-3 py-1.5 hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {busyBulk === key ? "…" : "Mark all paid"}
                  </button>
                )}
              </header>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                    <tr className="text-left">
                      <th className="px-4 py-2">Order</th>
                      <th className="px-4 py-2">Product</th>
                      <th className="px-4 py-2 text-right">Selling</th>
                      <th className="px-4 py-2 text-right">Carpenter cost</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {list.map((r) => {
                      const cc = Number(r.carpenter_cost_override ?? r.actual_carpenter_cost ?? 0);
                      const isPaid = r.carpenter_payment_status === "paid";
                      return (
                        <tr key={r.id}>
                          <td className="px-4 py-2">
                            <Link to="/admin/orders/$id" params={{ id: r.id }} className="text-primary underline">
                              {r.order_number}
                            </Link>
                            <div className="text-[11px] text-muted-foreground">{new Date(r.created_at).toLocaleDateString("en-GB")}</div>
                          </td>
                          <td className="px-4 py-2">{r.product_name}</td>
                          <td className="px-4 py-2 text-right">EGP {Number(r.total).toLocaleString()}</td>
                          <td className="px-4 py-2 text-right text-amber-700 font-medium">EGP {cc.toLocaleString()}</td>
                          <td className="px-4 py-2">
                            {isPaid ? (
                              <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-2 py-0.5">
                                ✓ Paid{r.carpenter_paid_at && <> · {new Date(r.carpenter_paid_at).toLocaleDateString("en-GB")}</>}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-md px-2 py-0.5">Unpaid</span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-right">
                            <button
                              type="button"
                              disabled={busyId === r.id}
                              onClick={() => markPaid(r.id, !isPaid)}
                              className={`text-xs rounded-md px-2.5 py-1 font-medium disabled:opacity-60 ${isPaid ? "border border-rose-300 text-rose-700 hover:bg-rose-50" : "bg-emerald-600 text-white hover:bg-emerald-700"}`}
                            >
                              {busyId === r.id ? "…" : isPaid ? "Mark unpaid" : "Mark paid"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: string; tone: "amber" | "emerald" | "neutral" }) {
  const cls =
    tone === "amber" ? "border-amber-200 bg-amber-50/40 text-amber-900"
    : tone === "emerald" ? "border-emerald-200 bg-emerald-50/40 text-emerald-900"
    : "";
  return (
    <div className={`bg-background border rounded-xl p-5 ${cls}`}>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="font-serif text-2xl mt-1">{value}</p>
    </div>
  );
}