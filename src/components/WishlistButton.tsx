"use client";

// =============================================================================
// NaKmetiji.si — WishlistButton
// Heart toggle for saving a farm. Checks auth state; prompts login if needed.
// =============================================================================

import { useState, useEffect, useTransition } from "react";
import { Heart, Loader2 } from "lucide-react";
import { toggleWishlist, getWishlistStatus } from "@/lib/actions/wishlist";
import { createSupabaseBrowser } from "@/lib/supabase/client";

interface Props {
  kmetijaId: string;
  /** If provided, skip the extra getUser call since caller already knows login state */
  initialLoggedIn?: boolean;
  className?: string;
}

export function WishlistButton({ kmetijaId, initialLoggedIn, className = "" }: Props) {
  const [inWishlist, setInWishlist] = useState(false);
  const [loggedIn, setLoggedIn] = useState(initialLoggedIn ?? false);
  const [ready, setReady] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    async function init() {
      if (initialLoggedIn === undefined) {
        const sb = createSupabaseBrowser();
        const { data: { user } } = await sb.auth.getUser();
        if (!user) { setReady(true); return; }
        setLoggedIn(true);
      }
      const { inWishlist: saved } = await getWishlistStatus(kmetijaId);
      setInWishlist(saved);
      setReady(true);
    }
    init();
  }, [kmetijaId, initialLoggedIn]);

  if (!ready) return null;

  const handleClick = () => {
    if (!loggedIn) {
      window.location.href = `/prijava?redirect=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    startTransition(async () => {
      const result = await toggleWishlist(kmetijaId);
      if (result.needsLogin) {
        window.location.href = `/prijava?redirect=${encodeURIComponent(window.location.pathname)}`;
        return;
      }
      if (!result.napaka) setInWishlist(result.inWishlist);
    });
  };

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      aria-label={inWishlist ? "Odstrani iz shranjenih" : "Shrani kmetijo"}
      title={inWishlist ? "Odstrani iz shranjenih" : "Shrani kmetijo"}
      className={`flex items-center justify-center rounded-xl transition-all ${
        inWishlist
          ? "bg-red-500 hover:bg-red-400 text-white"
          : "bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30"
      } ${className}`}
    >
      {isPending ? (
        <Loader2 size={18} className="animate-spin" />
      ) : (
        <Heart
          size={18}
          className={inWishlist ? "fill-white" : ""}
        />
      )}
    </button>
  );
}
