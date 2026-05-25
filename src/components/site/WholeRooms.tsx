import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { rooms } from "@/lib/rooms";

export function WholeRooms() {
  return (
    <section className="container mx-auto px-6 lg:px-10 py-20 md:py-28">
      <div className="max-w-xl mb-12" data-reveal>
        <p className="text-[11px] uppercase tracking-[0.32em] text-secondary mb-3">Inspiration</p>
        <h2 className="font-serif text-4xl md:text-5xl text-balance">Whole Rooms by Suzy Wood</h2>
        <p className="text-muted-foreground mt-3">
          Complete nursery and kids' room concepts, designed and crafted end-to-end.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {rooms.map((room, i) => (
          <Link
            key={room.slug}
            to="/rooms/$slug"
            params={{ slug: room.slug }}
            data-reveal
            style={{ transitionDelay: `${(i % 3) * 80}ms` }}
            className="group flex flex-col bg-card rounded-3xl overflow-hidden shadow-soft hover:shadow-elegant transition-all duration-500 border border-border/60 hover-lift"
          >
            <div className="relative aspect-[4/5] overflow-hidden bg-muted img-zoom">
              <img
                src={room.images[0]}
                alt={room.name}
                loading="lazy"
                className="h-full w-full object-cover"
              />
              <span className="absolute top-3 left-3 rounded-full bg-cream/90 backdrop-blur px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-wood-deep shadow-soft">
                {room.images.length} photos
              </span>
            </div>
            <div className="p-5 flex items-center justify-between gap-3">
              <div>
                <h3 className="font-serif text-xl leading-tight">{room.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{room.description}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-1 shrink-0" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}