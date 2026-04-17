"use client";

// =============================================================================
// NaKmetiji.si — Social Proof Toast
//
// Periodically shows "someone just booked" notifications to create urgency.
// Only renders in demo mode. Uses randomized farm names and regions.
// =============================================================================

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, X } from "lucide-react";
import { DEMO_MODE } from "@/lib/config/demo";

const MOCK_BOOKINGS = [
  { name: "Ana", farm: "Kmetija Pr' Francu", region: "Gorenjska" },
  { name: "Matej", farm: "Turistična kmetija Ramšak", region: "Štajerska" },
  { name: "Maja", farm: "Kmetija Šeruga", region: "Dolenjska" },
  { name: "Luka", farm: "Domačija Pr' Kranjcu", region: "Primorska" },
  { name: "Nina", farm: "Kmetija Lenar", region: "Koroška" },
  { name: "Žan", farm: "Eko kmetija Klepec", region: "Posavje" },
  { name: "Eva", farm: "Turistična kmetija Hlebec", region: "Pomurje" },
  { name: "Nejc", farm: "Kmetija Bečaj", region: "Notranjska" },
];

const TIME_AGO = ["pred 2 minutama", "pred 5 minutami", "pred 12 minutami", "pred 23 minutami"];

export function SocialProofToast() {
  const [visible, setVisible] = useState(false);
  const [booking, setBooking] = useState(MOCK_BOOKINGS[0]);
  const [timeAgo, setTimeAgo] = useState(TIME_AGO[0]);

  const showNext = useCallback(() => {
    const b = MOCK_BOOKINGS[Math.floor(Math.random() * MOCK_BOOKINGS.length)];
    const t = TIME_AGO[Math.floor(Math.random() * TIME_AGO.length)];
    setBooking(b);
    setTimeAgo(t);
    setVisible(true);

    // Auto-dismiss after 5s
    setTimeout(() => setVisible(false), 5000);
  }, []);

  useEffect(() => {
    if (!DEMO_MODE) return;

    // First toast after 15-25s
    const initial = setTimeout(showNext, 15000 + Math.random() * 10000);

    // Subsequent toasts every 30-60s
    const interval = setInterval(() => {
      showNext();
    }, 30000 + Math.random() * 30000);

    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, [showNext]);

  if (!DEMO_MODE) return null;

  return (
    <div className="fixed bottom-20 left-4 md:bottom-6 md:left-6 z-40 pointer-events-none">
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 200, damping: 24 }}
            className="pointer-events-auto flex items-start gap-3 rounded-2xl bg-white border border-earth-200/80 shadow-lg px-4 py-3 max-w-xs"
          >
            {/* Icon */}
            <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-forest-100 flex items-center justify-center">
              <MapPin size={16} className="text-forest-600" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-forest-900 leading-snug">
                {booking.name} je rezerviral/a
              </p>
              <p className="text-xs text-earth-600 truncate">
                {booking.farm}
              </p>
              <p className="text-[11px] text-earth-400 mt-0.5 flex items-center gap-1">
                <MapPin size={10} /> {booking.region} · {timeAgo}
              </p>
            </div>

            {/* Dismiss */}
            <button
              onClick={() => setVisible(false)}
              className="flex-shrink-0 p-1 rounded-lg text-earth-400 hover:text-earth-600 hover:bg-earth-100 transition-colors"
              aria-label="Zapri"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
