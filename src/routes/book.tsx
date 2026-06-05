import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { notifyOwnerNewBooking } from "@/lib/owner-notifications.functions";
import { Layout } from "@/components/site/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, Clock, Heart } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/book")({
  head: () => ({
    meta: [
      { title: "Book a Free Session — Suzy Wood" },
      { name: "description", content: "Book a free, no-commitment guidance session with the Suzy Wood team. We'll help you choose the perfect handcrafted piece for your little one." },
      { property: "og:title", content: "Book a Free Session — Suzy Wood" },
      { property: "og:description", content: "Free, no-commitment guidance session with our team." },
    ],
  }),
  component: BookPage,
});

const ADMIN_WHATSAPP = "201096313532";

const DAYS = [
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
] as const;

const SLOTS = [
  { value: "morning", label: "Morning (9am – 12pm)" },
  { value: "afternoon", label: "Afternoon (12pm – 4pm)" },
  { value: "evening", label: "Evening (4pm – 8pm)" },
] as const;

const schema = z.object({
  full_name: z.string().trim().min(1, "Please enter your full name").max(100),
  phone: z.string().trim().regex(/^01[0-9]{9}$/, "Egyptian phone format, e.g. 01012345678"),
  contact_method: z.enum(["whatsapp", "phone"], { required_error: "Choose a contact method" }),
  preferred_day: z.enum(["saturday","sunday","monday","tuesday","wednesday","thursday"], { required_error: "Choose a day" }),
  time_slot: z.enum(["morning","afternoon","evening"], { required_error: "Choose a time slot" }),
  notes: z.string().trim().max(2000).optional(),
});

function BookPage() {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ method: string } | null>(null);
  const notifyOwner = useServerFn(notifyOwnerNewBooking);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    contact_method: "" as "whatsapp" | "phone" | "",
    preferred_day: "" as typeof DAYS[number]["value"] | "",
    time_slot: "" as typeof SLOTS[number]["value"] | "",
    notes: "",
  });

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ ...form, notes: form.notes || undefined });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please complete the form");
      return;
    }
    setSubmitting(true);
    const { data: inserted, error } = await supabase.from("bookings").insert({
      full_name: parsed.data.full_name,
      phone: parsed.data.phone,
      contact_method: parsed.data.contact_method,
      preferred_day: parsed.data.preferred_day,
      time_slot: parsed.data.time_slot,
      notes: parsed.data.notes ?? null,
    }).select("id").single();
    setSubmitting(false);
    if (error || !inserted) {
      toast.error("Couldn't submit your booking. Please try again.");
      return;
    }

    notifyOwner({ data: { bookingId: inserted.id } }).catch((e) =>
      console.error("Owner booking notify failed", e),
    );

    // Open WhatsApp pre-filled message to admin (click-to-send)
    const dayLabel = DAYS.find((d) => d.value === parsed.data.preferred_day)?.label ?? parsed.data.preferred_day;
    const slotLabel = SLOTS.find((s) => s.value === parsed.data.time_slot)?.label ?? parsed.data.time_slot;
    const methodLabel = parsed.data.contact_method === "whatsapp" ? "WhatsApp" : "Phone Call";
    const message = [
      "🪴 *New Free Session Booking — Suzy Wood*",
      "",
      `*Name:* ${parsed.data.full_name}`,
      `*Phone:* ${parsed.data.phone}`,
      `*Preferred contact:* ${methodLabel}`,
      `*Preferred day:* ${dayLabel}`,
      `*Time slot:* ${slotLabel}`,
      parsed.data.notes ? `*Notes:* ${parsed.data.notes}` : null,
    ].filter(Boolean).join("\n");
    const waUrl = `https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");

    setDone({ method: methodLabel });
  };

  if (done) {
    return (
      <Layout>
        <section className="container mx-auto px-6 py-24 max-w-2xl text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <Check className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-serif text-4xl mb-4">Thank you!</h1>
          <p className="text-lg text-muted-foreground mb-8">
            We will contact you shortly via <span className="text-foreground font-medium">{done.method}</span>.
          </p>
          <Button onClick={() => { setDone(null); setForm({ full_name: "", phone: "", contact_method: "", preferred_day: "", time_slot: "", notes: "" }); }} variant="outline">
            Book another session
          </Button>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="container mx-auto px-6 py-16 lg:py-24 max-w-3xl">
        <div className="text-center mb-12">
          <h1 className="font-serif text-4xl lg:text-5xl leading-tight mb-4">
            Not sure what to choose?
            <br />
            <span className="text-primary">Book a free session with our team</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            A friendly chat to help you find the perfect handcrafted piece for your little one.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          {[
            { icon: Heart, title: "Free of charge", desc: "No fees, no surprises" },
            { icon: Check, title: "No commitment", desc: "Just helpful guidance" },
            { icon: Clock, title: "Reply within 24h", desc: "We're quick to respond" },
          ].map((b) => (
            <div key={b.title} className="rounded-2xl border border-border bg-card p-5 text-center">
              <div className="mx-auto h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <b.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="font-medium">{b.title}</div>
              <div className="text-xs text-muted-foreground mt-1">{b.desc}</div>
            </div>
          ))}
        </div>

        <form onSubmit={onSubmit} className="rounded-3xl border border-border bg-card p-6 sm:p-10 space-y-6 shadow-sm">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name *</Label>
            <Input id="full_name" value={form.full_name} onChange={(e) => update("full_name", e.target.value)} placeholder="Your name" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <Input id="phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="01012345678" inputMode="numeric" required />
            <p className="text-xs text-muted-foreground">Egyptian number starting with 01</p>
          </div>

          <div className="space-y-3">
            <Label>Preferred contact method *</Label>
            <RadioGroup value={form.contact_method} onValueChange={(v) => update("contact_method", v as "whatsapp" | "phone")} className="grid grid-cols-2 gap-3">
              {[
                { value: "whatsapp", label: "WhatsApp" },
                { value: "phone", label: "Phone Call" },
              ].map((opt) => (
                <label key={opt.value} htmlFor={`cm-${opt.value}`} className={`flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition-colors ${form.contact_method === opt.value ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"}`}>
                  <RadioGroupItem value={opt.value} id={`cm-${opt.value}`} />
                  <span className="text-sm font-medium">{opt.label}</span>
                </label>
              ))}
            </RadioGroup>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Preferred day *</Label>
              <Select value={form.preferred_day} onValueChange={(v) => update("preferred_day", v as typeof DAYS[number]["value"])}>
                <SelectTrigger><SelectValue placeholder="Choose a day" /></SelectTrigger>
                <SelectContent>
                  {DAYS.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Preferred time slot *</Label>
              <Select value={form.time_slot} onValueChange={(v) => update("time_slot", v as typeof SLOTS[number]["value"])}>
                <SelectTrigger><SelectValue placeholder="Choose a time" /></SelectTrigger>
                <SelectContent>
                  {SLOTS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Anything you want us to know before the session?</Label>
            <Textarea id="notes" value={form.notes} onChange={(e) => update("notes", e.target.value)} rows={4} placeholder="Optional notes..." maxLength={2000} />
          </div>

          <Button type="submit" size="lg" className="w-full h-14 text-base" disabled={submitting}>
            {submitting ? "Booking..." : "Book My Free Session"}
          </Button>
        </form>
      </section>
    </Layout>
  );
}