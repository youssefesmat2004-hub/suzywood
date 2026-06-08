import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { notifyOwnerNewReview } from "@/lib/owner-notifications.functions";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "./StarRating";
import { toast } from "sonner";
import type { Review } from "@/lib/types";

export function Reviews({ productId }: { productId: string }) {
  const { user } = useAuth();
  const notifyOwner = useServerFn(notifyOwnerNewReview);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("reviews")
      .select("*")
      .eq("product_id", productId)
      .eq("is_published", true)
      .order("created_at", { ascending: false });
    setReviews((data ?? []) as Review[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [productId]);

  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const myReview = user ? reviews.find((r) => r.user_id === user.id) : undefined;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    const { data: row, error } = await supabase.from("reviews").upsert(
      { product_id: productId, user_id: user.id, rating, title: title.slice(0, 120), body: body.slice(0, 1000) },
      { onConflict: "product_id,user_id" },
    ).select("id").maybeSingle();
    setSubmitting(false);
    if (error) {
      toast.error("Couldn't save your review", { description: error.message });
    } else {
      if (row?.id) {
        notifyOwner({ data: { reviewId: row.id } }).catch((e) =>
          console.error("Owner review notify failed", e),
        );
      }
      toast.success("Thank you for your review");
      setTitle(""); setBody(""); setRating(5);
      load();
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <StarRating value={avg} size="md" />
        <span className="text-sm text-muted-foreground">
          {reviews.length === 0 ? "No reviews yet" : `${avg.toFixed(1)} · ${reviews.length} review${reviews.length === 1 ? "" : "s"}`}
        </span>
      </div>

      {user ? (
        <form onSubmit={submit} className="space-y-4 bg-muted/40 border border-border rounded-2xl p-6">
          <p className="font-serif text-xl">{myReview ? "Update your review" : "Write a review"}</p>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <button type="button" key={i} onClick={() => setRating(i)} aria-label={`${i} stars`}>
                <span className={`text-2xl ${i <= rating ? "text-secondary" : "text-muted-foreground/40"}`}>★</span>
              </button>
            ))}
          </div>
          <div className="space-y-1">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="body">Your experience</Label>
            <Textarea id="body" value={body} onChange={(e) => setBody(e.target.value)} maxLength={1000} rows={4} required />
          </div>
          <Button type="submit" disabled={submitting}>{submitting ? "Saving…" : "Submit review"}</Button>
        </form>
      ) : (
        <div className="bg-muted/40 border border-border rounded-2xl p-6 text-sm text-muted-foreground">
          <Link to="/auth" className="text-primary border-b border-primary">Sign in</Link> to write a review.
        </div>
      )}

      <div className="space-y-6">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading reviews…</p>
        ) : reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">Be the first to share your experience.</p>
        ) : (
          reviews.map((r) => (
            <div key={r.id} className="border-t border-border pt-6">
              <div className="flex items-center justify-between gap-3">
                <StarRating value={r.rating} />
                <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
              </div>
              {r.title && <p className="font-serif text-lg mt-2">{r.title}</p>}
              {r.body && <p className="text-sm text-foreground/80 mt-1 leading-relaxed">{r.body}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
