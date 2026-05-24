import { useEffect, useState } from "react";

export function BrandLoader() {
  const [show, setShow] = useState(true);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Show once per session so it never feels repetitive
    if (sessionStorage.getItem("sw_loader_done") === "1") {
      setShow(false);
      return;
    }
    const t1 = setTimeout(() => setLeaving(true), 700);
    const t2 = setTimeout(() => {
      setShow(false);
      sessionStorage.setItem("sw_loader_done", "1");
    }, 1300);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (!show) return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-gradient-warm pointer-events-none ${leaving ? "loading-fade-out" : ""}`}
    >
      <div className="flex flex-col items-center gap-5 animate-float">
        <div className="font-serif text-5xl md:text-6xl text-primary tracking-tight">
          Suzy <span className="italic text-secondary">Wood</span>
        </div>
        <div className="h-[2px] w-32 overflow-hidden rounded-full bg-beige">
          <div className="h-full w-1/2 animate-shimmer bg-primary/40" />
        </div>
        <p className="text-xs uppercase tracking-[0.32em] text-muted-foreground">Handcrafted with love</p>
      </div>
    </div>
  );
}
