// =============================================================================
// NaKmetiji.si — /pot  (Road Trip Planner landing)
// Entry page for "Jožetov Road Trip". Users pick regions + days + vibes;
// on submit we POST /api/roadtrip and render the itinerary client-side.
// =============================================================================

import type { Metadata } from "next";
import { RoadTripPlannerClient } from "@/components/RoadTripPlannerClient";

export const metadata: Metadata = {
  title: "Jožetov Road Trip — Večdnevna pot po Sloveniji",
  description:
    "Izberi regije, povej Jožetu svoj vibe in dobi večdnevni načrt z eno kmetijo na regijo, bližnjimi znamenitostmi in optimalnim zaporedjem postankov.",
  alternates: { canonical: "https://nakmetiji.si/pot" },
  openGraph: {
    title: "Jožetov Road Trip — Večdnevna pot po Sloveniji",
    description: "Multi-regionalni itinerar, prilagojen tvojemu duhu.",
    url: "https://nakmetiji.si/pot",
  },
};

export default function RoadTripPage() {
  return (
    <div className="min-h-screen bg-paper pb-20 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-forest-200/30 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-[20%] right-[-5%] w-[30%] h-[50%] bg-amber-200/20 rounded-full blur-[80px] pointer-events-none" />

      <div className="mx-auto max-w-5xl px-6 pt-16 sm:pt-24 relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-forest-50 border border-forest-100 text-forest-700 text-[10px] font-bold uppercase tracking-wider mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-forest-500 animate-pulse" />
            AI Načrtovalec Poti
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-forest-900 font-display tracking-tight mb-5 drop-shadow-sm">
            Jožetov Road Trip
          </h1>
          <p className="text-earth-700 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
            Pozabite na neskončno iskanje. Zaupajte Jožetu, kam vas vleče srce in
            kakšen je vaš vibe. Sestavil vam bo <strong className="text-forest-800">popolno potovanje</strong> —
            z izbranimi kmetijami, skritimi kotički in natančno časovnico.
          </p>
        </div>
        <RoadTripPlannerClient />
      </div>
    </div>
  );
}
