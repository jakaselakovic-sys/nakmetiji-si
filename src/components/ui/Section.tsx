// =============================================================================
// NaKmetiji.si — UI: Section
// Wrapper za page sekcije s konsistentnim spacingom
// =============================================================================

import { clsx } from "clsx";
import type { ReactNode } from "react";

interface SectionProps {
  children: ReactNode;
  className?: string;
  id?: string;
  containerWidth?: "sm" | "md" | "lg" | "xl" | "full";
  background?: "default" | "cream" | "forest" | "white";
  padding?: "sm" | "md" | "lg" | "xl";
}

const widthStyles = {
  sm: "max-w-3xl",
  md: "max-w-5xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
  full: "max-w-none",
};

const bgStyles = {
  default: "",
  cream: "bg-cream",
  forest: "bg-forest-900 text-white",
  white: "bg-white",
};

const paddingStyles = {
  sm: "py-10",
  md: "py-16",
  lg: "py-20",
  xl: "py-28",
};

export function Section({
  children,
  className,
  id,
  containerWidth = "xl",
  background = "default",
  padding = "lg",
}: SectionProps) {
  return (
    <section id={id} className={clsx(bgStyles[background], className)}>
      <div
        className={clsx(
          "mx-auto px-6 lg:px-8",
          widthStyles[containerWidth],
          paddingStyles[padding]
        )}
      >
        {children}
      </div>
    </section>
  );
}

// ── Section header ──

interface SectionHeaderProps {
  overline?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
  action?: ReactNode;
}

export function SectionHeader({
  overline,
  title,
  description,
  align = "left",
  className,
  action,
}: SectionHeaderProps) {
  return (
    <div
      className={clsx(
        "mb-12",
        align === "center" && "text-center",
        action && "flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4",
        className
      )}
    >
      <div>
        {overline && (
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-forest-600/70 mb-3 block">
            {overline}
          </span>
        )}
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-forest-900 font-display">
          {title}
        </h2>
        {description && (
          <p
            className={clsx(
              "mt-3 text-base text-earth-600 leading-relaxed",
              align === "center" ? "mx-auto max-w-2xl" : "max-w-lg"
            )}
          >
            {description}
          </p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
