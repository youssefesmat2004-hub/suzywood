import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/site/Layout";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — Suzy Wood" },
      { name: "description", content: "Suzy Wood terms and conditions covering orders, delivery and warranty." },
      { property: "og:title", content: "Terms & Conditions — Suzy Wood" },
      { property: "og:description", content: "Suzy Wood terms covering orders, delivery and warranty." },
      { property: "og:url", content: "https://suzywoodofficial.com/terms" },
    ],
    links: [{ rel: "canonical", href: "https://suzywoodofficial.com/terms" }],
  }),
  component: TermsPage,
});

function TermsPage() {
  const [content, setContent] = useState("");
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("site_content").select("value").eq("key", "terms_content").maybeSingle();
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

export function MarkdownBlock({ text }: { text: string }) {
  // Lightweight markdown rendering for headings / paragraphs / lists.
  const lines = text.split("\n");
  const blocks: React.ReactNode[] = [];
  let para: string[] = [];
  let list: string[] = [];
  const flushPara = () => { if (para.length) { blocks.push(<p key={blocks.length} className="text-muted-foreground leading-relaxed mb-4">{para.join(" ")}</p>); para = []; } };
  const flushList = () => { if (list.length) { blocks.push(<ul key={blocks.length} className="list-disc pl-6 space-y-1 text-muted-foreground mb-4">{list.map((li, i) => <li key={i}>{li}</li>)}</ul>); list = []; } };
  lines.forEach((raw) => {
    const line = raw.trimEnd();
    if (!line.trim()) { flushPara(); flushList(); return; }
    if (line.startsWith("# ")) { flushPara(); flushList(); blocks.push(<h1 key={blocks.length} className="font-serif text-4xl mb-6">{line.slice(2)}</h1>); return; }
    if (line.startsWith("## ")) { flushPara(); flushList(); blocks.push(<h2 key={blocks.length} className="font-serif text-2xl mt-8 mb-3">{line.slice(3)}</h2>); return; }
    if (line.startsWith("- ")) { flushPara(); list.push(line.slice(2)); return; }
    para.push(line);
  });
  flushPara(); flushList();
  return <article>{blocks}</article>;
}