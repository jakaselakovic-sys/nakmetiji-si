"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import { useScroll, useTransform, useSpring, motion } from "framer-motion";

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

const SUB1_INPUT = [0, 0.10, 0.20];
const SUB2_INPUT = [0.10, 0.20, 0.30, 0.40];
const SUB3_INPUT = [0.30, 0.40, 0.50, 0.60];
const SUB4_INPUT = [0.55, 0.70, 1.0];

const FADE_01   = [1, 1, 0];
const FADE_0110 = [0, 1, 1, 0];
const FADE_011  = [0, 1, 1];

export function ScrollytellingWrapper() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Detect mobile — reduce scroll height to prevent overwhelming scroll on small screens.
  // Initial: "800vh" (SSR-safe desktop default); updates after mount.
  const [heroHeight, setHeroHeight] = useState("800vh");
  useEffect(() => {
    function update() {
      setHeroHeight(window.innerWidth < 640 ? "400vh" : "800vh");
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
  // Desktop: stiffness 50 / damping 20 → heavy, cinematic Apple scroll feel.
  // The same spring works on mobile at 400vh — it just resolves faster since
  // the range is shorter, which actually feels more responsive on touch.
  const springScroll = useSpring(scrollYProgress, {
    stiffness: 50,
    damping: 20,
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
  const themeColor = useTransform(springScroll, THEME_INPUT, THEME_OUTPUT);

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

  const LAYERS = useMemo(
    () => [
      { bg: "bg-[url('/images/bg-mountains.webp')]" },
      { bg: "bg-[url('/images/bg-vineyards.webp')]" },
      { bg: "bg-[url('/images/bg-river.webp')]" },
      { bg: "bg-[url('/images/bg-sheep-night.png')]" },
    ],
    []
  );

  return (
    <section ref={containerRef} style={{ height: heroHeight }} className="relative">
      <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col bg-slate-950">

        {/* ── Background engine ───────────────────────────────────────────── */}
        <motion.div
          className="absolute inset-0 z-0 origin-center"
          style={{ scale: backgroundScale, y: backgroundY, willChange: "transform" }}
        >
          {LAYERS.map((layer, i) => (
            <motion.div
              key={i}
              className={`absolute inset-0 bg-cover bg-center ${layer.bg}`}
              style={{ opacity: opacities[i], willChange: "opacity" }}
            />
          ))}
        </motion.div>

        {/* Ambient overlay — improves text contrast without washing out imagery */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/65 z-10 pointer-events-none" />

        {/* ── Typography ──────────────────────────────────────────────────── */}
        <div className="relative z-20 flex flex-col items-center justify-center h-screen w-full px-6 text-center pointer-events-none">
          <div className="max-w-6xl relative -mt-32 sm:-mt-32">
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

            {/* Dynamic subtitles */}
            <div className="relative h-10 sm:h-12 flex justify-center items-center mt-6 sm:mt-8 text-xl sm:text-2xl md:text-3xl font-display font-medium italic text-white/90 drop-shadow-lg tracking-wide">
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
            </div>
          </div>
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
