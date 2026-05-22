import { Sparkles, CalendarHeart, Truck } from "lucide-react";

const steps = [
  { Icon: Sparkles, title: "Browse & Choose", body: "Explore our collection and find the piece that feels right for your nursery." },
  { Icon: CalendarHeart, title: "Order or Book a Free Session", body: "Place an order directly, or chat with us first — we'll help you decide." },
  { Icon: Truck, title: "We Craft & Deliver", body: "Your piece is hand-built in Cairo and delivered to your door, ready to love." },
];

export function HowItWorks() {
  return (
    <section className="container mx-auto px-6 lg:px-10 py-20 md:py-28">
      <div className="text-center max-w-2xl mx-auto mb-14" data-reveal>
        <p className="text-[11px] uppercase tracking-[0.32em] text-secondary mb-3">How it works</p>
        <h2 className="font-serif text-4xl md:text-5xl text-balance">From workshop to nursery, with care at every step</h2>
      </div>
      <div className="grid md:grid-cols-3 gap-8 md:gap-6 relative">
        <div className="hidden md:block absolute top-12 left-[16.66%] right-[16.66%] h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        {steps.map(({ Icon, title, body }, i) => (
          <div key={title} data-reveal style={{ transitionDelay: `${i * 120}ms` }} className="relative flex flex-col items-center text-center">
            <div className="relative h-24 w-24 rounded-full bg-card border border-border shadow-card flex items-center justify-center">
              <Icon className="h-8 w-8 text-primary" />
              <span className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center shadow-soft">
                {i + 1}
              </span>
            </div>
            <h3 className="font-serif text-xl mt-6">{title}</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-xs leading-relaxed">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
