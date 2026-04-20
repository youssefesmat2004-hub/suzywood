import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/site/Layout";
import { Mail, Phone, MapPin } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Suzy Wood" },
      { name: "description", content: "Visit the Suzy Wood studio in Cairo or get in touch about your nursery project." },
      { property: "og:title", content: "Contact — Suzy Wood" },
      { property: "og:description", content: "Reach the Suzy Wood studio." },
    ],
  }),
  component: Contact,
});

function Contact() {
  return (
    <Layout>
      <section className="container mx-auto px-6 lg:px-10 pt-16 pb-24">
        <p className="text-[11px] uppercase tracking-[0.28em] text-secondary mb-3">Get in touch</p>
        <h1 className="font-serif text-5xl md:text-6xl max-w-3xl">We'd love to hear about your space.</h1>
        <div className="mt-16 grid md:grid-cols-3 gap-10">
          {[
            { Icon: MapPin, title: "Studio", body: "12 Road 9, New Cairo\nVisits by appointment" },
            { Icon: Mail, title: "Email", body: "studio@suzywood.com" },
            { Icon: Phone, title: "Phone", body: "+20 100 000 0000\nSun–Thu, 10am–6pm" },
          ].map(({ Icon, title, body }) => (
            <div key={title} className="bg-card border border-border rounded-2xl p-7 shadow-soft">
              <Icon className="h-5 w-5 text-secondary" />
              <h3 className="font-serif text-2xl mt-4">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>
    </Layout>
  );
}
