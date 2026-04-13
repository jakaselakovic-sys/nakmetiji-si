"use client";

// =============================================================================
// NaKmetiji.si — FarmVideoModal
// Cinematic 15-second video loop modal for farm detail pages.
//
// Trigger: "Predogled" pill button overlaid on the hero image.
// Physics: scale(0.96) → scale(1) spring entry, fade exit.
// The <video> is lazy: src is only set once the modal opens (no bandwidth waste
// for users who never click). On close, the video is paused immediately so
// there's no background audio after dismissal.
//
// Usage in FarmProfileClient:
//   <FarmVideoModal videoUrl={kmetija.video_url} farmIme={kmetija.ime} />
//
// If videoUrl is null/undefined the component renders nothing.
// =============================================================================

import { useEffect, useRef, useState, startTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Volume2, VolumeX, Maximize2 } from "lucide-react";

interface Props {
  videoUrl: string | null | undefined;
  farmIme: string;
}

export function FarmVideoModal({ videoUrl, farmIme }: Props) {
  const [open,   setOpen]   = useState(false);
  const [muted,  setMuted]  = useState(true);
  const [loaded, setLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Pause + reset when modal closes
  useEffect(() => {
    if (!open && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      startTransition(() => setLoaded(false));
    }
  }, [open]);

  // Play as soon as the video is ready after opening
  useEffect(() => {
    if (open && loaded && videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay blocked — user must tap play; muted should prevent this on most browsers
      });
    }
  }, [open, loaded]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!videoUrl) return null;

  return (
    <>
      {/* ── Trigger button ──────────────────────────────────────────────── */}
      <motion.button
        onClick={() => setOpen(true)}
        whileTap={{ scale: 0.95 }}
        className="inline-flex items-center gap-2 rounded-full bg-black/40 backdrop-blur-md border border-white/30 px-4 py-2 text-sm font-semibold text-white hover:bg-black/60 transition-all shadow-lg"
        aria-label={`Predogled videa — ${farmIme}`}
      >
        <Play size={14} fill="white" />
        Video predogled
      </motion.button>

      {/* ── Modal ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="video-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              key="video-card"
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl bg-black"
            >
              {/* Video */}
              <div className="relative aspect-video bg-black">
                {/* Loading shimmer */}
                {!loaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-forest-950">
                    <div className="flex flex-col items-center gap-3 text-white/40">
                      <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-white/70 animate-spin" />
                      <span className="text-xs font-medium uppercase tracking-wider">Nalaganje...</span>
                    </div>
                  </div>
                )}

                <video
                  ref={videoRef}
                  src={videoUrl}
                  muted={muted}
                  loop
                  playsInline
                  preload="auto"
                  onCanPlay={() => setLoaded(true)}
                  className={`w-full h-full object-cover transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
                />

                {/* Controls overlay */}
                <div className="absolute inset-0 flex flex-col justify-between p-4 bg-gradient-to-t from-black/60 via-transparent to-black/30 opacity-0 hover:opacity-100 transition-opacity duration-200">
                  {/* Top row */}
                  <div className="flex items-start justify-between">
                    <div className="inline-flex items-center gap-2 rounded-full bg-black/40 backdrop-blur-sm px-3 py-1.5">
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-white text-xs font-semibold uppercase tracking-wider">Live preview</span>
                    </div>
                    <button
                      onClick={() => setOpen(false)}
                      className="p-2 rounded-full bg-black/40 backdrop-blur-sm text-white/70 hover:text-white transition-colors"
                      aria-label="Zapri"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Bottom row */}
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-white font-bold text-lg leading-tight drop-shadow">{farmIme}</p>
                      <p className="text-white/60 text-xs mt-0.5">Cinematic preview</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setMuted(!muted)}
                        className="p-2.5 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-all"
                        aria-label={muted ? "Vklopi zvok" : "Izklopi zvok"}
                      >
                        {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                      </button>
                      <button
                        onClick={() => videoRef.current?.requestFullscreen?.()}
                        className="p-2.5 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-all"
                        aria-label="Celozaslonski način"
                      >
                        <Maximize2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Farm name footer */}
              <div className="px-5 py-3.5 bg-black flex items-center justify-between">
                <p className="text-white/70 text-sm font-medium">{farmIme} — video predstavitev</p>
                <button
                  onClick={() => setOpen(false)}
                  className="text-white/40 hover:text-white text-xs font-semibold transition-colors"
                >
                  Zapri
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
