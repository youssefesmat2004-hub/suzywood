import { Star } from "lucide-react";

export function StarRating({ value, size = "sm" }: { value: number; size?: "sm" | "md" }) {
  const px = size === "md" ? "h-5 w-5" : "h-3.5 w-3.5";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${px} ${i <= Math.round(value) ? "fill-secondary text-secondary" : "text-muted-foreground"}`}
        />
      ))}
    </div>
  );
}
