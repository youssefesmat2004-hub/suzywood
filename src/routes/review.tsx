import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { useServerFn } from "@tanstack/react-start";
import { Layout } from "@/components/site/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CheckCircle2, Star } from "lucide-react";
import { getReviewInvite, submitDeliveryReview } from "@/lib/reviews.functions";
import { useI18n } from "@/lib/i18n";

const searchSchema = z.object({ token: z.string().optional() });

export const Route = createFileRoute("/review")({
  head: () => ({
    meta: [
      { title: "Leave a review — Suzy Wood" },
      { name: "description", content: "Tell us about the quality of your Suzy Wood piece and the service you received." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Leave a review — Suzy Wood" },
      { property: "og:description", content: "Share your experience with your handcrafted Suzy Wood piece." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  validateSearch: (s) => searchSchema.parse(s),
  component: ReviewPage,
});

function Stars({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <button key={i} type="button" onClick={() => onChange(i)} aria-label={`${i} / 5 — ${label}`}>
            <Star className={`h-7 w-7 ${i <= value ? "fill-secondary text-secondary" : "text-muted-foreground/40"}`} />
          </button>
        ))}
      </div>
    </div>
  );
}

function ReviewPage() {
  const { t } = useI18n();
  const { token } = Route.useSearch();
  const loadInvite = useServerFn(getReviewInvite);
  const submit = useServerFn(submitDeliveryReview);

  const [state, setState] = useState<"loading" | "invalid" | "done" | "form">("loading");
  const [orderNumber, setOrderNumber] = useState("");
  const [items, setItems] = useState<Array<{ productId: string | null; productName: string }>>([]);
  const [name, setName] = useState("");
  const [productRating, setProductRating] = useState(5);
  const [serviceRating, setServiceRating] = useState(5);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) { setState("invalid"); return; }
    loadInvite({ data: { token } })
      .then((r) => {
        if (!r?.ok) { setState("invalid"); return; }
        setOrderNumber(r.orderNumber);
        setItems(r.items);
        setName(r.customerName ?? "");
        setState(r.alreadyReviewed ? "done" : "form");
      })
      .catch(() => setState("invalid"));
  }, [token]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    try {
      const r = await submit({
        data: {
          token,
          name: name.trim() || "Customer",
          productRating,
          serviceRating,
          comment: comment.trim() || undefined,
          productId: items[0]?.productId ?? null,
        },
      });
      if (r?.ok) {
        setState("done");
        toast.success(t("review.thanks", "Thank you for your review!"));
      } else {
        toast.error(t("review.failed", "Couldn't save your review"));
      }
    } catch {
      toast.error(t("review.failed", "Couldn't save your review"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <section className="container mx-auto px-6 py-16 max-w-xl">
        {state === "loading" ? (
          <p className="text-sm text-muted-foreground text-center">{t("review.loading", "Loading…")}</p>
        ) : state === "invalid" ? (
          <div className="text-center space-y-4">
            <h1 className="font-serif text-3xl">{t("review.invalidTitle", "This review link isn't valid")}</h1>
            <p className="text-muted-foreground">
              {t("review.invalidBody", "The link may have expired or already been used. If you'd still like to share your thoughts, message us on WhatsApp.")}
            </p>
            <Button asChild variant="outline"><Link to="/shop">{t("review.backToShop", "Back to shop")}</Link></Button>
          </div>
        ) : state === "done" ? (
          <div className="text-center space-y-4">
            <CheckCircle2 className="h-12 w-12 mx-auto text-primary" />
            <h1 className="font-serif text-3xl">{t("review.doneTitle", "Thank you for your review!")}</h1>
            <p className="text-muted-foreground">
              {t("review.doneBody", "We're so grateful you took the time. Your words help other families choose with confidence.")}
            </p>
            <Button asChild><Link to="/shop">{t("review.backToShop", "Back to shop")}</Link></Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="text-center space-y-2">
              <h1 className="font-serif text-3xl sm:text-4xl">{t("review.title", "How did we do?")}</h1>
              <p className="text-muted-foreground text-sm">
                {t("review.subtitle", "Tell us about your piece and the service you received.")}
              </p>
              {orderNumber ? (
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {t("review.orderLabel", "Order")} {orderNumber}
                </p>
              ) : null}
            </div>

            {items.length ? (
              <p className="text-sm text-center text-muted-foreground">
                {items.map((i) => i.productName).join(" · ")}
              </p>
            ) : null}

            <div className="bg-muted/40 border border-border rounded-2xl p-6 space-y-6">
              <Stars value={productRating} onChange={setProductRating} label={t("review.productQuality", "Product quality")} />
              <Stars value={serviceRating} onChange={setServiceRating} label={t("review.service", "Service & delivery")} />

              <div className="space-y-1">
                <Label htmlFor="review-name">{t("review.nameLabel", "Your name")}</Label>
                <Input id="review-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required />
              </div>

              <div className="space-y-1">
                <Label htmlFor="review-comment">{t("review.commentLabel", "Your review")}</Label>
                <Textarea
                  id="review-comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  maxLength={1000}
                  rows={5}
                  placeholder={t("review.commentPlaceholder", "What did you love? Anything we could do better?")}
                />
              </div>

              <Button type="submit" disabled={saving} className="w-full">
                {saving ? t("review.sending", "Sending…") : t("review.submit", "Submit review")}
              </Button>
            </div>
          </form>
        )}
      </section>
    </Layout>
  );
}
