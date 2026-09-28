import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { useServerFn } from "@tanstack/react-start";
import { Layout } from "@/components/site/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CheckCircle2, Star } from "lucide-react";
import { submitStoryReview } from "@/lib/reviews.functions";
import { useI18n } from "@/lib/i18n";

const searchSchema = z.object({});

export const Route = createFileRoute("/story-reviews")({
  head: () => ({
    meta: [
      { title: "Review Suzy Wood" },
      { name: "description", content: "Share your experience with Suzy Wood handcrafted nursery furniture." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Review Suzy Wood" },
      { property: "og:description", content: "Share your experience with Suzy Wood handcrafted nursery furniture." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  validateSearch: (s) => searchSchema.parse(s),
  component: StoryReviewsPage,
});

function StoryReviewsPage() {
  const { t } = useI18n();
  const submit = useServerFn(submitStoryReview);

  const [done, setDone] = useState(false);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await submit({
        data: { name: name.trim() || "Customer", rating, comment: comment.trim() || undefined },
      });
      if (r?.ok) {
        setDone(true);
      } else {
        toast.error(t("story.failed", "Couldn't submit your review"), {
          description: r?.error === "rate_limited" ? t("story.rateLimited", "Too many reviews right now — please try again later.") : undefined,
        });
      }
    } catch {
      toast.error(t("story.failed", "Couldn't submit your review"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <section className="container mx-auto px-6 py-16 max-w-xl">
        {done ? (
          <div className="text-center space-y-4">
            <CheckCircle2 className="h-12 w-12 mx-auto text-primary" />
            <h1 className="font-serif text-3xl">{t("story.thanksTitle", "Thank you for your review!")}</h1>
            <p className="text-muted-foreground">
              {t("story.thanksBody", "We're so grateful you took the time. Your words help other families choose with confidence.")}
            </p>
            <Button asChild><Link to="/shop">{t("review.backToShop", "Back to shop")}</Link></Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="text-center space-y-2">
              <h1 className="font-serif text-3xl sm:text-4xl">{t("story.title", "How was your experience with Suzy Wood?")}</h1>
              <p className="text-muted-foreground text-sm">
                {t("story.subtitle", "A few words from you helps other families choose with confidence.")}
              </p>
            </div>

            <div className="bg-muted/40 border border-border rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button key={i} type="button" onClick={() => setRating(i)} aria-label={`${i} / 5`}>
                    <Star className={`h-8 w-8 ${i <= rating ? "fill-secondary text-secondary" : "text-muted-foreground/40"}`} />
                  </button>
                ))}
              </div>

              <div className="space-y-1">
                <Label htmlFor="story-name">{t("review.nameLabel", "Your name")}</Label>
                <Input id="story-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required />
              </div>

              <div className="space-y-1">
                <Label htmlFor="story-comment">{t("review.commentLabel", "Your review")}</Label>
                <Textarea
                  id="story-comment"
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
