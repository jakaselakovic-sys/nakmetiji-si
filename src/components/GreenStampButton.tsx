"use client";

// =============================================================================
// GreenStampButton — "Pridobi žig" button embedded on farm detail pages
// Handles: unauthenticated, already-stamped, loading, and success states
// =============================================================================

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Stamp, CheckCircle2, Loader2, QrCode } from "lucide-react";

interface Props {
  farmSlug: string;
  isLoggedIn: boolean;
  isAlreadyStamped: boolean;
}

export function GreenStampButton({ farmSlug, isLoggedIn, isAlreadyStamped }: Props) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">(
    isAlreadyStamped ? "done" : "idle"
  );
  const [errorMsg, setErrorMsg] = useState("");

  async function handleClaim() {
    if (!isLoggedIn) {
      router.push(`/prijava?redirect=/green-passport/potrditev?farm=${farmSlug}`);
      return;
    }
    if (state !== "idle") return;

    setState("loading");

    try {
      const res = await fetch("/api/green-stamp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ farm: farmSlug }),
      });
      const json = await res.json() as { ok: boolean; duplicate?: boolean; error?: string };

      if (json.ok) {
        if (json.duplicate) {
          setState("done");
        } else {
          // Navigate to success page
          router.push(`/green-passport/potrditev?farm=${farmSlug}`);
        }
      } else {
        setErrorMsg(json.error ?? "Napaka pri dodajanju žiga.");
        setState("error");
        setTimeout(() => setState("idle"), 3000);
      }
    } catch {
      setErrorMsg("Napaka pri povezavi. Poskusi znova.");
      setState("error");
      setTimeout(() => setState("idle"), 3000);
    }
  }

  if (state === "done") {
    return (
      <div className="flex items-center gap-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 px-5 py-3.5 text-emerald-700">
        <CheckCircle2 size={20} className="flex-shrink-0" />
        <div>
          <p className="font-bold text-sm">Žig zbran!</p>
          <p className="text-xs text-emerald-600">Ta kmetija je v tvojem potnem listu.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <motion.button
        onClick={handleClaim}
        whileTap={{ scale: 0.97 }}
        disabled={state === "loading"}
        className="w-full flex items-center justify-center gap-2.5 rounded-2xl bg-forest-900 hover:bg-forest-800 disabled:opacity-60 text-white font-bold py-4 px-6 transition-all shadow-md hover:shadow-lg"
      >
        {state === "loading" ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Dodajam žig...
          </>
        ) : (
          <>
            <Stamp size={18} />
            {isLoggedIn ? "Pridobi žig" : "Prijavi se in pridobi žig"}
          </>
        )}
      </motion.button>

      {/* QR hint */}
      <p className="flex items-center justify-center gap-1.5 text-[11px] text-earth-400 font-medium">
        <QrCode size={11} />
        Ali skeniraj QR kodo pri gostitelju
      </p>

      {/* Error toast */}
      <AnimatePresence>
        {state === "error" && (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center text-xs text-red-500 font-medium"
          >
            {errorMsg}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
