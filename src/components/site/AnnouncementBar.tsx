export function AnnouncementBar() {
  return (
    <div className="relative overflow-hidden bg-gradient-wood text-cream">
      <div className="container mx-auto px-6 lg:px-10 py-2.5 text-center text-[12px] md:text-[13px] tracking-wide">
        🪵 Handcrafted with love — Free delivery on orders above 1,500 EGP
      </div>
      <div className="pointer-events-none absolute inset-0 animate-shimmer opacity-60" />
    </div>
  );
}
