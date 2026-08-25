import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "./StarRating";
import { toast } from "sonner";
import type { Review } from "@/lib/types";
import { useI18n } from "@/lib/i18n";

export function Reviews({ productId }: { productId: string }) {
  const { t } = useI18n();
  const { user } = useAuth();
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
    const { error } = await supabase.from("reviews").upsert(
      { product_id: productId, user_id: user.id, rating, title: title.slice(0, 120), body: body.slice(0, 1000) },
      { onConflict: "product_id,user_id" },
    );
    setSubmitting(false);
    if (error) {
      toast.error(t("shop.couldNotSaveReview", "Couldn't save your review"), { description: error.message });
    } else {
      toast.success(t("shop.thankYouForReview", "Thank you for your review"));
      setTitle(""); setBody(""); setRating(5);
      load();
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <StarRating value={avg} size="md" />
        <span className="text-sm text-muted-foreground">
          {reviews.length === 0
            ? t("shop.noReviewsYet", "No reviews yet")
            : `${avg.toFixed(1)} · ${reviews.length} ${reviews.length === 1 ? t("shop.reviewSingular", "review") : t("shop.reviewPlural", "reviews")}`}
        </span>
      </div>

      {user ? (
        <form onSubmit={submit} className="space-y-4 bg-muted/40 border border-border rounded-2xl p-6">
          <p className="font-serif text-xl">{myReview ? t("shop.updateYourReview", "Update your review") : t("shop.writeAReview", "Write a review")}</p>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <button type="button" key={i} onClick={() => setRating(i)} aria-label={t("shop.starsAria", "{n} stars").replace("{n}", String(i))}>
                <span className={`text-2xl ${i <= rating ? "text-secondary" : "text-muted-foreground"}`}>★</span>
              </button>
            ))}
          </div>
          <div className="space-y-1">
            <Label htmlFor="title">{t("shop.reviewTitleLabel", "Title")}</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="body">{t("shop.yourExperienceLabel", "Your experience")}</Label>
            <Textarea id="body" value={body} onChange={(e) => setBody(e.target.value)} maxLength={1000} rows={4} required />
          </div>
          <Button type="submit" disabled={submitting}>{submitting ? t("shop.savingEllipsis", "Saving…") : t("shop.submitReview", "Submit review")}</Button>
        </form>
      ) : (
        <div className="bg-muted/40 border border-border rounded-2xl p-6 text-sm text-muted-foreground">
          <Link to="/auth" className="text-primary border-b border-primary">{t("shop.signInLink", "Sign in")}</Link> {t("shop.toWriteAReview", "to write a review.")}
        </div>
      )}

      <div className="space-y-6">
        {loading ? (
          <p className="text-sm text-muted-foreground">{t("shop.loadingReviews", "Loading reviews…")}</p>
        ) : reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("shop.beFirstToShare", "Be the first to share your experience.")}</p>
        ) : (
          reviews.map((r) => (
            <div key={r.id} className="border-t border-border pt-6">
              <div className="flex items-center justify-between gap-3">
                <StarRating value={r.rating} />
                <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
              </div>
              {r.title && <p className="font-serif text-lg mt-2">{r.title}</p>}
              {r.body && <p className="text-sm text-foreground mt-1 leading-relaxed">{r.body}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
