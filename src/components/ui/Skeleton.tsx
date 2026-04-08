// =============================================================================
// NaKmetiji.si — UI: Skeleton
// Loading placeholder z animacijo
// =============================================================================

import { clsx } from "clsx";

interface SkeletonProps {
  className?: string;
  rounded?: "sm" | "md" | "lg" | "full" | "2xl";
}

export function Skeleton({ className, rounded = "lg" }: SkeletonProps) {
  const roundedStyles = {
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-full",
    "2xl": "rounded-2xl",
  };

  return (
    <div
      className={clsx(
        "bg-gradient-to-r from-earth-100 via-earth-50 to-earth-100",
        "animate-shimmer",
        roundedStyles[rounded],
        className
      )}
    />
  );
}

// ── Predpripravljeni skeleton-i ──

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-earth-200 overflow-hidden">
      <Skeleton className="h-48 w-full" rounded="sm" />
      <div className="p-5 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-6 w-16" rounded="full" />
          <Skeleton className="h-6 w-20" rounded="full" />
          <Skeleton className="h-6 w-14" rounded="full" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={clsx(
            "h-4",
            i === lines - 1 ? "w-2/3" : "w-full"
          )}
        />
      ))}
    </div>
  );
}
