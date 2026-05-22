import { Instagram } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { resolveImage } from "@/lib/images";

const IG_URL = "https://www.instagram.com/suzywoodofficial?igsh=MWo3MXJjM296aW9oNA==";

export function InstagramStrip() {
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("products")
        .select("image_url, gallery")
        .eq("is_active", true)
        .not("image_url", "is", null)
        .limit(12);
      const urls: string[] = [];
      for (const row of data ?? []) {
        if (row.image_url) urls.push(resolveImage(row.image_url));
        const g = Array.isArray(row.gallery) ? row.gallery : [];
        for (const it of g) if (typeof it === "string") urls.push(resolveImage(it));
      }
      if (!cancelled) setImages(urls.slice(0, 6));
    })();
    return () => { cancelled = true; };
  }, []);

  if (images.length === 0) return null;

  return (
    <section className="container mx-auto px-6 lg:px-10 py-20 md:py-24">
      <div className="text-center mb-10" data-reveal>
        <p className="text-[11px] uppercase tracking-[0.32em] text-secondary mb-3">Follow our journey</p>
        <a href={IG_URL} target="_blank" rel="noopener noreferrer" className="inline-block font-serif text-3xl md:text-4xl hover:text-primary transition-colors">
          @suzywood
        </a>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        {images.map((src, i) => (
          <a
            key={i}
            href={IG_URL}
            target="_blank"
            rel="noopener noreferrer"
            data-reveal
            style={{ transitionDelay: `${i * 70}ms` }}
            className="group relative aspect-square overflow-hidden rounded-xl bg-muted img-zoom"
          >
            <img src={src} alt="Suzy Wood instagram" loading="lazy" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-wood-deep/0 group-hover:bg-wood-deep/55 transition-colors duration-300 flex items-center justify-center">
              <Instagram className="h-7 w-7 text-cream opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
