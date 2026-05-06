import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SiteContent = Record<string, string>;

let cache: SiteContent | null = null;
const listeners = new Set<(c: SiteContent) => void>();

async function fetchAll(): Promise<SiteContent> {
  const { data } = await supabase.from("site_content").select("key,value");
  const map: SiteContent = {};
  (data ?? []).forEach((r: { key: string; value: string }) => {
    map[r.key] = r.value;
  });
  cache = map;
  return map;
}

export function useSiteContent() {
  const [content, setContent] = useState<SiteContent>(cache ?? {});

  useEffect(() => {
    if (!cache) fetchAll().then(setContent);
    const cb = (c: SiteContent) => setContent({ ...c });
    listeners.add(cb);

    const channel = supabase
      .channel(`site_content_changes_${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_content" },
        async () => {
          const fresh = await fetchAll();
          listeners.forEach((l) => l(fresh));
        }
      )
      .subscribe();

    return () => {
      listeners.delete(cb);
      supabase.removeChannel(channel);
    };
  }, []);

  return content;
}

export function getContent(content: SiteContent, key: string, fallback = "") {
  return content[key] ?? fallback;
}