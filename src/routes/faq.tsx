import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/site/Layout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ARABIC_FAQ } from "@/lib/arabic-faq";

type FAQGroup = { category: string; items: { q: string; a: string }[] };

export const Route = createFileRoute("/faq")({
  loader: async (): Promise<{ groups: FAQGroup[] }> => {
    const { data } = await supabase.from("site_content").select("value").eq("key", "faq_content").maybeSingle();
    let groups: FAQGroup[] = [];
    if (data?.value) {
      try { groups = JSON.parse(data.value); } catch { /* ignore */ }
    }
    return { groups };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: "FAQ — Suzy Wood | أسئلة شائعة عن أثاث غرف الأطفال" },
      { name: "description", content: "Common questions about ordering, delivery, custom builds, care and returns. أسئلة شائعة عن أسعار سراير الأطفال الخشبية، التوصيل داخل القاهرة ومصر، والدفع والتصنيع حسب الطلب." },
      { property: "og:title", content: "FAQ — Suzy Wood | أسئلة شائعة" },
      { property: "og:description", content: "إجابات عن أسئلتك حول أثاث غرف الأطفال المصنوع يدويًا في القاهرة — الأسعار، التوصيل، الدفع ومدة التنفيذ." },
      { property: "og:url", content: "https://suzywoodofficial.com/faq" },
      { property: "og:locale", content: "en_US" },
      { property: "og:locale:alternate", content: "ar_EG" },
    ],
    links: [{ rel: "canonical", href: "https://suzywoodofficial.com/faq" }],
    scripts: (() => {
      const items = [
        ...(loaderData?.groups ?? []).flatMap((g) => g.items),
        ...ARABIC_FAQ,
      ];
      if (!items.length) return [];
      return [{
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          inLanguage: ["en", "ar"],
          mainEntity: items.map((it) => ({
            "@type": "Question",
            name: it.q,
            acceptedAnswer: { "@type": "Answer", text: it.a },
          })),
        }),
      }];
    })(),
  }),

  component: FAQPage,
});

function FAQPage() {
  const { groups } = Route.useLoaderData() as { groups: FAQGroup[] };

  return (
    <Layout>
      <section className="container mx-auto px-6 py-16 lg:py-24 max-w-3xl">
        <h1 className="font-serif text-4xl lg:text-5xl text-center mb-3">Frequently Asked Questions</h1>
        <p className="text-center text-muted-foreground mb-12">Everything you might want to know before you order.</p>
        {groups.length === 0 ? (
          <p className="text-center text-muted-foreground">No FAQs yet.</p>
        ) : (
          <div className="space-y-10">
            {groups.map((g) => (
              <div key={g.category}>
                <h2 className="font-serif text-2xl mb-4">{g.category}</h2>
                <Accordion type="single" collapsible className="rounded-2xl border border-border bg-card divide-y divide-border">
                  {g.items.map((it, i) => (
                    <AccordionItem key={i} value={`${g.category}-${i}`} className="border-0 px-5">
                      <AccordionTrigger className="text-left hover:no-underline">{it.q}</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">{it.a}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
}