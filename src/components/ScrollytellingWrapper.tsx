"use client";

import { useRef } from "react";
import { useScroll, useTransform, useSpring, motion } from "framer-motion";

export function ScrollytellingWrapper() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Track scroll within the 700vh container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Apply spring smoothing - the secret sauce for the "heavy" Apple scroll feel
  const springScroll = useSpring(scrollYProgress, {
    stiffness: 50,
    damping: 20,
    restDelta: 0.001
  });

  // ––––– LAYER OPACITIES (Backgrounds) –––––
  // ALL visual cross-fades complete absolutely by 0.70!
  // This leaves 30% of an 800vh container (2.4 whole screen heights) as a pure visual freeze.
  const opacity1 = useTransform(springScroll, [0, 0.15, 0.30], [1, 1, 0]);
  const opacity2 = useTransform(springScroll, [0.10, 0.25, 0.35, 0.50], [0, 1, 1, 0]);
  const opacity3 = useTransform(springScroll, [0.30, 0.45, 0.55, 0.70], [0, 1, 1, 0]); 
  const opacity4 = useTransform(springScroll, [0.55, 0.70, 1.0], [0, 1, 1]);
  const opacities = [opacity1, opacity2, opacity3, opacity4];

  // ––––– BACKGROUND SCALING (Zoom-out on arrival) –––––
  const backgroundScale = useTransform(springScroll, [0, 1], [1.1, 1.0]);
  const backgroundY = useTransform(springScroll, [0, 1], ["0%", "5%"]); 

  // ––––– DYNAMIC UI SHIFTING (Text colors) –––––
  const themeColor = useTransform(
    springScroll, 
    [0, 0.15,  0.25, 0.35,  0.45, 0.55,  0.70], 
    [
      "#f8fafc", // Mountains
      "#f8fafc", 
      "#fef08a", // Vineyards
      "#fef08a", 
      "#99f6e4", // River
      "#99f6e4", 
      "#bae6fd"  // Night
    ]
  );

  // ––––– DYNAMIC SUBTITLES –––––
  const sub1Opacity = useTransform(springScroll, [0, 0.10, 0.20], [1, 1, 0]);
  const sub2Opacity = useTransform(springScroll, [0.10, 0.20, 0.30, 0.40], [0, 1, 1, 0]);
  const sub3Opacity = useTransform(springScroll, [0.30, 0.40, 0.50, 0.60], [0, 1, 1, 0]);
  const sub4Opacity = useTransform(springScroll, [0.55, 0.70, 1.0], [0, 1, 1]);

  // ––––– PROGRESS TIMELINE (Right side) –––––
  const progressHeight = useTransform(springScroll, [0, 1], ["0%", "100%"]);

  return (
    <section ref={containerRef} className="relative h-[800vh]">
      <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col bg-slate-950 context-layer">
        
        {/* =========================================================
            BACKGROUND ENGINE (Pure Image Cross-Fading)
            ========================================================= */}
        <motion.div 
          className="absolute inset-0 z-0 origin-center"
          style={{ 
            scale: backgroundScale, 
            y: backgroundY, 
            willChange: "transform" 
          }}
        >
          {/* Layer 1: Mountains */}
          <motion.div 
            className="absolute inset-0 bg-cover bg-center bg-[url('/images/bg-mountains.webp')]" 
            style={{ opacity: opacities[0], willChange: 'opacity' }}
          />

          {/* Layer 2: Vineyards */}
          <motion.div 
            className="absolute inset-0 bg-cover bg-center bg-[url('/images/bg-vineyards.webp')]"
            style={{ opacity: opacities[1], willChange: 'opacity' }}
          />

          {/* Layer 3: River */}
          <motion.div 
            className="absolute inset-0 bg-cover bg-center bg-[url('/images/bg-river.webp')]"
            style={{ opacity: opacities[2], willChange: 'opacity' }}
          />

          {/* Layer 4: Sheep Farm (Night) */}
          <motion.div 
            className="absolute inset-0 bg-cover bg-center bg-[url('/images/bg-sheep-night.png')]"
            style={{ opacity: opacities[3], willChange: 'opacity' }}
          />
        </motion.div>

        {/* Ambient Dark Overlay for High-Contrast Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 z-10 pointer-events-none" />

        {/* =========================================================
            FOREGROUND SECTIONS (Minimalist Typography)
            ========================================================= */}
        <div className="relative z-20 flex flex-col items-center justify-center h-screen w-full px-6 text-center pointer-events-none">
          {/* Main Typographic Display (STATIC - No Parallax) */}
          <div className="max-w-6xl relative -mt-32">
            <motion.h1 
              initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
              className="font-display text-6xl sm:text-7xl md:text-8xl lg:text-[7.5rem] font-bold text-white tracking-tight leading-[1.05] mb-6 max-w-6xl drop-shadow-2xl"
            >
              <span className="text-white/95">Odkrijte Slovenijo,</span>
              <motion.span 
                className="block mt-2 font-black italic drop-shadow-lg"
                style={{ color: themeColor, willChange: "color" }}
              >
                ki diši po domačem.
              </motion.span>
            </motion.h1>
            
            {/* Dynamic Subtitles */}
            <div className="relative h-12 flex justify-center items-center mt-8 text-2xl md:text-3xl font-display font-medium italic text-white/90 drop-shadow-lg tracking-wide">
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

        {/* =========================================================
            VERTICAL PROGRESS INDICATOR (Apple-Style)
            ========================================================= */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-2 hidden md:flex">
          {/* Background Track */}
          <div className="w-[2px] h-32 bg-white/10 rounded-full relative overflow-hidden">
            {/* Active Fill Line linked to Day-to-Night color */}
            <motion.div 
              className="absolute top-0 left-0 w-full bg-white/70"
              style={{ height: progressHeight, backgroundColor: themeColor }}
            />
          </div>
        </div>

      </div>
    </section>
  );
}
