import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function FinalCTA() {
  return (
    <section className="container mx-auto px-6 lg:px-10 py-16">
      <div data-reveal className="relative overflow-hidden rounded-3xl bg-gradient-wood text-cream px-8 py-16 md:py-20 text-center shadow-elegant">
        <div className="pointer-events-none absolute inset-0 opacity-40 wood-grain rounded-3xl" style={{ height: "100%" }} />
        <div className="relative max-w-2xl mx-auto">
          <p className="text-[11px] uppercase tracking-[0.32em] text-cream/70 mb-3">Personal guidance</p>
          <h2 className="font-serif text-4xl md:text-5xl text-balance">Not sure what to choose?</h2>
          <p className="mt-4 text-cream/85 leading-relaxed">
            Book a free guidance session with our team — no commitment. We'll help you find the perfect piece for your nursery.
          </p>
          <div className="mt-7">
            <Button asChild size="lg" variant="secondary" className="bg-cream text-wood-deep hover:bg-cream/90 shadow-elegant pulse-glow">
              <Link to="/book">Book My Free Session</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
