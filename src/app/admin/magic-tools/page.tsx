// =============================================================================
// NaKmetiji.si — Magic Tools Admin Page
// Server component — super_admin only
// =============================================================================

import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, Sparkles } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase/server";
import { MagicVendorSuite } from "@/components/vendor/MagicVendorSuite";


export const metadata: Metadata = {
  title: "Magic Tools | Admin",
};

export default async function MagicToolsPage() {
  const supabase = await createSupabaseServer();

  // Check super_admin role
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/prijava?redirect=/admin/magic-tools");

  const { data: profil } = await supabase
    .from("profili")
    .select("vloga")
    .eq("id", user.id)
    .single();

  if (profil?.vloga !== "super_admin") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-12 relative overflow-hidden">
      {/* Absolute ambient lights */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        <Link 
          href="/admin" 
          className="inline-flex items-center gap-2 text-indigo-300 hover:text-white transition-colors mb-8 font-medium bg-white/5 px-4 py-2 rounded-xl backdrop-blur-md border border-white/10"
        >
          <ChevronLeft size={18} /> Nazaj na Admin Ploščo
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-white to-purple-300 mb-4 flex items-center gap-4">
            <Sparkles className="text-indigo-400" size={36} />
            Agencijska Orodja
          </h1>
          <p className="text-indigo-200/80 max-w-2xl text-lg">
            Ta orodja so vidna izključno Super Adminom. Uporabite jih za monetizacijo, ustvarjanje premium profilov ali hitro pripravo GTM kampanj za kmetije.
          </p>
        </div>

        {/* The Magic Vendor Suite */}
        <MagicVendorSuite />
      </div>
    </div>
  );
}
