import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Layout } from "@/components/site/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Suzy Wood" },
      { name: "description", content: "Visit the Suzy Wood studio in Cairo or get in touch about your nursery project." },
    ],
  }),
  component: Contact,
});

function Contact() {
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const { error } = await supabase.from("contact_messages").insert({
      full_name: String(fd.get("name")),
      email: String(fd.get("email")),
      phone: String(fd.get("phone") ?? "") || null,
      message: String(fd.get("message")),
    });
    setSubmitting(false);
    if (error) toast.error("Couldn't send", { description: error.message });
    else { toast.success("Message sent"); (e.target as HTMLFormElement).reset(); }
  };

  return (
    <Layout>
      <section className="container mx-auto px-6 lg:px-10 pt-16 pb-24 max-w-5xl">
        <p className="text-[11px] uppercase tracking-[0.28em] text-secondary mb-3">Get in touch</p>
        <h1 className="font-serif text-5xl md:text-6xl">We'd love to hear about your space.</h1>

        <div className="mt-16 grid lg:grid-cols-3 gap-10">
          <div className="space-y-6">
            {[
              { Icon: MapPin, title: "Studio", body: "12 Road 9, New Cairo\nVisits by appointment" },
              { Icon: Mail, title: "Email", body: "studio@suzywood.com" },
              { Icon: Phone, title: "Phone & WhatsApp", body: "+20 100 000 0000\nSun–Thu, 10am–6pm" },
            ].map(({ Icon, title, body }) => (
              <div key={title} className="bg-card border border-border rounded-2xl p-5 shadow-soft">
                <Icon className="h-5 w-5 text-secondary" />
                <h3 className="font-serif text-xl mt-3">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
          <form onSubmit={onSubmit} className="lg:col-span-2 bg-card border border-border rounded-2xl p-8 space-y-5">
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="space-y-1"><Label htmlFor="name">Name</Label><Input id="name" name="name" required maxLength={100} /></div>
              <div className="space-y-1"><Label htmlFor="phone">Phone (optional)</Label><Input id="phone" name="phone" type="tel" maxLength={30} /></div>
            </div>
            <div className="space-y-1"><Label htmlFor="email">Email</Label><Input id="email" type="email" name="email" required maxLength={255} /></div>
            <div className="space-y-1"><Label htmlFor="message">Message</Label><Textarea id="message" name="message" rows={5} required minLength={5} maxLength={3000} /></div>
            <Button type="submit" disabled={submitting} size="lg">{submitting ? "Sending…" : "Send Message"}</Button>
          </form>
        </div>
      </section>
    </Layout>
  );
}
