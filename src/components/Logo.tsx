// =============================================================================
// NaKmetiji.si — Logo
// Hand-set wordmark: dark-brown serif "NaKmetiji" with the "K" carrying extra
// weight, followed by ".si" in forest green. Sized via the `size` prop so the
// same component works in the navbar, hero, footer, and OG images.
// =============================================================================

import Link from "next/link";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "dark" | "light";   // dark = brown brand, light = white-on-dark for nav
  href?: string | null;          // pass null to render plain (no link)
  className?: string;
}

const SIZES = {
  sm:  "text-lg",
  md:  "text-2xl",
  lg:  "text-4xl",
  xl:  "text-6xl",
};

export function Logo({ size = "md", variant = "dark", href = "/", className = "" }: LogoProps) {
  const inner = (
    <span
      className={`inline-flex items-baseline font-display font-black leading-none tracking-tight ${SIZES[size]} ${className}`}
    >
      <span style={{ color: variant === "light" ? "#FDFBF7" : "#3d2c1e" }}>
        Na<span className="font-black">K</span>metiji
      </span>
      <span
        style={{ color: variant === "light" ? "#9ae6b4" : "#2D5A27" }}
        className="ml-0.5 font-bold text-[0.55em] tracking-tight"
      >
        .si
      </span>
    </span>
  );

  if (href === null) return inner;
  return (
    <Link href={href} aria-label="NaKmetiji.si — domov" className="inline-flex items-center">
      {inner}
    </Link>
  );
}
