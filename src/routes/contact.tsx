import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Layout } from "@/components/site/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Suzy Wood" },
      { name: "description", content: "Get in touch with Suzy Wood about your nursery project." },
      { property: "og:title", content: "Contact Suzy Wood — Custom Nursery Furniture in Cairo" },
      { property: "og:description", content: "Talk to the Suzy Wood team about custom nursery and toddler furniture, delivery across Egypt, and made-to-order pieces." },
      { property: "og:url", content: "https://suzywoodofficial.com/contact" },
    ],
    links: [{ rel: "canonical", href: "https://suzywoodofficial.com/contact" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          name: "Suzy Wood",
          image: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/ee700a9f-4938-4be4-a277-9bb9a733a37d/id-preview-9e14d270--11bfc074-06ec-4994-b934-707592e10ec4.lovable.app-1776683618592.png",
          url: "https://suzywoodofficial.com/contact",
          telephone: "+20 109 631 3532",
          priceRange: "$$",
          address: {
            "@type": "PostalAddress",
            addressLocality: "Cairo",
            addressCountry: "EG",
          },
          openingHoursSpecification: [
            {
              "@type": "OpeningHoursSpecification",
              dayOfWeek: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"],
              opens: "10:00",
              closes: "18:00",
            },
          ],
        }),
      },
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
              { Icon: Phone, title: "Phone & WhatsApp", body: "+20 109 631 3532", sub: "Sun–Thu, 10am–6pm", href: "tel:+201096313532" },
            ].map(({ Icon, title, body, sub, href }) => (
              <div key={title} className="bg-card border border-border rounded-2xl p-5 shadow-soft">
                <Icon className="h-5 w-5 text-secondary" />
                <h3 className="font-serif text-xl mt-3">{title}</h3>
                {href ? (
                  <a href={href} className="mt-2 block text-sm text-muted-foreground hover:text-primary transition-colors">{body}</a>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{body}</p>
                )}
                {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
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
