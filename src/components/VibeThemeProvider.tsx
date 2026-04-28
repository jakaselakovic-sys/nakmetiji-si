"use client";

import { useEffect } from "react";
import { useVibeStore } from "@/lib/vibeStore";

const VIBE_COLORS: Record<string, { bgTint: string; accent: string; accentHover: string }> = {
  rusticna: { bgTint: "#faf7f2", accent: "#8B5A2B", accentHover: "#6b4521" },
  moderna: { bgTint: "#f5f7fa", accent: "#2c3e50", accentHover: "#1a252f" },
  tiha: { bgTint: "#f4f6f5", accent: "#4a6b5d", accentHover: "#354e43" },
  druzinska: { bgTint: "#fdf8f5", accent: "#e67e22", accentHover: "#d35400" },
  romanticna: { bgTint: "#fdf5f6", accent: "#c0392b", accentHover: "#a93226" },
  pustolovska: { bgTint: "#f2f6f3", accent: "#27ae60", accentHover: "#2ecc71" },
  eko: { bgTint: "#f3f7f4", accent: "#2ecc71", accentHover: "#27ae60" },
  luksuzna: { bgTint: "#fbfaf6", accent: "#d4af37", accentHover: "#b5952f" },
};

export function VibeThemeProvider() {
  const dominantVibe = useVibeStore((s) => s.dominantVibe);

  useEffect(() => {
    if (!dominantVibe || !VIBE_COLORS[dominantVibe]) {
      document.body.style.removeProperty("--vibe-bg-tint");
      document.body.style.removeProperty("--vibe-accent");
      document.body.style.removeProperty("--vibe-accent-hover");
      return;
    }

    const colors = VIBE_COLORS[dominantVibe];
    document.body.style.setProperty("--vibe-bg-tint", colors.bgTint);
    document.body.style.setProperty("--vibe-accent", colors.accent);
    document.body.style.setProperty("--vibe-accent-hover", colors.accentHover);
  }, [dominantVibe]);

  return null;
}
