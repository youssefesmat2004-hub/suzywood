import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { submitExperienceReview } from "@/lib/reviews.functions";
import { useI18n } from "@/lib/i18n";

export function ExperienceReview({ orderNumber }: { orderNumber: string }) {
  const { t } = useI18n();
  const submit = useServerFn(submitExperienceReview);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="mt-10 mx-auto max-w-md bg-muted/40 border border-border rounded-2xl p-6 text-center">
        <p className="text-sm text-muted-foreground">
          {t("checkout.expThanks", "Thank you for the feedback — it really helps us improve.")}
        </p>
      </div>
    );
  }

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await submit({ data: { orderNumber, rating, comment: comment.trim() || undefined } });
      if (r?.ok || (r as any)?.error === "already_submitted") setDone(true);
      else toast.error(t("checkout.expFailed", "Couldn't save your feedback"));
    } catch {
      toast.error(t("checkout.expFailed", "Couldn't save your feedback"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={send} className="mt-10 mx-auto max-w-md text-left bg-muted/40 border border-border rounded-2xl p-6 space-y-4">
      <h2 className="font-serif text-xl text-center">
        {t("checkout.expTitle", "How was your ordering experience?")}
      </h2>
      <div className="flex items-center justify-center gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => setRating(i)}
            aria-label={`${i} / 5 — ${t("checkout.expTitle", "How was your ordering experience?")}`}
          >
            <Star className={`h-7 w-7 ${i <= rating ? "fill-secondary text-secondary" : "text-muted-foreground/40"}`} />
          </button>
        ))}
      </div>
      <div className="space-y-1">
        <Label htmlFor="experience-comment">{t("checkout.expCommentLabel", "Anything you'd like to tell us? (optional)")}</Label>
        <Textarea
          id="experience-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          maxLength={1000}
        />
      </div>
      <Button type="submit" disabled={saving} className="w-full">
        {saving ? t("checkout.expSending", "Sending…") : t("checkout.expSubmit", "Send feedback")}
      </Button>
    </form>
  );
}
