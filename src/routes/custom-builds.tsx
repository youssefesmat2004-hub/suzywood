import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/site/Layout";
import { CustomBuildForm } from "@/components/site/CustomBuildForm";

export const Route = createFileRoute("/custom-builds")({
  head: () => ({
    meta: [
      { title: "Custom Builds — Suzy Wood" },
      { name: "description", content: "Commission a bespoke piece of nursery or toddler furniture from Suzy Wood's Cairo workshop." },
      { property: "og:title", content: "Custom Builds — Suzy Wood" },
      { property: "og:description", content: "Bespoke wooden furniture for nurseries, toddler rooms, and playrooms." },
    ],
  }),
  component: CustomBuilds,
});

function CustomBuilds() {
  return (
    <Layout>
      <section className="container mx-auto px-6 lg:px-10 pt-16 pb-24">
        <div className="grid lg:grid-cols-2 gap-16">
          <div className="space-y-6">
            <p className="text-[11px] uppercase tracking-[0.28em] text-secondary">Custom Builds</p>
            <h1 className="font-serif text-5xl md:text-6xl text-balance">
              Designed for your room, built for your child.
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              Tell us about the piece you've been imagining — a fitted wardrobe, a reading nook, a one-of-a-kind crib.
              Our design team will sketch a proposal and quote within two working days.
            </p>
            <ul className="space-y-3 pt-2 text-sm">
              {[
                "Free design consultation",
                "3D rendering before production",
                "6–8 week typical lead time",
                "White-glove install in Greater Cairo",
              ].map((i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-secondary" /> {i}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-card border border-border rounded-3xl p-8 lg:p-10 shadow-card">
            <CustomBuildForm />
          </div>
        </div>
      </section>
    </Layout>
  );
}
