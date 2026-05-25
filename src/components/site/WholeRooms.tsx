import r1 from "@/assets/whole-rooms/room-1.jpeg";
import r2 from "@/assets/whole-rooms/room-2.jpeg";
import r3 from "@/assets/whole-rooms/room-3.jpeg";
import r4 from "@/assets/whole-rooms/room-4.jpeg";
import r5 from "@/assets/whole-rooms/room-5.jpeg";
import r6 from "@/assets/whole-rooms/room-6.jpeg";
import r7 from "@/assets/whole-rooms/room-7.jpeg";
import r8 from "@/assets/whole-rooms/room-8.jpeg";
import r9 from "@/assets/whole-rooms/room-9.jpeg";
import r10 from "@/assets/whole-rooms/room-10.jpeg";
import r11 from "@/assets/whole-rooms/room-11.jpeg";

const images = [r1, r2, r3, r4, r5, r6, r7, r8, r9, r10, r11];

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
      <div className="grid gap-4 sm:gap-5 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {images.map((src, i) => (
          <div
            key={i}
            data-reveal
            style={{ transitionDelay: `${(i % 4) * 60}ms` }}
            className={`relative overflow-hidden rounded-3xl bg-muted shadow-soft hover:shadow-elegant transition-all duration-500 img-zoom ${
              i % 5 === 0 ? "aspect-[3/4] sm:col-span-2 sm:row-span-2 sm:aspect-square" : "aspect-[4/5]"
            }`}
          >
            <img
              src={src}
              alt={`Whole room design by Suzy Wood ${i + 1}`}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>
        ))}
      </div>
    </section>
  );
}