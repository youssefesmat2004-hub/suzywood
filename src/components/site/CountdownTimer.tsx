import { useEffect, useRef, useState } from "react";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function getTimeLeft(target: Date): TimeLeft {
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  const prevRef = useRef(value);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (prevRef.current !== value) {
      setAnimate(true);
      const id = setTimeout(() => setAnimate(false), 500);
      prevRef.current = value;
      return () => clearTimeout(id);
    }
  }, [value]);

  const display = String(value).padStart(2, "0");

  return (
    <div className="flex flex-col items-center gap-2 sm:gap-3">
      <div className="relative bg-card/90 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-border/60 shadow-soft w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 flex items-center justify-center overflow-hidden hover-lift">
        <div
          className={`font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-wood-deep tabular-nums leading-none tracking-tight transition-transform duration-500 ease-[cubic-bezier(0.2,0.7,0.2,1)] ${animate ? "-translate-y-full opacity-0" : "translate-y-0 opacity-100"}`}
        >
          {display}
        </div>
        <div
          className={`absolute font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-wood-deep tabular-nums leading-none tracking-tight transition-transform duration-500 ease-[cubic-bezier(0.2,0.7,0.2,1)] ${animate ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"}`}
        >
          {display}
        </div>
      </div>
      <span className="text-[9px] sm:text-[10px] md:text-xs uppercase tracking-[0.24em] text-muted-foreground font-sans">
        {label}
      </span>
    </div>
  );
}

export function CountdownTimer() {
  // Target: June 5, 2026 at 2:00 PM
  const targetDateRef = useRef(new Date(2026, 5, 5, 14, 0, 0));
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(targetDateRef.current));
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const tick = () => {
      const next = getTimeLeft(targetDateRef.current);
      setTimeLeft(next);
      if (
        next.days === 0 &&
        next.hours === 0 &&
        next.minutes === 0 &&
        next.seconds === 0
      ) {
        setExpired(true);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (expired) {
    return (
      <div className="animate-in fade-in zoom-in-95 duration-700">
        <div className="relative bg-card/90 backdrop-blur-md rounded-3xl border border-border/60 shadow-card px-8 py-8 sm:px-12 sm:py-10 max-w-lg mx-auto text-center">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-sage text-cream rounded-full px-4 py-1.5 text-xs font-medium shadow-soft">
            We're Live!
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-wood-deep text-balance mt-2">
            Our new website is now available!
          </h2>
          <p className="text-muted-foreground mt-3 max-w-sm mx-auto text-sm sm:text-base">
            Thank you for waiting. Discover our handcrafted collection and create a beautiful space for your little one.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div data-reveal className="w-full">
      <div className="flex flex-col items-center gap-4 sm:gap-6">
        <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.32em] text-secondary font-sans">
          Launching Soon
        </p>
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 justify-center">
          <TimeUnit value={timeLeft.days} label="Days" />
          <span className="text-xl sm:text-2xl md:text-3xl text-wood/50 font-serif pb-5 sm:pb-6">
            :
          </span>
          <TimeUnit value={timeLeft.hours} label="Hours" />
          <span className="text-xl sm:text-2xl md:text-3xl text-wood/50 font-serif pb-5 sm:pb-6">
            :
          </span>
          <TimeUnit value={timeLeft.minutes} label="Minutes" />
          <span className="text-xl sm:text-2xl md:text-3xl text-wood/50 font-serif pb-5 sm:pb-6">
            :
          </span>
          <TimeUnit value={timeLeft.seconds} label="Seconds" />
        </div>
      </div>
    </div>
  );
}
