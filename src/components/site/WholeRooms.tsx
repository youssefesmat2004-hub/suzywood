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
import b1 from "@/assets/whole-rooms/room-b/img-1.jpeg";
import b2 from "@/assets/whole-rooms/room-b/img-2.jpeg";
import b3 from "@/assets/whole-rooms/room-b/img-3.jpeg";
import b4 from "@/assets/whole-rooms/room-b/img-4.jpeg";
import b5 from "@/assets/whole-rooms/room-b/img-5.jpeg";

const rooms: { name: string; images: string[] }[] = [
  { name: "Room One", images: [r1, r2, r3, r4, r5, r6, r7, r8, r9, r10, r11] },
  { name: "Room Two", images: [b1, b2, b3, b4, b5] },
];

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

      <div className="space-y-16">
        {rooms.map((room, ri) => (
          <div key={ri} data-reveal>
            <div className="flex items-baseline justify-between gap-4 mb-6">
              <h3 className="font-serif text-2xl md:text-3xl">{room.name}</h3>
              <span className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                {room.images.length} photos
              </span>
            </div>
            <div className="grid gap-4 sm:gap-5 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {room.images.map((src, i) => (
                <div
                  key={i}
                  className="relative overflow-hidden rounded-3xl bg-muted shadow-soft hover:shadow-elegant transition-all duration-500 img-zoom aspect-[4/5]"
                >
                  <img
                    src={src}
                    alt={`${room.name} by Suzy Wood ${i + 1}`}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}