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
    name: "Kanzy Badr",
    initials: "KB",
    avatarBg: "bg-emerald-100 text-emerald-700",
    date: "23 Apr",
    rating: 5,
    text: "Great quality. I customized the stair gates with her and it was wonderful.",
  },
  {
    id: 2,
    name: "Dena Hussien El-Maghraby",
    initials: "DH",
    avatarBg: "bg-sky-100 text-sky-700",
    date: "10 Aug 2025",
    rating: 5,
    text: "Highly recommend, Excellence in every step. We bought a beautiful drawer unit and even 3.5 years later, after heavy use by our kids, any small issue had nothing to do with the product's quality or durability. Suzy responds quickly, honors appointments, and follows through until everything is perfect.",
  },
  {
    id: 3,
    name: "Malak Ashraf",
    initials: "MA",
    avatarBg: "bg-rose-100 text-rose-700",
    date: "13 Oct 2024",
    rating: 5,
    text: "Great service and craftsmanship! Perfect finishing and design execution 👏🏼👏🏼 100% recommended.",
  },
  {
    id: 4,
    name: "Basma Osama Abdou",
    initials: "BO",
    avatarBg: "bg-amber-100 text-amber-700",
    date: "25 Jun 2024",
    rating: 5,
    text: "One of the best 🤍 thank you so much.",
  },
  {
    id: 5,
    name: "هاجر وحيد",
    initials: "هو",
    avatarBg: "bg-violet-100 text-violet-700",
    date: "20 Nov 2025",
    rating: 5,
    text: "تجربتي كانت ممتازة جدا، الدولاب طلع أحسن مما توقعت، وشغله متقن جدًا. التعامل معاها راقي ومحترم والالتزام في المواعيد فوق الممتاز.",
  },
];

function FacebookBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-facebook">
      <BadgeCheck className="h-3.5 w-3.5 fill-facebook text-white" />
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
      <p className="text-sm text-foreground leading-relaxed flex-1">
        “{t.text}”
      </p>

      {/* Facebook footer */}
      <div className="mt-4 pt-3 border-t border-border/40 flex items-center gap-1.5">
        <Facebook className="h-3.5 w-3.5 text-facebook" />
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
      <a
        href="https://www.facebook.com/share/1G52ndaFE6/?mibextid=wwXIfr"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-10 flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors group"
      >
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
        <span className="inline-flex items-center gap-1.5">
          <Facebook className="h-4 w-4 text-facebook" />
          <strong className="text-foreground">100% recommend</strong> · 257 reviews on Facebook
          <span className="underline-offset-4 group-hover:underline">— visit our page</span>
        </span>
      </a>
    </section>
  );
}
