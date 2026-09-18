import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/site/StarRating";
import { toast } from "sonner";
import { Eye, EyeOff, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/reviews")({
  head: () => ({ meta: [{ title: "Reviews — Suzy Wood Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminReviews,
});

type Row = {
  id: string;
  kind: string;
  reviewer_name: string;
  comment: string | null;
  experience_rating: number | null;
  product_rating: number | null;
  service_rating: number | null;
  is_published: boolean;
  submitted_at: string;
  order_id: string;
  orders?: { order_number: string } | null;
};

function AdminReviews() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "published">("all");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("order_reviews")
      .select("id, kind, reviewer_name, comment, experience_rating, product_rating, service_rating, is_published, submitted_at, order_id, orders(order_number)")
      .order("submitted_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data ?? []) as any);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const togglePublish = async (row: Row) => {
    const { error } = await supabase
      .from("order_reviews")
      .update({ is_published: !row.is_published } as never)
      .eq("id", row.id);
    if (error) return toast.error(error.message);
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, is_published: !row.is_published } : r)));
    toast.success(row.is_published ? "Review hidden" : "Review published");
  };

  const remove = async (row: Row) => {
    if (!confirm("Delete this review permanently?")) return;
    const { error } = await supabase.from("order_reviews").delete().eq("id", row.id);
    if (error) return toast.error(error.message);
    setRows((prev) => prev.filter((r) => r.id !== row.id));
    toast.success("Review deleted");
  };

  const visible = rows.filter((r) =>
    filter === "all" ? true : filter === "pending" ? !r.is_published : r.is_published,
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-serif text-3xl">Reviews</h1>
          <div className="flex gap-2">
            {(["all", "pending", "published"] as const).map((f) => (
              <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>
                {f === "all" ? "All" : f === "pending" ? "Pending approval" : "Published"}
              </Button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading reviews…</p>
        ) : visible.length === 0 ? (
          <p className="text-sm text-muted-foreground">No reviews here yet.</p>
        ) : (
          <div className="space-y-4">
            {visible.map((r) => {
              const ratings = [r.product_rating, r.service_rating, r.experience_rating].filter(
                (v) => typeof v === "number",
              ) as number[];
              const avg = ratings.length ? ratings.reduce((s, v) => s + v, 0) / ratings.length : 0;
              return (
                <div key={r.id} className="border border-border rounded-2xl p-5 bg-card space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{r.reviewer_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.orders?.order_number ?? "—"} · {r.kind === "experience" ? "Website experience" : "After delivery"} ·{" "}
                        {new Date(r.submitted_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full border ${
                        r.is_published
                          ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                          : "bg-amber-100 text-amber-800 border-amber-200"
                      }`}
                    >
                      {r.is_published ? "Published" : "Pending approval"}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <StarRating value={avg} />
                    {r.product_rating != null && <span>Quality: {r.product_rating}/5</span>}
                    {r.service_rating != null && <span>Service: {r.service_rating}/5</span>}
                    {r.experience_rating != null && <span>Website: {r.experience_rating}/5</span>}
                  </div>

                  {r.comment ? <p className="text-sm leading-relaxed">{r.comment}</p> : null}

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => togglePublish(r)}>
                      {r.is_published ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                      {r.is_published ? "Hide" : "Publish"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(r)}>
                      <Trash2 className="h-4 w-4 mr-1" /> Delete
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
