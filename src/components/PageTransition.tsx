"use client";

// =============================================================================
// NaKmetiji.si — Page Transition Wrapper
// Animates page content on mount with a subtle fade + slide up.
// Uses framer-motion's AnimatePresence for smooth enter/exit.
// =============================================================================

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
