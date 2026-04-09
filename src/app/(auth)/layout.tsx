// =============================================================================
// NaKmetiji.si — Auth Layout
// Brez Navbar/Footer — čista prijavna stran
// =============================================================================

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Prijava | NaKmetiji",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-950 via-forest-900 to-forest-800 flex items-center justify-center px-4 py-12">
      {/* Ozadje dekoracija */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-forest-700/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-forest-600/20 blur-3xl" />
      </div>
      <div className="relative w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
