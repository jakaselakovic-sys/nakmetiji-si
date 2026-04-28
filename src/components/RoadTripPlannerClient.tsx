"use client";

// =============================================================================
// NaKmetiji.si — Road Trip Planner (client)
// A guided conversational wizard with Jože to plan a road trip.
// Output is a premium day-by-day Itinerary Notebook.
// =============================================================================

import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { REGIJE, type Regija } from "@/types/database";
import {
  WizardData,
  StepRegion,
  StepDuration,
  StepVibe,
  StepReview,
} from "./RoadTripWizardSteps";
import { ItineraryNotebook, type Itinerary } from "./ItineraryNotebook";

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function RoadTripPlannerClient() {
  const [step, setStep] = useState<"region" | "duration" | "vibe" | "review" | "result">("region");
  const [data, setData] = useState<WizardData>({
    regions: [],
    days: 3,
    vibes: [],
    withDog: false,
  });

  const [loading, setLoading] = useState(false);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Preload from URL deep links: ?regions=primorska,kras&days=3&vibe=romanticna
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    
    let hasData = false;
    const patch: Partial<WizardData> = {};
    
    const qr = params.get("regions");
    if (qr) {
      const list = qr
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter((s): s is Regija => REGIJE.includes(s as Regija));
      if (list.length > 0) {
        patch.regions = list;
        hasData = true;
      }
    }
    
    const dq = params.get("days");
    if (dq && /^\d+$/.test(dq)) {
      const n = parseInt(dq, 10);
      if (n >= 1 && n <= 14) {
        patch.days = n;
        hasData = true;
      }
    }

    const vq = params.get("vibe");
    if (vq) {
      patch.vibes = [vq];
      hasData = true;
    }

    if (hasData) {
      setData((prev) => ({ ...prev, ...patch }));
      // Auto-advance if we have enough data from URL
      if (patch.regions?.length && patch.days) {
        setStep("review");
      }
    }
  }, []);

  const updateData = (patch: Partial<WizardData>) => {
    setData((prev) => ({ ...prev, ...patch }));
  };

  async function submitPlan() {
    setLoading(true);
    setError(null);
    setItinerary(null);
    try {
      const res = await fetch("/api/roadtrip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        setError(err.error ?? "Napaka pri načrtovanju poti.");
        setStep("review"); // Go back to review on error
        return;
      }
      const result = (await res.json()) as Itinerary;
      setItinerary(result);
      setStep("result");
      
      // Smooth scroll to the result
      requestAnimationFrame(() => {
        document.getElementById("itinerary-result")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch {
      setError("Povezava ni uspela. Poskusite znova.");
      setStep("review");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* ── Error ─────────────────────────────────────────────────── */}
      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-center">
          {error}
        </p>
      )}

      {/* ── Wizard Steps ───────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {step === "region" && (
          <StepRegion
            key="step-region"
            data={data}
            onUpdate={updateData}
            onNext={() => setStep("duration")}
          />
        )}

        {step === "duration" && (
          <StepDuration
            key="step-duration"
            data={data}
            onUpdate={updateData}
            onNext={() => setStep("vibe")}
            onBack={() => setStep("region")}
          />
        )}

        {step === "vibe" && (
          <StepVibe
            key="step-vibe"
            data={data}
            onUpdate={updateData}
            onNext={() => setStep("review")}
            onBack={() => setStep("duration")}
          />
        )}

        {step === "review" && (
          <StepReview
            key="step-review"
            data={data}
            onUpdate={updateData}
            onNext={submitPlan}
            onBack={() => setStep("vibe")}
            onSubmit={submitPlan}
            loading={loading}
          />
        )}

        {step === "result" && itinerary && (
          <ItineraryNotebook key="step-result" itinerary={itinerary} />
        )}
      </AnimatePresence>
    </div>
  );
}
