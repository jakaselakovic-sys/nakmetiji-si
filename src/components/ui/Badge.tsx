// =============================================================================
// NaKmetiji.si — UI: Badge
// Značka za kategorije, statuse, tage
// =============================================================================

import { clsx } from "clsx";
import type { ReactNode } from "react";

type BadgeVariant = "default" | "forest" | "earth" | "premium" | "outline";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
  icon?: ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-earth-100 text-earth-700 border-earth-200",
  forest: "bg-forest-50 text-forest-700 border-forest-200",
  earth: "bg-earth-50 text-earth-700 border-earth-200",
  premium: "bg-gradient-to-r from-gold-600/10 to-gold-500/10 text-gold-600 border-gold-500/20",
  outline: "bg-transparent text-earth-600 border-earth-300",
};

export function Badge({
  children,
  variant = "default",
  className,
  icon,
}: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
        "transition-colors duration-200",
        variantStyles[variant],
        className
      )}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  );
}
