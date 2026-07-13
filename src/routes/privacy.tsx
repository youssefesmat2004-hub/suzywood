import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/site/Layout";
import { MarkdownBlock } from "./terms";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Suzy Wood" },
      { name: "description", content: "Read the Suzy Wood privacy policy to learn what personal information we collect, how we use it, and the choices you have over your data." },
      { property: "og:title", content: "Privacy Policy — Suzy Wood" },
      { property: "og:description", content: "Learn how Suzy Wood collects, uses, and safeguards your personal information when you shop our handcrafted nursery furniture." },
      { property: "og:url", content: "https://suzywoodofficial.com/privacy" },
    ],
    links: [{ rel: "canonical", href: "https://suzywoodofficial.com/privacy" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const [content, setContent] = useState("");
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("site_content").select("value").eq("key", "privacy_content").maybeSingle();
      setContent(data?.value ?? "");
    })();
  }, []);
  return (
    <Layout>
      <section className="container mx-auto px-6 py-16 lg:py-24 max-w-3xl">
        <MarkdownBlock text={content} />
      </section>
    </Layout>
  );
}