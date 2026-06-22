import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Layout } from "@/components/site/Layout";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { getRoom, rooms, type Room } from "@/lib/rooms";

export const Route = createFileRoute("/rooms/$slug")({
  loader: ({ params }) => {
    const room = getRoom(params.slug);
    if (!room) throw notFound();
    return { room };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) return { meta: [] };
    const url = `https://suzywoodofficial.com/rooms/${params.slug}`;
    const room = loaderData.room;
    return {
      meta: [
        { title: `${room.name} — Suzy Wood` },
        { name: "description", content: room.description },
        { property: "og:title", content: `${room.name} — Suzy Wood` },
        { property: "og:description", content: room.description },
        { property: "og:image", content: room.images[0] },
        { property: "og:url", content: url },
        { property: "og:type", content: "article" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ImageGallery",
            name: `${room.name} — Suzy Wood`,
            description: room.description,
            url,
            image: room.images,
          }),
        },
      ],
    };
  },
  notFoundComponent: () => (
    <Layout>
      <div className="container mx-auto px-6 lg:px-10 py-24 text-center">
        <h1 className="font-serif text-4xl mb-3">Room not found</h1>
        <p className="text-muted-foreground mb-6">This room doesn't exist.</p>
        <Button asChild>
          <Link to="/">Back to home</Link>
        </Button>
      </div>
    </Layout>
  ),
  errorComponent: ({ error, reset }) => (
    <Layout>
      <div className="container mx-auto px-6 lg:px-10 py-24 text-center">
        <h1 className="font-serif text-4xl mb-3">Something went wrong</h1>
        <p className="text-muted-foreground mb-6">{error.message}</p>
        <Button onClick={() => reset()}>Try again</Button>
      </div>
    </Layout>
  ),
  component: RoomPage,
});

function RoomPage() {
  const { room } = Route.useLoaderData() as { room: Room };
  const others = rooms.filter((r) => r.slug !== room.slug);

  return (
    <Layout>
      <section className="container mx-auto px-6 lg:px-10 py-12 md:py-16">
        <Link
          to="/"
          hash="whole-rooms"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8"
        >
          <ArrowLeft className="h-4 w-4" /> All rooms
        </Link>

        <div className="max-w-2xl mb-10">
          <p className="text-[11px] uppercase tracking-[0.32em] text-secondary mb-3">Whole Room</p>
          <h1 className="font-serif text-4xl md:text-6xl text-balance">{room.name}</h1>
          <p className="text-muted-foreground mt-4 text-lg">{room.description}</p>
        </div>

        <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {room.images.map((src, i) => (
            <div
              key={i}
              className={`relative overflow-hidden rounded-3xl bg-muted shadow-soft img-zoom ${
                i === 0 ? "sm:col-span-2 sm:row-span-2 aspect-square" : "aspect-[4/5]"
              }`}
            >
              <img
                src={src}
                alt={`${room.name} by Suzy Wood — handcrafted nursery furniture, view ${i + 1} of ${room.images.length}`}
                loading={i < 2 ? "eager" : "lazy"}
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>

        {others.length > 0 && (
          <div className="mt-20">
            <h2 className="font-serif text-2xl md:text-3xl mb-6">Other rooms</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((r) => (
                <Link
                  key={r.slug}
                  to="/rooms/$slug"
                  params={{ slug: r.slug }}
                  className="group flex flex-col bg-card rounded-3xl overflow-hidden shadow-soft hover:shadow-elegant transition-all duration-500 border border-border/60 hover-lift"
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-muted img-zoom">
                    <img src={r.images[0]} alt={r.name} loading="lazy" className="h-full w-full object-cover" />
                  </div>
                  <div className="p-5">
                    <h3 className="font-serif text-lg">{r.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{r.images.length} photos</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>
    </Layout>
  );
}