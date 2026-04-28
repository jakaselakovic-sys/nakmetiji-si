"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import { useScroll, useTransform, useSpring, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { HeroSearch } from "@/components/HeroSearch";
import { useVibeStore, VIBE_HERO_SUBTITLES, type VibeTag } from "@/lib/vibeStore";

// ---------------------------------------------------------------------------
// Transform input/output arrays defined at module level.
// Prevents array recreation on every render, which would otherwise cause
// Framer Motion to rebuild the interpolation function unnecessarily.
// ---------------------------------------------------------------------------

const BG_OPACITY_1 = { input: [0, 0.15, 0.30],    output: [1, 1, 0] };
const BG_OPACITY_2 = { input: [0.10, 0.25, 0.35, 0.50], output: [0, 1, 1, 0] };
const BG_OPACITY_3 = { input: [0.30, 0.45, 0.55, 0.70], output: [0, 1, 1, 0] };
const BG_OPACITY_4 = { input: [0.55, 0.70, 1.0],  output: [0, 1, 1] };

const THEME_INPUT  = [0, 0.15, 0.25, 0.35, 0.45, 0.55, 0.70];
const THEME_OUTPUT = ["#f8fafc", "#f8fafc", "#fef08a", "#fef08a", "#99f6e4", "#99f6e4", "#bae6fd"];

/** Accent color overrides per vibe — applied to the scrolling theme tint */
const VIBE_TINT: Record<VibeTag, string[]> = {
  wine:      ["#f8fafc", "#fde68a", "#d4a853", "#d4a853", "#d4a853", "#d4a853", "#fde68a"],
  family:    ["#f8fafc", "#bbf7d0", "#86efac", "#86efac", "#86efac", "#86efac", "#bbf7d0"],
  quiet:     ["#f8fafc", "#c7d2fe", "#a5b4fc", "#a5b4fc", "#93c5fd", "#93c5fd", "#bae6fd"],
  organic:   ["#f8fafc", "#d9f99d", "#bef264", "#bef264", "#a3e635", "#a3e635", "#d9f99d"],
  luxury:    ["#f8fafc", "#fef08a", "#fbbf24", "#fbbf24", "#f59e0b", "#f59e0b", "#fde68a"],
  adventure: ["#f8fafc", "#fdba74", "#fb923c", "#fb923c", "#f97316", "#f97316", "#fdba74"],
};

const SUB1_INPUT = [0, 0.10, 0.20];
const SUB2_INPUT = [0.10, 0.20, 0.30, 0.40];
const SUB3_INPUT = [0.30, 0.40, 0.50, 0.60];
const SUB4_INPUT = [0.55, 0.70, 1.0];

const FADE_01   = [1, 1, 0];
const FADE_0110 = [0, 1, 1, 0];
const FADE_011  = [0, 1, 1];

interface DozivetjeOption { id: string; ime: string; slug: string }

