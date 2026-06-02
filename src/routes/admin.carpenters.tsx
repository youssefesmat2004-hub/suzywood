import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Hammer, Loader2 } from "lucide-react";
import { CARPENTER_NAMES, type CarpenterId } from "@/components/carpenter/CarpenterDashboard";

export const Route = createFileRoute("/admin/carpenters")({
  component: CarpentersOverviewPage,
});

type Row = { id: string; status: string; assigned_carpenter: number | null };

type Stats = {
  total: number;
  pending: number;
  inProgress: number;
  finished: number;
};

const EMPTY: Stats = { total: 0, pending: 0, inProgress: 0, finished: 0 };

const DASHBOARD_PATHS: Record<CarpenterId, "/carpenter-dashboard-1" | "/carpenter-dashboard-2" | "/carpenter-dashboard-3"> = {
  1: "/carpenter-dashboard-1",
  2: "/carpenter-dashboard-2",
  3: "/carpenter-dashboard-3",
};

function CarpentersOverviewPage() {
  const [stats, setStats] = useState<Record<number, Stats>>({ 1: EMPTY, 2: EMPTY, 3: EMPTY });
  const [unassigned, setUnassigned] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, status, assigned_carpenter")
        .in("status", ["confirmed", "in_production", "delivered"]);
      if (error) {
        setLoading(false);
        return;
      }
      const next: Record<number, Stats> = { 1: { ...EMPTY }, 2: { ...EMPTY }, 3: { ...EMPTY } };
      let unassignedCount = 0;
      for (const r of (data ?? []) as Row[]) {
        if (r.assigned_carpenter == null) {
          if (r.status !== "delivered") unassignedCount++;
          continue;
        }
        const s = next[r.assigned_carpenter];
        if (!s) continue;
        if (r.status === "delivered") s.finished++;
        else {
          s.total++;
          if (r.status === "in_production") s.inProgress++;
          else if (r.status === "confirmed") s.pending++;
        }
      }
      setStats(next);
      setUnassigned(unassignedCount);
      setLoading(false);
    };
    void load();

    const ch = supabase
      .channel("admin-carpenters-overview")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="font-serif text-3xl">Carpenters</h1>
          <p className="text-sm text-muted-foreground mt-1">Workshop assignments and progress across the team.</p>
        </div>
        <Link
          to="/admin/orders"
          className="text-sm rounded-md border px-3 py-1.5 hover:bg-muted"
        >
          Manage orders
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading…
        </div>
      ) : (
        <>
          {unassigned > 0 && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-center justify-between">
              <div className="text-sm text-amber-900">
                <span className="font-semibold">{unassigned}</span> open order{unassigned === 1 ? "" : "s"} not assigned to any carpenter.
              </div>
              <Link to="/admin/orders" className="text-sm font-medium text-amber-900 underline">
                Assign now
              </Link>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {([1, 2, 3] as CarpenterId[]).map((id) => {
              const s = stats[id] ?? EMPTY;
              return (
                <div key={id} className="bg-background border rounded-xl p-5">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Hammer className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs text-muted-foreground">Carpenter {id}</div>
                        <div className="font-semibold truncate" dir="rtl">{CARPENTER_NAMES[id]}</div>
                      </div>
                    </div>
                  </div>

                  <dl className="grid grid-cols-3 gap-2 text-center">
                    <Stat label="Current" value={s.total} tone="default" />
                    <Stat label="In progress" value={s.inProgress} tone="indigo" />
                    <Stat label="Finished" value={s.finished} tone="emerald" />
                  </dl>

                  <div className="mt-3 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{s.pending}</span> pending start
                  </div>

                  <a
                    href={DASHBOARD_PATHS[id]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex w-full items-center justify-center rounded-lg border px-3 py-2 text-sm hover:bg-muted"
                  >
                    Open dashboard
                  </a>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: "default" | "indigo" | "emerald" }) {
  const toneClass =
    tone === "indigo"
      ? "bg-indigo-50 text-indigo-700"
      : tone === "emerald"
      ? "bg-emerald-50 text-emerald-700"
      : "bg-muted text-foreground";
  return (
    <div className={`rounded-lg ${toneClass} py-2`}>
      <div className="text-xl font-semibold leading-none">{value}</div>
      <div className="text-[11px] mt-1 opacity-80">{label}</div>
    </div>
  );
}