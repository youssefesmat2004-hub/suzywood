import { useEffect } from "react";

/**
 * Observe all [data-reveal] elements in the document and toggle .is-visible
 * when they enter the viewport. Runs once per mount.
 */
export function useReveal() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("IntersectionObserver" in window)) {
      document.querySelectorAll("[data-reveal]").forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.05 }
    );
    const scan = () => document.querySelectorAll("[data-reveal]:not(.is-visible)").forEach((el) => io.observe(el));
    // Defer the first scan so it runs after React finishes hydrating; adding
    // classes mid-hydration causes attribute mismatch warnings.
    const raf = requestAnimationFrame(scan);
    const mo = new MutationObserver(() => scan());
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { cancelAnimationFrame(raf); io.disconnect(); mo.disconnect(); };
  }, []);
}
