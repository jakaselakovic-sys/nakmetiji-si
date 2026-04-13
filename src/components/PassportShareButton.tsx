"use client";

// =============================================================================
// NaKmetiji.si — PassportShareButton
// Builds the OG image URL from passport data and triggers native share sheet
// (Instagram Stories, WhatsApp, copy-link fallback).
// =============================================================================

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, Check, ImageDown, Copy } from "lucide-react";
import type { GreenLevel } from "@/lib/greenPassport";

interface Props {
  name: string;
  stamps: number;
  regions: number;
  currentLevel: GreenLevel;
  totalPoints: number;
}

export function PassportShareButton({ name, stamps, regions, currentLevel }: Props) {
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  function buildOgUrl(format: "card" | "story") {
    const params = new URLSearchParams({
      stamps:  String(stamps),
      regions: String(regions),
      level:   currentLevel.name,
      icon:    currentLevel.icon,
      name:    name,
      format,
    });
    return `${window.location.origin}/api/og/potni-list?${params.toString()}`;
  }

  async function handleNativeShare() {
    const ogUrl = buildOgUrl("card");
    const shareData = {
      title: `${currentLevel.icon} Moj Zeleni Potni List — ${currentLevel.name}`,
      text:  `Sem ${currentLevel.name} na NaKmetiji.si — zbral/-a ${stamps} žig${stamps === 1 ? "" : stamps < 5 ? "e" : "ov"} v ${regions} regijah slovenskega podeželja! 🌿`,
      url:   ogUrl,
    };

    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch { /* user cancelled or browser blocked */ }
    }

    // Fallback — copy link
    await handleCopyLink();
  }

  async function handleCopyLink() {
    const ogUrl = buildOgUrl("card");
    await navigator.clipboard.writeText(`${window.location.origin}/moj-potni-list`).catch(() =>
      navigator.clipboard.writeText(ogUrl)
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    setShowMenu(false);
  }

  function handleInstagramStory() {
    // Stories can't be opened via JS — download the image URL for user to save
    const storyUrl = buildOgUrl("story");
    const a = document.createElement("a");
    a.href = storyUrl;
    a.download = `zeleni-potni-list-${name.toLowerCase().replace(/\s+/g, "-")}-story.png`;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.click();
    setShowMenu(false);
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        {/* Primary share — native sheet */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={handleNativeShare}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-earth-200 text-forest-800 text-sm font-semibold shadow-sm hover:shadow-md hover:border-forest-300 transition-all"
        >
          {copied ? (
            <><Check size={15} className="text-emerald-500" /> Kopirano!</>
          ) : (
            <><Share2 size={15} /> Deli potni list</>
          )}
        </motion.button>

        {/* More options toggle */}
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-2.5 rounded-xl border border-earth-200 bg-white text-earth-500 hover:text-forest-700 hover:border-forest-300 transition-all text-xs font-bold"
          aria-label="Več možnosti deljenja"
        >
          ···
        </button>
      </div>

      <AnimatePresence>
        {showMenu && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowMenu(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute right-0 top-full mt-2 z-20 w-52 bg-white rounded-2xl shadow-xl border border-earth-200 overflow-hidden"
            >
              <button
                onClick={handleInstagramStory}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-earth-700 hover:bg-earth-50 transition-colors"
              >
                <ImageDown size={16} className="text-pink-500" />
                Prenesi za Stories
              </button>
              <button
                onClick={handleCopyLink}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-earth-700 hover:bg-earth-50 transition-colors border-t border-earth-100"
              >
                <Copy size={16} className="text-forest-500" />
                {copied ? "Kopirano!" : "Kopiraj povezavo"}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
