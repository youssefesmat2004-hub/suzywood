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

export type Room = {
  slug: string;
  name: string;
  description: string;
  images: string[];
};

export const rooms: Room[] = [
  {
    slug: "room-one",
    name: "Room One",
    description: "A complete nursery concept handcrafted from solid wood.",
    images: [r1, r2, r3, r4],
  },
  {
    slug: "room-two",
    name: "Room Two",
    description: "Warm, calming kids' room designed end-to-end by Suzy Wood.",
    images: [r5, r6, r7],
  },
  {
    slug: "room-three",
    name: "Room Three",
    description: "Bespoke room build featuring custom wood furniture & details.",
    images: [r8, r9, r10, r11],
  },
];

export const getRoom = (slug: string) => rooms.find((r) => r.slug === slug);