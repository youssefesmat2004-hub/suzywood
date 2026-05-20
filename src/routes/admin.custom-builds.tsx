import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageCircle, Mail, Trash2, Copy } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/custom-builds")({
  head: () => ({ meta: [{ title: "Custom Builds — Suzy Wood Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: AdminCustomBuilds,
});

type CB = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  room_type: string;
  description: string;
  status: string;
  created_at: string;
};

const STATUSES = ["new", "contacted", "accepted", "declined", "completed"];
const STATUS_COLOR: Record<string, string> = {
  new: "bg-amber-100 text-amber-800 border-amber-200",
  contacted: "bg-blue-100 text-blue-800 border-blue-200",
  accepted: "bg-emerald-100 text-emerald-800 border-emerald-200",
  declined: "bg-rose-100 text-rose-800 border-rose-200",
  completed: "bg-purple-100 text-purple-800 border-purple-200",
};

function AdminCustomBuilds() {
  const [rows, setRows] = useState<CB[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data, error } = await supabase
      .from("custom_build_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("Couldn't load requests");
    else setRows((data ?? []) as CB[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel("custom-builds-admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "custom_build_requests" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const updateStatus = async (row: CB, status: string) => {
    const prev = row.status;
    setRows((r) => r.map((x) => (x.id === row.id ? { ...x, status } : x)));
    const { error } = await supabase.from("custom_build_requests").update({ status }).eq("id", row.id);
    if (error) {
      toast.error(error.message);
      setRows((r) => r.map((x) => (x.id === row.id ? { ...x, status: prev } : x)));
    } else toast.success(`Marked as ${status}`);
  };

  const remove = async (row: CB) => {
    if (!confirm(`Delete request from ${row.full_name}?`)) return;
    const { error } = await supabase.from("custom_build_requests").delete().eq("id", row.id);
    if (error) { toast.error(error.message); return; }
    setRows((r) => r.filter((x) => x.id !== row.id));
  };

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success("Copied");
  };

  const newCount = rows.filter((r) => r.status === "new").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl">Custom Build Requests</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Customer-submitted custom furniture requests{newCount > 0 && ` — ${newCount} new`}.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}</div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground">No custom requests yet.</div>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.id} className="rounded-xl border bg-card p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-serif text-lg">{row.full_name}</h3>
                    <span className="text-xs px-2 py-0.5 rounded bg-muted capitalize">{row.room_type}</span>
                    <span className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleString()}</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1 flex gap-4 flex-wrap">
                    <a href={`mailto:${row.email}`} className="hover:text-primary inline-flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" /> {row.email}
                    </a>
                    <a href={`tel:${row.phone}`} className="hover:text-primary font-mono text-xs">{row.phone}</a>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Select value={row.status} onValueChange={(v) => updateStatus(row, v)}>
                    <SelectTrigger className={`h-8 w-36 border ${STATUS_COLOR[row.status] ?? ""}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="outline" asChild>
                    <a
                      href={`https://wa.me/${row.phone.replace(/[^0-9]/g, "").replace(/^0/, "2")}?text=${encodeURIComponent(`Hi ${row.full_name}, thanks for your custom build request at Suzy Wood. We'd love to discuss your ${row.room_type}.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(row)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <div className="mt-3 p-3 rounded bg-muted/50 text-sm whitespace-pre-wrap relative">
                <button onClick={() => copy(row.description)} className="absolute top-2 right-2 p-1 hover:bg-background rounded" title="Copy">
                  <Copy className="h-3.5 w-3.5" />
                </button>
                {row.description}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}