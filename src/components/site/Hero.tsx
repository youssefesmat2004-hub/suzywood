import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import hero from "@/assets/hero-nursery.jpg";
import roomFloat from "@/assets/whole-rooms/room-1.jpeg";
import { ArrowRight } from "lucide-react";

interface HeroProps {
  title?: string;
  subtitle?: string;
}

export function Hero({ title, subtitle }: HeroProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (!ref.current) return;
        const top = ref.current.getBoundingClientRect().top;
        // Parallax only when in viewport vicinity
        setOffset(Math.max(-120, Math.min(120, -top * 0.18)));
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, []);

  return (
    <section ref={ref} className="relative min-h-[88vh] md:min-h-screen flex items-center overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <img
          src={hero}
          alt=""
          aria-hidden="true"
          width={1920}
          height={1280}
          fetchPriority="high"
          decoding="async"
          className="h-[120%] w-full object-cover will-change-transform"
          style={{ transform: `translate3d(0, ${offset}px, 0)` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-cream/30 via-cream/40 to-cream" />
      </div>

      <div className="container mx-auto px-6 lg:px-10 py-24 md:py-32">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-7" data-reveal>
            <span className="inline-flex items-center gap-2 rounded-full bg-cream/80 backdrop-blur border border-border px-3.5 py-1.5 text-[11px] uppercase tracking-[0.28em] text-wood-deep shadow-soft">
              <span className="h-1.5 w-1.5 rounded-full bg-secondary animate-pulse" /> Est. 2018 · Cairo
            </span>
            <h1 className="font-serif text-5xl md:text-7xl lg:text-[5.5rem] leading-[1.02] text-balance text-wood-deep">
              {title ?? "Premium Baby & Toddlers Furniture"}
              <br />
              <span className="text-wood-deep">For Your Little One</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed">
              {subtitle ?? "Handmade wooden baby furniture, built to last a lifetime."}
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild size="lg" className="pulse-glow group">
                <Link to="/shop">
                  Shop Now <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-wood-deep text-wood-deep hover:bg-wood-deep hover:text-cream">
                <Link to="/book">Book a Free Session</Link>
              </Button>
            </div>
          </div>

          <div className="lg:col-span-5 hidden lg:flex justify-end relative">
            <div className="relative animate-float">
              <div className="aspect-[4/5] w-[360px] rounded-3xl overflow-hidden shadow-elegant border-4 border-cream">
                <img src={roomFloat} alt="Suzy Wood nursery room" className="h-full w-full object-cover" />
              </div>
              <div className="absolute -bottom-6 -left-10 bg-card border border-border rounded-2xl px-5 py-4 shadow-card">
                <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Lead time</p>
                <p className="font-serif text-xl mt-0.5">3–4 weeks</p>
              </div>
              <div className="absolute -top-4 -right-6 bg-secondary text-cream rounded-full px-4 py-2 text-xs shadow-card rotate-3">
                ⭐ 5-star rated
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
