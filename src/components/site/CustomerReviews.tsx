import { useCallback, useEffect, useState } from "react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { StarRating } from "./StarRating";
import { BadgeCheck, Facebook } from "lucide-react";

interface Testimonial {
  id: number;
  name: string;
  initials: string;
  avatarBg: string;
  date: string;
  rating: number;
  text: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Nourhan El-Sayed",
    initials: "NE",
    avatarBg: "bg-emerald-100 text-emerald-700",
    date: "2 weeks ago",
    rating: 5,
    text: "We ordered the Aurora crib for our daughter and it exceeded every expectation. The craftsmanship is remarkable — you can feel the quality in every joint and finish. Suzy was incredibly helpful customizing the dimensions to fit our nursery perfectly. Worth every pound.",
  },
  {
    id: 2,
    name: "Omar Hesham",
    initials: "OH",
    avatarBg: "bg-sky-100 text-sky-700",
    date: "1 month ago",
    rating: 5,
    text: "This is our second purchase from Suzy Wood. The toddler bed we bought last year still looks brand new, so coming back was an easy decision. The team communicated every step of the build process and the delivery was seamless. True heirloom quality.",
  },
  {
    id: 3,
    name: "Layla Mahmoud",
    initials: "LM",
    avatarBg: "bg-rose-100 text-rose-700",
    date: "2 months ago",
    rating: 5,
    text: "After searching for months for a non-toxic, solid wood nursery set, I finally found Suzy Wood. The attention to detail is incredible — rounded edges, smooth finish, and the wood grain is absolutely stunning. Our nursery feels like a magazine spread.",
  },
];

function FacebookBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#1877F2]">
      <BadgeCheck className="h-3.5 w-3.5 fill-[#1877F2] text-white" />
      Verified Facebook Review
    </span>
  );
}

function TestimonialCard({ t }: { t: Testimonial }) {
  return (
    <div className="bg-white rounded-2xl border border-border/60 shadow-soft p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div
          className={`h-11 w-11 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${t.avatarBg}`}
        >
          {t.initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-semibold text-sm text-foreground truncate">{t.name}</p>
            <FacebookBadge />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{t.date}</p>
        </div>
      </div>

      {/* Stars */}
      <div className="mb-3">
        <StarRating value={t.rating} size="md" />
      </div>

      {/* Review text */}
      <p className="text-sm text-foreground/85 leading-relaxed flex-1">
        “{t.text}”
      </p>

      {/* Facebook footer */}
      <div className="mt-4 pt-3 border-t border-border/40 flex items-center gap-1.5">
        <Facebook className="h-3.5 w-3.5 text-[#1877F2]" />
        <span className="text-[11px] text-muted-foreground">Recommended on Facebook</span>
      </div>
    </div>
  );
}

export function CustomerReviews() {
  const [api, setApi] = useState<any>(null);
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!api) return;
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => setCurrent(api.selectedScrollSnap()));
  }, [api]);

  const scrollTo = useCallback(
    (index: number) => api?.scrollTo(index),
    [api]
  );

  return (
    <section className="container mx-auto px-6 lg:px-10 py-20 lg:py-28">
      <div className="text-center mb-12">
        <p className="text-[11px] uppercase tracking-[0.28em] text-secondary mb-3">What Parents Say</p>
        <h2 className="font-serif text-4xl md:text-5xl text-balance">Loved by families across Egypt.</h2>
        <p className="text-muted-foreground mt-4 max-w-lg mx-auto leading-relaxed">
          Real reviews from real parents who chose Suzy Wood for their little ones.
        </p>
      </div>

      <div className="relative max-w-6xl mx-auto">
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          setApi={setApi}
          className="w-full"
        >
          <CarouselContent className="-ml-4 md:-ml-6">
            {testimonials.map((t) => (
              <CarouselItem
                key={t.id}
                className="pl-4 md:pl-6 basis-full sm:basis-1/2 lg:basis-1/3"
              >
                <TestimonialCard t={t} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex -left-14 bg-white border-border hover:bg-muted" />
          <CarouselNext className="hidden md:flex -right-14 bg-white border-border hover:bg-muted" />
        </Carousel>

        {/* Dot indicators */}
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: count }).map((_, i) => (
            <button
              key={i}
              onClick={() => scrollTo(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === current
                  ? "w-6 bg-primary"
                  : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Facebook social proof bar */}
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
        <div className="flex -space-x-2">
          {testimonials.map((t) => (
            <div
              key={t.id}
              className={`h-8 w-8 rounded-full border-2 border-background flex items-center justify-center text-[10px] font-semibold ${t.avatarBg}`}
            >
              {t.initials}
            </div>
          ))}
        </div>
        <span>
          Join <strong className="text-foreground">500+ families</strong> who recommend us on Facebook
        </span>
      </div>
    </section>
  );
}
