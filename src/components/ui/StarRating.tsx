// =============================================================================
// NaKmetiji.si — UI: StarRating
// Zvezdice za prikaz ocene (1-5)
// =============================================================================

import { Star } from "lucide-react";
import { clsx } from "clsx";

interface StarRatingProps {
  rating: number | null;
  maxStars?: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  reviewCount?: number;
  className?: string;
}

const sizeMap = {
  sm: { star: 14, text: "text-xs" },
  md: { star: 16, text: "text-sm" },
  lg: { star: 20, text: "text-base" },
};

export function StarRating({
  rating,
  maxStars = 5,
  size = "md",
  showValue = true,
  reviewCount,
  className,
}: StarRatingProps) {
  if (rating === null) {
    return (
      <span className={clsx("text-earth-400 italic", sizeMap[size].text, className)}>
        Še brez ocen
      </span>
    );
  }

  const { star: starSize, text } = sizeMap[size];

  return (
    <div className={clsx("inline-flex items-center gap-1", className)}>
      {Array.from({ length: maxStars }).map((_, i) => {
        const filled = i < Math.floor(rating);
        const halfFilled = !filled && i < Math.ceil(rating) && rating % 1 >= 0.3;

        return (
          <Star
            key={i}
            size={starSize}
            className={clsx(
              "transition-colors",
              filled
                ? "fill-gold-500 text-gold-500"
                : halfFilled
                ? "fill-gold-500/50 text-gold-500"
                : "fill-earth-200 text-earth-300"
            )}
          />
        );
      })}
      {showValue && (
        <span className={clsx("font-semibold text-forest-800 ml-1", text)}>
          {rating.toFixed(1)}
        </span>
      )}
      {reviewCount !== undefined && (
        <span className={clsx("text-earth-500 ml-0.5", text)}>
          ({reviewCount})
        </span>
      )}
    </div>
  );
}
