import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/site/Layout";
import craft from "@/assets/craft-story.jpg";

export const Route = createFileRoute("/our-craft")({
  head: () => ({
    meta: [
      { title: "Our Craft — Suzy Wood" },
      { name: "description", content: "How Suzy Wood designs and builds heirloom-quality nursery furniture by hand in Cairo." },
      { property: "og:title", content: "Our Craft — Suzy Wood" },
      { property: "og:description", content: "Hand-joined solid wood, plant-based finishes, made to last generations." },
      { property: "og:image", content: craft },
    ],
  }),
  component: OurCraft,
});

function OurCraft() {
  return (
    <Layout>
      <section className="container mx-auto px-6 lg:px-10 pt-16 pb-24">
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.28em] text-secondary mb-3">Our Craft</p>
          <h1 className="font-serif text-5xl md:text-6xl text-balance">
            Furniture worth keeping for the next child.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
            Suzy Wood started in a small Cairo workshop with a simple belief: the first piece of furniture in
            a child's life should be the safest one in the home — and the one most worth keeping.
          </p>
        </div>

        <div className="mt-16 aspect-[16/8] rounded-3xl overflow-hidden shadow-elegant">
          <img src={craft} alt="Woodworker crafting furniture in the Cairo workshop" loading="lazy" width={1280} height={1280} className="h-full w-full object-cover" />
        </div>

        <div className="mt-20 grid md:grid-cols-3 gap-12">
          {[
            { t: "Solid Wood, Always", d: "We never use particleboard or veneers. Every joint, panel and rail is solid Finnish Moski , Contor or Zan." },
            { t: "Flawless Finishig", d: "All of our products stand out with its smooth and sleek finishes" },
            { t: "Built to Be Inherited", d: "Some Hardware Pieces are replaceable, and every piece can be refinished decades from now for extra cost" },
          ].map((b) => (
            <div key={b.t}>
              <h2 className="font-serif text-2xl">{b.t}</h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">{b.d}</p>
            </div>
          ))}
        </div>
      </section>
    </Layout>
  );
}
