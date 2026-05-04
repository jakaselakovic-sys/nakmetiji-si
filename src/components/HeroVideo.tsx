"use client";

// =============================================================================
// NaKmetiji.si — HeroVideo
// Boutique Luxe full-screen hero with 4K video loop + Framer Motion transitions.
// Falls back gracefully to a static image when no video src is provided or
// when the browser cannot play the video (codec error, network, power-save mode).
//
// Usage:
//   <HeroVideo videoSrc="/videos/hero-4k.mp4" fallbackSrc="/images/bg-mountains.webp">
//     <SearchWidget dozivetja={dozivetja} />
//   </HeroVideo>
// =============================================================================

import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";

interface HeroVideoProps {
  /** Primary 4K MP4 source (optional — falls back to image if absent) */
  videoSrc?: string;
  /** Static image shown while video loads and as permanent fallback */
  fallbackSrc?: string;
  fallbackAlt?: string;
  /** 0–1, applied to the dark gradient overlay. Default 0.45. */
  overlayStrength?: number;
  /** CSS min-height of the section. Defaults to 100svh. */
  minHeight?: string;
  children?: React.ReactNode;
}

function canUseMotionVideo() {
  if (typeof window === "undefined") return false;
  const motionOK = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const wideEnough = window.matchMedia("(min-width: 768px)").matches;
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  const dataOK = !connection?.saveData && connection?.effectiveType !== "2g";
  return motionOK && wideEnough && dataOK;
}

export function HeroVideo({
  videoSrc,
  fallbackSrc = "/images/bg-mountains.webp",
  fallbackAlt = "NaKmetiji — turistične kmetije v Sloveniji",
  overlayStrength = 0.48,
  minHeight = "100svh",
  children,
}: HeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [canPlayMotionVideo] = useState(canUseMotionVideo);

  // Slow the video playback rate for a more cinematic feel.
  useEffect(() => {
    if (videoRef.current && videoReady) {
      videoRef.current.playbackRate = 0.75;
    }
  }, [videoReady]);

  const showVideo = !!videoSrc && !videoFailed && canPlayMotionVideo;

  return (
    <section
      className="relative overflow-hidden bg-[#042519] flex items-center justify-center"
      style={{ minHeight }}
      aria-label="Hero sekcija"
    >
      {/* ── Static fallback image ── always rendered so there's no flash of
          solid colour. Fades out once the video is playing. */}
      <motion.div
        className="absolute inset-0 z-0"
        animate={{ opacity: videoReady ? 0 : 1 }}
        transition={{ duration: 1.8, ease: "easeInOut" }}
        style={{ willChange: "opacity" }}
      >
        <Image
          src={fallbackSrc}
          alt={fallbackAlt}
          fill
          priority
          quality={90}
          sizes="100vw"
          className="object-cover object-center"
        />
      </motion.div>

      {/* ── 4K video layer ── */}
      {showVideo && (
        <motion.video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          poster={fallbackSrc}
          onCanPlayThrough={() => setVideoReady(true)}
          onError={() => setVideoFailed(true)}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={videoReady
            ? { opacity: 1, scale: 1 }
            : { opacity: 0, scale: 1.04 }}
          transition={{ duration: 2.0, ease: "easeOut" }}
          className="absolute inset-0 w-full h-full object-cover z-[1]"
          style={{ willChange: "opacity, transform" }}
        >
          <source src={videoSrc} type="video/mp4" />
        </motion.video>
      )}

      {/* ── Boutique Luxe gradient overlay ──
          Top: deep Forest Green tint (#064E3B) for brand anchoring
          Mid: near-transparent for image clarity
          Bottom: dark vignette for text legibility */}
      <div
        className="absolute inset-0 z-[2] pointer-events-none"
        style={{
          background: `linear-gradient(
            170deg,
            rgba(6,78,59,${(overlayStrength * 0.65).toFixed(2)}) 0%,
            rgba(4,37,25,${(overlayStrength * 0.25).toFixed(2)}) 42%,
            rgba(0,0,0,${(overlayStrength * 1.6).toFixed(2)}) 100%
          )`,
        }}
        aria-hidden="true"
      />

      {/* ── Subtle film-grain texture overlay ── */}
      <div
        className="absolute inset-0 z-[2] pointer-events-none mix-blend-overlay opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "120px",
        }}
        aria-hidden="true"
      />

      {/* ── Gold accent light — top-right luxury flare ── */}
      <div
        className="absolute top-0 right-0 w-[38vw] h-[38vw] rounded-full pointer-events-none z-[2]"
        style={{
          background: "radial-gradient(ellipse at center, rgba(212,175,55,0.07) 0%, transparent 70%)",
          transform: "translate(20%, -20%)",
        }}
        aria-hidden="true"
      />

      {/* ── Content slot ── */}
      <div className="relative z-[3] w-full">{children}</div>
    </section>
  );
}
