"use client";

// =============================================================================
// GreenStampButton — "Pridobi žig" button embedded on farm detail pages
// Vključuje:
// 1. Geofencing (GPS permission + request)
// 2. Optimistic UI (Framer Motion rollback)
// 3. Offline-First (IndexedDB sync)
// =============================================================================

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Stamp, CheckCircle2, Loader2, QrCode, Hourglass } from "lucide-react";
import { addStampToQueue, getStampQueue, removeFromQueue } from "@/lib/indexedDB";
import { hapticMedium } from "@/lib/haptics";
import * as Sentry from "@sentry/nextjs";

interface Props {
  farmSlug: string;
  isLoggedIn: boolean;
  isAlreadyStamped: boolean;
}

export function GreenStampButton({ farmSlug, isLoggedIn, isAlreadyStamped }: Props) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "loading" | "optimistic" | "done" | "offline_saved" | "error">(
    isAlreadyStamped ? "done" : "idle"
  );
  const [errorMsg, setErrorMsg] = useState("");

  // Sync worker if we come back online
  useEffect(() => {
    async function handleOnline() {
      if (state === "offline_saved") {
        setState("loading");
      }
      
      try {
        const queue = await getStampQueue();
        for (const item of queue) {
          // Tickets expire after 5 min — drop stale offline entries instead of
          // hammering the server with guaranteed-403 replays.
          if (Date.now() - item.ts > 5 * 60 * 1000) {
            await removeFromQueue(item.id);
            continue;
          }
          const res = await fetch("/api/green-stamp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              farm: item.farmSlug,
              lat: item.lat,
              lng: item.lng,
              accuracy: item.accuracy,
              ts: item.ts,
              sig: item.sig,
            }),
          });

          if (res.ok) {
            await removeFromQueue(item.id);
          }
        }
        if (state === "offline_saved") setState("done");
      } catch (err) {
        Sentry.captureException(err, { tags: { feature: "green_stamp", action: "background_sync" } });
      }
    }

    window.addEventListener("online", handleOnline);
    // Attempt sync on initial mount if online
    if (navigator.onLine && state === "offline_saved") {
      handleOnline();
    }
    
    return () => window.removeEventListener("online", handleOnline);
  }, [state]);

  function getPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolokacija ni podprta."));
      } else {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      }
    });
  }

  async function handleClaim() {
    if (!isLoggedIn) {
      router.push(`/prijava?redirect=/green-passport/potrditev?farm=${farmSlug}`);
      return;
    }
    if (state !== "idle" && state !== "error") return;

    setState("loading");

    let lat = 0;
    let lng = 0;
    let accuracy = 0;

    // 1. Get Geolocation
    try {
      const pos = await getPosition();
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
      accuracy = pos.coords.accuracy;
    } catch (err: unknown) {
      Sentry.captureException(err, { tags: { feature: "green_stamp", action: "geolocation" } });
      setErrorMsg("Za potrditev žiga morate dovoliti dostop do lokacije.");
      setState("error");
      setTimeout(() => setState("idle"), 4000);
      return;
    }

    // 2. Fetch fresh ticket (ts + sig) — server signs slug|ts with qr_secret_key.
    // Must happen online; offline queue reuses the last issued ticket.
    let ts = 0;
    let sig = "";
    if (navigator.onLine) {
      try {
        const initRes = await fetch(`/api/green-stamp/init?farm=${encodeURIComponent(farmSlug)}`);
        if (!initRes.ok) throw new Error("init_failed");
        const initJson = (await initRes.json()) as { ts: number; sig: string };
        ts = initJson.ts;
        sig = initJson.sig;
      } catch {
        setErrorMsg("Povezava za žig ni na voljo. Poskusite znova.");
        setState("error");
        setTimeout(() => setState("idle"), 4000);
        return;
      }
    }

    // 3. Check offline status
    if (!navigator.onLine) {
      setErrorMsg("Za žig je potrebna internetna povezava.");
      setState("error");
      setTimeout(() => setState("idle"), 4000);
      return;
    }

    // 4. Optimistic UI - Pretend it worked immediately!
    setState("optimistic");

    // 5. API Request
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const res = await fetch("/api/green-stamp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ farm: farmSlug, lat, lng, accuracy, ts, sig }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const json = await res.json() as { status: string; message?: string };

      if (res.ok && (json.status === "success" || json.status === "duplicate")) {
        setState("done");
        hapticMedium();
        if (json.status === "success") {
          setTimeout(() => {
            router.push(`/green-passport/potrditev?farm=${farmSlug}`);
          }, 1000); // Wait a bit for the animation
        }
      } else {
        // Rollback
        setErrorMsg(json.message ?? "Napaka pri dodajanju žiga.");
        setState("error");
        setTimeout(() => setState("idle"), 5000);
      }
    } catch (err: unknown) {
      // Rollback on network failure — save offline only if we have a valid ticket
      if (((err instanceof Error && err.name === "AbortError") || !navigator.onLine) && sig && ts) {
         await addStampToQueue({ farmSlug, lat, lng, accuracy, sig, ts, timestamp: Date.now() });
         setState("offline_saved");
      } else {
        setErrorMsg("Napaka pri povezavi. Poskusi znova.");
        setState("error");
        setTimeout(() => setState("idle"), 4000);
      }
    }
  }

  if (state === "done" || state === "optimistic") {
    return (
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex items-center gap-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 px-5 py-3.5 text-emerald-700"
      >
        <CheckCircle2 size={20} className="flex-shrink-0" />
        <div>
          <p className="font-bold text-sm">Žig zbran!</p>
          <p className="text-xs text-emerald-600">Ta kmetija je v vaši kroniki.</p>
        </div>
      </motion.div>
    );
  }

  if (state === "offline_saved") {
    return (
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex items-center gap-2.5 rounded-2xl bg-amber-50 border border-amber-200 px-5 py-3.5 text-amber-700"
      >
        <Hourglass size={20} className="flex-shrink-0 animate-pulse" />
        <div>
          <p className="font-bold text-sm">Žig shranjen v čakalnici</p>
          <p className="text-xs text-amber-600">Sinhronizacija ob naslednjem signalu.</p>
        </div>
      </motion.div>
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
        Ali skenirajte QR kodo pri gostitelju
      </p>

      {/* Error toast */}
      <AnimatePresence>
        {state === "error" && (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center text-xs text-red-500 font-medium px-2 py-1 bg-red-50 rounded border border-red-100"
          >
            {errorMsg}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
