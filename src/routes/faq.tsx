import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/site/Layout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — Suzy Wood" },
      { name: "description", content: "Common questions about ordering, delivery, custom builds, care and returns." },
      { property: "og:title", content: "FAQ — Suzy Wood" },
      { property: "og:description", content: "Answers to common questions about Suzy Wood orders." },
    ],
  }),
  component: FAQPage,
});

type FAQGroup = { category: string; items: { q: string; a: string }[] };

function FAQPage() {
  const [groups, setGroups] = useState<FAQGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("site_content").select("value").eq("key", "faq_content").maybeSingle();
      if (data?.value) {
        try { setGroups(JSON.parse(data.value)); } catch { /* ignore */ }
      }
      setLoading(false);
    })();
  }, []);

  return (
    <Layout>
      <section className="container mx-auto px-6 py-16 lg:py-24 max-w-3xl">
        <h1 className="font-serif text-4xl lg:text-5xl text-center mb-3">Frequently Asked Questions</h1>
        <p className="text-center text-muted-foreground mb-12">Everything you might want to know before you order.</p>
        {loading ? (
          <p className="text-center text-muted-foreground">Loading…</p>
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