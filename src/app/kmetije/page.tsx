import { KmetijeClient } from "./KmetijeClient";

export const metadata = {
  title: "Vse kmetije | NaKmetiji",
  description: "Poiščite in filtrirajte turistične kmetije po vsej Sloveniji.",
};

export default function KmetijePage() {
  return (
    <div className="min-h-screen bg-cream">
      {/* ── Page Hero ── */}
      <div className="bg-forest-900 pt-32 pb-20 px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/hero-bg.png')] opacity-10 bg-cover bg-center mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-forest-900 to-transparent"></div>
        
        <div className="relative z-10 max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4 animate-fade-in-up">
            Vse kmetije
          </h1>
          <p className="text-lg text-white/70 animate-fade-in-up delay-100">
            Odkrijte skrite dragulje slovenskega podeželja. Prilagodite iskanje svojim željam in najdite popolno destinacijo.
          </p>
        </div>
      </div>

      <KmetijeClient />
    </div>
  );
}
