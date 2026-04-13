"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, PartyPopper } from "lucide-react";
import { zahtevajNagrado } from "@/lib/actions/nagrade";

export function ClaimRewardButton() {
  const [state, setState]           = useState<"idle" | "loading" | "success" | "error">("idle");
  const [msg, setMsg]               = useState<string | null>(null);
  const [rewardCode, setRewardCode] = useState<string | null>(null);

  async function handleClick() {
    setState("loading");
    setMsg(null);
    const res = await zahtevajNagrado();
    if (res.ok) {
      setState("success");
      setRewardCode(res.reward_code);
      setMsg(`Zahtevek za nagrado "${res.levelName}" je bil oddan!`);
    } else {
      setState("error");
      setMsg(res.napaka);
    }
  }

  if (state === "success" && rewardCode) {
    return (
      <div className="mt-4 flex flex-col items-start gap-3">
        <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-5 py-3 text-sm text-emerald-800 font-semibold">
          <PartyPopper size={16} className="text-emerald-600" />
          {msg}
        </div>
        <div className="flex flex-wrap items-center gap-3 bg-white border-2 border-emerald-300 rounded-xl px-5 py-3">
          <span className="text-xs text-earth-500 font-medium">Tvoja koda nagrade:</span>
          <span className="font-mono text-lg font-black text-forest-900 tracking-widest">{rewardCode}</span>
          <button
            onClick={() => navigator.clipboard?.writeText(rewardCode)}
            className="text-xs text-forest-600 hover:text-forest-800 font-semibold underline"
          >
            Kopiraj
          </button>
        </div>
        <p className="text-xs text-earth-500">
          Pošlji kodo na <strong>info@nakmetiji.si</strong> za uveljavitev nagrade.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 flex flex-col items-start gap-2">
      <button
        onClick={handleClick}
        disabled={state === "loading"}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-forest-600 text-white font-bold text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
      >
        {state === "loading"
          ? <Loader2 size={16} className="animate-spin" />
          : <CheckCircle2 size={16} />}
        {state === "loading" ? "Pošiljanje..." : "Uveljavi nagrado →"}
      </button>
      {state === "error" && msg && (
        <p className="text-xs text-red-600 font-semibold">{msg}</p>
      )}
    </div>
  );
}
