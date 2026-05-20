import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export const Route = createFileRoute("/admin/newsletter")({
  component: NewsletterAdmin,
});

type Sub = { id: string; email: string; full_name: string | null; created_at: string; unsubscribed_at: string | null };

function NewsletterAdmin() {
  const [list, setList] = useState<Sub[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("newsletter_subscribers").select("*").order("created_at", { ascending: false });
      setList((data ?? []) as Sub[]);
      setLoading(false);
    })();
  }, []);

  const exportCsv = () => {
    const rows = [["email", "name", "subscribed_at", "unsubscribed_at"], ...list.map((s) => [s.email, s.full_name ?? "", s.created_at, s.unsubscribed_at ?? ""])];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `newsletter-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-8 flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-3xl mb-2">Newsletter Subscribers</h1>
          <p className="text-sm text-muted-foreground">{list.filter((s) => !s.unsubscribed_at).length} active · {list.length} total</p>
        </div>
        <Button variant="outline" onClick={exportCsv} disabled={list.length === 0} className="gap-2"><Download className="h-4 w-4" />Export CSV</Button>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading…</div>
        ) : list.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No subscribers yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-3">Email</th>
                <th className="p-3">Name</th>
                <th className="p-3">Subscribed</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {list.map((s) => (
                <tr key={s.id} className="border-t border-border">
                  <td className="p-3 font-mono">{s.email}</td>
                  <td className="p-3">{s.full_name ?? "—"}</td>
                  <td className="p-3">{new Date(s.created_at).toLocaleDateString()}</td>
                  <td className="p-3">{s.unsubscribed_at ? <span className="text-muted-foreground">Unsubscribed</span> : <span className="text-primary">Active</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}