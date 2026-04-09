// =============================================================================
// NaKmetiji.si — Navbar
// Glassmorphism navigacija — server component ki prebere sejo
// =============================================================================

import { createSupabaseServer } from "@/lib/supabase/server";
import { NavbarClient } from "./NavbarClient";

const NAV_LINKS = [
  { label: "Domov", href: "/" },
  { label: "Kmetije", href: "/kmetije" },
  { label: "Zemljevid", href: "/zemljevid" },
  { label: "O nas", href: "/o-nas" },
] as const;

export async function Navbar() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  let vloga: string | null = null;
  if (user) {
    const { data } = await supabase
      .from("profili")
      .select("vloga")
      .eq("id", user.id)
      .single();
    vloga = data?.vloga ?? null;
  }

  return (
    <NavbarClient
      navLinks={NAV_LINKS as unknown as { label: string; href: string }[]}
      isPrijavljen={!!user}
      vloga={vloga}
    />
  );
}
