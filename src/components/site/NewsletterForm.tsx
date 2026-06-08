import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { notifyOwnerNewNewsletterSubscriber } from "@/lib/owner-notifications.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { z } from "zod";

const schema = z.string().trim().email("Enter a valid email").max(255);

export function NewsletterForm({ variant = "footer" }: { variant?: "footer" | "hero" }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const notifyOwner = useServerFn(notifyOwnerNewNewsletterSubscriber);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(email);
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? "Invalid email"); return; }
    setBusy(true);
    const { data: row, error } = await supabase
      .from("newsletter_subscribers")
      .insert({ email: parsed.data })
      .select("id")
      .maybeSingle();
    setBusy(false);
    if (error && !error.message.toLowerCase().includes("duplicate")) {
      toast.error("Couldn't subscribe", { description: error.message });
      return;
    }
    if (row?.id) {
      notifyOwner({ data: { subscriberId: row.id } }).catch((e) =>
        console.error("Owner newsletter notify failed", e),
      );
    }
    toast.success("You're in! Welcome to Suzy Wood.");
    setEmail("");
  };

  if (variant === "hero") {
    return (
      <form onSubmit={submit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
        <Input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="h-12 bg-background"
        />
        <Button type="submit" size="lg" className="h-12 whitespace-nowrap" disabled={busy}>
          {busy ? "Subscribing…" : "Get 10% Off"}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={submit} className="flex gap-2 max-w-sm mx-auto">
      <Input
        type="email"
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="bg-background h-10"
      />
      <Button type="submit" disabled={busy} className="h-10">{busy ? "…" : "Join"}</Button>
    </form>
  );
}