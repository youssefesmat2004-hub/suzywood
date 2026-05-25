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
import c1 from "@/assets/whole-rooms/room-c/img-1.jpeg";
import c2 from "@/assets/whole-rooms/room-c/img-2.jpeg";
import c3 from "@/assets/whole-rooms/room-c/img-3.jpeg";
import c4 from "@/assets/whole-rooms/room-c/img-4.jpeg";
import c5 from "@/assets/whole-rooms/room-c/img-5.jpeg";

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
    images: [r1, r2, r3, r4, r5, r6, r7, r8, r9, r10, r11],
  },
  {
    slug: "room-two",
    name: "Room Two",
    description: "Warm, calming kids' room designed end-to-end by Suzy Wood.",
    images: [b1, b2, b3, b4, b5],
  },
  {
    slug: "room-three",
    name: "Room Three",
    description: "Bespoke room build featuring custom wood furniture & details.",
    images: [c1, c2, c3, c4, c5],
  },
];

export const getRoom = (slug: string) => rooms.find((r) => r.slug === slug);