export function ScrollytellingWrapper({
  dozivetja = [],
}: {
  dozivetja?: DozivetjeOption[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const dominantVibe = useVibeStore((s) => s.dominantVibe);

  // Hero length — drastically shorter than the original 800vh.
  // Cinematic feeling preserved (4 cross-fading scenes), but the user reaches
  // the rest of the page in 3 page-flicks, not 8.
  // Mobile gets even shorter to respect touch scrolling.
  const [heroHeight, setHeroHeight] = useState("280vh");
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    function update() {
      const mobile = window.innerWidth < 640;
      setIsMobile(mobile);
      setHeroHeight(mobile ? "200vh" : "280vh");
    }
    update();
    window.addEventListener("resize", update, { passive: true });
    return () => window.removeEventListener("resize", update);
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Spring physics:
  //   Desktop: stiffness 50 / damping 20 — heavy cinematic feel
  //   Mobile:  stiffness 30 / damping 18 — lighter, cheaper to compute
  // Mobile budget matters more than buttery interpolation; users on slower
  // Androids would otherwise drop frames during the parallax.
  const springScroll = useSpring(scrollYProgress, {
    stiffness: isMobile ? 30 : 50,
    damping: isMobile ? 18 : 20,
    restDelta: 0.001,
  });

  // ── Background opacities ──────────────────────────────────────────────────
  const opacity1 = useTransform(springScroll, BG_OPACITY_1.input, BG_OPACITY_1.output);
  const opacity2 = useTransform(springScroll, BG_OPACITY_2.input, BG_OPACITY_2.output);
  const opacity3 = useTransform(springScroll, BG_OPACITY_3.input, BG_OPACITY_3.output);
  const opacity4 = useTransform(springScroll, BG_OPACITY_4.input, BG_OPACITY_4.output);

  // ── Background pan (subtle parallax) ─────────────────────────────────────
  const backgroundScale = useTransform(springScroll, [0, 1], [1.08, 1.0]);
  const backgroundY     = useTransform(springScroll, [0, 1], ["0%", "5%"]);

  // ── Accent color (tied to scene) ──────────────────────────────────────────
  const vibeOutputColors = dominantVibe ? VIBE_TINT[dominantVibe] : THEME_OUTPUT;
  const themeColor = useTransform(springScroll, THEME_INPUT, vibeOutputColors);

  // ── Subtitle crossfades ───────────────────────────────────────────────────
  const sub1Opacity = useTransform(springScroll, SUB1_INPUT, FADE_01);
  const sub2Opacity = useTransform(springScroll, SUB2_INPUT, FADE_0110);
  const sub3Opacity = useTransform(springScroll, SUB3_INPUT, FADE_0110);
  const sub4Opacity = useTransform(springScroll, SUB4_INPUT, FADE_011);

  // ── Progress bar ──────────────────────────────────────────────────────────
  const progressHeight = useTransform(springScroll, [0, 1], ["0%", "100%"]);

  // useMemo so layer array identity is stable across re-renders
  const opacities = useMemo(
    () => [opacity1, opacity2, opacity3, opacity4],
    [opacity1, opacity2, opacity3, opacity4]
  );

  // First image is the LCP — eager load with priority. Subsequent images
  // load lazy; the cross-fade is opacity-only so they're already in the DOM.
  const LAYERS = useMemo(
    () => [
      { src: "/images/bg-mountains.webp",  alt: "Slovenske gore",       priority: true  },
      { src: "/images/bg-vineyards.webp",  alt: "Vinogradi v sončnem zahodu", priority: false },
      { src: "/images/bg-river.webp",      alt: "Reka in gozd",         priority: false },
      { src: "/images/bg-sheep-night.png", alt: "Pašnik ob zori",       priority: false },
    ],
    []
  );

  return (
    <section ref={containerRef} style={{ height: heroHeight }} className="relative">
      <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col bg-slate-950">

        {/* ── Background engine ─────────────────────────────────────────────
            Outer wrapper: scroll-driven parallax scale/y.
            Inner wrapper: ambient auto-animation (gentle breathing + drift)
            — independent of scroll, so the scene feels alive on page load.
            Disabled when user prefers reduced motion. */}
        <motion.div
          className="absolute inset-0 z-0 origin-center"
          style={{ scale: backgroundScale, y: backgroundY, willChange: "transform" }}
        >
          <motion.div
            className="absolute inset-0"
            animate={
              prefersReducedMotion || isMobile
                ? undefined
                : { scale: [1, 1.035, 1], x: ["-0.6%", "0.6%", "-0.6%"] }
            }
            transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
            style={{ willChange: "transform" }}
          >
            {LAYERS.map((layer, i) => (
              <motion.div
                key={i}
                className="absolute inset-0"
                style={{ opacity: opacities[i], willChange: "opacity" }}
              >
                <Image
                  src={layer.src}
                  alt={layer.alt}
                  fill
                  priority={layer.priority}
                  loading={layer.priority ? "eager" : "lazy"}
                  sizes="100vw"
                  quality={85}
                  className="object-cover object-center"
                />
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Ambient overlay — improves text contrast without washing out imagery */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/65 z-10 pointer-events-none" />

        {/* ── Typography + above-the-fold search ───────────────────────────
            The hero copy sits just above center; HeroSearch is anchored to
            the bottom third so both are visible on any viewport without
            scrolling. pointer-events-auto only on the search wrapper. */}
        <div className="relative z-20 flex flex-col items-center justify-start h-screen w-full px-6 text-center pointer-events-none pt-[22vh] sm:pt-[20vh]">
          <div className="max-w-6xl relative">
            <motion.h1
              initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
              className="font-display text-5xl sm:text-7xl md:text-8xl lg:text-[7.5rem] font-bold text-white tracking-tight leading-[1.05] mb-6 max-w-6xl drop-shadow-2xl text-balance"
            >
              <span className="text-white/95">Odkrijte Slovenijo,</span>
              <motion.span
                className="block mt-2 font-script text-[1.15em] drop-shadow-lg"
                style={{ color: themeColor, willChange: "color" }}
              >
                ki diši po domačem.
              </motion.span>
            </motion.h1>

            {/* Dynamic subtitles — vibe-aware when dominant vibe is set */}
            <div className="relative h-10 sm:h-12 flex justify-center items-center mt-6 sm:mt-8 text-xl sm:text-2xl md:text-3xl font-display font-medium italic text-white/90 drop-shadow-lg tracking-wide">
              {dominantVibe ? (
                <motion.p
                  key={dominantVibe}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  className="absolute w-full text-center"
                >
                  {VIBE_HERO_SUBTITLES[dominantVibe]}
                </motion.p>
              ) : (
                <>
                  <motion.p className="absolute" style={{ opacity: sub1Opacity, willChange: "opacity" }}>
                    Kjer se nebo dotakne gora.
                  </motion.p>
                  <motion.p className="absolute" style={{ opacity: sub2Opacity, willChange: "opacity" }}>
                    Okusi ujeti v soncu.
                  </motion.p>
                  <motion.p className="absolute" style={{ opacity: sub3Opacity, willChange: "opacity" }}>
                    Osvežitev v objemu gozdov.
                  </motion.p>
                  <motion.p className="absolute w-full text-center" style={{ opacity: sub4Opacity, willChange: "opacity" }}>
                    Domačnost, ki vas objame.
                  </motion.p>
                </>
              )}
            </div>
          </div>

          {/* Above-the-fold search — fixed to bottom third of the sticky hero.
              pointer-events-auto only on this block so the background stays
              interactive via scroll. */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: "easeOut", delay: 0.8 }}
            className="pointer-events-auto mt-auto mb-[10vh] w-full max-w-4xl"
          >
            <HeroSearch dozivetja={dozivetja} />
          </motion.div>
        </div>

        {/* ── Progress indicator — desktop only ───────────────────────────── */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 z-50 hidden md:flex flex-col items-center gap-2">
          <div className="w-[2px] h-32 bg-white/10 rounded-full relative overflow-hidden">
            <motion.div
              className="absolute top-0 left-0 w-full"
              style={{ height: progressHeight, backgroundColor: themeColor }}
            />
          </div>
        </div>

      </div>
    </section>
  );
}
